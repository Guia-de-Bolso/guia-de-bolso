/** Mapa oficial de avistagens — Projeto Franca Austral / Instituto Australis. */
export const BALEIAS_AVISTAGENS_URL = "https://baleiafranca.org.br/avistagens/";

/** Site institucional do ProFRANCA. */
export const BALEIAS_INSTITUTO_URL = "https://baleiafranca.org.br/";

/** Crédito exibido no card e futuras integrações. */
export const BALEIAS_FONTE_NOME = "Instituto Australis / ProFRANCA";

/** Temporada reprodutiva da baleia-franca-austral no litoral catarinense. */
export const BALEIAS_TEMPORADA = {
  mesInicio: 7,
  mesFim: 11,
  mesPico: 9,
};

/**
 * Mês calendário (1–12) em America/Sao_Paulo.
 * @param {Date} [date]
 * @returns {number}
 */
export function getMesSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    month: "numeric",
  }).formatToParts(date);

  const month = parts.find((part) => part.type === "month")?.value;
  return Number(month);
}

/**
 * Indica se estamos na temporada reprodutiva (jul–nov).
 * @param {Date} [date]
 * @returns {boolean}
 */
export function isTemporadaBaleiasAtiva(date = new Date()) {
  const mes = getMesSaoPaulo(date);
  return mes >= BALEIAS_TEMPORADA.mesInicio && mes <= BALEIAS_TEMPORADA.mesFim;
}

/**
 * Subtítulo contextual da temporada para o card da home.
 * @param {Date} [date]
 * @returns {string|null}
 */
export function getTemporadaBaleiasSubtitulo(date = new Date()) {
  if (!isTemporadaBaleiasAtiva(date)) return null;

  const mes = getMesSaoPaulo(date);

  if (mes === BALEIAS_TEMPORADA.mesPico) {
    return "Pico da temporada — as baleias estão mais presentes em setembro.";
  }

  if (mes === BALEIAS_TEMPORADA.mesInicio) {
    return "As primeiras baleias-francas já chegam ao litoral de Imbituba.";
  }

  if (mes === BALEIAS_TEMPORADA.mesFim) {
    return "Últimas semanas da temporada reprodutiva no litoral catarinense.";
  }

  return "Temporada reprodutiva · julho a novembro no litoral de SC.";
}
