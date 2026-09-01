import { calcVariation } from "./adminDashboard.js";
import {
  countLogsForLugar,
  getReportPeriodRanges,
  LOG_ACOES_ENGAJAMENTO,
  LOG_ACOES_VISUALIZACAO_LUGAR,
  aggregateEngajamentoByLugar,
  logDetalhesMatchLugar,
} from "./adminRelatorios.js";
import { isLugarEstabelecimento } from "./lugarDetalhe.js";
import { isLugarAtivo } from "./lugarStatus.js";
import {
  getPlanoComercialTier,
  getPlanoComercialTierLabel,
  isPerfilPromoAtivo,
  PLANO_TIER,
} from "./planoLancamento.js";
import { isParceiro } from "./lugarBadges.js";
import { hojeISO } from "./homeRotation.js";

/** @typedef {import("@/lib/adminRelatorios").PeriodoRelatorioId} PeriodoRelatorioId */

/**
 * @typedef {Object} KpiMetrica
 * @property {number} value
 * @property {{ text: string, className: string, direction: string }} variation
 */

/**
 * @typedef {Object} KpiTopLugar
 * @property {string} id
 * @property {string} nome
 * @property {string} categoria
 * @property {number} visualizacoes
 * @property {number} irAgora
 * @property {number} engajamento
 */

/**
 * @typedef {Object} KpisLancamento
 * @property {string} periodoLabel
 * @property {KpiMetrica} usuariosAtivos
 * @property {KpiMetrica} visualizacoes
 * @property {KpiMetrica} irAgora
 * @property {KpiMetrica} favoritos
 * @property {KpiMetrica} qrScans
 * @property {KpiMetrica} claimPerfil
 * @property {KpiMetrica} buscasIa
 * @property {{ presenca: number, lancamento: number, parceiro: number, publico: number, totalAtivos: number }} lugaresPorTier
 * @property {KpiTopLugar[]} topLugares
 */

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string[]} acoes
 * @param {string} start
 * @param {string} end
 * @returns {Promise<number>}
 */
async function countLogsByAcoes(supabase, acoes, start, end) {
  const { data, error } = await supabase
    .from("logs")
    .select("id")
    .in("acao", acoes)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    console.error("[adminKpis] logs:", error.message);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} start
 * @param {string} end
 * @returns {Promise<number>}
 */
async function countUsuariosAtivos(supabase, start, end) {
  const { data, error } = await supabase
    .from("logs")
    .select("user_id")
    .eq("acao", "acessou_app")
    .gte("created_at", start)
    .lte("created_at", end)
    .not("user_id", "is", null);

  if (error) {
    console.error("[adminKpis] mau:", error.message);
    return 0;
  }

  return new Set((data ?? []).map((row) => row.user_id)).size;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} start
 * @param {string} end
 * @returns {Promise<number>}
 */
async function countBuscasIa(supabase, start, end) {
  const { count, error } = await supabase
    .from("logs_ia")
    .select("id", { count: "exact", head: true })
    .eq("feature", "busca")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) {
    console.error("[adminKpis] logs_ia:", error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Conta lugares ativos por tier comercial.
 * @param {object[]} lugares
 * @param {string} [hoje]
 * @returns {{ presenca: number, lancamento: number, parceiro: number, publico: number, totalAtivos: number }}
 */
export function countLugaresPorTier(lugares, hoje = hojeISO()) {
  /** @type {{ presenca: number, lancamento: number, parceiro: number, publico: number, totalAtivos: number }} */
  const counts = {
    presenca: 0,
    lancamento: 0,
    parceiro: 0,
    publico: 0,
    totalAtivos: 0,
  };

  for (const lugar of lugares ?? []) {
    if (!isLugarAtivo(lugar)) continue;
    counts.totalAtivos += 1;
    const tier = getPlanoComercialTier(lugar, hoje);
    if (tier === PLANO_TIER.PARCEIRO) counts.parceiro += 1;
    else if (tier === PLANO_TIER.LANCAMENTO) counts.lancamento += 1;
    else if (tier === PLANO_TIER.PUBLICO) counts.publico += 1;
    else counts.presenca += 1;
  }

  return counts;
}

/**
 * Agrega métricas por lugar a partir de logs brutos.
 * @param {Array<{ acao: string, detalhes: object|null }>} logs
 * @param {Map<string, object>} lugaresById
 * @returns {KpiTopLugar[]}
 */
export function buildTopLugaresFromLogs(logs, lugaresById) {
  /** @type {Map<string, { visualizacoes: number, irAgora: number }>} */
  const byLugar = new Map();

  for (const row of logs ?? []) {
    const detalhes = row.detalhes;
    if (!detalhes || typeof detalhes !== "object") continue;
    const id = String(detalhes.lugar_id ?? detalhes.lugarId ?? "");
    if (!id) continue;

    const current = byLugar.get(id) || { visualizacoes: 0, irAgora: 0 };
    if (row.acao === "visualizou_lugar") current.visualizacoes += 1;
    if (row.acao === "ir_agora") current.irAgora += 1;
    byLugar.set(id, current);
  }

  return [...byLugar.entries()]
    .map(([id, metrics]) => {
      const lugar = lugaresById.get(id);
      return {
        id,
        nome: lugar?.nome || `Local ${id.slice(0, 8)}`,
        categoria: lugar?.categoria || "—",
        visualizacoes: metrics.visualizacoes,
        irAgora: metrics.irAgora,
        engajamento: metrics.visualizacoes + metrics.irAgora,
      };
    })
    .sort((a, b) => b.engajamento - a.engajamento)
    .slice(0, 10);
}

/**
 * KPIs agregados da fase de lançamento (marketing → cobrança).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {PeriodoRelatorioId} periodId
 * @returns {Promise<KpisLancamento>}
 */
export async function buildKpisLancamento(supabase, periodId) {
  const { current, previous } = getReportPeriodRanges(periodId);
  const periodoAnteriorLabel = "período anterior";

  const [
    mauCurrent,
    mauPrevious,
    visCurrent,
    visPrevious,
    irCurrent,
    irPrevious,
    favCurrent,
    favPrevious,
    qrCurrent,
    qrPrevious,
    claimCurrent,
    claimPrevious,
    buscaCurrent,
    buscaPrevious,
    lugaresRes,
    logsEngajamentoRes,
  ] = await Promise.all([
    countUsuariosAtivos(supabase, current.start, current.end),
    countUsuariosAtivos(supabase, previous.start, previous.end),
    countLogsByAcoes(supabase, LOG_ACOES_VISUALIZACAO_LUGAR, current.start, current.end),
    countLogsByAcoes(supabase, LOG_ACOES_VISUALIZACAO_LUGAR, previous.start, previous.end),
    countLogsByAcoes(supabase, ["ir_agora"], current.start, current.end),
    countLogsByAcoes(supabase, ["ir_agora"], previous.start, previous.end),
    countLogsByAcoes(supabase, ["favoritou"], current.start, current.end),
    countLogsByAcoes(supabase, ["favoritou"], previous.start, previous.end),
    countLogsByAcoes(supabase, ["escaneou_qr"], current.start, current.end),
    countLogsByAcoes(supabase, ["escaneou_qr"], previous.start, previous.end),
    countLogsByAcoes(supabase, ["claim_perfil"], current.start, current.end),
    countLogsByAcoes(supabase, ["claim_perfil"], previous.start, previous.end),
    countBuscasIa(supabase, current.start, current.end),
    countBuscasIa(supabase, previous.start, previous.end),
    supabase
      .from("lugares")
      .select("id, nome, categoria, subcategoria, status, eh_parceiro, perfil_promo_ate"),
    supabase
      .from("logs")
      .select("acao, detalhes")
      .in("acao", LOG_ACOES_ENGAJAMENTO)
      .gte("created_at", current.start)
      .lte("created_at", current.end),
  ]);

  const lugares = lugaresRes.data ?? [];
  const lugaresById = new Map(lugares.map((lugar) => [String(lugar.id), lugar]));
  const topLugares = buildTopLugaresFromLogs(logsEngajamentoRes.data ?? [], lugaresById);

  return {
    periodoLabel: current.label,
    usuariosAtivos: {
      value: mauCurrent,
      variation: calcVariation(mauCurrent, mauPrevious, periodoAnteriorLabel),
    },
    visualizacoes: {
      value: visCurrent,
      variation: calcVariation(visCurrent, visPrevious, periodoAnteriorLabel),
    },
    irAgora: {
      value: irCurrent,
      variation: calcVariation(irCurrent, irPrevious, periodoAnteriorLabel),
    },
    favoritos: {
      value: favCurrent,
      variation: calcVariation(favCurrent, favPrevious, periodoAnteriorLabel),
    },
    qrScans: {
      value: qrCurrent,
      variation: calcVariation(qrCurrent, qrPrevious, periodoAnteriorLabel),
    },
    claimPerfil: {
      value: claimCurrent,
      variation: calcVariation(claimCurrent, claimPrevious, periodoAnteriorLabel),
    },
    buscasIa: {
      value: buscaCurrent,
      variation: calcVariation(buscaCurrent, buscaPrevious, periodoAnteriorLabel),
    },
    lugaresPorTier: countLugaresPorTier(lugares),
    topLugares,
  };
}

/**
 * Resumo comercial de um lugar para abordagem de venda.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {object} lugar
 * @param {PeriodoRelatorioId} periodId
 * @returns {Promise<{ tierLabel: string, engajamentoTotal: number, visualizacoes: number, irAgora: number, claimPerfil: number }>}
 */
export async function buildResumoComercialLugar(supabase, lugar, periodId) {
  const { current } = getReportPeriodRanges(periodId);
  const lugarId = String(lugar.id);
  const tierLabel = getPlanoComercialTierLabel(getPlanoComercialTier(lugar));

  const [visualizacoes, irAgora, claimPerfil] = await Promise.all([
    countLogsForLugar(supabase, LOG_ACOES_VISUALIZACAO_LUGAR, lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["ir_agora"], lugarId, current.start, current.end),
    countLogsForLugar(supabase, ["claim_perfil"], lugarId, current.start, current.end),
  ]);

  return {
    tierLabel,
    visualizacoes,
    irAgora,
    claimPerfil,
    engajamentoTotal: visualizacoes + irAgora + claimPerfil,
  };
}

/**
 * Estabelecimento comercial elegível para abordagem comercial.
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarElegivelComercial(lugar) {
  if (!lugar || !isLugarAtivo(lugar)) return false;
  return isLugarEstabelecimento(lugar);
}

/**
 * Prioridade de abordagem: promo expirando ou alto engajamento.
 * @param {object} lugar
 * @param {number} engajamentoTotal
 * @param {string} [hoje]
 * @returns {"alta"|"media"|"baixa"}
 */
export function getPrioridadeAbordagem(lugar, engajamentoTotal, hoje = hojeISO()) {
  const promoAtivo = isPerfilPromoAtivo(lugar?.perfil_promo_ate, hoje);
  const diasRestantes = promoAtivo
    ? Math.round(
        (new Date(`${lugar.perfil_promo_ate}T12:00:00`).getTime() -
          new Date(`${hoje}T12:00:00`).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : null;

  if (isParceiro(lugar)) return "baixa";
  if (promoAtivo && diasRestantes !== null && diasRestantes <= 30) return "alta";
  if (engajamentoTotal >= 50) return "alta";
  if (engajamentoTotal >= 15 || promoAtivo) return "media";
  return "baixa";
}

/**
 * @typedef {Object} FilaAbordagemItem
 * @property {string} id
 * @property {string} nome
 * @property {string} categoria
 * @property {string} subcategoria
 * @property {string} tier
 * @property {string} tierLabel
 * @property {"alta"|"media"|"baixa"} prioridade
 * @property {number} visualizacoes
 * @property {number} irAgora
 * @property {number} favoritos
 * @property {number} qrScans
 * @property {number} claimPerfil
 * @property {number} engajamentoTotal
 * @property {string|null} perfilPromoAte
 */

/**
 * Fila de abordagem comercial ordenada por prioridade e engajamento.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {PeriodoRelatorioId} periodId
 * @returns {Promise<{ periodoLabel: string, items: FilaAbordagemItem[] }>}
 */
export async function buildFilaAbordagemComercial(supabase, periodId) {
  const { current } = getReportPeriodRanges(periodId);

  const [lugaresRes, logsRes] = await Promise.all([
    supabase
      .from("lugares")
      .select("id, nome, categoria, subcategoria, status, eh_parceiro, perfil_promo_ate")
      .eq("status", "ativo")
      .not("categoria", "in", "(Natureza,Aventura)")
      .order("nome", { ascending: true }),
    supabase
      .from("logs")
      .select("acao, detalhes")
      .in("acao", LOG_ACOES_ENGAJAMENTO)
      .gte("created_at", current.start)
      .lte("created_at", current.end),
  ]);

  const lugares = (lugaresRes.data ?? []).filter(isLugarElegivelComercial);
  const engajamentoByLugar = aggregateEngajamentoByLugar(logsRes.data ?? []);

  const prioridadeRank = { alta: 0, media: 1, baixa: 2 };

  const items = lugares
    .map((lugar) => {
      const metrics = engajamentoByLugar.get(String(lugar.id)) || {
        visualizacoes: 0,
        irAgora: 0,
        favoritos: 0,
        qrScans: 0,
        claimPerfil: 0,
      };
      const engajamentoTotal =
        metrics.visualizacoes +
        metrics.irAgora +
        metrics.favoritos +
        metrics.qrScans +
        metrics.claimPerfil;
      const tier = getPlanoComercialTier(lugar);

      return {
        id: String(lugar.id),
        nome: lugar.nome || "—",
        categoria: lugar.categoria || "—",
        subcategoria: lugar.subcategoria || "",
        tier,
        tierLabel: getPlanoComercialTierLabel(tier),
        prioridade: getPrioridadeAbordagem(lugar, engajamentoTotal),
        visualizacoes: metrics.visualizacoes,
        irAgora: metrics.irAgora,
        favoritos: metrics.favoritos,
        qrScans: metrics.qrScans,
        claimPerfil: metrics.claimPerfil,
        engajamentoTotal,
        perfilPromoAte: lugar.perfil_promo_ate || null,
      };
    })
    .sort((a, b) => {
      const prio = prioridadeRank[a.prioridade] - prioridadeRank[b.prioridade];
      if (prio !== 0) return prio;
      return b.engajamentoTotal - a.engajamentoTotal;
    });

  return {
    periodoLabel: current.label,
    items,
  };
}

/**
 * Exporta a fila de abordagem como CSV (UTF-8).
 * @param {{ periodoLabel: string, items: FilaAbordagemItem[] }} fila
 * @returns {string}
 */
export function formatFilaAbordagemCsv(fila) {
  const header = [
    "Nome",
    "Categoria",
    "Subcategoria",
    "Plano",
    "Prioridade",
    "Visualizações",
    "IR AGORA",
    "Favoritos",
    "QR",
    "Pedidos perfil",
    "Engajamento total",
    "Promo até",
  ];

  const rows = fila.items.map((item) => [
    item.nome,
    item.categoria,
    item.subcategoria,
    item.tierLabel,
    item.prioridade,
    item.visualizacoes,
    item.irAgora,
    item.favoritos,
    item.qrScans,
    item.claimPerfil,
    item.engajamentoTotal,
    item.perfilPromoAte || "",
  ]);

  const escape = (value) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
