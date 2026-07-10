import { isCapacitorNative } from "./capacitorNavigation.js";

/** Locale usado no reconhecimento de voz da busca por IA. */
export const SPEECH_LANG = "pt-BR";

/** Mensagens exibidas na UI da busca por voz. */
export const VOICE_SEARCH_MESSAGES = {
  UNAVAILABLE: "Reconhecimento de voz indisponível neste dispositivo.",
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
  if (!status) return false;
  return (
    status.speechRecognition === "granted" ||
    status.microphone === "granted" ||
    status.recordAudio === "granted"
  );
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

  const SpeechRecognition = await loadSpeechRecognitionPlugin();
  const status = await SpeechRecognition.checkPermissions();

  if (isSpeechPermissionGranted(status)) {
    return { granted: true };
  }

  const requested = await SpeechRecognition.requestPermissions();
  return { granted: isSpeechPermissionGranted(requested) };
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
