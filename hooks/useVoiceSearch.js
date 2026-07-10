"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canUseNativeVoiceSearch,
  createVoiceCaptureSession,
  ensureSpeechPermissions,
  VOICE_SEARCH_MESSAGES,
} from "@/lib/speechRecognition";

/**
 * Hook de busca por voz no app nativo Capacitor.
 * @param {object} [options]
 * @param {(text: string) => void} [options.onPartial] - Atualiza o input enquanto o usuário fala.
 * @param {(text: string) => void} [options.onTranscript] - Texto final ao encerrar a captura.
 * @returns {{
 *   supported: boolean,
 *   status: "idle" | "listening" | "denied" | "error",
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

  const start = useCallback(async () => {
    if (!canUseNativeVoiceSearch()) return;

    setError("");

    const permission = await ensureSpeechPermissions();
    if (!permission.granted) {
      setStatus("denied");
      setError(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
      return;
    }

    try {
      const session = await createVoiceCaptureSession({
        onPartial: (text) => onPartialRef.current?.(text),
        onError: (message) => setError(message),
      });

      sessionRef.current = session;
      setStatus("listening");
    } catch (err) {
      setStatus("error");
      setError(err?.message ?? VOICE_SEARCH_MESSAGES.START_FAILED);
      await cleanupSession();
    }
  }, [cleanupSession]);

  const toggle = useCallback(async () => {
    if (status === "listening") {
      const text = await stop();
      if (text) onTranscriptRef.current?.(text);
      return;
    }

    await start();
  }, [start, status, stop]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  return {
    supported: canUseNativeVoiceSearch(),
    status,
    error,
    isListening: status === "listening",
    start,
    stop,
    toggle,
    clearError,
  };
}
