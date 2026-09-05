import { addDaysISO, diffDiasCalendario } from "./lugarPurge.js";
import { hojeISO } from "./homeRotation.js";

/** Meses do programa de lançamento gratuito. */
export const PARCEIRO_GRATIS_MESES = 6;

/** Intervalo entre curadorias de avaliações aprovadas. */
export const CURADORIA_AVALIACOES_DIAS = 90;

export const PARCEIRO_AVISO_30_DIAS = 30;
export const PARCEIRO_AVISO_7_DIAS = 7;
export const CURADORIA_AVISO_DIAS = 7;

export const PARCEIRO_MODALIDADE = {
  LANCAMENTO_GRATIS: "lancamento_gratis",
  PAGO: "pago",
};

export const PARCEIRO_STATUS = {
  ATIVO: "ativo",
  RENOVACAO_PENDENTE: "renovacao_pendente",
  CONVERTIDO_PAGO: "convertido_pago",
  ENCERRADO: "encerrado",
};

/** Colunas do programa parceiro em `lugares` (admin). */
export const PARCEIRO_PROGRAMA_COLUMNS =
  "parceiro_modalidade, parceiro_inicio_em, parceiro_fim_em, parceiro_status, ultima_curadoria_avaliacoes_em, proxima_curadoria_avaliacoes_em, parceiro_notas_internas";

/**
 * @param {string} isoDate YYYY-MM-DD
 * @param {number} meses
 * @returns {string}
 */
export function addMonthsISO(isoDate, meses) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setMonth(d.getMonth() + meses);
  return hojeISO(d);
}

/**
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function normalizeDateISO(iso) {
  const value = String(iso ?? "").trim();
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return hojeISO(date);
}

/**
 * @param {string} inicioISO
 * @returns {string}
 */
export function getParceiroFimGratisISO(inicioISO) {
  const inicio = normalizeDateISO(inicioISO);
  if (!inicio) return "";
  return addMonthsISO(inicio, PARCEIRO_GRATIS_MESES);
}

/**
 * @param {string} [hoje]
 * @returns {{ ultima_curadoria_avaliacoes_em: string, proxima_curadoria_avaliacoes_em: string }}
 */
export function buildCuradoriaAvaliacoesFeita(hoje = hojeISO()) {
  return {
    ultima_curadoria_avaliacoes_em: hoje,
    proxima_curadoria_avaliacoes_em: addDaysISO(hoje, CURADORIA_AVALIACOES_DIAS),
  };
}

/**
 * @param {object} form
 * @param {string} [hoje]
 * @returns {object}
 */
export function buildParceiroProgramaPayload(form, hoje = hojeISO()) {
  const ehParceiro = Boolean(form.eh_parceiro);
  const modalidade =
    form.parceiro_modalidade === PARCEIRO_MODALIDADE.PAGO
      ? PARCEIRO_MODALIDADE.PAGO
      : form.parceiro_modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS
        ? PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS
        : null;

  if (!ehParceiro) {
    return {
      parceiro_modalidade: modalidade,
      parceiro_inicio_em: normalizeDateISO(form.parceiro_inicio_em) || null,
      parceiro_fim_em: normalizeDateISO(form.parceiro_fim_em) || null,
      parceiro_status: PARCEIRO_STATUS.ENCERRADO,
      ultima_curadoria_avaliacoes_em:
        normalizeDateISO(form.ultima_curadoria_avaliacoes_em) || null,
      proxima_curadoria_avaliacoes_em:
        normalizeDateISO(form.proxima_curadoria_avaliacoes_em) || null,
      parceiro_notas_internas: String(form.parceiro_notas_internas || "").trim() || null,
    };
  }

  const inicio =
    normalizeDateISO(form.parceiro_inicio_em) || hoje;
  const modalidadeEfetiva =
    modalidade || PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS;

  let fim = null;
  if (modalidadeEfetiva === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) {
    fim =
      normalizeDateISO(form.parceiro_fim_em) || getParceiroFimGratisISO(inicio);
  }

  let status = form.parceiro_status;
  if (modalidadeEfetiva === PARCEIRO_MODALIDADE.PAGO) {
    status = PARCEIRO_STATUS.CONVERTIDO_PAGO;
  } else if (!status || status === PARCEIRO_STATUS.ENCERRADO) {
    status = PARCEIRO_STATUS.ATIVO;
  }

  let proximaCuradoria = normalizeDateISO(form.proxima_curadoria_avaliacoes_em);
  if (!proximaCuradoria) {
    const base =
      normalizeDateISO(form.ultima_curadoria_avaliacoes_em) || inicio;
    proximaCuradoria = addDaysISO(base, CURADORIA_AVALIACOES_DIAS);
  }

  return {
    parceiro_modalidade: modalidadeEfetiva,
    parceiro_inicio_em: inicio,
    parceiro_fim_em: fim,
    parceiro_status: status,
    ultima_curadoria_avaliacoes_em:
      normalizeDateISO(form.ultima_curadoria_avaliacoes_em) || null,
    proxima_curadoria_avaliacoes_em: proximaCuradoria,
    parceiro_notas_internas: String(form.parceiro_notas_internas || "").trim() || null,
  };
}

/**
 * @param {string|null|undefined} fimISO
 * @param {string} [hoje]
 * @returns {number|null}
 */
export function getDiasRestantesParceiroGratis(fimISO, hoje = hojeISO()) {
  const fim = normalizeDateISO(fimISO);
  if (!fim) return null;
  return diffDiasCalendario(hoje, fim);
}

/**
 * @param {string|null|undefined} proximaISO
 * @param {string} [hoje]
 * @returns {number|null} negativo = atrasado
 */
export function getDiasAteCuradoria(proximaISO, hoje = hojeISO()) {
  const proxima = normalizeDateISO(proximaISO);
  if (!proxima) return null;
  return diffDiasCalendario(hoje, proxima);
}

/**
 * @param {string|null|undefined} fimISO
 * @param {string|null|undefined} modalidade
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarParceiroVencendo30(fimISO, modalidade, hoje = hojeISO()) {
  if (modalidade !== PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) return false;
  const dias = getDiasRestantesParceiroGratis(fimISO, hoje);
  return dias !== null && dias <= PARCEIRO_AVISO_30_DIAS && dias > PARCEIRO_AVISO_7_DIAS;
}

/**
 * @param {string|null|undefined} fimISO
 * @param {string|null|undefined} modalidade
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarParceiroVencendo7(fimISO, modalidade, hoje = hojeISO()) {
  if (modalidade !== PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) return false;
  const dias = getDiasRestantesParceiroGratis(fimISO, hoje);
  return dias !== null && dias <= PARCEIRO_AVISO_7_DIAS && dias >= 0;
}

/**
 * @param {string|null|undefined} fimISO
 * @param {string|null|undefined} modalidade
 * @param {boolean} ehParceiro
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarParceiroGratisVencido(
  fimISO,
  modalidade,
  ehParceiro,
  hoje = hojeISO()
) {
  if (!ehParceiro || modalidade !== PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) {
    return false;
  }
  const dias = getDiasRestantesParceiroGratis(fimISO, hoje);
  return dias !== null && dias < 0;
}

/**
 * @param {string|null|undefined} proximaISO
 * @param {boolean} ehParceiro
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarCuradoriaAtrasada(proximaISO, ehParceiro, hoje = hojeISO()) {
  if (!ehParceiro) return false;
  const dias = getDiasAteCuradoria(proximaISO, hoje);
  return dias !== null && dias < 0;
}

/**
 * @param {string|null|undefined} proximaISO
 * @param {boolean} ehParceiro
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarCuradoriaProxima(proximaISO, ehParceiro, hoje = hojeISO()) {
  if (!ehParceiro) return false;
  const dias = getDiasAteCuradoria(proximaISO, hoje);
  return dias !== null && dias >= 0 && dias <= CURADORIA_AVISO_DIAS;
}

/**
 * @param {number|null} diasRestantes
 * @returns {string}
 */
export function formatDiasRestantesParceiro(diasRestantes) {
  if (diasRestantes === null) return "";
  if (diasRestantes < 0) return `vencido há ${Math.abs(diasRestantes)} dias`;
  if (diasRestantes === 0) return "vence hoje";
  if (diasRestantes === 1) return "vence amanhã";
  return `em ${diasRestantes} dias`;
}

/**
 * @param {string|null|undefined} modalidade
 * @returns {string}
 */
export function getParceiroModalidadeLabel(modalidade) {
  if (modalidade === PARCEIRO_MODALIDADE.PAGO) return "Pago R$ 299/mês";
  if (modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS) {
    return "Lançamento 6 meses grátis";
  }
  return "—";
}

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function getParceiroStatusLabel(status) {
  const labels = {
    [PARCEIRO_STATUS.ATIVO]: "Ativo",
    [PARCEIRO_STATUS.RENOVACAO_PENDENTE]: "Renovação pendente",
    [PARCEIRO_STATUS.CONVERTIDO_PAGO]: "Pago",
    [PARCEIRO_STATUS.ENCERRADO]: "Encerrado",
  };
  return labels[status] || "—";
}

/**
 * @param {object|null|undefined} error
 * @returns {boolean}
 */
export function isMissingParceiroProgramaColumnError(error) {
  const msg = String(error?.message || error?.details || "").toLowerCase();
  return (
    msg.includes("parceiro_modalidade") ||
    msg.includes("parceiro_inicio_em") ||
    msg.includes("parceiro_fim_em") ||
    msg.includes("parceiro_status") ||
    msg.includes("ultima_curadoria_avaliacoes_em") ||
    msg.includes("proxima_curadoria_avaliacoes_em") ||
    msg.includes("parceiro_notas_internas")
  );
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<boolean>}
 */
export async function fetchParceiroProgramaColumnsReady(supabase) {
  const { error } = await supabase
    .from("lugares")
    .select("parceiro_modalidade")
    .limit(1);

  if (!error) return true;
  if (isMissingParceiroProgramaColumnError(error)) return false;
  console.error("[fetchParceiroProgramaColumnsReady]", error.message);
  return false;
}
