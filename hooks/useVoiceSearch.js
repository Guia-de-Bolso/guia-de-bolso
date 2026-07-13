"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  abortNativeVoiceCapture,
  ANDROID_VOICE_POPUP_TIMEOUT_MS,
  ANDROID_VOICE_PREPARE_TIMEOUT_MS,
  canUseNativeVoiceSearch,
  canUseVoiceSearch,
  createVoiceCaptureSession,
  ensureSpeechPermissions,
  ensureVoiceSessionIdle,
  formatSpeechError,
  isAndroidNative,
  isRecoverableSpeechError,
  probeNativeSpeechPlugin,
  resetNativeSpeechBridge,
  runAndroidPopupVoiceCapture,
  VOICE_SEARCH_MESSAGES,
  VOICE_ANDROID_POPUP_HINT,
  VOICE_IOS_LISTENING_HINT,
  withVoiceCaptureTimeout,
} from "@/lib/speechRecognition";

/** Encerra automaticamente se o usuário não parar manualmente (iOS). */
const IOS_AUTO_STOP_MS = 30000;

/**
 * Hook de busca por voz.
 * Android: diálogo nativo do Google (um toque).
 * iOS: escuta inline com parciais (toque para parar).
 * @param {object} [options]
 * @param {(text: string) => void} [options.onPartial]
 * @param {(text: string) => void} [options.onTranscript]
 */
export function useVoiceSearch({ onPartial, onTranscript } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const sessionRef = useRef(null);
  const captureBusyRef = useRef(false);
  const latestPartialRef = useRef("");
  const autoStopTimerRef = useRef(null);
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

  const deliverTranscript = useCallback(
    (text) => {
      const finalText = String(text || latestPartialRef.current || "").trim();
      latestPartialRef.current = "";
      captureBusyRef.current = false;
      resetVoiceUi();

      if (finalText) {
        onPartialRef.current?.(finalText);
        onTranscriptRef.current?.(finalText);
        return;
      }

      setError(VOICE_SEARCH_MESSAGES.NO_SPEECH);
      setStatus("error");
    },
    [resetVoiceUi]
  );

  const runAndroidPopupFlow = useCallback(async () => {
    captureBusyRef.current = true;
    latestPartialRef.current = "";
    setStatus("preparing");
    setError("");
    setHint(VOICE_ANDROID_POPUP_HINT);

    const watchdog = setTimeout(() => {
      if (!captureBusyRef.current) return;
      captureBusyRef.current = false;
      setStatus("error");
      setError(VOICE_SEARCH_MESSAGES.POPUP_TIMEOUT);
      setHint("");
      void abortNativeVoiceCapture();
      void resetNativeSpeechBridge();
    }, 15000);

    try {
      setStatus("idle");
      setHint("Aguarde o diálogo do Google na tela.");

      const text = await withVoiceCaptureTimeout(
        runAndroidPopupVoiceCapture(),
        ANDROID_VOICE_POPUP_TIMEOUT_MS,
        "popup-timeout"
      );

      deliverTranscript(text);
    } catch (err) {
      captureBusyRef.current = false;
      const message = formatSpeechError(err);
      if (!message || message === VOICE_SEARCH_MESSAGES.CANCELLED) {
        resetVoiceUi();
        return;
      }
      setStatus("error");
      setError(message || VOICE_SEARCH_MESSAGES.START_FAILED);
      setHint("");
      await resetNativeSpeechBridge();
    } finally {
      clearTimeout(watchdog);
    }
  }, [deliverTranscript, resetVoiceUi]);

  const runIosVoiceFlow = useCallback(async () => {
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
          setStatus("listening");
          setHint(VOICE_IOS_LISTENING_HINT);
        },
      });

      sessionRef.current = session;
      setStatus("listening");
      setHint(VOICE_IOS_LISTENING_HINT);

      clearAutoStopTimer();
      autoStopTimerRef.current = setTimeout(() => {
        void (async () => {
          if (!sessionRef.current) return;
          const text = await stop();
          deliverTranscript(text);
        })();
      }, IOS_AUTO_STOP_MS);
    } catch (err) {
      captureBusyRef.current = false;
      setStatus("error");
      setError(formatSpeechError(err) || VOICE_SEARCH_MESSAGES.START_FAILED);
      setHint("");
      await cleanupSession();
      await ensureVoiceSessionIdle();
    }
  }, [cleanupSession, clearAutoStopTimer, deliverTranscript, rememberPartial, stop]);

  const start = useCallback(async () => {
    if (!canUseVoiceSearch()) {
      setStatus("error");
      setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
      return;
    }

    if (isAndroidNative()) {
      await runAndroidPopupFlow();
      return;
    }

    if (canUseNativeVoiceSearch()) {
      await runIosVoiceFlow();
      return;
    }

    setStatus("preparing");
    setError("");

    try {
      const session = await createVoiceCaptureSession({
        onPartial: rememberPartial,
        onError: (message) => {
          setStatus("error");
          setError(message);
        },
      });

      sessionRef.current = session;
      setStatus("listening");
      setHint(VOICE_IOS_LISTENING_HINT);
    } catch (err) {
      setStatus("error");
      setError(formatSpeechError(err));
      await cleanupSession();
    }
  }, [cleanupSession, rememberPartial, runAndroidPopupFlow, runIosVoiceFlow]);

  const toggle = useCallback(async () => {
    try {
      if (!canUseVoiceSearch()) {
        setStatus("error");
        setError(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
        return;
      }

      if (isAndroidNative()) {
        if (captureBusyRef.current) {
          await cancelCapture();
          return;
        }
        await runAndroidPopupFlow();
        return;
      }

      const iosActive =
        canUseNativeVoiceSearch() &&
        (status === "listening" || status === "preparing" || captureBusyRef.current);

      if (iosActive) {
        const text = await stop();
        deliverTranscript(text);
        await ensureVoiceSessionIdle();
        return;
      }

      if (canUseNativeVoiceSearch()) {
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
      captureBusyRef.current = false;
      setStatus("error");
      setError(formatSpeechError(err) || VOICE_SEARCH_MESSAGES.START_FAILED);
      setHint("");
      await cleanupSession();
      await ensureVoiceSessionIdle();
    }
  }, [
    cancelCapture,
    cleanupSession,
    deliverTranscript,
    runAndroidPopupFlow,
    runIosVoiceFlow,
    start,
    status,
    stop,
  ]);

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
    isListening: status === "listening",
    isPreparing: status === "preparing",
    start,
    stop,
    toggle,
    clearError,
  };
}
