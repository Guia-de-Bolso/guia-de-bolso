/**
 * FALLBACK APENAS PARA DEV NO BROWSER (`next dev`).
 *
 * NÃO usar dentro do WebView Capacitor — a Web Speech API
 * (webkitSpeechRecognition) falha de forma não confiável lá.
 * Produção nativa: `lib/voiceSearchNative.js` + `@capgo/capacitor-speech-recognition`.
 */

import { VOICE_ERROR } from "@/lib/voiceSearchErrors";

/**
 * @returns {boolean}
 */
export function browserVoiceSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * @param {{
 *   onPartial: (text: string) => void,
 *   onListeningChange: (listening: boolean) => void,
 *   onError: (code: string) => void,
 * }} handlers
 * @returns {{ stop: () => void, cleanup: () => void }}
 */
export function startBrowserListening(handlers) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    handlers.onError(VOICE_ERROR.UNAVAILABLE);
    return {
      stop() {},
      cleanup() {},
    };
  }

  const recognition = new Ctor();
  recognition.lang = "pt-BR";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let text = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      text += event.results[i][0].transcript;
    }
    const trimmed = text.trim();
    if (trimmed) handlers.onPartial(trimmed);
  };

  recognition.onstart = () => handlers.onListeningChange(true);
  recognition.onend = () => handlers.onListeningChange(false);
  recognition.onerror = (event) => {
    const map = {
      "not-allowed": VOICE_ERROR.PERMISSION,
      "service-not-allowed": VOICE_ERROR.PERMISSION,
      "no-speech": VOICE_ERROR.NO_SPEECH,
      network: VOICE_ERROR.NETWORK,
      aborted: VOICE_ERROR.UNKNOWN,
      "audio-capture": VOICE_ERROR.UNAVAILABLE,
    };
    handlers.onError(map[event.error] || VOICE_ERROR.UNKNOWN);
    handlers.onListeningChange(false);
  };

  recognition.start();

  return {
    stop() {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    cleanup() {
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
