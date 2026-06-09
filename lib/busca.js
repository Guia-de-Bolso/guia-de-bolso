import { getStatusFuncionamento } from "./horarios.js";

/**
 * Valores de filtro por status de funcionamento na busca.
 * @type {{ TODOS: string, ABERTOS: string, FECHADOS: string }}
 */
export const FILTRO_STATUS_BUSCA = {
  TODOS: "todos",
  ABERTOS: "abertos",
  FECHADOS: "fechados",
};

/**
 * Indica se o lugar está aberto no momento (fuso São Paulo).
 * @param {{ horarios?: Record<string, string> }} [lugar]
 * @returns {boolean}
 */
export function lugarEstaAberto(lugar) {
  return Boolean(getStatusFuncionamento(lugar?.horarios)?.aberto);
}

/**
 * Filtra lista de lugares por status aberto/fechado.
 * @param {Array<Object>} [lugares] - Lugares com campo `horarios`.
 * @param {string} [filtroStatus] - Um de {@link FILTRO_STATUS_BUSCA}.
 * @returns {Array<Object>}
 */
export function filtrarLugaresPorStatus(lugares, filtroStatus) {
  if (!filtroStatus || filtroStatus === FILTRO_STATUS_BUSCA.TODOS) {
    return lugares ?? [];
  }

  if (filtroStatus === FILTRO_STATUS_BUSCA.ABERTOS) {
    return (lugares ?? []).filter((lugar) => lugarEstaAberto(lugar));
  }

  if (filtroStatus === FILTRO_STATUS_BUSCA.FECHADOS) {
    return (lugares ?? []).filter((lugar) => !lugarEstaAberto(lugar));
  }

  return lugares ?? [];
}

/**
 * Monta resumo compacto de um lugar para contexto da busca com IA.
 * @param {Object} lugar - Lugar com tags, horários e metadados.
 * @returns {{ id: string, nome: string, categoria: string, subcategoria: string, abertoAgora: boolean, statusLabel: string, statusDetail: string, tags: string[], descricao: string }}
 */
export function buildLugarBuscaResumo(lugar) {
  const tags = (lugar.lugares_tags ?? [])
    .map((item) => item.tags?.nome)
    .filter(Boolean);

  const status = getStatusFuncionamento(lugar.horarios);

  return {
    id: lugar.id,
    nome: lugar.nome,
    categoria: lugar.categoria,
    subcategoria: lugar.subcategoria,
    abertoAgora: Boolean(status?.aberto),
    statusLabel: status?.label ?? "",
    statusDetail: status?.detail ?? "",
    tags,
    descricao: lugar.descricao,
  };
}

/**
 * Retorna rótulo legível do filtro de status para prompts e UI.
 * @param {string} filtroStatus - Um de {@link FILTRO_STATUS_BUSCA}.
 * @returns {string}
 */
export function getFiltroStatusLabel(filtroStatus) {
  if (filtroStatus === FILTRO_STATUS_BUSCA.ABERTOS) return "abertos agora";
  if (filtroStatus === FILTRO_STATUS_BUSCA.FECHADOS) return "fechados agora";
  return "todos os horários";
}
