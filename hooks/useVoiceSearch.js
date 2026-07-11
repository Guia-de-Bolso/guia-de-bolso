"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  abortNativeVoiceCapture,
  canUseVoiceSearch,
  createVoiceCaptureSession,
  ensureSpeechPermissions,
  formatSpeechError,
  isAndroidNative,
  isIosNative,
  probeNativeSpeechPlugin,
  runAndroidPopupVoiceCapture,
  VOICE_LISTENING_HINT,
  VOICE_SEARCH_MESSAGES,
} from "@/lib/speechRecognition";

/**
 * Hook de busca por voz no app nativo Capacitor.
 * @param {object} [options]
 * @param {(text: string) => void} [options.onPartial] - Atualiza o input enquanto o usuário fala.
 * @param {(text: string) => void} [options.onTranscript] - Texto final ao encerrar a captura.
 * @returns {{
 *   supported: boolean,
 *   status: "idle" | "preparing" | "listening" | "denied" | "error",
 *   error: string,
 *   hint: string,
 *   isListening: boolean,
 *   start: () => Promise<void>,
 *   stop: () => Promise<string>,
 *   toggle: () => Promise<void>,
 *   clearError: () => void,
 * }}
 */
export function useVoiceSearch({ onPartial, onTranscript } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const sessionRef = useRef(null);
  const captureBusyRef = useRef(false);
  const onPartialRef = useRef(onPartial);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onPartialRef.current = onPartial;
    onTranscriptRef.current = onTranscript;
  }, [onPartial, onTranscript]);

  const resetVoiceUi = useCallback(() => {
    setStatus("idle");
    setHint("");
  }, []);

  const cleanupSession = useCallback(async () => {
    const session = sessionRef.current;
    sessionRef.current = null;

    if (!session) return "";

    try {
      const text = await session.stop();
      await session.removeListeners();
      return text;
    } catch {
      await session.removeListeners().catch(() => undefined);
      return "";
    }
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const stop = useCallback(async () => {
    const text = await cleanupSession();
    resetVoiceUi();
    return text;
  }, [cleanupSession, resetVoiceUi]);

  const cancelCapture = useCallback(async () => {
    captureBusyRef.current = false;
    await cleanupSession();
    await abortNativeVoiceCapture();
    resetVoiceUi();
    setError("");
  }, [cleanupSession, resetVoiceUi]);

  const finishWithTranscript = useCallback(
    (text) => {
      resetVoiceUi();
      if (text) {
        onTranscriptRef.current?.(text);
        return;
      }
      setError("Não captamos áudio. Verifique o microfone e tente de novo.");
      setStatus("error");
    },
    [resetVoiceUi]
  );

  const runAndroidVoiceFlow = useCallback(async () => {
    captureBusyRef.current = true;
    setStatus("preparing");
    setError("");
    setHint("");

    try {
      const probe = await probeNativeSpeechPlugin();
      if (!probe.ok) {
        setStatus("error");
        setError(probe.error ?? VOICE_SEARCH_MESSAGES.PLUGIN_MISSING);
        return;
      }

      const permission = await ensureSpeechPermissions();
      if (!permission.granted) {
        setStatus("denied");
        setError(permission.error ?? VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
        return;
      }

      setHint("Fale no diálogo do Google…");

      const text = await runAndroidPopupVoiceCapture({
        onPartial: (value) => onPartialRef.current?.(value),
      });

      finishWithTranscript(text);
    } catch (err) {
      const message = formatSpeechError(err);
      resetVoiceUi();
      if (message && message !== VOICE_SEARCH_MESSAGES.CANCELLED) {
        setStatus("error");
        setError(message);
      }
    } finally {
      captureBusyRef.current = false;
    }
  }, [finishWithTranscript, resetVoiceUi]);

  const runIosVoiceFlow = useCallback(async () => {
    captureBusyRef.current = true;
    setStatus("preparing");
    setError("");
    setHint("");

    try {
      const probe = await probeNativeSpeechPlugin();
      if (!probe.ok) {
        setStatus("error");
        setError(probe.error ?? VOICE_SEARCH_MESSAGES.PLUGIN_MISSING);
        return;
      }

      const permission = await ensureSpeechPermissions();
      if (!permission.granted) {
        setStatus("denied");
        setError(permission.error ?? VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
        return;
      }

      const session = await createVoiceCaptureSession({
        onPartial: (text) => onPartialRef.current?.(text),
        onError: (message) => {
          setStatus("error");
          setError(message);
          setHint("");
        },
        onStarted: () => {
          setStatus("listening");
          setHint(VOICE_LISTENING_HINT);
        },
      });

      sessionRef.current = session;
      setStatus("listening");
      setHint(VOICE_LISTENING_HINT);
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      setHint("");
      await cleanupSession();
    } finally {
      if (!sessionRef.current) {
        captureBusyRef.current = false;
      }
    }
  }, [cleanupSession]);

  const start = useCallback(async () => {
    if (!canUseVoiceSearch()) {
      setStatus("error");
      setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
      return;
    }

    if (isAndroidNative()) {
      await runAndroidVoiceFlow();
      return;
    }

    if (isIosNative()) {
      await runIosVoiceFlow();
      return;
    }

    setStatus("preparing");
    setError("");

    try {
      const permission = await ensureSpeechPermissions();
      if (!permission.granted) {
        setStatus("denied");
        setError(permission.error ?? VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
        return;
      }

      const session = await createVoiceCaptureSession({
        onPartial: (text) => onPartialRef.current?.(text),
        onError: (message) => {
          setStatus("error");
          setError(message);
        },
      });

      sessionRef.current = session;
      setStatus("listening");
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      await cleanupSession();
    }
  }, [cleanupSession, runAndroidVoiceFlow, runIosVoiceFlow]);

  const toggle = useCallback(async () => {
    try {
      if (!canUseVoiceSearch()) {
        setStatus("error");
        setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
        return;
      }

      if (isAndroidNative()) {
        if (captureBusyRef.current || status === "preparing") {
          await cancelCapture();
          return;
        }
        await runAndroidVoiceFlow();
        return;
      }

      if (isIosNative() && (status === "listening" || status === "preparing")) {
        captureBusyRef.current = false;
        const text = await stop();
        finishWithTranscript(text);
        return;
      }

      if (isIosNative()) {
        await runIosVoiceFlow();
        return;
      }

      if (status === "listening" || status === "preparing") {
        const text = await stop();
        if (text) onTranscriptRef.current?.(text);
        return;
      }

      await start();
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      setHint("");
      await cleanupSession();
      captureBusyRef.current = false;
    }
  }, [
    cancelCapture,
    cleanupSession,
    finishWithTranscript,
    runAndroidVoiceFlow,
    runIosVoiceFlow,
    start,
    status,
    stop,
  ]);

  useEffect(() => {
    return () => {
      captureBusyRef.current = false;
      cleanupSession();
    };
  }, [cleanupSession]);

  return {
    supported: canUseVoiceSearch(),
    status,
    error,
    hint,
    isListening: status === "listening" || status === "preparing",
    start,
    stop,
    toggle,
    clearError,
  };
}
