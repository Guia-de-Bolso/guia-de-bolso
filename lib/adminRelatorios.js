import { calcVariation } from "./adminDashboard.js";
import { AVALIACAO_STATUS_APROVADOS } from "./avaliacoes.js";
import { getUsageDayKey } from "./premium.js";
import {
  getBrasiliaDayEndDbString,
  getBrasiliaDayStartDbString,
} from "./supabaseTimestamp.js";

/** @typedef {'ultimos_30_dias'|'este_mes'|'mes_anterior'|'ultimos_3_meses'} PeriodoRelatorioId */

export const PERIODO_RELATORIO_OPTIONS = [
  { id: "ultimos_30_dias", label: "Últimos 30 dias" },
  { id: "este_mes", label: "Este mês" },
  { id: "mes_anterior", label: "Mês anterior" },
  { id: "ultimos_3_meses", label: "Últimos 3 meses" },
];

/** Visualização da página de um local específico (relatórios por estabelecimento). */
export const LOG_ACOES_VISUALIZACAO_LUGAR = ["visualizou_lugar"];

/** Aberturas do app (MAU / uso geral — não atribuir a um lugar). */
export const LOG_ACOES_ACESSO_APP = ["acessou_app", "acesso_app"];

/** @deprecated Prefer `LOG_ACOES_VISUALIZACAO_LUGAR` para métricas por estabelecimento. */
export const LOG_ACOES_VISUALIZACAO = LOG_ACOES_VISUALIZACAO_LUGAR;

/** Ações de engajamento rastreadas para relatórios comerciais. */
export const LOG_ACOES_ENGAJAMENTO = [
  "visualizou_lugar",
  "ir_agora",
  "favoritou",
  "escaneou_qr",
  "claim_perfil",
];

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD em America/Sao_Paulo
 */
function dayKeyFromDate(date) {
  return getUsageDayKey(date);
}

/**
 * Primeiro dia do mês (YYYY-MM) em Brasília.
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {string}
 */
function firstDayOfMonth(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Último dia do mês.
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {string}
 */
function lastDayOfMonth(year, month) {
  const last = new Date(Date.UTC(year, month, 0, 12, 0, 0));
  return dayKeyFromDate(last);
}

/**
 * @param {string} dayKey
 * @param {number} offsetDays
 * @returns {string}
 */
function addDaysToDayKey(dayKey, offsetDays) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + offsetDays);
  return dayKeyFromDate(anchor);
}

/**
 * @typedef {{ start: string, end: string, label: string }} PeriodoRange
 */

/**
 * Intervalo atual e anterior para comparação de métricas.
 * @param {PeriodoRelatorioId} periodId
 * @returns {{ current: PeriodoRange, previous: PeriodoRange }}
 */
export function getReportPeriodRanges(periodId) {
  const todayKey = dayKeyFromDate(new Date());
  const [ty, tm] = todayKey.split("-").map(Number);

  /** @type {{ startKey: string, endKey: string, label: string }} */
  let current;

  if (periodId === "este_mes") {
    current = {
      startKey: firstDayOfMonth(ty, tm),
      endKey: todayKey,
      label: "Este mês",
    };
  } else if (periodId === "mes_anterior") {
    const prevMonth = tm === 1 ? 12 : tm - 1;
    const prevYear = tm === 1 ? ty - 1 : ty;
    const startKey = firstDayOfMonth(prevYear, prevMonth);
    const endKey = lastDayOfMonth(prevYear, prevMonth);
    current = { startKey, endKey, label: "Mês anterior" };
  } else if (periodId === "ultimos_3_meses") {
    current = {
      startKey: addDaysToDayKey(todayKey, -89),
      endKey: todayKey,
      label: "Últimos 3 meses",
    };
  } else {
    current = {
      startKey: addDaysToDayKey(todayKey, -29),
      endKey: todayKey,
      label: "Últimos 30 dias",
    };
  }

  const startMs = new Date(`${current.startKey}T12:00:00Z`).getTime();
  const endMs = new Date(`${current.endKey}T12:00:00Z`).getTime();
  const durationDays = Math.max(
    1,
    Math.round((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1
  );

  const prevEndKey = addDaysToDayKey(current.startKey, -1);
  const prevStartKey = addDaysToDayKey(prevEndKey, -(durationDays - 1));

  return {
    current: {
      start: getBrasiliaDayStartDbString(current.startKey),
      end: getBrasiliaDayEndDbString(current.endKey),
      label: current.label,
    },
    previous: {
      start: getBrasiliaDayStartDbString(prevStartKey),
      end: getBrasiliaDayEndDbString(prevEndKey),
      label: "Período anterior",
    },
  };
}

/**
 * @param {unknown} detalhes
 * @param {string} lugarId
 * @returns {boolean}
 */
export function logDetalhesMatchLugar(detalhes, lugarId) {
  if (!detalhes || typeof detalhes !== "object") return false;
  const id = detalhes.lugar_id ?? detalhes.lugarId;
  return String(id) === String(lugarId);
}

/**
 * Agrega métricas de engajamento por lugar a partir de logs brutos.
 * @param {Array<{ acao: string, detalhes: object|null }>} logs
 * @returns {Map<string, { visualizacoes: number, irAgora: number, favoritos: number, qrScans: number, claimPerfil: number }>}
 */
export function aggregateEngajamentoByLugar(logs) {
  /** @type {Map<string, { visualizacoes: number, irAgora: number, favoritos: number, qrScans: number, claimPerfil: number }>} */
  const byLugar = new Map();

  for (const row of logs ?? []) {
    const detalhes = row.detalhes;
    if (!detalhes || typeof detalhes !== "object") continue;
    const id = String(detalhes.lugar_id ?? detalhes.lugarId ?? "");
    if (!id) continue;

    const current = byLugar.get(id) || {
      visualizacoes: 0,
      irAgora: 0,
      favoritos: 0,
      qrScans: 0,
      claimPerfil: 0,
    };

    if (row.acao === "visualizou_lugar") current.visualizacoes += 1;
    if (row.acao === "ir_agora") current.irAgora += 1;
    if (row.acao === "favoritou") current.favoritos += 1;
    if (row.acao === "escaneou_qr") current.qrScans += 1;
    if (row.acao === "claim_perfil") current.claimPerfil += 1;

    byLugar.set(id, current);
  }

  return byLugar;
}

/**
 * @param {number[]} values
 * @returns {number}
 */
export function calcMediaInteira(values) {
  const nums = (values ?? []).filter(Number.isFinite);
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
}

/**
 * Posição 1-based em ranking decrescente (empates compartilham posição).
 * @param {number} value
 * @param {number[]} sortedDesc
 * @returns {number|null}
 */
export function calcPosicaoRanking(value, sortedDesc) {
  if (!sortedDesc.length) return null;
  const index = sortedDesc.findIndex((item) => item <= value);
  if (index === -1) return sortedDesc.length;
  return index + 1;
}

/**
 * @typedef {Object} RelatorioComparativoCategoria
 * @property {string} categoria
 * @property {number} totalEstabelecimentos
 * @property {number} mediaVisualizacoes
 * @property {number} mediaIrAgora
 * @property {number} mediaEngajamento
 * @property {number|null} posicaoVisualizacoes
 * @property {number|null} posicaoIrAgora
 * @property {number|null} topParceiroVisualizacoes
 * @property {number|null} topParceiroIrAgora
 */

/**
 * Compara métricas do estabelecimento com a média da categoria no período.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} lugarId
 * @param {string} categoria
 * @param {PeriodoRelatorioId} periodId
 * @returns {Promise<RelatorioComparativoCategoria|null>}
 */
export async function buildComparativoCategoria(supabase, lugarId, categoria, periodId) {
  const cat = String(categoria || "").trim();
  if (!cat || cat === "Natureza" || cat === "Aventura") return null;

  const { current } = getReportPeriodRanges(periodId);

  const [lugaresRes, logsRes] = await Promise.all([
    supabase
      .from("lugares")
      .select("id, categoria, eh_parceiro")
      .eq("status", "ativo")
      .eq("categoria", cat),
    supabase
      .from("logs")
      .select("acao, detalhes")
      .in("acao", LOG_ACOES_ENGAJAMENTO)
      .gte("created_at", current.start)
      .lte("created_at", current.end),
  ]);

  const lugares = lugaresRes.data ?? [];
  if (lugares.length < 2) return null;

  const engajamentoByLugar = aggregateEngajamentoByLugar(logsRes.data ?? []);

  const rows = lugares.map((lugar) => {
    const metrics = engajamentoByLugar.get(String(lugar.id)) || {
      visualizacoes: 0,
      irAgora: 0,
      favoritos: 0,
      qrScans: 0,
      claimPerfil: 0,
    };
    const engajamento =
      metrics.visualizacoes +
      metrics.irAgora +
      metrics.favoritos +
      metrics.qrScans +
      metrics.claimPerfil;

    return {
      id: String(lugar.id),
      ehParceiro: Boolean(lugar.eh_parceiro),
      visualizacoes: metrics.visualizacoes,
      irAgora: metrics.irAgora,
      engajamento,
    };
  });

  const target = rows.find((row) => row.id === String(lugarId));
  if (!target) return null;

  const visualizacoesSorted = [...rows.map((row) => row.visualizacoes)].sort((a, b) => b - a);
  const irAgoraSorted = [...rows.map((row) => row.irAgora)].sort((a, b) => b - a);

  const parceiros = rows.filter((row) => row.ehParceiro);

  return {
    categoria: cat,
    totalEstabelecimentos: rows.length,
    mediaVisualizacoes: calcMediaInteira(rows.map((row) => row.visualizacoes)),
    mediaIrAgora: calcMediaInteira(rows.map((row) => row.irAgora)),
    mediaEngajamento: calcMediaInteira(rows.map((row) => row.engajamento)),
    posicaoVisualizacoes: calcPosicaoRanking(
      target.visualizacoes,
      visualizacoesSorted
    ),
    posicaoIrAgora: calcPosicaoRanking(target.irAgora, irAgoraSorted),
    topParceiroVisualizacoes: parceiros.length
      ? Math.max(...parceiros.map((row) => row.visualizacoes))
      : null,
    topParceiroIrAgora: parceiros.length
      ? Math.max(...parceiros.map((row) => row.irAgora))
      : null,
  };
}

/**
 * Conta logs por ação e lugar no intervalo.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string[]} acoes
 * @param {string} lugarId
 * @param {string} start
 * @param {string} end
 * @returns {Promise<number>}
 */
export async function countLogsForLugar(supabase, acoes, lugarId, start, end) {
  const { data, error } = await supabase
    .from("logs")
    .select("acao, detalhes")
    .in("acao", acoes)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    console.error("[relatorios] logs:", error.message);
    return 0;
  }

  return (data ?? []).filter((row) => logDetalhesMatchLugar(row.detalhes, lugarId))
    .length;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} lugarId
 * @returns {Promise<number>}
 */
export async function countFavoritosAtivos(supabase, lugarId) {
  const { count, error } = await supabase
    .from("favoritos")
    .select("id", { count: "exact", head: true })
    .eq("lugar_id", lugarId);

  if (error) {
    console.error("[relatorios] favoritos:", error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} lugarId
 * @param {string} start
 * @param {string} end
 * @returns {Promise<{ count: number, media: number|null }>}
 */
export async function fetchAvaliacoesPeriodo(supabase, lugarId, start, end) {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id, nota, comentario, created_at, status")
    .eq("lugar_id", lugarId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[relatorios] avaliacoes:", error.message);
    return { count: 0, media: null, lista: [] };
  }

  const aprovadas = (data ?? []).filter((row) =>
    AVALIACAO_STATUS_APROVADOS.includes(row.status)
  );

  const notas = aprovadas.map((row) => Number(row.nota)).filter(Number.isFinite);
  const media =
    notas.length > 0
      ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
      : null;

  return {
    count: aprovadas.length,
    media,
    lista: aprovadas,
  };
}

/**
 * @typedef {Object} RelatorioMetrica
 * @property {number} value
 * @property {{ text: string, className: string, direction: string }} variation
 * @property {string} [hint]
 */

/**
 * @typedef {Object} RelatorioEstabelecimento
 * @property {string} lugarId
 * @property {string} lugarNome
 * @property {string} periodoLabel
 * @property {RelatorioMetrica} visualizacoes
 * @property {RelatorioMetrica} qrScans
 * @property {RelatorioMetrica} irAgora
 * @property {RelatorioMetrica} favoritos
 * @property {RelatorioMetrica} avaliacoes
 * @property {RelatorioMetrica} claimPerfil
 * @property {number|null} avaliacoesMedia
 * @property {Array<{ nota: number, comentario: string, created_at: string }>} avaliacoesLista
 * @property {RelatorioComparativoCategoria|null} [comparativoCategoria]
 */

/**
 * @param {number} current
 * @param {number} previous
 * @param {string} periodoAnteriorLabel
 * @returns {{ text: string, className: string, direction: string }}
 */
export function buildMetricVariation(current, previous, periodoAnteriorLabel) {
  const variation = calcVariation(current, previous, periodoAnteriorLabel);
  return variation;
}

/**
 * Monta relatório completo para um estabelecimento.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} lugarId
 * @param {string} lugarNome
 * @param {PeriodoRelatorioId} periodId
 * @param {string} [planoTierLabel] - Tier comercial no momento do relatório.
 * @param {string} [categoria] - Categoria do estabelecimento (comparativo).
 * @returns {Promise<RelatorioEstabelecimento>}
 */
export async function buildRelatorioEstabelecimento(
  supabase,
  lugarId,
  lugarNome,
  periodId,
  planoTierLabel = "",
  categoria = ""
) {
  const { current, previous } = getReportPeriodRanges(periodId);
  const periodoAnteriorLabel = "período anterior";

  const [
    visCurrent,
    visPrevious,
    qrCurrent,
    qrPrevious,
    irCurrent,
    irPrevious,
    favoritosAtivos,
    favLogsCurrent,
    favLogsPrevious,
    avalCurrent,
    avalPrevious,
    claimCurrent,
    claimPrevious,
    comparativoCategoria,
  ] = await Promise.all([
    countLogsForLugar(supabase, LOG_ACOES_VISUALIZACAO_LUGAR, lugarId, current.start, current.end),
    countLogsForLugar(
      supabase,
      LOG_ACOES_VISUALIZACAO_LUGAR,
      lugarId,
      previous.start,
      previous.end
    ),
    countLogsForLugar(supabase, ["escaneou_qr"], lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["escaneou_qr"], lugarId, previous.start, previous.end),
    countLogsForLugar(supabase, ["ir_agora"], lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["ir_agora"], lugarId, previous.start, previous.end),
    countFavoritosAtivos(supabase, lugarId),
    countLogsForLugar(supabase, ["favoritou"], lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["favoritou"], lugarId, previous.start, previous.end),
    fetchAvaliacoesPeriodo(supabase, lugarId, current.start, current.end),
    fetchAvaliacoesPeriodo(supabase, lugarId, previous.start, previous.end),
    countLogsForLugar(supabase, ["claim_perfil"], lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["claim_perfil"], lugarId, previous.start, previous.end),
    buildComparativoCategoria(supabase, lugarId, categoria, periodId),
  ]);

  const engajamentoTotal =
    visCurrent + irCurrent + favLogsCurrent + qrCurrent + claimCurrent;

  return {
    lugarId,
    lugarNome,
    periodoLabel: current.label,
    planoTierLabel,
    engajamentoTotal,
    visualizacoes: {
      value: visCurrent,
      variation: buildMetricVariation(visCurrent, visPrevious, periodoAnteriorLabel),
    },
    qrScans: {
      value: qrCurrent,
      variation: buildMetricVariation(qrCurrent, qrPrevious, periodoAnteriorLabel),
    },
    irAgora: {
      value: irCurrent,
      variation: buildMetricVariation(irCurrent, irPrevious, periodoAnteriorLabel),
    },
    favoritos: {
      value: favoritosAtivos,
      hint: "Total ativo agora",
      variation: buildMetricVariation(
        favLogsCurrent,
        favLogsPrevious,
        periodoAnteriorLabel
      ),
    },
    avaliacoes: {
      value: avalCurrent.count,
      variation: buildMetricVariation(
        avalCurrent.count,
        avalPrevious.count,
        periodoAnteriorLabel
      ),
    },
    claimPerfil: {
      value: claimCurrent,
      variation: buildMetricVariation(
        claimCurrent,
        claimPrevious,
        periodoAnteriorLabel
      ),
    },
    avaliacoesMedia: avalCurrent.media,
    avaliacoesLista: avalCurrent.lista,
    comparativoCategoria: comparativoCategoria ?? null,
  };
}

/**
 * @param {number} nota
 * @returns {string}
 */
export function notaParaEstrelas(nota) {
  const n = Math.max(0, Math.min(5, Math.round(Number(nota) || 0)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/**
 * @param {string} [texto]
 * @param {number} [max=120]
 * @returns {string}
 */
export function resumirComentario(texto, max = 120) {
  const t = String(texto || "").trim();
  if (!t) return "(sem comentário)";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * @param {RelatorioEstabelecimento} relatorio
 * @returns {string}
 */
export function formatRelatorioWhatsApp(relatorio) {
  const lines = [
    "📊 Relatório Guia de Bolso",
    `📍 ${relatorio.lugarNome} — ${relatorio.periodoLabel}`,
  ];

  if (relatorio.planoTierLabel) {
    lines.push(`📋 Plano atual: ${relatorio.planoTierLabel}`);
  }

  lines.push(
    "",
    `👁 Visualizações: ${relatorio.visualizacoes.value} (${relatorio.visualizacoes.variation.text})`,
    `📱 Escaneamentos QR: ${relatorio.qrScans.value} (${relatorio.qrScans.variation.text})`,
    `🗺️ IR AGORA: ${relatorio.irAgora.value} (${relatorio.irAgora.variation.text})`,
    `❤️ Favoritos: ${relatorio.favoritos.value}`,
    `🔓 Pedidos de perfil: ${relatorio.claimPerfil.value} (${relatorio.claimPerfil.variation.text})`
  );

  const mediaTexto =
    relatorio.avaliacoesMedia != null
      ? ` (média ${relatorio.avaliacoesMedia})`
      : "";

  lines.push(`⭐ Avaliações: ${relatorio.avaliacoes.value}${mediaTexto}`);

  if (relatorio.comparativoCategoria) {
    const comp = relatorio.comparativoCategoria;
    lines.push(
      "",
      `📊 Comparativo · ${comp.categoria} (${comp.totalEstabelecimentos} locais)`,
      `👁 Sua posição em views: #${comp.posicaoVisualizacoes} (média da categoria: ${comp.mediaVisualizacoes})`,
      `🗺️ Sua posição em IR AGORA: #${comp.posicaoIrAgora} (média: ${comp.mediaIrAgora})`
    );
    if (comp.topParceiroVisualizacoes != null) {
      lines.push(
        `🏆 Melhor parceiro da categoria: ${comp.topParceiroVisualizacoes} views · ${comp.topParceiroIrAgora} IR AGORA`
      );
    }
  }

  if (relatorio.avaliacoesLista.length > 0) {
    lines.push("", "Últimas avaliações:");
    for (const av of relatorio.avaliacoesLista.slice(0, 8)) {
      const data = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(av.created_at));
      lines.push(
        `- '${resumirComentario(av.comentario, 80)}' - ${notaParaEstrelas(av.nota)} (${data})`
      );
    }
  }

  lines.push("", "Guia de Bolso — App oficial de turismo de Imbituba 🌿");

  return lines.join("\n");
}
