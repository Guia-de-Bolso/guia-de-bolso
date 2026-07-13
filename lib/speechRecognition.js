import { Capacitor } from "@capacitor/core";
import { isCapacitorNative } from "./capacitorNavigation.js";

/** Locale usado no reconhecimento de voz da busca por IA. */
export const SPEECH_LANG = "pt-BR";

/** Tempo máximo aguardando o início da captura nativa. */
export const NATIVE_VOICE_START_TIMEOUT_MS = 15000;

/** Dica exibida enquanto o app escuta (iOS e Android inline). */
export const VOICE_LISTENING_HINT =
  "Fale agora. Toque no microfone de novo para buscar.";

/** Mensagens exibidas na UI da busca por voz. */
export const VOICE_SEARCH_MESSAGES = {
  UNAVAILABLE: "Reconhecimento de voz indisponível neste dispositivo.",
  PLUGIN_MISSING:
    "Atualize o app na App Store ou Play Store para usar a busca por voz.",
  PERMISSION_DENIED:
    "Permita o microfone nas configurações do app para buscar por voz.",
  START_FAILED: "Não foi possível iniciar a busca por voz. Tente de novo.",
  TIMEOUT: "A busca por voz demorou demais. Tente de novo.",
  CANCELLED: "Busca por voz cancelada.",
  NO_SPEECH:
    "Não ouvimos fala. Fale por 2–3 segundos perto do microfone e toque no microfone de novo.",
};

/**
 * Rejeita se a promise não resolver dentro do prazo.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [message]
 * @returns {Promise<T>}
 */
export function withVoiceCaptureTimeout(promise, ms, message = VOICE_SEARCH_MESSAGES.TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/**
 * Busca por voz no app nativo Capacitor.
 * @returns {boolean}
 */
export function canUseNativeVoiceSearch() {
  return isCapacitorNative();
}

/**
 * Web Speech API — apenas no browser (não no app nativo).
 * @returns {boolean}
 */
export function canUseWebVoiceSearch() {
  if (typeof window === "undefined") return false;
  if (isCapacitorNative()) return false;
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
 * @returns {boolean}
 */
export function isIosNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/**
 * @returns {boolean}
 */
export function usesInlineNativeVoice() {
  return isAndroidNative() || isIosNative();
}

/**
 * Normaliza erros do plugin Capacitor / WebView.
 * @param {unknown} error
 * @returns {string}
 */
export function formatSpeechError(error) {
  const message = String(error?.message ?? error ?? "").trim();
  if (!message) {
    return "";
  }

  if (/not implemented|unimplemented|not available on the web/i.test(message)) {
    return VOICE_SEARCH_MESSAGES.PLUGIN_MISSING;
  }

  if (/already running/i.test(message)) {
    return VOICE_SEARCH_MESSAGES.START_FAILED;
  }

  if (message === "0" || /^cancel/i.test(message) || message === "Recognition stopped") {
    return VOICE_SEARCH_MESSAGES.CANCELLED;
  }

  if (/permission|denied|not allowed|MISSING_PERMISSION/i.test(message)) {
    return VOICE_SEARCH_MESSAGES.PERMISSION_DENIED;
  }

  return message || VOICE_SEARCH_MESSAGES.START_FAILED;
}

/**
 * Interrompe captura nativa em andamento.
 * @returns {Promise<void>}
 */
export async function abortNativeVoiceCapture() {
  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    await SpeechRecognition.forceStop({ timeout: 2000 }).catch(() => SpeechRecognition.stop());
    await SpeechRecognition.removeAllListeners().catch(() => undefined);
  } catch {
    /* noop */
  }
}

/** @deprecated Use abortNativeVoiceCapture */
export const abortAndroidVoiceCapture = abortNativeVoiceCapture;

/**
 * Garante que não há sessão nativa presa antes de iniciar outra.
 * @returns {Promise<void>}
 */
export async function ensureVoiceSessionIdle() {
  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    const { listening } = await SpeechRecognition.isListening();
    if (listening) {
      await abortNativeVoiceCapture();
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }
  } catch {
    await abortNativeVoiceCapture();
  }
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
 * Escolhe o primeiro locale suportado pelo reconhecedor nativo.
 * @param {import("@capgo/capacitor-speech-recognition").SpeechRecognitionPlugin} SpeechRecognition
 * @returns {Promise<string>}
 */
export async function resolveSpeechLocale(SpeechRecognition) {
  const candidates = [SPEECH_LANG, "pt_BR", "pt-BR", "pt"];

  for (const language of candidates) {
    try {
      const { available } = await SpeechRecognition.available({ language });
      if (available) return language;
    } catch {
      /* tenta próximo */
    }
  }

  return SPEECH_LANG;
}

/**
 * Lê o último texto conhecido pelo plugin nativo.
 * @returns {Promise<string>}
 */
export async function readNativePartialTranscript() {
  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    const last = await SpeechRecognition.getLastPartialResult();
    return pickBestTranscript(last);
  } catch {
    return "";
  }
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
export function pickLongerTranscript(a, b) {
  const left = String(a || "").trim();
  const right = String(b || "").trim();
  return right.length > left.length ? right : left;
}

/**
 * Garante que o bridge nativo está ativo (não o stub web do Capacitor).
 * @param {import("@capgo/capacitor-speech-recognition").SpeechRecognitionPlugin} SpeechRecognition
 */
async function assertNativeSpeechPlugin(SpeechRecognition) {
  try {
    const { version } = await SpeechRecognition.getPluginVersion();
    if (version === "web") {
      throw new Error(VOICE_SEARCH_MESSAGES.PLUGIN_MISSING);
    }
  } catch (error) {
    if (String(error?.message ?? "").includes(VOICE_SEARCH_MESSAGES.PLUGIN_MISSING)) {
      throw error;
    }
  }
}

/**
 * Garante permissão de microfone no app nativo.
 * @returns {Promise<{ granted: boolean, error?: string }>}
 */
export async function ensureSpeechPermissions() {
  if (!canUseNativeVoiceSearch()) {
    return { granted: canUseWebVoiceSearch() };
  }

  try {
    const SpeechRecognition = await loadSpeechRecognitionPlugin();
    await assertNativeSpeechPlugin(SpeechRecognition);

    const status = await SpeechRecognition.checkPermissions();

    if (isSpeechPermissionGranted(status)) {
      return { granted: true };
    }

    const requested = await SpeechRecognition.requestPermissions();
    if (isSpeechPermissionGranted(requested)) {
      return { granted: true };
    }

    return {
      granted: false,
      error: VOICE_SEARCH_MESSAGES.PERMISSION_DENIED,
    };
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
    await assertNativeSpeechPlugin(SpeechRecognition);

    const language = await resolveSpeechLocale(SpeechRecognition);
    const { available } = await withVoiceCaptureTimeout(
      SpeechRecognition.available({ language }),
      5000,
      VOICE_SEARCH_MESSAGES.PLUGIN_MISSING
    );

    if (!available) {
      return { ok: false, error: VOICE_SEARCH_MESSAGES.UNAVAILABLE };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatSpeechError(error) };
  }
}

/**
 * Captura inline com parciais — fluxo único iOS + Android (sem popup do Google).
 * @param {object} options
 * @param {(text: string) => void} [options.onPartial]
 * @param {(message: string) => void} [options.onError]
 * @param {() => void} [options.onStarted]
 * @returns {Promise<{ stop: () => Promise<string>, removeListeners: () => Promise<void> }>}
 */
async function createNativeVoiceCaptureSession({ onPartial, onError, onStarted }) {
  const SpeechRecognition = await loadSpeechRecognitionPlugin();
  await assertNativeSpeechPlugin(SpeechRecognition);
  await ensureVoiceSessionIdle();

  const language = await resolveSpeechLocale(SpeechRecognition);
  const { available } = await withVoiceCaptureTimeout(
    SpeechRecognition.available({ language }),
    5000,
    VOICE_SEARCH_MESSAGES.UNAVAILABLE
  );

  if (!available) {
    throw new Error(VOICE_SEARCH_MESSAGES.UNAVAILABLE);
  }

  let latestText = "";

  /** @type {import("@capacitor/core").PluginListenerHandle[]} */
  const handles = [];

  const partialHandle = await SpeechRecognition.addListener("partialResults", (event) => {
    const text = pickBestTranscript(event);
    if (!text) return;
    latestText = pickLongerTranscript(latestText, text);
    onPartial?.(text);
  });
  handles.push(partialHandle);

  const errorHandle = await SpeechRecognition.addListener("error", (event) => {
    onError?.(event?.message || VOICE_SEARCH_MESSAGES.START_FAILED);
  });
  handles.push(errorHandle);

  const listeningHandle = await SpeechRecognition.addListener("listeningState", (event) => {
    const started =
      event?.status === "started" ||
      event?.state === "started" ||
      event?.state === "startedListening";
    if (started) onStarted?.();
  });
  handles.push(listeningHandle);

  if (usesInlineNativeVoice()) {
    await SpeechRecognition.setPTTState({ held: true }).catch(() => undefined);
  }

  await withVoiceCaptureTimeout(
    SpeechRecognition.start({
      language,
      partialResults: true,
      popup: false,
      addPunctuation: true,
      maxResults: 5,
      continuousPTT: true,
      muteRecognizerBeep: isAndroidNative(),
    }),
    NATIVE_VOICE_START_TIMEOUT_MS
  );

  onStarted?.();

  return {
    async stop() {
      let text = pickBestTranscript(latestText);

      try {
        const cached = await SpeechRecognition.getLastPartialResult();
        text = pickLongerTranscript(text, pickBestTranscript(cached));
      } catch {
        /* noop */
      }

      if (usesInlineNativeVoice()) {
        await SpeechRecognition.setPTTState({ held: false }).catch(() => undefined);
      }

      try {
        await SpeechRecognition.forceStop({ timeout: 2000 });
      } catch {
        await SpeechRecognition.stop().catch(() => undefined);
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });

      try {
        const last = await SpeechRecognition.getLastPartialResult();
        text = pickLongerTranscript(text, pickBestTranscript(last));
      } catch {
        /* noop */
      }

      return text;
    },
    async removeListeners() {
      await Promise.all(handles.map((handle) => handle.remove()));
      await SpeechRecognition.removeAllListeners().catch(() => undefined);
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

export async function createVoiceCaptureSession({ onPartial, onError, onStarted }) {
  if (canUseNativeVoiceSearch()) {
    return createNativeVoiceCaptureSession({ onPartial, onError, onStarted });
  }

  return createWebVoiceCaptureSession({ onPartial, onError });
}
