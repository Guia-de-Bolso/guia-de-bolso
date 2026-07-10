"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canUseVoiceSearch,
  canUseWebVoiceSearch,
  createVoiceCaptureSession,
  ensureSpeechPermissions,
  formatSpeechError,
  isAndroidNative,
  probeNativeSpeechPlugin,
  runAndroidPopupVoiceCapture,
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
  const sessionRef = useRef(null);
  const onPartialRef = useRef(onPartial);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onPartialRef.current = onPartial;
    onTranscriptRef.current = onTranscript;
  }, [onPartial, onTranscript]);

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
    setStatus("idle");
    return text;
  }, [cleanupSession]);

  const runAndroidVoiceFlow = useCallback(async () => {
    setStatus("preparing");
    setError("");

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

    try {
      const text = await runAndroidPopupVoiceCapture({
        onPartial: (value) => onPartialRef.current?.(value),
      });

      setStatus("idle");

      if (text) {
        onTranscriptRef.current?.(text);
        return;
      }

      setError("Não captamos áudio. Verifique o microfone e tente de novo.");
      setStatus("error");
    } catch (err) {
      const message = formatSpeechError(err);
      setStatus("idle");
      if (message) {
        setStatus("error");
        setError(message);
      }
    }
  }, []);

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

    setStatus("preparing");
    setError("");

    try {
      const probe = await probeNativeSpeechPlugin();
      if (!probe.ok && !canUseWebVoiceSearch()) {
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
        },
      });

      sessionRef.current = session;
      setStatus("listening");
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      await cleanupSession();
    }
  }, [cleanupSession, runAndroidVoiceFlow]);

  const toggle = useCallback(async () => {
    try {
      if (!canUseVoiceSearch()) {
        setStatus("error");
        setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
        return;
      }

      if (isAndroidNative()) {
        if (status === "preparing") return;
        await runAndroidVoiceFlow();
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
      await cleanupSession();
    }
  }, [cleanupSession, runAndroidVoiceFlow, start, status, stop]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  return {
    supported: canUseVoiceSearch(),
    status,
    error,
    isListening: status === "listening" || status === "preparing",
    start,
    stop,
    toggle,
    clearError,
  };
}
