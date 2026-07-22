/** Códigos de erro da busca por voz (nativo Capgo + fallback browser). */
export const VOICE_ERROR = {
  UNAVAILABLE: "unavailable",
  PERMISSION: "permission",
  NO_SPEECH: "no_speech",
  NETWORK: "network",
  BUSY: "busy",
  UNKNOWN: "unknown",
};

/**
 * Mensagem amigável em pt-BR para o código de erro de voz.
 * @param {string} code
 * @returns {string}
 */
export function messageForVoiceError(code) {
  switch (code) {
    case VOICE_ERROR.UNAVAILABLE:
      return "Busca por voz não está disponível neste aparelho.";
    case VOICE_ERROR.PERMISSION:
      return "Permissão de microfone necessária. Ative nas configurações do aparelho.";
    case VOICE_ERROR.NO_SPEECH:
      return "Não ouvi nada. Toque no microfone e fale de novo.";
    case VOICE_ERROR.NETWORK:
      return "Sem conexão. Verifique a internet e tente de novo.";
    case VOICE_ERROR.BUSY:
      return "O microfone já está em uso. Aguarde um instante.";
    default:
      return "Não foi possível ouvir. Tente de novo.";
  }
}

/**
 * Mapeia códigos/mensagens do recognizer nativo para VOICE_ERROR.
 * @param {unknown} raw
 * @returns {string}
 */
export function mapNativeVoiceError(raw) {
  const s = String(raw || "").toLowerCase();
  if (
    s.includes("permission") ||
    s.includes("missing permission") ||
    s.includes("denied") ||
    s.includes("notauthorized") ||
    s.includes("not_authorized")
  ) {
    return VOICE_ERROR.PERMISSION;
  }
  if (s.includes("network") || s.includes("internet")) {
    return VOICE_ERROR.NETWORK;
  }
  if (
    s.includes("no_speech") ||
    s.includes("nospeech") ||
    s.includes("speech_timeout") ||
    s.includes("speech timeout") ||
    s.includes("no match") ||
    s.includes("nomatch")
  ) {
    return VOICE_ERROR.NO_SPEECH;
  }
  if (s.includes("busy") || s.includes("recognizer_busy")) {
    return VOICE_ERROR.BUSY;
  }
  if (s.includes("unavailable") || s.includes("not_available") || s.includes("not available")) {
    return VOICE_ERROR.UNAVAILABLE;
  }
  return VOICE_ERROR.UNKNOWN;
}
