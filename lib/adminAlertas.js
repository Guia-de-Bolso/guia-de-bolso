import { AVALIACAO_STATUS } from "@/lib/avaliacoes";
import { hojeISO } from "@/lib/homeRotation";
import {
  deveAlertarCuradoriaAtrasada,
  deveAlertarCuradoriaProxima,
  deveAlertarParceiroGratisVencido,
  deveAlertarParceiroVencendo30,
  deveAlertarParceiroVencendo7,
  formatDiasRestantesParceiro,
  getDiasAteCuradoria,
  getDiasRestantesParceiroGratis,
} from "@/lib/parceiroAdmin";
import {
  deveAlertarContratoSemDocumentoAssinado,
  isMissingContratosTableError,
} from "@/lib/contratoAdmin";
import {
  deveAlertarExclusao1Dia,
  deveAlertarExclusao7Dias,
  formatDiasRestantesExclusao,
  getDiasRestantesExclusao,
  getExclusaoPrevistaISO,
  mensagemAlertaExclusao1Dia,
  mensagemAlertaExclusao7Dias,
} from "@/lib/lugarPurge";

/** @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient */

export const ALERTA_PRIORIDADE = {
  ALTA: "alta",
  INFO: "info",
};

export const ALERTA_TIPO = {
  AVALIACAO_PENDENTE: "avaliacao_pendente",
  AVALIACAO_AGUARDANDO_EDICAO: "avaliacao_aguardando_edicao",
  LUGAR_EM_ANALISE: "lugar_em_analise",
  DESTAQUE_EXPIRANDO: "destaque_expirando",
  DESTAQUE_EXPIRADO_ATIVO: "destaque_expirado_ativo",
  CONTA_EXCLUIDA: "conta_excluida",
  LUGAR_EXCLUSAO_7D: "lugar_exclusao_7d",
  LUGAR_EXCLUSAO_1D: "lugar_exclusao_1d",
  PARCEIRO_VENCENDO_30: "parceiro_vencendo_30",
  PARCEIRO_VENCENDO_7: "parceiro_vencendo_7",
  PARCEIRO_GRATIS_VENCIDO: "parceiro_gratis_vencido",
  CURADORIA_AVALIACOES_ATRASADA: "curadoria_avaliacoes_atrasada",
  CURADORIA_AVALIACOES_PROXIMA: "curadoria_avaliacoes_proxima",
  CONTRATO_SEM_DOCUMENTO_ASSINADO: "contrato_sem_documento_assinado",
};

const STORAGE_BASE = "guia_admin_alertas_lidas";
const DIAS_LOG_CONTA_EXCLUIDA = 7;

/** @type {Record<string, string>} */
export const ALERTA_ICONE = {
  [ALERTA_TIPO.AVALIACAO_PENDENTE]: "⭐",
  [ALERTA_TIPO.AVALIACAO_AGUARDANDO_EDICAO]: "✏️",
  [ALERTA_TIPO.LUGAR_EM_ANALISE]: "📍",
  [ALERTA_TIPO.DESTAQUE_EXPIRANDO]: "⏳",
  [ALERTA_TIPO.DESTAQUE_EXPIRADO_ATIVO]: "⚠️",
  [ALERTA_TIPO.CONTA_EXCLUIDA]: "👤",
  [ALERTA_TIPO.LUGAR_EXCLUSAO_7D]: "🗑️",
  [ALERTA_TIPO.LUGAR_EXCLUSAO_1D]: "⚠️",
  [ALERTA_TIPO.PARCEIRO_VENCENDO_30]: "🤝",
  [ALERTA_TIPO.PARCEIRO_VENCENDO_7]: "⏳",
  [ALERTA_TIPO.PARCEIRO_GRATIS_VENCIDO]: "🚨",
  [ALERTA_TIPO.CURADORIA_AVALIACOES_ATRASADA]: "📝",
  [ALERTA_TIPO.CURADORIA_AVALIACOES_PROXIMA]: "📋",
  [ALERTA_TIPO.CONTRATO_SEM_DOCUMENTO_ASSINADO]: "📄",
};

/**
 * @param {string} [userId]
 * @returns {string}
 */
export function getStorageKeyAlertas(userId) {
  return userId ? `${STORAGE_BASE}_${userId}` : STORAGE_BASE;
}

/**
 * @param {string} iso
 * @param {number} dias
 * @returns {string}
 */
function addDaysISO(iso, dias) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return hojeISO(d);
}

/**
 * @param {string} fimISO
 * @param {string} hoje
 * @returns {number}
 */
function diasAteFim(fimISO, hoje) {
  const fim = new Date(`${fimISO}T12:00:00`);
  const h = new Date(`${hoje}T12:00:00`);
  return Math.round((fim.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatTempoRelativoAlerta(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return "há 1 dia";
  if (diffD < 7) return `há ${diffD} dias`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/**
 * @param {string} [userId]
 * @returns {Record<string, string>}
 */
export function getAlertasLidas(userId) {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(getStorageKeyAlertas(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} dedupeKey
 * @param {string} [userId]
 * @returns {boolean}
 */
export function isAlertaLida(dedupeKey, userId) {
  const lidas = getAlertasLidas(userId);
  return Boolean(lidas[dedupeKey]);
}

/**
 * @param {string} dedupeKey
 * @param {string} [userId]
 */
export function marcarAlertaLida(dedupeKey, userId) {
  if (typeof window === "undefined" || !dedupeKey) return;

  const lidas = getAlertasLidas(userId);
  lidas[dedupeKey] = new Date().toISOString();
  localStorage.setItem(getStorageKeyAlertas(userId), JSON.stringify(lidas));
}

/**
 * @param {string[]} dedupeKeys
 * @param {string} [userId]
 */
export function marcarTodasLidas(dedupeKeys, userId) {
  if (typeof window === "undefined" || !dedupeKeys?.length) return;

  const lidas = getAlertasLidas(userId);
  const agora = new Date().toISOString();
  for (const key of dedupeKeys) {
    if (key) lidas[key] = agora;
  }
  localStorage.setItem(getStorageKeyAlertas(userId), JSON.stringify(lidas));
}

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
function plural(count, singular, plural) {
  return count === 1 ? singular : plural;
}

/**
 * Monta alertas operacionais a partir de queries Supabase (sem logs de analytics).
 * @param {SupabaseClient} supabase
 * @returns {Promise<Array<{
 *   tipo: string,
 *   prioridade: string,
 *   dedupeKey: string,
 *   titulo: string,
 *   mensagem: string,
 *   href: string,
 *   createdAt: string,
 *   icon: string,
 * }>>}
 */
export async function fetchAdminAlertas(supabase) {
  const desdeConta = new Date();
  desdeConta.setDate(desdeConta.getDate() - DIAS_LOG_CONTA_EXCLUIDA);

  const hoje = hojeISO();

  const [
    pendentesRes,
    aguardandoRes,
    lugaresRes,
    lugaresInativosRes,
    logsContaRes,
    parceirosRes,
  ] = await Promise.all([
    supabase
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .in("status", [AVALIACAO_STATUS.PENDENTE]),
    supabase
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .in("status", [AVALIACAO_STATUS.AGUARDANDO_EDICAO]),
    supabase
      .from("lugares")
      .select("id, nome, created_at")
      .eq("status", "em_analise")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("lugares")
      .select("id, nome, desativado_em")
      .eq("status", "desativado")
      .not("desativado_em", "is", null)
      .order("desativado_em", { ascending: true })
      .limit(50),
    supabase
      .from("logs")
      .select("id, user_nome, user_email, created_at")
      .eq("acao", "deletou_conta")
      .gte("created_at", desdeConta.toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("lugares")
      .select(
        "id, nome, eh_parceiro, parceiro_modalidade, parceiro_fim_em, proxima_curadoria_avaliacoes_em"
      )
      .eq("eh_parceiro", true)
      .eq("status", "ativo")
      .order("nome")
      .limit(100),
  ]);

  /** @type {Array<object>} */
  const alertas = [];

  const countPendentes = pendentesRes.count ?? 0;
  if (countPendentes > 0) {
    alertas.push({
      tipo: ALERTA_TIPO.AVALIACAO_PENDENTE,
      prioridade: ALERTA_PRIORIDADE.ALTA,
      dedupeKey: ALERTA_TIPO.AVALIACAO_PENDENTE,
      titulo: `${countPendentes} ${plural(countPendentes, "avaliação", "avaliações")} aguardando moderação`,
      mensagem: "Revise e aprove ou rejeite na fila de pendentes.",
      href: "/admin/avaliacoes?tab=pendente",
      createdAt: new Date().toISOString(),
      icon: ALERTA_ICONE[ALERTA_TIPO.AVALIACAO_PENDENTE],
    });
  }

  const countAguardando = aguardandoRes.count ?? 0;
  if (countAguardando > 0) {
    alertas.push({
      tipo: ALERTA_TIPO.AVALIACAO_AGUARDANDO_EDICAO,
      prioridade: ALERTA_PRIORIDADE.ALTA,
      dedupeKey: ALERTA_TIPO.AVALIACAO_AGUARDANDO_EDICAO,
      titulo: `${countAguardando} ${plural(countAguardando, "avaliação", "avaliações")} aguardando edição`,
      mensagem: "O autor precisa ajustar o texto antes de nova moderação.",
      href: "/admin/avaliacoes?tab=aguardando_edicao",
      createdAt: new Date().toISOString(),
      icon: ALERTA_ICONE[ALERTA_TIPO.AVALIACAO_AGUARDANDO_EDICAO],
    });
  }

  const lugaresAnalise = lugaresRes.data ?? [];
  if (lugaresAnalise.length > 0) {
    if (lugaresAnalise.length <= 3) {
      for (const lugar of lugaresAnalise) {
        alertas.push({
          tipo: ALERTA_TIPO.LUGAR_EM_ANALISE,
          prioridade: ALERTA_PRIORIDADE.ALTA,
          dedupeKey: `${ALERTA_TIPO.LUGAR_EM_ANALISE}:${lugar.id}`,
          titulo: `"${lugar.nome}" aguarda publicação`,
          mensagem: "Local em análise — revise e publique ou desative.",
          href: `/admin/locais/${lugar.id}/editar`,
          createdAt: lugar.created_at || new Date().toISOString(),
          icon: ALERTA_ICONE[ALERTA_TIPO.LUGAR_EM_ANALISE],
        });
      }
    } else {
      alertas.push({
        tipo: ALERTA_TIPO.LUGAR_EM_ANALISE,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: ALERTA_TIPO.LUGAR_EM_ANALISE,
        titulo: `${lugaresAnalise.length} locais em análise`,
        mensagem: "Revise a fila e publique os cadastros pendentes.",
        href: "/admin/locais?status=em_analise",
        createdAt: lugaresAnalise[0]?.created_at || new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.LUGAR_EM_ANALISE],
      });
    }
  }

  for (const lugar of lugaresInativosRes.data ?? []) {
    const dias = getDiasRestantesExclusao(lugar.desativado_em, hoje);
    if (dias === null) continue;

    if (deveAlertarExclusao7Dias(lugar.desativado_em, hoje)) {
      const prazo = formatDiasRestantesExclusao(dias);
      alertas.push({
        tipo: ALERTA_TIPO.LUGAR_EXCLUSAO_7D,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.LUGAR_EXCLUSAO_7D}:${lugar.id}`,
        titulo: `"${lugar.nome}" — exclusão ${prazo}`,
        mensagem: mensagemAlertaExclusao7Dias(lugar.nome, dias),
        href: `/admin/locais/${lugar.id}/editar`,
        createdAt: lugar.desativado_em || new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.LUGAR_EXCLUSAO_7D],
      });
    } else if (deveAlertarExclusao1Dia(lugar.desativado_em, hoje)) {
      alertas.push({
        tipo: ALERTA_TIPO.LUGAR_EXCLUSAO_1D,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.LUGAR_EXCLUSAO_1D}:${lugar.id}`,
        titulo:
          dias <= 0
            ? `"${lugar.nome}" — exclusão hoje`
            : `"${lugar.nome}" — exclusão amanhã`,
        mensagem: mensagemAlertaExclusao1Dia(lugar.nome, dias),
        href: `/admin/locais/${lugar.id}/editar`,
        createdAt: getExclusaoPrevistaISO(lugar.desativado_em, hoje)
          ? `${getExclusaoPrevistaISO(lugar.desativado_em, hoje)}T12:00:00`
          : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.LUGAR_EXCLUSAO_1D],
      });
    }
  }

  for (const lugar of parceirosRes.error ? [] : parceirosRes.data ?? []) {
    const href = `/admin/locais/${lugar.id}/editar`;
    const fim = lugar.parceiro_fim_em;
    const modalidade = lugar.parceiro_modalidade;
    const proximaCuradoria = lugar.proxima_curadoria_avaliacoes_em;

    if (
      deveAlertarParceiroGratisVencido(fim, modalidade, Boolean(lugar.eh_parceiro), hoje)
    ) {
      alertas.push({
        tipo: ALERTA_TIPO.PARCEIRO_GRATIS_VENCIDO,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.PARCEIRO_GRATIS_VENCIDO}:${lugar.id}`,
        titulo: `"${lugar.nome}" — gratuito vencido`,
        mensagem:
          "Período de 6 meses acabou. Encerre a parceria ou converta para pago.",
        href,
        createdAt: fim ? `${fim}T12:00:00` : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.PARCEIRO_GRATIS_VENCIDO],
      });
      continue;
    }

    if (deveAlertarParceiroVencendo7(fim, modalidade, hoje)) {
      const dias = formatDiasRestantesParceiro(
        getDiasRestantesParceiroGratis(fim, hoje)
      );
      alertas.push({
        tipo: ALERTA_TIPO.PARCEIRO_VENCENDO_7,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.PARCEIRO_VENCENDO_7}:${lugar.id}`,
        titulo: `"${lugar.nome}" — gratuito vence ${dias}`,
        mensagem: "Prepare renovação ou encerramento da parceria.",
        href,
        createdAt: fim ? `${fim}T12:00:00` : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.PARCEIRO_VENCENDO_7],
      });
    } else if (deveAlertarParceiroVencendo30(fim, modalidade, hoje)) {
      const dias = formatDiasRestantesParceiro(
        getDiasRestantesParceiroGratis(fim, hoje)
      );
      alertas.push({
        tipo: ALERTA_TIPO.PARCEIRO_VENCENDO_30,
        prioridade: ALERTA_PRIORIDADE.INFO,
        dedupeKey: `${ALERTA_TIPO.PARCEIRO_VENCENDO_30}:${lugar.id}`,
        titulo: `"${lugar.nome}" — gratuito vence ${dias}`,
        mensagem: "Envie relatório e alinhe continuidade com o estabelecimento.",
        href: `/admin/parceiros`,
        createdAt: fim ? `${fim}T12:00:00` : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.PARCEIRO_VENCENDO_30],
      });
    }

    if (deveAlertarCuradoriaAtrasada(proximaCuradoria, Boolean(lugar.eh_parceiro), hoje)) {
      const dias = Math.abs(getDiasAteCuradoria(proximaCuradoria, hoje) ?? 0);
      alertas.push({
        tipo: ALERTA_TIPO.CURADORIA_AVALIACOES_ATRASADA,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.CURADORIA_AVALIACOES_ATRASADA}:${lugar.id}`,
        titulo: `Curadoria de avaliações — "${lugar.nome}"`,
        mensagem: `Revisão trimestral atrasada há ${dias} dias.`,
        href: `/admin/avaliacoes?lugar_id=${lugar.id}&tab=aprovado`,
        createdAt: proximaCuradoria
          ? `${proximaCuradoria}T12:00:00`
          : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.CURADORIA_AVALIACOES_ATRASADA],
      });
    } else if (
      deveAlertarCuradoriaProxima(proximaCuradoria, Boolean(lugar.eh_parceiro), hoje)
    ) {
      alertas.push({
        tipo: ALERTA_TIPO.CURADORIA_AVALIACOES_PROXIMA,
        prioridade: ALERTA_PRIORIDADE.INFO,
        dedupeKey: `${ALERTA_TIPO.CURADORIA_AVALIACOES_PROXIMA}:${lugar.id}`,
        titulo: `Curadoria em breve — "${lugar.nome}"`,
        mensagem: "Revise avaliações aprovadas nos próximos 7 dias.",
        href: `/admin/avaliacoes?lugar_id=${lugar.id}&tab=aprovado`,
        createdAt: proximaCuradoria
          ? `${proximaCuradoria}T12:00:00`
          : new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.CURADORIA_AVALIACOES_PROXIMA],
      });
    }
  }

  for (const log of logsContaRes.data ?? []) {
    const nome = log.user_nome || log.user_email || "Usuário";
    alertas.push({
      tipo: ALERTA_TIPO.CONTA_EXCLUIDA,
      prioridade: ALERTA_PRIORIDADE.INFO,
      dedupeKey: `${ALERTA_TIPO.CONTA_EXCLUIDA}:${log.id}`,
      titulo: "Conta excluída",
      mensagem: `${nome} solicitou exclusão da conta.`,
      href: "/admin/logs?acao=deletou_conta",
      createdAt: log.created_at || new Date().toISOString(),
      icon: ALERTA_ICONE[ALERTA_TIPO.CONTA_EXCLUIDA],
    });
  }

  const contratosRes = await supabase
    .from("contratos_comerciais")
    .select("id, lugar_id, ativo, status, updated_at, lugares ( id, nome )")
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!contratosRes.error) {
    const contratosAtivos = contratosRes.data ?? [];
    const contratoIds = contratosAtivos.map((item) => item.id);

    let docsByContrato = {};
    if (contratoIds.length > 0) {
      const docsRes = await supabase
        .from("contrato_documentos")
        .select("contrato_id, tipo")
        .in("contrato_id", contratoIds);

      if (!docsRes.error) {
        for (const doc of docsRes.data ?? []) {
          if (!docsByContrato[doc.contrato_id]) docsByContrato[doc.contrato_id] = [];
          docsByContrato[doc.contrato_id].push(doc);
        }
      }
    }

    for (const contrato of contratosAtivos) {
      const docs = docsByContrato[contrato.id] || [];
      if (!deveAlertarContratoSemDocumentoAssinado(contrato, docs, hoje)) continue;

      const nomeLugar =
        contrato.lugares?.nome || parceirosRes.data?.find((l) => l.id === contrato.lugar_id)?.nome || "Estabelecimento";

      alertas.push({
        tipo: ALERTA_TIPO.CONTRATO_SEM_DOCUMENTO_ASSINADO,
        prioridade: ALERTA_PRIORIDADE.ALTA,
        dedupeKey: `${ALERTA_TIPO.CONTRATO_SEM_DOCUMENTO_ASSINADO}:${contrato.id}`,
        titulo: `"${nomeLugar}" — sem PDF assinado`,
        mensagem: "Contrato ativo ou assinado sem documento do tipo contrato assinado.",
        href: "/admin/contratos?filtro=sem_doc",
        createdAt: contrato.updated_at || new Date().toISOString(),
        icon: ALERTA_ICONE[ALERTA_TIPO.CONTRATO_SEM_DOCUMENTO_ASSINADO],
        devOnly: true,
      });
    }
  } else if (!isMissingContratosTableError(contratosRes.error)) {
    console.warn("[adminAlertas] contratos_comerciais:", contratosRes.error.message);
  }

  const prioridadeOrdem = { alta: 0, info: 1 };
  alertas.sort((a, b) => {
    const pa = prioridadeOrdem[a.prioridade] ?? 2;
    const pb = prioridadeOrdem[b.prioridade] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return alertas;
}

/**
 * @param {Array<{ dedupeKey: string, prioridade: string }>} alertas
 * @param {string} [userId]
 * @returns {Array<object>}
 */
export function enrichAlertasComLidas(alertas, userId) {
  return alertas.map((alerta) => ({
    ...alerta,
    lida: isAlertaLida(alerta.dedupeKey, userId),
  }));
}

/**
 * @param {Array<{ lida?: boolean, prioridade: string }>} alertas
 * @param {"nao_lidas"|"importantes"|"todas"} filtro
 * @returns {Array<object>}
 */
export function filtrarAlertas(alertas, filtro) {
  if (filtro === "nao_lidas") {
    return alertas.filter((a) => !a.lida);
  }
  if (filtro === "importantes") {
    return alertas.filter((a) => a.prioridade === ALERTA_PRIORIDADE.ALTA);
  }
  return alertas;
}
