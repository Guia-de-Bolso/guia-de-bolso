"use client";

import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  messageForVoiceError,
  VOICE_ERROR,
} from "@/lib/voiceSearchErrors";
import {
  browserVoiceSupported,
  startBrowserListening,
} from "@/lib/voiceSearchBrowser";
import {
  ensureNativeVoicePermission,
  probeNativeVoice,
  startNativeListening,
} from "@/lib/voiceSearchNative";

/**
 * Busca por voz: Capgo nativo no app; Web Speech só como fallback de browser/dev.
 *
 * @param {{
 *   onTranscriptChange?: (text: string) => void,
 *   onFinalTranscript?: (text: string) => void,
 * }} [options]
 */
export function useVoiceSearch(options = {}) {
  const { onTranscriptChange, onFinalTranscript } = options;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sessionRef = useRef(null);
  const transcriptRef = useRef("");
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const finalFiredRef = useRef(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onTranscriptChange, onFinalTranscript]);

  useEffect(() => {
    let cancelled = false;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let retryTimer;

    async function probe(attempt = 0) {
      if (Capacitor.isNativePlatform()) {
        if (!cancelled && attempt === 0) setSupported(true);

        const result = await probeNativeVoice();
        if (cancelled) return;

        if (result.ok) {
          setSupported(true);
          return;
        }

        if (result.reason === "unavailable") {
          setSupported(false);
          return;
        }

        if (attempt < 3) {
          retryTimer = setTimeout(() => {
            void probe(attempt + 1);
          }, 400 * (attempt + 1));
          return;
        }

        setSupported(true);
        return;
      }

      if (!cancelled) setSupported(browserVoiceSupported());
    }

    void probe();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const teardown = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) await session.cleanup?.();
  }, []);

  useEffect(() => {
    return () => {
      try {
        sessionRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      teardown();
    };
  }, [teardown]);

  const applyPartial = useCallback((text) => {
    transcriptRef.current = text;
    setTranscript(text);
    onTranscriptChangeRef.current?.(text);
  }, []);

  const finishIfNeeded = useCallback(() => {
    if (finalFiredRef.current) return;
    finalFiredRef.current = true;
    const text = transcriptRef.current.trim();
    if (!text) {
      setErrorMessage(messageForVoiceError(VOICE_ERROR.NO_SPEECH));
      return;
    }
    onFinalTranscriptRef.current?.(text);
  }, []);

  const handleListeningChange = useCallback(
    (isListening) => {
      listeningRef.current = isListening;
      setListening(isListening);
      if (!isListening) {
        busyRef.current = false;
        setBusy(false);
        finishIfNeeded();
        teardown();
      }
    },
    [finishIfNeeded, teardown]
  );

  const handleError = useCallback(
    (code) => {
      setErrorMessage(messageForVoiceError(code));
      setListening(false);
      listeningRef.current = false;
      busyRef.current = false;
      setBusy(false);
      finalFiredRef.current = true;
      teardown();
    },
    [teardown]
  );

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    if (session) await session.stop();
  }, []);

  const start = useCallback(async () => {
    if (busyRef.current || listeningRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setErrorMessage("");
    finalFiredRef.current = false;
    transcriptRef.current = "";
    setTranscript("");

    // Feedback visual imediato ao tocar o mic.
    listeningRef.current = true;
    setListening(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const granted = await ensureNativeVoicePermission();
        if (!granted) {
          handleError(VOICE_ERROR.PERMISSION);
          return;
        }
        // Usuário pode ter tocado de novo para cancelar durante o prompt.
        if (!listeningRef.current) {
          busyRef.current = false;
          setBusy(false);
          return;
        }
        sessionRef.current = await startNativeListening({
          onPartial: applyPartial,
          onListeningChange: handleListeningChange,
          onError: handleError,
        });
        busyRef.current = false;
        setBusy(false);
        return;
      }

      sessionRef.current = startBrowserListening({
        onPartial: applyPartial,
        onListeningChange: handleListeningChange,
        onError: handleError,
      });
      busyRef.current = false;
      setBusy(false);
    } catch (err) {
      console.error("[useVoiceSearch]", err);
      if (!err?.voiceHandled) {
        handleError(VOICE_ERROR.UNKNOWN);
      }
    }
  }, [applyPartial, handleError, handleListeningChange]);

  const toggle = useCallback(async () => {
    if (listeningRef.current || busyRef.current) {
      await stop();
      listeningRef.current = false;
      setListening(false);
      busyRef.current = false;
      setBusy(false);
      return;
    }
    await start();
  }, [start, stop]);

  const clearError = useCallback(() => setErrorMessage(""), []);

  return {
    supported,
    listening,
    busy,
    transcript,
    errorMessage,
    clearError,
    start,
    stop,
    toggle,
  };
}
