/** Preço mensal do plano Premium em reais. */
export const PREMIUM_PRICE = 9.9;

/** Rótulo formatado do preço Premium para exibição na UI. */
export const PREMIUM_PRICE_LABEL = "R$9,90/mês";

/** Fuso usado para o “dia” de uso gratuito de IA. */
export const USAGE_TIMEZONE = "America/Sao_Paulo";

/**
 * Limites diários de uso de IA para usuários não premium (reset à meia-noite, fuso SP).
 * @type {{ busca: number, roteiro: number }}
 */
export const LIMITS = {
  busca: 5,
  roteiro: 2,
};

/** Mensagens de limite diário gratuito (server + UI). */
export const LIMIT_DENY_MESSAGES = {
  busca: (n) =>
    `Você usou suas ${n} buscas com IA de hoje. O limite reinicia à meia-noite. Assine o Premium por R$9,90/mês para uso ilimitado.`,
  roteiro: (n) =>
    `Você usou seus ${n} roteiros com IA de hoje. O limite reinicia à meia-noite. Assine o Premium por R$9,90/mês para uso ilimitado.`,
};

/**
 * @typedef {Object} UsageCounter
 * @property {number} used - Quantidade já utilizada no dia corrente.
 * @property {number} limit - Limite do plano gratuito por dia.
 * @property {number|null} remaining - Restante (`null` se premium).
 */

/**
 * @typedef {Object} PremiumUsage
 * @property {boolean} premium - Se o usuário tem Premium ativo.
 * @property {string} day - Chave do dia (`YYYY-MM-DD`, fuso São Paulo).
 * @property {string} [month] - Alias legado de `day` (compatibilidade).
 * @property {UsageCounter} buscas - Uso de buscas com IA.
 * @property {UsageCounter} roteiros - Uso de roteiros com IA.
 * @property {{ requiresPremium: boolean }} climaDetalhes - Regras do clima detalhado.
 * @property {string} [resetsAt] - ISO do próximo reset (meia-noite SP).
 * @property {number} [msUntilReset] - Milissegundos até o reset.
 */

/**
 * Retorna a chave do dia corrente no fuso de São Paulo (formato `YYYY-MM-DD`).
 * Armazenada em `perfis.uso_ia_mes` (nome legado da coluna).
 * @param {Date} [date] - Data de referência (padrão: agora).
 * @returns {string}
 */
export function getUsageDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Verifica se o perfil tem assinatura Premium ativa.
 * @param {{ premium_ativo?: boolean, premium_ate?: string|null }} [perfil]
 * @returns {boolean}
 */
export function isPremiumActive(perfil) {
  if (!perfil?.premium_ativo) return false;
  if (!perfil?.premium_ate) return true;
  return new Date(perfil.premium_ate) > new Date();
}

/**
 * Milissegundos até a próxima meia-noite no fuso de São Paulo.
 * @param {Date} [from] - Instante de referência.
 * @returns {number}
 */
export function getMsUntilDailyReset(from = new Date()) {
  const startDay = getUsageDayKey(from);
  let lo = from.getTime();
  let hi = lo + 48 * 60 * 60 * 1000;

  if (getUsageDayKey(new Date(hi)) === startDay) {
    return 0;
  }

  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (getUsageDayKey(new Date(mid)) === startDay) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return Math.max(0, hi - from.getTime());
}

/**
 * Data/hora (UTC) da próxima meia-noite em São Paulo.
 * @param {Date} [from]
 * @returns {Date}
 */
export function getNextDailyResetAt(from = new Date()) {
  return new Date(from.getTime() + getMsUntilDailyReset(from));
}

/**
 * Formata milissegundos como `HH:MM:SS`.
 * @param {number} ms
 * @returns {string}
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/**
 * Adiciona metadados de reset diário ao objeto de uso.
 * @param {PremiumUsage} usage
 * @returns {PremiumUsage}
 */
export function enrichUsageWithDailyReset(usage) {
  if (!usage || usage.premium) {
    return usage;
  }

  const msUntilReset = getMsUntilDailyReset();

  return {
    ...usage,
    resetsAt: getNextDailyResetAt().toISOString(),
    msUntilReset,
  };
}

/**
 * Indica se o valor em `uso_ia_mes` é uma chave diária válida (`YYYY-MM-DD`).
 * @param {string|null|undefined} usoIaMes
 * @returns {boolean}
 */
export function isUsageDayKey(usoIaMes) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(usoIaMes ?? "").trim());
}

/**
 * Chave legada mensal (`YYYY-MM`) — não conta como dia corrente na leitura.
 * @param {string|null|undefined} usoIaMes
 * @returns {boolean}
 */
export function isLegacyUsageMonthKey(usoIaMes) {
  const stored = String(usoIaMes ?? "").trim();
  return /^\d{4}-\d{2}$/.test(stored);
}

/**
 * Verifica se a chave em `perfis.uso_ia_mes` corresponde ao dia corrente (SP).
 * Apenas `YYYY-MM-DD` igual a hoje conta; `YYYY-MM` e outros formatos não.
 * @param {string|null|undefined} usoIaMes - Valor persistido no perfil.
 * @param {string} [day] - Chave do dia atual (`getUsageDayKey()`).
 * @returns {boolean}
 */
export function isSameUsageDay(usoIaMes, day = getUsageDayKey()) {
  const stored = String(usoIaMes ?? "").trim();
  if (!stored) return false;
  return isUsageDayKey(stored) && stored === day;
}

/**
 * Indica se o perfil precisa realinhar contadores ao dia corrente (SP).
 * @param {Object} [perfil]
 * @param {string} [day]
 * @returns {boolean}
 */
export function shouldAlignUsageToDay(perfil, day = getUsageDayKey()) {
  if (isPremiumActive(perfil)) return false;
  const stored = String(perfil?.uso_ia_mes ?? "").trim();
  if (!stored) return true;
  if (isLegacyUsageMonthKey(stored)) return true;
  return !isSameUsageDay(stored, day);
}

/**
 * Contadores efetivos para o dia corrente (fonte única para leitura e gates client).
 * @param {Object} [perfil]
 * @param {string} [day]
 * @returns {{ buscas: number, roteiros: number, sameDay: boolean, needsDayAlign: boolean }}
 */
export function getEffectiveUsageCounters(perfil, day = getUsageDayKey()) {
  if (isPremiumActive(perfil)) {
    const sameDay = isSameUsageDay(perfil?.uso_ia_mes, day);
    return {
      sameDay,
      needsDayAlign: false,
      buscas: sameDay ? Number(perfil?.buscas_ia) || 0 : Number(perfil?.buscas_ia) || 0,
      roteiros: sameDay ? Number(perfil?.roteiros_ia) || 0 : Number(perfil?.roteiros_ia) || 0,
    };
  }

  if (shouldAlignUsageToDay(perfil, day)) {
    return { sameDay: false, needsDayAlign: true, buscas: 0, roteiros: 0 };
  }

  return {
    sameDay: true,
    needsDayAlign: false,
    buscas: Number(perfil?.buscas_ia) || 0,
    roteiros: Number(perfil?.roteiros_ia) || 0,
  };
}

/**
 * Normaliza contadores de uso de IA a partir do perfil do Supabase.
 * @param {Object} [perfil] - Linha da tabela `perfis` com campos de uso.
 * @returns {PremiumUsage}
 */
export function normalizeUsageFromPerfil(perfil) {
  const day = getUsageDayKey();
  const { buscas, roteiros } = getEffectiveUsageCounters(perfil, day);
  const premium = isPremiumActive(perfil);

  const usage = {
    premium,
    day,
    month: day,
    buscas: {
      used: buscas,
      limit: LIMITS.busca,
      remaining: premium ? null : Math.max(0, LIMITS.busca - buscas),
    },
    roteiros: {
      used: roteiros,
      limit: LIMITS.roteiro,
      remaining: premium ? null : Math.max(0, LIMITS.roteiro - roteiros),
    },
    climaDetalhes: {
      requiresPremium: !premium,
    },
  };

  return enrichUsageWithDailyReset(usage);
}

/**
 * Uso padrão quando o perfil ainda não carregou ou colunas premium não existem.
 * @param {Object} [perfil] - Perfil parcial ou vazio.
 * @returns {PremiumUsage}
 */
export function createDefaultUsage(perfil = {}) {
  return normalizeUsageFromPerfil(perfil);
}

/**
 * @typedef {Object} AccessCheck
 * @property {boolean} allowed - Se a ação é permitida.
 * @property {'LOGIN_REQUIRED'|'LIMIT_REACHED'|'DEFER_TO_API'|string} [code] - Código de bloqueio ou deferência.
 */

/**
 * Verifica se o usuário pode usar busca com IA.
 * @param {PremiumUsage|null} usage - Estado de uso normalizado.
 * @param {boolean} [isLoggedIn=false] - Se há sessão ativa.
 * @param {{ synced?: boolean }} [options] - `synced: false` bloqueia até hidratar da API.
 * @returns {AccessCheck}
 */
export function canUseBusca(usage, isLoggedIn = false, options = {}) {
  const { synced = true } = options;

  if (!usage) {
    if (isLoggedIn && !synced) {
      return { allowed: false, code: "USAGE_PENDING" };
    }
    if (isLoggedIn) return { allowed: true, code: "DEFER_TO_API" };
    return { allowed: false, code: "LOGIN_REQUIRED" };
  }
  if (usage.premium) return { allowed: true };
  const buscasUsed = Number(usage.buscas?.used) || 0;
  if (buscasUsed < LIMITS.busca) return { allowed: true };
  return { allowed: false, code: "LIMIT_REACHED" };
}

/**
 * Verifica se o usuário pode gerar roteiro com IA.
 * @param {PremiumUsage|null} usage - Estado de uso normalizado.
 * @param {boolean} [isLoggedIn=false] - Se há sessão ativa.
 * @param {{ synced?: boolean }} [options] - `synced: false` bloqueia até hidratar da API.
 * @returns {AccessCheck}
 */
export function canUseRoteiro(usage, isLoggedIn = false, options = {}) {
  const { synced = true } = options;

  if (!usage) {
    if (isLoggedIn && !synced) {
      return { allowed: false, code: "USAGE_PENDING" };
    }
    if (isLoggedIn) return { allowed: true, code: "DEFER_TO_API" };
    return { allowed: false, code: "LOGIN_REQUIRED" };
  }
  if (usage.premium) return { allowed: true };
  const roteirosUsed = Number(usage.roteiros?.used) || 0;
  if (roteirosUsed < LIMITS.roteiro) return { allowed: true };
  return { allowed: false, code: "LIMIT_REACHED" };
}

/**
 * Verifica se o usuário pode ver detalhes climáticos (recurso Premium).
 * @param {PremiumUsage|null} usage - Estado de uso normalizado.
 * @param {boolean} [isLoggedIn=false] - Se há sessão ativa.
 * @returns {AccessCheck}
 */
export function canViewClimaDetalhes(usage, isLoggedIn = false) {
  if (!isLoggedIn) {
    return { allowed: false, code: "LOGIN_REQUIRED" };
  }
  if (!usage) {
    return { allowed: false, code: "PREMIUM_REQUIRED" };
  }
  if (usage.premium) return { allowed: true };
  return { allowed: false, code: "PREMIUM_REQUIRED" };
}

/**
 * Indica se o limite diário de buscas foi atingido.
 * @param {PremiumUsage|null} usage
 * @returns {boolean}
 */
export function isDailyBuscaLimitReached(usage) {
  if (!usage || usage.premium) return false;
  return (Number(usage.buscas?.used) || 0) >= LIMITS.busca;
}

/**
 * Indica se o limite diário de roteiros foi atingido.
 * @param {PremiumUsage|null} usage
 * @returns {boolean}
 */
export function isDailyRoteiroLimitReached(usage) {
  if (!usage || usage.premium) return false;
  return (Number(usage.roteiros?.used) || 0) >= LIMITS.roteiro;
}
