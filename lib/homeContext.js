import { FILTRO_STATUS_BUSCA } from "@/lib/busca";
import { getStatusFuncionamento, horariosTemCadastro } from "@/lib/horarios";
import {
  calcularDistanciaKm,
  getCoordenadasLugar,
  IMBITUBA_COORDS,
} from "@/lib/localizacao";

/** Chips de busca rápida na home (query + filtro opcional). */
export const QUICK_SEARCH_CHIPS = [
  {
    id: "calmo",
    label: "Lugares calmos",
    emoji: "🍃",
    query: "Lugar calmo perto de você",
  },
  {
    id: "por-do-sol",
    label: "Pôr do sol",
    emoji: "🌅",
    query: "Onde ver o pôr do sol?",
  },
  {
    id: "trilhas",
    label: "Trilhas rápidas",
    emoji: "🥾",
    query: "Trilhas rápidas para agora",
  },
  {
    id: "abertos",
    label: "Abertos agora",
    emoji: "🟢",
    query: "lugares abertos agora",
    filtro: FILTRO_STATUS_BUSCA.ABERTOS,
  },
];

/** Planos sugeridos de roteiro rápido na home. */
export const PLANOS_RAPIDOS = [
  {
    id: "manha",
    titulo: "Manhã perfeita",
    emoji: "🌅",
    descricao: "Café, praia e energia para começar o dia",
    query: "café da manhã e praia aberta agora",
    filtro: FILTRO_STATUS_BUSCA.ABERTOS,
    gradient: "from-amber-100 to-orange-50",
  },
  {
    id: "tarde-romantica",
    titulo: "Tarde romântica",
    emoji: "💑",
    descricao: "Almoço especial e pôr do sol",
    query: "restaurante romântico com vista",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    gradient: "from-rose-100 to-pink-50",
  },
  {
    id: "dia-chuvoso",
    titulo: "Dia chuvoso",
    emoji: "🌧️",
    descricao: "Programas aconchegantes para qualquer tempo",
    query: "o que fazer em dia chuvoso cultura gastronomia",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    gradient: "from-slate-200 to-blue-50",
  },
  {
    id: "noite",
    titulo: "Noite animada",
    emoji: "🌙",
    descricao: "Bares, música e vida noturna",
    query: "bares e vida noturna abertos",
    filtro: FILTRO_STATUS_BUSCA.ABERTOS,
    gradient: "from-indigo-100 to-violet-50",
  },
  {
    id: "bate-volta",
    titulo: "Bate-volta rápido",
    emoji: "⚡",
    descricao: "Experiências curtas perto de você",
    query: "lugares perto rápido",
    filtro: FILTRO_STATUS_BUSCA.ABERTOS,
    gradient: "from-emerald-100 to-teal-50",
  },
];

const TEMPO_POR_CATEGORIA = {
  Natureza: "~2h",
  Gastronomia: "~1h30",
  Noite: "~2h30",
  Cultura: "~1h30",
  Aventura: "~3h",
  "Bem-estar": "~1h",
  Compras: "~1h",
  Serviços: "~45min",
  Hospedagem: "~30min",
};

/**
 * Retorna data/hora atual no fuso de São Paulo.
 * @returns {Date}
 */
function getNowInBrazil() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
}

/**
 * Retorna período do dia atual no fuso de São Paulo.
 * @returns {'manha'|'tarde'|'noite'|'madrugada'}
 */
export function getPeriodoDia() {
  const hour = getNowInBrazil().getHours();
  if (hour >= 5 && hour < 12) return "manha";
  if (hour >= 12 && hour < 18) return "tarde";
  if (hour >= 18 && hour < 23) return "noite";
  return "madrugada";
}

/**
 * Gera frase contextual da home com base no período e clima.
 * @param {{ temperature?: number, weatherEmoji?: string, condition?: string }|null} [climaResumo]
 * @returns {string}
 */
export function getFraseContextual(climaResumo = null) {
  const periodo = getPeriodoDia();
  const temp = climaResumo?.temperature;
  const ensolarado =
    climaResumo?.weatherEmoji === "☀️" ||
    climaResumo?.condition?.toLowerCase().includes("limpo") ||
    climaResumo?.condition?.toLowerCase().includes("sol");

  const nublado =
    climaResumo?.condition?.toLowerCase().includes("nubl") ||
    climaResumo?.condition?.toLowerCase().includes("cloud");

  if (periodo === "manha") {
    if (nublado) return "Manhã nublada em Imbituba — ideias para aproveitar o dia";
    return "Manhã fresca em Imbituba — ótimo momento para explorar";
  }

  if (periodo === "tarde") {
    if (ensolarado && temp >= 22) {
      return "Tarde ensolarada em Imbituba — perfeito para praia";
    }
    return "Tarde agradável em Imbituba — experiências esperando por você";
  }

  if (periodo === "noite") {
    return "Noite agradável — ótimas opções abertas agora";
  }

  return "Boa madrugada — planeje o dia que vem com calma";
}

/**
 * Indica se o lugar deve exibir informações de horário de funcionamento.
 * @param {{ mostrar_horarios?: boolean, horarios?: Record<string, string> }} lugar
 * @returns {boolean}
 */
export function lugarExibeHorarios(lugar) {
  return Boolean(lugar?.mostrar_horarios) && horariosTemCadastro(lugar?.horarios);
}

/**
 * Sugere melhor momento para visitar com base no status de funcionamento.
 * @param {{ horarios?: Record<string, string>, mostrar_horarios?: boolean }} lugar
 * @returns {string|null}
 */
export function getMelhorHorario(lugar) {
  if (!lugarExibeHorarios(lugar)) return null;

  const status = getStatusFuncionamento(lugar.horarios);
  if (!status) return null;
  if (status.aberto) return "Agora é um ótimo momento";
  if (status.detail?.includes("Abre")) return status.detail;
  return "Confira os horários no detalhe";
}

/**
 * Estima duração típica da experiência por categoria.
 * @param {{ categoria?: string }} lugar
 * @returns {string}
 */
export function getTempoExperiencia(lugar) {
  return TEMPO_POR_CATEGORIA[lugar?.categoria] ?? "~2h";
}

/**
 * Pontua lugar para seleção do hero da home.
 * @param {Object} lugar
 * @param {{ latitude: number, longitude: number }|null} userPosition
 * @param {string} periodo - Período do dia ({@link getPeriodoDia}).
 * @param {Set<string>} popularIds - IDs de lugares em alta.
 * @returns {number}
 */
function scoreLugar(lugar, userPosition, periodo, popularIds, parceiroIds) {
  let score = 0;
  const status = getStatusFuncionamento(lugar.horarios);
  const coords = getCoordenadasLugar(lugar);
  const distKm = userPosition
    ? calcularDistanciaKm(userPosition, coords)
    : null;

  if (status?.aberto) score += 40;
  if (popularIds.has(lugar.id)) score += 25;
  if (parceiroIds?.has?.(String(lugar.id)) || lugar.ehParceiro) score += 50;

  if (periodo === "manha" && ["Natureza", "Gastronomia"].includes(lugar.categoria)) {
    score += 12;
  }
  if (periodo === "tarde" && ["Natureza", "Gastronomia", "Aventura"].includes(lugar.categoria)) {
    score += 15;
  }
  if (periodo === "noite" && ["Noite", "Gastronomia"].includes(lugar.categoria)) {
    score += 18;
  }

  if (Number.isFinite(distKm)) {
    if (distKm < 5) score += 20;
    else if (distKm < 15) score += 10;
  }

  return score;
}

/**
 * Escolhe o lugar em destaque (hero) da home por relevância contextual.
 * @param {Array<Object>} lugares
 * @param {{ latitude: number, longitude: number }|null} userPosition
 * @param {Set<string>} [popularIds] - IDs populares para boost de score.
 * @returns {Object|null}
 */
export function pickHeroLugar(lugares, userPosition, popularIds = new Set(), parceiroIds = new Set()) {
  if (!lugares?.length) return null;

  const periodo = getPeriodoDia();
  const abertos = lugares.filter((l) => getStatusFuncionamento(l.horarios)?.aberto);

  const pool = abertos.length ? abertos : lugares;

  const sorted = [...pool].sort(
    (a, b) =>
      scoreLugar(b, userPosition, periodo, popularIds, parceiroIds) -
      scoreLugar(a, userPosition, periodo, popularIds, parceiroIds)
  );

  return sorted[0] ?? lugares[0];
}

/**
 * Verifica se o lugar está entre os populares (em alta).
 * @param {string} lugarId
 * @param {Set<string>} popularIds
 * @returns {boolean}
 */
export function isEmAlta(lugarId, popularIds) {
  return popularIds.has(lugarId);
}

/**
 * Ordena lugares pela distância ao usuário (mais perto primeiro).
 * @param {Array<Object>} lugares
 * @param {{ latitude: number, longitude: number }|null} userPosition
 * @returns {Array<Object>}
 */
export function sortLugaresPorDistancia(lugares, userPosition) {
  if (!userPosition) return lugares;

  return [...lugares].sort((a, b) => {
    const da = calcularDistanciaKm(userPosition, getCoordenadasLugar(a)) ?? 999;
    const db = calcularDistanciaKm(userPosition, getCoordenadasLugar(b)) ?? 999;
    return da - db;
  });
}

/** Coordenadas padrão de Imbituba (reexport). */
export { IMBITUBA_COORDS };
