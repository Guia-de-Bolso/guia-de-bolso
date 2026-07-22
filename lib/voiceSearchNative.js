import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { mapNativeVoiceError, VOICE_ERROR } from "@/lib/voiceSearchErrors";

/**
 * Resultado da sonda do recognizer nativo.
 * @typedef {{ ok: boolean, reason?: string }} NativeVoiceProbe
 */

/**
 * @returns {typeof SpeechRecognition}
 */
function getSpeechRecognition() {
  return SpeechRecognition;
}

/**
 * Reconhecimento nativo disponível (Capacitor + SFSpeechRecognizer / SpeechRecognizer).
 * @returns {Promise<NativeVoiceProbe>}
 */
export async function probeNativeVoice() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not_native" };
  }

  try {
    const result = await getSpeechRecognition().available();
    if (result?.available) return { ok: true };
    return { ok: false, reason: "unavailable" };
  } catch (err) {
    console.warn("[voiceSearchNative] probe falhou:", err);
    return { ok: true, reason: "probe_error" };
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function nativeVoiceAvailable() {
  const probe = await probeNativeVoice();
  return probe.ok;
}

/**
 * @returns {Promise<boolean>}
 */
export async function ensureNativeVoicePermission() {
  const SR = getSpeechRecognition();

  let current;
  try {
    current = await SR.checkPermissions();
  } catch (err) {
    console.error("[voiceSearchNative] checkPermissions:", err);
    throw err;
  }

  if (current?.speechRecognition === "granted") return true;

  let next;
  try {
    next = await SR.requestPermissions();
  } catch (err) {
    console.error("[voiceSearchNative] requestPermissions:", err);
    throw err;
  }

  return next?.speechRecognition === "granted";
}

/**
 * @param {import("@capgo/capacitor-speech-recognition").SpeechRecognitionPartialResultEvent} event
 * @returns {string}
 */
export function textFromPartialEvent(event) {
  if (!event) return "";
  if (event.accumulatedText) return String(event.accumulatedText).trim();
  if (event.matches?.[0]) return String(event.matches[0]).trim();
  if (event.accumulated) return String(event.accumulated).trim();
  return "";
}

/**
 * Inicia sessão nativa com UI própria (popup: false).
 * Listeners devem ser registrados ANTES de chamar start (já feito aqui).
 * @param {{
 *   onPartial: (text: string) => void,
 *   onListeningChange: (listening: boolean) => void,
 *   onError: (code: string) => void,
 * }} handlers
 * @returns {Promise<{ stop: () => Promise<void>, cleanup: () => Promise<void> }>}
 */
export async function startNativeListening(handlers) {
  const SR = getSpeechRecognition();

  let availability;
  try {
    availability = await SR.available();
  } catch (err) {
    console.error("[voiceSearchNative] available() no start:", err);
    const code = VOICE_ERROR.UNAVAILABLE;
    handlers.onError(code);
    const error = new Error("Speech recognition bridge unavailable");
    error.voiceHandled = true;
    throw error;
  }

  if (!availability?.available) {
    handlers.onError(VOICE_ERROR.UNAVAILABLE);
    const error = new Error("Speech recognition unavailable");
    error.voiceHandled = true;
    throw error;
  }

  /** @type {import("@capacitor/core").PluginListenerHandle[]} */
  const handles = [];

  handles.push(
    await SR.addListener("partialResults", (event) => {
      const text = textFromPartialEvent(event);
      if (text) handlers.onPartial(text);
    })
  );

  handles.push(
    await SR.addListener("listeningState", (event) => {
      const state = event?.state;
      const status = event?.status;

      if (
        status === "started" ||
        state === "started" ||
        state === "startingListening"
      ) {
        handlers.onListeningChange(true);
        return;
      }

      if (status === "stopped" || state === "stopped") {
        handlers.onListeningChange(false);
      }

      if (event?.errorCode) {
        handlers.onError(mapNativeVoiceError(event.errorCode));
      }
    })
  );

  handles.push(
    await SR.addListener("error", (event) => {
      handlers.onError(mapNativeVoiceError(event?.code || event?.message));
      handlers.onListeningChange(false);
    })
  );

  // Feedback imediato — o evento nativo pode atrasar no live reload.
  handlers.onListeningChange(true);

  try {
    await SR.start({
      language: "pt-BR",
      partialResults: true,
      popup: false,
      maxResults: 1,
    });
  } catch (err) {
    console.error("[voiceSearchNative] start():", err);
    // onError antes de listening=false para não mostrar "não ouvi nada" no lugar do erro real.
    handlers.onError(mapNativeVoiceError(err?.message || err));
    handlers.onListeningChange(false);
    for (const handle of handles) {
      try {
        await handle?.remove?.();
      } catch {
        /* ignore */
      }
    }
    const error = err instanceof Error ? err : new Error(String(err));
    error.voiceHandled = true;
    throw error;
  }

  return {
    async stop() {
      try {
        await SR.stop();
      } catch {
        try {
          await SR.forceStop();
        } catch {
          /* ignore */
        }
      }
    },
    async cleanup() {
      for (const handle of handles) {
        try {
          await handle?.remove?.();
        } catch {
          /* ignore */
        }
      }
      try {
        await SR.removeAllListeners();
      } catch {
        /* ignore */
      }
    },
  };
}
