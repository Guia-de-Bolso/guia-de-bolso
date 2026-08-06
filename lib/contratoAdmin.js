import { hojeISO } from "./homeRotation.js";
import { diffDiasCalendario } from "./lugarPurge.js";
import { PLANO_COMERCIAL_PRECO } from "./planoComercial.js";
import {
  PARCEIRO_MODALIDADE,
  PARCEIRO_STATUS,
  buildParceiroProgramaPayload,
  getParceiroFimGratisISO,
  normalizeDateISO,
} from "./parceiroAdmin.js";

/** @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient */

export const CONTRATO_TIPO = {
  LANCAMENTO_6_MESES: "lancamento_6_meses_gratis",
  PARCEIRO_PAGO: "parceiro_pago",
  ADITIVO: "aditivo",
};

export const CONTRATO_STATUS = {
  RASCUNHO: "rascunho",
  ENVIADO: "enviado",
  ASSINADO: "assinado",
  ATIVO: "ativo",
  ENCERRADO: "encerrado",
  INADIMPLENTE: "inadimplente",
};

export const CONTRATO_DOC_TIPO = {
  PROPOSTA: "proposta",
  CONTRATO_ASSINADO: "contrato_assinado",
  ADITIVO: "aditivo",
  COMPROVANTE: "comprovante",
  OUTRO: "outro",
};

export const CONTRATOS_BUCKET = "contratos-parceiros";

export const CONTRATO_TIPO_OPTIONS = [
  { id: CONTRATO_TIPO.PARCEIRO_PAGO, label: "Parceiro pago (mensal)" },
  { id: CONTRATO_TIPO.ADITIVO, label: "Aditivo" },
  // Legado — só leitura de contratos antigos; não oferecido em novos cadastros
  { id: CONTRATO_TIPO.LANCAMENTO_6_MESES, label: "Lançamento — 6 meses grátis (legado)" },
];

/** Tipos permitidos ao criar/editar contrato novo (sem 6 meses grátis). */
export const CONTRATO_TIPO_OPTIONS_CRIACAO = CONTRATO_TIPO_OPTIONS.filter(
  (item) => item.id !== CONTRATO_TIPO.LANCAMENTO_6_MESES
);

export const CONTRATO_STATUS_OPTIONS = [
  { id: CONTRATO_STATUS.RASCUNHO, label: "Rascunho" },
  { id: CONTRATO_STATUS.ENVIADO, label: "Enviado" },
  { id: CONTRATO_STATUS.ASSINADO, label: "Assinado" },
  { id: CONTRATO_STATUS.ATIVO, label: "Ativo" },
  { id: CONTRATO_STATUS.ENCERRADO, label: "Encerrado" },
  { id: CONTRATO_STATUS.INADIMPLENTE, label: "Inadimplente" },
];

export const CONTRATO_DOC_TIPO_OPTIONS = [
  { id: CONTRATO_DOC_TIPO.PROPOSTA, label: "Proposta" },
  { id: CONTRATO_DOC_TIPO.CONTRATO_ASSINADO, label: "Contrato assinado" },
  { id: CONTRATO_DOC_TIPO.ADITIVO, label: "Aditivo" },
  { id: CONTRATO_DOC_TIPO.COMPROVANTE, label: "Comprovante" },
  { id: CONTRATO_DOC_TIPO.OUTRO, label: "Outro" },
];

export const CONTRATO_FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "pago", label: "Pagos" },
  { id: "sem_doc", label: "Sem contrato assinado" },
  { id: "inadimplente", label: "Inadimplentes" },
];

const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const CONTRATO_DOC_MAX_BYTES = 10 * 1024 * 1024;

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function getContratoTipoLabel(tipo) {
  return CONTRATO_TIPO_OPTIONS.find((item) => item.id === tipo)?.label || tipo || "—";
}

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function getContratoStatusLabel(status) {
  return CONTRATO_STATUS_OPTIONS.find((item) => item.id === status)?.label || status || "—";
}

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function getContratoDocTipoLabel(tipo) {
  return CONTRATO_DOC_TIPO_OPTIONS.find((item) => item.id === tipo)?.label || tipo || "—";
}

/**
 * @param {object|null|undefined} error
 * @returns {boolean}
 */
export function isMissingContratosTableError(error) {
  const msg = String(error?.message || error?.details || "").toLowerCase();
  return (
    msg.includes("contratos_comerciais") ||
    msg.includes("contrato_documentos") ||
    msg.includes("is_admin_only")
  );
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<boolean>}
 */
export async function fetchContratosTablesReady(supabase) {
  const { error } = await supabase.from("contratos_comerciais").select("id").limit(1);
  if (!error) return true;
  if (isMissingContratosTableError(error)) return false;
  console.warn("[contratoAdmin] fetchContratosTablesReady:", error.message);
  return false;
}

/**
 * @param {object} form
 * @param {string} [hoje]
 * @returns {object}
 */
export function buildContratoPayload(form, hoje = hojeISO()) {
  const tipo = Object.values(CONTRATO_TIPO).includes(form.tipo)
    ? form.tipo
    : CONTRATO_TIPO.LANCAMENTO_6_MESES;

  const status = Object.values(CONTRATO_STATUS).includes(form.status)
    ? form.status
    : CONTRATO_STATUS.RASCUNHO;

  const dataInicio = normalizeDateISO(form.data_inicio) || hoje;
  let dataFim = normalizeDateISO(form.data_fim) || null;

  if (tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES && !dataFim) {
    dataFim = getParceiroFimGratisISO(dataInicio);
  }

  let valorMensal = null;
  if (tipo === CONTRATO_TIPO.PARCEIRO_PAGO) {
    const parsed = Number(form.valor_mensal);
    valorMensal = Number.isFinite(parsed) && parsed >= 0 ? parsed : PLANO_COMERCIAL_PRECO;
  }

  return {
    lugar_id: form.lugar_id,
    tipo,
    status,
    ativo: Boolean(form.ativo),
    numero_proposta: String(form.numero_proposta || "").trim() || null,
    valor_mensal: valorMensal,
    moeda: "BRL",
    data_proposta: normalizeDateISO(form.data_proposta) || null,
    data_assinatura: normalizeDateISO(form.data_assinatura) || null,
    data_inicio: dataInicio,
    data_fim: dataFim,
    data_conversao_pago: normalizeDateISO(form.data_conversao_pago) || null,
    asaas_customer_id: String(form.asaas_customer_id || "").trim() || null,
    asaas_subscription_id: String(form.asaas_subscription_id || "").trim() || null,
    asaas_link_cobranca: String(form.asaas_link_cobranca || "").trim() || null,
    contato_nome: String(form.contato_nome || "").trim() || null,
    contato_email: String(form.contato_email || "").trim() || null,
    contato_whatsapp: String(form.contato_whatsapp || "").trim() || null,
    cnpj: String(form.cnpj || "").trim() || null,
    razao_social: String(form.razao_social || "").trim() || null,
    notas_internas: String(form.notas_internas || "").trim() || null,
  };
}

/**
 * Monta patch do programa parceiro em `lugares` a partir do contrato.
 * @param {object} contrato
 * @returns {object}
 */
export function buildLugarParceiroPatchFromContrato(contrato) {
  const modalidade =
    contrato.tipo === CONTRATO_TIPO.PARCEIRO_PAGO
      ? PARCEIRO_MODALIDADE.PAGO
      : PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS;

  const notas = [
    contrato.notas_internas,
    contrato.numero_proposta ? `Proposta ${contrato.numero_proposta}` : null,
    contrato.asaas_link_cobranca ? `Asaas: ${contrato.asaas_link_cobranca}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return buildParceiroProgramaPayload({
    eh_parceiro: true,
    parceiro_modalidade: modalidade,
    parceiro_inicio_em: contrato.data_inicio,
    parceiro_fim_em:
      modalidade === PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS ? contrato.data_fim : null,
    parceiro_status:
      modalidade === PARCEIRO_MODALIDADE.PAGO
        ? PARCEIRO_STATUS.CONVERTIDO_PAGO
        : PARCEIRO_STATUS.ATIVO,
    parceiro_notas_internas: notas || null,
    ultima_curadoria_avaliacoes_em: null,
    proxima_curadoria_avaliacoes_em: null,
  });
}

/**
 * @param {object} contrato
 * @param {object[]} documentos
 * @returns {boolean}
 */
export function contratoTemDocumentoAssinado(contrato, documentos = []) {
  if (!contrato) return false;
  return documentos.some((doc) => doc.tipo === CONTRATO_DOC_TIPO.CONTRATO_ASSINADO);
}

/**
 * @param {object} contrato
 * @param {string} [hoje]
 * @returns {number|null}
 */
export function getDiasRestantesContratoGratis(contrato, hoje = hojeISO()) {
  if (!contrato || contrato.tipo !== CONTRATO_TIPO.LANCAMENTO_6_MESES) return null;
  const fim = normalizeDateISO(contrato.data_fim);
  if (!fim) return null;
  return diffDiasCalendario(hoje, fim);
}

/**
 * @param {object} contrato
 * @param {object[]} documentos
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function deveAlertarContratoSemDocumentoAssinado(contrato, documentos, hoje = hojeISO()) {
  if (!contrato?.ativo) return false;
  const statusOk = [CONTRATO_STATUS.ASSINADO, CONTRATO_STATUS.ATIVO].includes(contrato.status);
  if (!statusOk) return false;
  return !contratoTemDocumentoAssinado(contrato, documentos);
}

/**
 * Parceiros pagos (e perfil básico / 6 meses grátis) não geram alerta de “sem contrato”.
 * Contratos comerciais existem apenas para modalidade paga.
 * @deprecated Mantida por compatibilidade de testes/imports — sempre false.
 * @param {object} lugar
 * @param {Record<string, object>} [_contratosAtivosPorLugar]
 * @returns {boolean}
 */
export function deveAlertarParceiroSemContratoAtivo(lugar, _contratosAtivosPorLugar = {}) {
  void lugar;
  void _contratosAtivosPorLugar;
  return false;
}

/**
 * @param {object} contrato
 * @param {string} filtro
 * @param {object[]} documentos
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function contratoMatchesFiltro(contrato, filtro, documentos = [], hoje = hojeISO()) {
  if (!contrato) return false;
  if (filtro === "todos") return true;
  if (filtro === "ativos") return Boolean(contrato.ativo);
  if (filtro === "gratis") return contrato.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES;
  if (filtro === "pago") return contrato.tipo === CONTRATO_TIPO.PARCEIRO_PAGO;
  if (filtro === "inadimplente") return contrato.status === CONTRATO_STATUS.INADIMPLENTE;
  if (filtro === "sem_doc") {
    return deveAlertarContratoSemDocumentoAssinado(contrato, documentos, hoje);
  }
  if (filtro === "vencendo") {
    const dias = getDiasRestantesContratoGratis(contrato, hoje);
    return (
      contrato.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES &&
      dias !== null &&
      dias <= 30 &&
      dias >= 0
    );
  }
  return true;
}

/**
 * @param {object[]} contratos
 * @param {Record<string, object[]>} docsByContrato
 * @param {string} [hoje]
 * @returns {{ ativos: number, gratis: number, pagos: number, vencendo: number, semDoc: number, inadimplentes: number }}
 */
export function calcularResumoContratos(contratos, docsByContrato = {}, hoje = hojeISO()) {
  let ativos = 0;
  let gratis = 0;
  let pagos = 0;
  let vencendo = 0;
  let semDoc = 0;
  let inadimplentes = 0;

  for (const contrato of contratos) {
    const docs = docsByContrato[contrato.id] || [];
    if (contrato.ativo) ativos += 1;
    if (contrato.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES) gratis += 1;
    if (contrato.tipo === CONTRATO_TIPO.PARCEIRO_PAGO) pagos += 1;
    if (contrato.status === CONTRATO_STATUS.INADIMPLENTE) inadimplentes += 1;
    if (contratoMatchesFiltro(contrato, "vencendo", docs, hoje)) vencendo += 1;
    if (deveAlertarContratoSemDocumentoAssinado(contrato, docs, hoje)) semDoc += 1;
  }

  return { ativos, gratis, pagos, vencendo, semDoc, inadimplentes };
}

/**
 * @param {number|null|undefined} valor
 * @returns {string}
 */
export function formatContratoValorMensal(valor) {
  if (valor === null || valor === undefined) return "Grátis";
  const amount = Number(valor);
  if (!Number.isFinite(amount) || amount <= 0) return "Grátis";
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {string} contratoId
 * @param {string} fileName
 * @returns {string}
 */
export function buildContratoStoragePath(contratoId, fileName) {
  const safeName = String(fileName || "documento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const stamp = Date.now();
  return `${contratoId}/${stamp}-${safeName || "documento"}`;
}

/**
 * @param {string} mime
 * @returns {boolean}
 */
export function isAllowedContratoDocMime(mime) {
  return ALLOWED_DOC_MIMES.has(String(mime || "").toLowerCase());
}

/**
 * @param {number} bytes
 * @returns {boolean}
 */
export function isAllowedContratoDocSize(bytes) {
  return Number(bytes) > 0 && Number(bytes) <= CONTRATO_DOC_MAX_BYTES;
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} contratoId
 * @param {string} userId
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function syncParceiroFromContrato(supabase, contratoId, userId) {
  const { data: contrato, error: contratoError } = await supabase
    .from("contratos_comerciais")
    .select("*")
    .eq("id", contratoId)
    .maybeSingle();

  if (contratoError || !contrato) {
    return { ok: false, message: "Contrato não encontrado." };
  }

  const parceiroPatch = {
    eh_parceiro: true,
    ...buildLugarParceiroPatchFromContrato(contrato),
  };

  const { error: lugarError } = await supabase
    .from("lugares")
    .update(parceiroPatch)
    .eq("id", contrato.lugar_id);

  if (lugarError) {
    return { ok: false, message: lugarError.message };
  }

  const { error: updateContratoError } = await supabase
    .from("contratos_comerciais")
    .update({
      ativo: true,
      status:
        contrato.status === CONTRATO_STATUS.RASCUNHO || contrato.status === CONTRATO_STATUS.ENVIADO
          ? CONTRATO_STATUS.ATIVO
          : contrato.status,
    })
    .eq("id", contratoId);

  if (updateContratoError) {
    return { ok: false, message: updateContratoError.message };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} contratoId
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function encerrarContratoComercial(supabase, contratoId) {
  const { data: contrato, error: fetchError } = await supabase
    .from("contratos_comerciais")
    .select("id, lugar_id, ativo")
    .eq("id", contratoId)
    .maybeSingle();

  if (fetchError || !contrato) {
    return { ok: false, message: "Contrato não encontrado." };
  }

  const { error: updateError } = await supabase
    .from("contratos_comerciais")
    .update({
      ativo: false,
      status: CONTRATO_STATUS.ENCERRADO,
    })
    .eq("id", contratoId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (contrato.ativo) {
    await supabase
      .from("lugares")
      .update({
        eh_parceiro: false,
        parceiro_status: PARCEIRO_STATUS.ENCERRADO,
      })
      .eq("id", contrato.lugar_id);
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<object[]>}
 */
export async function fetchContratosAdmin(supabase) {
  const { data, error } = await supabase
    .from("contratos_comerciais")
    .select(
      `
      *,
      lugares ( id, nome, categoria, eh_parceiro, status )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<Record<string, object[]>>}
 */
export async function fetchDocumentosByContratoIds(supabase, contratoIds) {
  if (!contratoIds?.length) return {};

  const { data, error } = await supabase
    .from("contrato_documentos")
    .select("*")
    .in("contrato_id", contratoIds)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  /** @type {Record<string, object[]>} */
  const map = {};
  for (const doc of data ?? []) {
    if (!map[doc.contrato_id]) map[doc.contrato_id] = [];
    map[doc.contrato_id].push(doc);
  }
  return map;
}

/**
 * Estabelecimentos elegíveis no dropdown de contratos.
 * Somente parceiros ativos na modalidade paga — 6 meses grátis e perfil básico não têm contrato.
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarElegivelParaContratoDropdown(lugar) {
  if (!lugar) return false;
  return (
    Boolean(lugar.eh_parceiro) &&
    lugar.status === "ativo" &&
    lugar.parceiro_modalidade === PARCEIRO_MODALIDADE.PAGO
  );
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<object[]>}
 */
export async function fetchLugaresParaContrato(supabase) {
  const { data, error } = await supabase
    .from("lugares")
    .select("id, nome, categoria, status, eh_parceiro, parceiro_modalidade")
    .eq("eh_parceiro", true)
    .eq("status", "ativo")
    .eq("parceiro_modalidade", PARCEIRO_MODALIDADE.PAGO)
    .order("nome");

  if (error) throw error;
  return data ?? [];
}
