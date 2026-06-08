import { formatarAcaoLog, formatarDetalhesLog, getLogAcaoBadge } from "@/lib/logs";
import { USAGE_TIMEZONE } from "@/lib/premium";
import {
  getBrasiliaDayEndDbString,
  getBrasiliaDayStartDbString,
  getBrasiliaPeriodStartDbString,
  parseSupabaseTimestamp,
} from "@/lib/supabaseTimestamp";

const LOG_DATETIME_OPTIONS = {
  timeZone: USAGE_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const LOG_DATE_SHORT_OPTIONS = {
  timeZone: USAGE_TIMEZONE,
  day: "2-digit",
  month: "short",
};

/** @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient */

/** Filtros de ação na UI admin. */
export const LOG_ACOES = [
  { id: "todas", label: "Todas", values: null },
  { id: "acessou_app", label: "Acesso ao app", values: ["acessou_app"] },
  { id: "login", label: "Login", values: ["login"] },
  { id: "logout", label: "Logout", values: ["logout"] },
  { id: "favorito", label: "Favorito", values: ["favoritou", "desfavoritou"] },
  { id: "ir_agora", label: "IR AGORA", values: ["ir_agora"] },
  { id: "deletou_conta", label: "Exclusão de conta", values: ["deletou_conta"] },
  {
    id: "admin_excluiu_usuario",
    label: "Admin excluiu usuário",
    values: ["admin_excluiu_usuario"],
  },
];

export const LOG_PERIODOS = [
  { id: "hoje", label: "Hoje", days: 0 },
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "custom", label: "Personalizado", days: null },
];

/**
 * @param {number} [days]
 * @returns {string}
 */
export function getPeriodoInicioIso(days = 7) {
  return getBrasiliaPeriodStartDbString(days);
}

/**
 * @param {string} periodoId
 * @param {string} [customInicio]
 * @param {string} [customFim]
 * @returns {{ inicio: string|null, fim: string|null }}
 */
export function resolvePeriodoDatas(periodoId, customInicio, customFim) {
  if (periodoId === "custom") {
    return {
      inicio: customInicio ? getBrasiliaDayStartDbString(customInicio) : null,
      fim: customFim ? getBrasiliaDayEndDbString(customFim) : null,
    };
  }

  const preset = LOG_PERIODOS.find((p) => p.id === periodoId);
  const days = preset?.days ?? 7;
  return {
    inicio: getPeriodoInicioIso(days),
    fim: null,
  };
}

/**
 * @param {string} filtroAcaoId
 * @returns {string[]|null}
 */
export function getAcoesFromFiltro(filtroAcaoId) {
  const item = LOG_ACOES.find((a) => a.id === filtroAcaoId);
  return item?.values ?? null;
}

/**
 * Badge PT — delega a `getLogAcaoBadge` com suporte a exclusão de conta.
 * @param {string} acao
 * @returns {{ label: string, className: string }}
 */
export function getLogAcaoBadgeAdmin(acao) {
  if (acao === "deletou_conta" || acao === "admin_excluiu_usuario") {
    return {
      label: acao === "admin_excluiu_usuario" ? "Admin excluiu usuário" : "Exclusão de conta",
      className: "bg-red-100 text-red-800",
    };
  }
  if (acao === "excluiu_lugar_inativo") {
    return {
      label: "Local excluído (inativo)",
      className: "bg-red-100 text-red-800",
    };
  }
  return getLogAcaoBadge(acao);
}

export { formatarAcaoLog, formatarDetalhesLog };

/**
 * @param {string|number|Date} value
 * @returns {{ relativo: string, absoluto: string }}
 */
export function formatLogDateTime(value) {
  if (!value) {
    return { relativo: "—", absoluto: "—" };
  }

  const date = parseSupabaseTimestamp(value);
  if (!date) {
    return { relativo: "—", absoluto: "—" };
  }

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  let relativo = "agora";
  if (diffMin < 1) relativo = "agora";
  else if (diffMin < 60) relativo = `há ${diffMin} min`;
  else if (diffH < 24) relativo = `há ${diffH}h`;
  else if (diffD === 1) relativo = "há 1 dia";
  else if (diffD < 7) relativo = `há ${diffD} dias`;
  else relativo = new Intl.DateTimeFormat("pt-BR", LOG_DATE_SHORT_OPTIONS).format(date);

  const absoluto = new Intl.DateTimeFormat("pt-BR", LOG_DATETIME_OPTIONS).format(date);

  return { relativo, absoluto };
}

/**
 * @param {object} log
 * @param {Map<string, { nome?: string }>} [perfisMap]
 * @returns {string}
 */
export function getLogUserDisplayName(log, perfisMap) {
  if (log.user_nome) return log.user_nome;
  if (log.user_email) return log.user_email;
  if (log.user_id && perfisMap?.get(log.user_id)?.nome) {
    return perfisMap.get(log.user_id).nome;
  }
  return "Visitante";
}

/**
 * @param {object} log
 * @returns {string}
 */
export function getLogUserInitial(log) {
  const name = getLogUserDisplayName(log);
  return String(name).charAt(0).toUpperCase();
}

/**
 * @param {object} log
 * @returns {{ href: string|null, label: string|null }}
 */
export function getLogContextLink(log) {
  const detalhes = log.detalhes || {};

  if (log.acao === "deletou_conta" || log.acao === "admin_excluiu_usuario") {
    return { href: "/admin/usuarios", label: "Ver usuários" };
  }

  const lugarId = detalhes.lugar_id;
  if (lugarId) {
    return {
      href: `/admin/locais/${lugarId}/editar`,
      label: "Ver local",
    };
  }

  return { href: null, label: null };
}

/**
 * @param {object} log
 * @param {string} [busca]
 * @returns {boolean}
 */
export function logMatchesBusca(log, busca) {
  const term = busca.trim().toLowerCase();
  if (!term) return true;

  const detalhes = log.detalhes || {};
  const haystack = [
    log.user_nome,
    log.user_email,
    detalhes.lugar_nome,
    formatarAcaoLog(log),
    formatarDetalhesLog(detalhes),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

/**
 * Métricas dos últimos 7 dias.
 * @param {SupabaseClient} supabase
 * @returns {Promise<{ total: number, acessos: number, irAgora: number, favoritos: number }>}
 */
export async function fetchLogMetrics7d(supabase) {
  const inicio = getPeriodoInicioIso(7);

  const base = () => supabase.from("logs").select("id", { count: "exact", head: true }).gte("created_at", inicio);

  const [totalRes, acessosRes, irRes, favRes] = await Promise.all([
    base(),
    base().eq("acao", "acessou_app"),
    base().eq("acao", "ir_agora"),
    base().in("acao", ["favoritou", "desfavoritou"]),
  ]);

  return {
    total: totalRes.count ?? 0,
    acessos: acessosRes.count ?? 0,
    irAgora: irRes.count ?? 0,
    favoritos: favRes.count ?? 0,
  };
}

/**
 * @param {SupabaseClient} supabase
 * @param {object} options
 * @param {number} [options.page]
 * @param {number} [options.pageSize]
 * @param {string[]|null} [options.acoes]
 * @param {string|null} [options.userId]
 * @param {string|null} [options.dataInicio]
 * @param {string|null} [options.dataFim]
 * @param {string} [options.busca]
 * @returns {Promise<{ logs: object[], total: number, perfis: object[] }>}
 */
export async function fetchLogsAdmin(supabase, options = {}) {
  const {
    page = 0,
    pageSize = 25,
    acoes = null,
    userId = null,
    dataInicio = null,
    dataFim = null,
    busca = "",
  } = options;

  let query = supabase
    .from("logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);
  if (dataInicio) query = query.gte("created_at", dataInicio);
  if (dataFim) query = query.lte("created_at", dataFim);
  if (acoes?.length === 1) query = query.eq("acao", acoes[0]);
  else if (acoes?.length > 1) query = query.in("acao", acoes);

  const term = busca.trim();
  if (term) {
    const escaped = term.replace(/[%_]/g, "\\$&");
    query = query.or(`user_nome.ilike.%${escaped}%,user_email.ilike.%${escaped}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("[fetchLogsAdmin]", error.message);
    return { logs: [], total: 0, perfis: [] };
  }

  let logs = data ?? [];

  if (term) {
    logs = logs.filter((log) => logMatchesBusca(log, term));
  }

  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
  let perfis = [];

  if (userIds.length > 0) {
    const { data: perfisData } = await supabase
      .from("perfis")
      .select("id, nome, foto_url")
      .in("id", userIds);
    perfis = perfisData ?? [];
  }

  return {
    logs,
    total: count ?? logs.length,
    perfis,
  };
}
