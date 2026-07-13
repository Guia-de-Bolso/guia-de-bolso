"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  abortNativeVoiceCapture,
  canUseNativeVoiceSearch,
  canUseVoiceSearch,
  createVoiceCaptureSession,
  ensureSpeechPermissions,
  ensureVoiceSessionIdle,
  formatSpeechError,
  isRecoverableSpeechError,
  probeNativeSpeechPlugin,
  VOICE_LISTENING_HINT,
  VOICE_SEARCH_MESSAGES,
} from "@/lib/speechRecognition";

/** Encerra automaticamente se o usuário não parar manualmente. */
const NATIVE_AUTO_STOP_MS = 30000;
/** Tempo mínimo ouvindo antes de aceitar o segundo toque (evita parar cedo demais). */
const MIN_NATIVE_LISTEN_MS = 1500;

/**
 * Hook de busca por voz no app nativo Capacitor.
 * @param {object} [options]
 * @param {(text: string) => void} [options.onPartial] - Atualiza o input enquanto o usuário fala.
 * @param {(text: string) => void} [options.onTranscript] - Texto final ao encerrar a captura.
 */
export function useVoiceSearch({ onPartial, onTranscript } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const sessionRef = useRef(null);
  const captureBusyRef = useRef(false);
  const latestPartialRef = useRef("");
  const autoStopTimerRef = useRef(null);
  const listenStartedAtRef = useRef(0);
  const onPartialRef = useRef(onPartial);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onPartialRef.current = onPartial;
    onTranscriptRef.current = onTranscript;
  }, [onPartial, onTranscript]);

  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const resetVoiceUi = useCallback(() => {
    clearAutoStopTimer();
    setStatus("idle");
    setHint("");
  }, [clearAutoStopTimer]);

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
    latestPartialRef.current = "";
    clearAutoStopTimer();
    await cleanupSession();
    await abortNativeVoiceCapture();
    await ensureVoiceSessionIdle();
    resetVoiceUi();
    setError("");
  }, [cleanupSession, clearAutoStopTimer, resetVoiceUi]);

  const rememberPartial = useCallback((text) => {
    const value = String(text || "").trim();
    if (!value) return;
    latestPartialRef.current = value;
    onPartialRef.current?.(value);
  }, []);

  const finishWithTranscript = useCallback(
    (text) => {
      const finalText = String(text || latestPartialRef.current || "").trim();
      latestPartialRef.current = "";
      captureBusyRef.current = false;
      resetVoiceUi();

      if (finalText) {
        onTranscriptRef.current?.(finalText);
        return;
      }

      setError(VOICE_SEARCH_MESSAGES.NO_SPEECH);
      setStatus("error");
    },
    [resetVoiceUi]
  );

  const runNativeVoiceFlow = useCallback(async () => {
    captureBusyRef.current = true;
    latestPartialRef.current = "";
    setStatus("preparing");
    setError("");
    setHint("");

    try {
      await ensureVoiceSessionIdle();

      const probe = await probeNativeSpeechPlugin();
      if (!probe.ok) {
        setStatus("error");
        setError(probe.error ?? VOICE_SEARCH_MESSAGES.PLUGIN_MISSING);
        captureBusyRef.current = false;
        return;
      }

      const permission = await ensureSpeechPermissions();
      if (!permission.granted) {
        setStatus("denied");
        setError(permission.error ?? VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
        captureBusyRef.current = false;
        return;
      }

      const session = await createVoiceCaptureSession({
        onPartial: rememberPartial,
        onError: (message) => {
          if (isRecoverableSpeechError(message)) return;

          captureBusyRef.current = false;
          setStatus("error");
          setError(message);
          setHint("");
          void cleanupSession();
        },
        onStarted: () => {
          listenStartedAtRef.current = Date.now();
          setStatus("listening");
          setHint(VOICE_LISTENING_HINT);
        },
      });

      sessionRef.current = session;
      listenStartedAtRef.current = Date.now();
      setStatus("listening");
      setHint(VOICE_LISTENING_HINT);

      clearAutoStopTimer();
      autoStopTimerRef.current = setTimeout(() => {
        void (async () => {
          if (!sessionRef.current) return;
          const text = await stop();
          finishWithTranscript(text);
        })();
      }, NATIVE_AUTO_STOP_MS);
    } catch (err) {
      captureBusyRef.current = false;
      setStatus("error");
      setError(formatSpeechError(err) || VOICE_SEARCH_MESSAGES.START_FAILED);
      setHint("");
      await cleanupSession();
      await ensureVoiceSessionIdle();
    }
  }, [cleanupSession, clearAutoStopTimer, finishWithTranscript, rememberPartial, resetVoiceUi, stop]);

  const start = useCallback(async () => {
    if (!canUseVoiceSearch()) {
      setStatus("error");
      setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
      return;
    }

    if (canUseNativeVoiceSearch()) {
      await runNativeVoiceFlow();
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
        onPartial: rememberPartial,
        onError: (message) => {
          setStatus("error");
          setError(message);
        },
      });

      sessionRef.current = session;
      setStatus("listening");
      setHint(VOICE_LISTENING_HINT);
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      await cleanupSession();
    }
  }, [cleanupSession, rememberPartial, runNativeVoiceFlow]);

  const toggle = useCallback(async () => {
    try {
      if (!canUseVoiceSearch()) {
        setStatus("error");
        setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
        return;
      }

      const nativeActive =
        canUseNativeVoiceSearch() &&
        (status === "listening" || status === "preparing" || captureBusyRef.current);

      if (nativeActive) {
        const elapsed = Date.now() - listenStartedAtRef.current;
        if (elapsed < MIN_NATIVE_LISTEN_MS && !latestPartialRef.current) {
          const secondsLeft = Math.max(1, Math.ceil((MIN_NATIVE_LISTEN_MS - elapsed) / 1000));
          setHint(`Ouvindo… fale por mais ${secondsLeft}s e toque de novo.`);
          return;
        }

        const text = await stop();
        finishWithTranscript(text);
        await ensureVoiceSessionIdle();
        return;
      }

      if (canUseNativeVoiceSearch()) {
        await runNativeVoiceFlow();
        return;
      }

      if (status === "listening" || status === "preparing") {
        const text = await stop();
        if (text) onTranscriptRef.current?.(text);
        return;
      }

      await start();
    } catch (err) {
      captureBusyRef.current = false;
      setStatus("error");
      setError(formatSpeechError(err) || VOICE_SEARCH_MESSAGES.START_FAILED);
      setHint("");
      await cleanupSession();
      await ensureVoiceSessionIdle();
    }
  }, [cleanupSession, finishWithTranscript, runNativeVoiceFlow, start, status, stop]);

  useEffect(() => {
    return () => {
      captureBusyRef.current = false;
      clearAutoStopTimer();
      void cleanupSession();
      void abortNativeVoiceCapture();
    };
  }, [cleanupSession, clearAutoStopTimer]);

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
