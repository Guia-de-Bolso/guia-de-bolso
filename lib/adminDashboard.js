import { isPremiumActive } from "./premium.js";
import { hojeISO } from "./homeRotation.js";
import {
  PARCEIRO_MODALIDADE,
  getDiasAteCuradoria,
  getDiasRestantesParceiroGratis,
} from "./parceiroAdmin.js";

/**
 * ISO timestamp N days ago (start of comparison window).
 * @param {number} days
 * @returns {string}
 */
export function getCutoffIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * @param {number} total
 * @param {number} past
 * @param {string} periodLabel
 * @returns {{ text: string, className: string, direction: "up"|"down"|"flat" }}
 */
export function calcVariation(total, past, periodLabel) {
  if (past === 0) {
    if (total === 0) {
      return { text: "Sem variação", className: "text-[#5a6b66]", direction: "flat" };
    }
    return {
      text: `↑ +100% vs ${periodLabel}`,
      className: "text-emerald-600",
      direction: "up",
    };
  }

  const percent = ((total - past) / past) * 100;
  const rounded = Math.round(percent);

  if (rounded === 0) {
    return { text: "Sem variação", className: "text-[#5a6b66]", direction: "flat" };
  }

  if (rounded > 0) {
    return {
      text: `↑ +${rounded}% vs ${periodLabel}`,
      className: "text-emerald-600",
      direction: "up",
    };
  }

  return {
    text: `↓ ${Math.abs(rounded)}% vs ${periodLabel}`,
    className: "text-red-500",
    direction: "down",
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} table
 * @param {{ eq?: { field: string, value: unknown }, ltCreatedAt?: string }} [options]
 * @returns {Promise<{ total: number, past: number }>}
 */
export async function fetchCount(supabase, table, options = {}) {
  const { eq, ltCreatedAt } = options;

  let totalQuery = supabase.from(table).select("id", { count: "exact", head: true });
  let pastQuery = supabase.from(table).select("id", { count: "exact", head: true });

  if (eq) {
    totalQuery = totalQuery.eq(eq.field, eq.value);
    pastQuery = pastQuery.eq(eq.field, eq.value);
  }

  if (ltCreatedAt) {
    pastQuery = pastQuery.lt("created_at", ltCreatedAt);
  }

  const [totalRes, pastRes] = await Promise.all([totalQuery, pastQuery]);

  return {
    total: totalRes.count ?? 0,
    past: pastRes.count ?? 0,
  };
}

/**
 * Contagem no intervalo [cutoff, agora] vs período anterior de mesma duração.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} table
 * @param {number} days
 * @param {{ eq?: { field: string, value: unknown } }} [options]
 * @returns {Promise<{ total: number, past: number }>}
 */
export async function fetchCountInPeriod(supabase, table, days, options = {}) {
  const cutoff = getCutoffIso(days);
  const prevCutoff = getCutoffIso(days * 2);
  const { eq } = options;

  let currentQuery = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", cutoff);

  let pastQuery = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", prevCutoff)
    .lt("created_at", cutoff);

  if (eq) {
    currentQuery = currentQuery.eq(eq.field, eq.value);
    pastQuery = pastQuery.eq(eq.field, eq.value);
  }

  const [currentRes, pastRes] = await Promise.all([currentQuery, pastQuery]);

  return {
    total: currentRes.count ?? 0,
    past: pastRes.count ?? 0,
  };
}

/**
 * Contagem de atrativos publicados (`ativa` true ou null).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ ltCreatedAt?: string }} [options]
 * @returns {Promise<{ total: number, past: number }>}
 */
export async function fetchAtrativosPublicadosCount(supabase, options = {}) {
  const { ltCreatedAt } = options;
  const publicadosFilter = "ativa.is.null,ativa.eq.true";

  let totalQuery = supabase
    .from("rotas")
    .select("id", { count: "exact", head: true })
    .or(publicadosFilter);

  let pastQuery = supabase
    .from("rotas")
    .select("id", { count: "exact", head: true })
    .or(publicadosFilter);

  if (ltCreatedAt) {
    pastQuery = pastQuery.lt("created_at", ltCreatedAt);
  }

  const [totalRes, pastRes] = await Promise.all([totalQuery, pastQuery]);

  if (totalRes.error) {
    console.error("[fetchAtrativosPublicadosCount]", totalRes.error.message);
  }
  if (pastRes.error) {
    console.error("[fetchAtrativosPublicadosCount:past]", pastRes.error.message);
  }

  return {
    total: totalRes.count ?? 0,
    past: pastRes.count ?? 0,
  };
}

/**
 * Lugares ativos com flag `eh_parceiro`.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<number>}
 */
export async function countParceirosAtivos(supabase) {
  const { count, error } = await supabase
    .from("lugares")
    .select("id", { count: "exact", head: true })
    .eq("status", "ativo")
    .eq("eh_parceiro", true);

  if (error) {
    console.error("[countParceirosAtivos]", error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Pendências do programa parceiro (prazos e curadoria).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<{ vencendo: number, vencido: number, curadoriaAtrasada: number }>}
 */
export async function fetchParceiroProgramaPendencias(supabase) {
  const hoje = hojeISO();
  const { data, error } = await supabase
    .from("lugares")
    .select("parceiro_modalidade, parceiro_fim_em, proxima_curadoria_avaliacoes_em")
    .eq("eh_parceiro", true)
    .eq("status", "ativo");

  if (error) {
    console.error("[fetchParceiroProgramaPendencias]", error.message);
    return { vencendo: 0, vencido: 0, curadoriaAtrasada: 0 };
  }

  let vencendo = 0;
  let vencido = 0;
  let curadoriaAtrasada = 0;

  for (const lugar of data ?? []) {
    if (lugar.parceiro_modalidade !== PARCEIRO_MODALIDADE.PAGO) {
      const dias = getDiasRestantesParceiroGratis(lugar.parceiro_fim_em, hoje);
      if (dias !== null && dias < 0) vencido += 1;
      else if (dias !== null && dias <= 30) vencendo += 1;
    }
    const diasCuradoria = getDiasAteCuradoria(
      lugar.proxima_curadoria_avaliacoes_em,
      hoje
    );
    if (diasCuradoria !== null && diasCuradoria < 0) curadoriaAtrasada += 1;
  }

  return { vencendo, vencido, curadoriaAtrasada };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<number>}
 */
export async function countPremiumAtivos(supabase) {
  const { data, error } = await supabase
    .from("perfis")
    .select("id, premium_ativo, premium_ate");

  if (error) {
    console.error("[countPremiumAtivos]", error.message);
    return 0;
  }

  return (data ?? []).filter((p) => isPremiumActive(p)).length;
}

/**
 * @param {number} hour
 * @returns {"Bom dia"|"Boa tarde"|"Boa noite"}
 */
export function getSaudacao(hour = new Date().getHours()) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * @param {object} counts
 * @returns {string}
 */
export function buildResumoOperacional(counts) {
  const parts = [];

  if (counts.avaliacoesPendentes > 0) {
    parts.push(
      `${counts.avaliacoesPendentes} avaliação${counts.avaliacoesPendentes !== 1 ? "ões" : ""} pendente${counts.avaliacoesPendentes !== 1 ? "s" : ""}`
    );
  }
  if (counts.emAnalise > 0) {
    parts.push(
      `${counts.emAnalise} local${counts.emAnalise !== 1 ? "is" : ""} em análise`
    );
  }
  if (parts.length === 0) {
    return "Tudo em dia no painel — nenhuma pendência urgente.";
  }

  return parts.join(" · ");
}
