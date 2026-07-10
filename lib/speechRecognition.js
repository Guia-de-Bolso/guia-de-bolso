import { Capacitor } from "@capacitor/core";
import { isCapacitorNative } from "./capacitorNavigation.js";

/** Locale usado no reconhecimento de voz da busca por IA. */
export const SPEECH_LANG = "pt-BR";

/** Mensagens exibidas na UI da busca por voz. */
export const VOICE_SEARCH_MESSAGES = {
  UNAVAILABLE: "Reconhecimento de voz indisponível neste dispositivo.",
  PLUGIN_MISSING:
    "Atualize o app na Play Store ou App Store para usar a busca por voz.",
  PERMISSION_DENIED:
    "Permita o microfone nas configurações do app para buscar por voz.",
  START_FAILED: "Não foi possível iniciar a busca por voz. Tente de novo.",
};

/**
 * Busca por voz no app nativo Capacitor.
 * @returns {boolean}
 */
export function canUseNativeVoiceSearch() {
  return isCapacitorNative();
}

/**
 * Web Speech API (Safari/Chrome) — fallback na web e no WebView quando o plugin nativo não estiver disponível.
 * @returns {boolean}
 */
export function canUseWebVoiceSearch() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * @returns {boolean}
 */
export function canUseVoiceSearch() {
  return canUseNativeVoiceSearch() || canUseWebVoiceSearch();
}

/**
 * @returns {boolean}
 */
export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

/**
 * Normaliza erros do plugin Capacitor / WebView.
 * @param {unknown} error
 * @returns {string}
 */
export function formatSpeechError(error) {
  const message = String(error?.message ?? error ?? "").trim();
  if (!message || message === "0") {
    return "";
  }

  if (/not implemented|unimplemented|not available on the web/i.test(message)) {
    return VOICE_SEARCH_MESSAGES.PLUGIN_MISSING;
  }

  if (/^cancel/i.test(message) || message === "Recognition stopped") {
    return "";
  }

  return message || VOICE_SEARCH_MESSAGES.START_FAILED;
}

/**
 * Android popup: `start()` só resolve quando o usuário termina o diálogo nativo.
 * @param {object} [options]
 * @param {(text: string) => void} [options.onPartial]
 * @returns {Promise<string>}
 */
export async function runAndroidPopupVoiceCapture({ onPartial } = {}) {
  const SpeechRecognition = await loadSpeechRecognitionPlugin();
  const { available } = await SpeechRecognition.available();

  if (!available) {
    throw new Error(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
  }

  const result = await SpeechRecognition.start({
    language: SPEECH_LANG,
    partialResults: true,
    popup: true,
    prompt: "Fale o que você quer descobrir",
    addPunctuation: true,
  });

  const matches = Array.isArray(result?.matches) ? result.matches : [];
  const text = pickBestTranscript(matches[0] ?? result);

  if (text) {
    onPartial?.(text);
  }

  return text;
}

/**
 * Extrai o melhor texto de um evento parcial ou resultado final do plugin.
 * @param {import("@capgo/capacitor-speech-recognition").SpeechRecognitionPartialResultEvent | import("@capgo/capacitor-speech-recognition").LastPartialResult | string | null | undefined} event
 * @returns {string}
 */
export function pickBestTranscript(event) {
  if (!event) return "";
  if (typeof event === "string") return event.trim();

  const text =
    event.accumulatedText ||
    event.accumulated ||
    event.text ||
    (Array.isArray(event.matches) ? event.matches[0] : "");

  return String(text || "").trim();
}

/**
 * @param {import("@capgo/capacitor-speech-recognition").SpeechRecognitionPermissionStatus | null | undefined} status
 * @returns {boolean}
 */
export function isSpeechPermissionGranted(status) {
  return status?.speechRecognition === "granted";
}

/**
 * @returns {Promise<import("@capgo/capacitor-speech-recognition").SpeechRecognitionPlugin>}
 */
async function loadSpeechRecognitionPlugin() {
  const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition");
  return SpeechRecognition;
}

/**
 * Garante permissão de microfone e reconhecimento de fala no app nativo.
 * @returns {Promise<{ granted: boolean }>}
 */
export async function ensureSpeechPermissions() {
  if (!canUseNativeVoiceSearch()) {
    return { granted: canUseWebVoiceSearch() };
  }

  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    const status = await SpeechRecognition.checkPermissions();

    if (isSpeechPermissionGranted(status)) {
      return { granted: true };
    }

    const requested = await SpeechRecognition.requestPermissions();
    return { granted: isSpeechPermissionGranted(requested) };
  } catch (error) {
    return { granted: false, error: formatSpeechError(error) };
  }
}

/**
 * Verifica se o plugin nativo está registrado e o dispositivo suporta STT.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function probeNativeSpeechPlugin() {
  if (!canUseNativeVoiceSearch()) {
    return { ok: false, error: VOICE_SEARCH_MESSAGES.UNAVAILABLE };
  }

  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    const { available } = await SpeechRecognition.available();

    if (!available) {
      return { ok: false, error: VOICE_SEARCH_MESSAGES.UNAVAILABLE };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatSpeechError(error) };
  }
}

/**
 * Inicia captura de voz com resultados parciais.
 * @param {object} options
 * @param {(text: string) => void} [options.onPartial]
 * @param {(message: string) => void} [options.onError]
 * @returns {Promise<{ stop: () => Promise<string>, removeListeners: () => Promise<void> }>}
 */
async function createNativeVoiceCaptureSession({ onPartial, onError }) {
  const SpeechRecognition = await loadSpeechRecognitionPlugin();
  const { available } = await SpeechRecognition.available();

  if (!available) {
    throw new Error(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
  }

  /** @type {import("@capacitor/core").PluginListenerHandle[]} */
  const handles = [];

  const partialHandle = await SpeechRecognition.addListener("partialResults", (event) => {
    const text = pickBestTranscript(event);
    if (text) onPartial?.(text);
  });
  handles.push(partialHandle);

  const errorHandle = await SpeechRecognition.addListener("error", (event) => {
    onError?.(event.message || VOICE_SEARCH_MESSAGES.START_FAILED);
  });
  handles.push(errorHandle);

  await SpeechRecognition.start({
    language: SPEECH_LANG,
    partialResults: true,
    popup: false,
    addPunctuation: true,
  });

  return {
    async stop() {
      await SpeechRecognition.stop();
      const last = await SpeechRecognition.getLastPartialResult();
      if (!last.available) return "";
      return pickBestTranscript(last);
    },
    async removeListeners() {
      await Promise.all(handles.map((handle) => handle.remove()));
      await SpeechRecognition.removeAllListeners();
    },
  };
}

/**
 * @param {object} options
 * @param {(text: string) => void} [options.onPartial]
 * @param {(message: string) => void} [options.onError]
 * @returns {Promise<{ stop: () => Promise<string>, removeListeners: () => Promise<void> }>}
 */
function createWebVoiceCaptureSession({ onPartial, onError }) {
  const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!WebSpeechRecognition) {
    throw new Error(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
  }

  const recognition = new WebSpeechRecognition();
  recognition.lang = SPEECH_LANG;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let latestText = "";

  recognition.onresult = (event) => {
    let chunk = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      chunk += event.results[index][0]?.transcript ?? "";
    }
    latestText = chunk.trim();
    if (latestText) onPartial?.(latestText);
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed") {
      onError?.(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED);
      return;
    }
    if (event.error === "aborted") return;
    onError?.(VOICE_SEARCH_MESSAGES.START_FAILED);
  };

  recognition.start();

  return {
    async stop() {
      return new Promise((resolve) => {
        recognition.onend = () => resolve(latestText);
        try {
          recognition.stop();
        } catch {
          resolve(latestText);
        }
      });
    },
    async removeListeners() {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    },
  };
}

export async function createVoiceCaptureSession({ onPartial, onError }) {
  if (canUseNativeVoiceSearch()) {
    try {
      return await createNativeVoiceCaptureSession({ onPartial, onError });
    } catch (error) {
      if (!canUseWebVoiceSearch()) throw error;
    }
  }

  return createWebVoiceCaptureSession({ onPartial, onError });
}
