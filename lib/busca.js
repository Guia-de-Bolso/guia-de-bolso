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
 * Status de funcionamento para busca/filtro, respeitando `mostrar_horarios`.
 * Locais públicos sem horário comercial são tratados como sempre acessíveis.
 * @param {{ horarios?: Record<string, string>, mostrar_horarios?: boolean }} [lugar]
 * @returns {{ abertoAgora: boolean, statusLabel: string, statusDetail: string }}
 */
function getStatusBusca(lugar) {
  const mostrarHorarios = Boolean(lugar?.mostrar_horarios);

  if (!mostrarHorarios) {
    return {
      abertoAgora: true,
      statusLabel: "Sempre acessível",
      statusDetail: "Sem horário comercial",
    };
  }

  const horarios = lugar?.horarios;
  const temObjetoHorarios =
    horarios &&
    typeof horarios === "object" &&
    !Array.isArray(horarios) &&
    Object.keys(horarios).length > 0;

  if (!temObjetoHorarios) {
    return {
      abertoAgora: true,
      statusLabel: "Horário não informado",
      statusDetail: "Sem horário cadastrado",
    };
  }

  const status = getStatusFuncionamento(horarios, true);
  if (!status) {
    return {
      abertoAgora: false,
      statusLabel: "Fechado",
      statusDetail: "Fechado ou sem expediente cadastrado",
    };
  }

  return {
    abertoAgora: Boolean(status.aberto),
    statusLabel: status.label ?? "",
    statusDetail: status.detail ?? "",
  };
}

/**
 * Indica se o lugar está aberto no momento (fuso São Paulo).
 * @param {{ horarios?: Record<string, string>, mostrar_horarios?: boolean }} [lugar]
 * @returns {boolean}
 */
export function lugarEstaAberto(lugar) {
  return getStatusBusca(lugar).abertoAgora;
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

/** Máximo de caracteres de `descricao` no contexto enviado ao Claude (busca). */
export const BUSCA_DESCRICAO_MAX_CHARS = 120;

/**
 * Trunca descrição para contexto IA (menos tokens, alinhado ao roteiro).
 * @param {unknown} descricao
 * @returns {string}
 */
export function truncateBuscaDescricao(descricao) {
  const text = String(descricao ?? "").trim();
  if (!text) return "";
  if (text.length <= BUSCA_DESCRICAO_MAX_CHARS) return text;
  return `${text.slice(0, BUSCA_DESCRICAO_MAX_CHARS)}…`;
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

  const { abertoAgora, statusLabel, statusDetail } = getStatusBusca(lugar);

  return {
    id: lugar.id,
    nome: lugar.nome,
    categoria: lugar.categoria,
    subcategoria: lugar.subcategoria,
    abertoAgora,
    statusLabel,
    statusDetail,
    tags,
    descricao: truncateBuscaDescricao(lugar.descricao),
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
