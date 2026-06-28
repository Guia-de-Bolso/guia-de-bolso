/**
 * Controle server-side de limites Premium e incremento de uso de IA (busca e roteiro).
 * @module lib/premiumServer
 */

import { createClient } from "@/lib/supabase/server";
import {
  LIMITS,
  LIMIT_DENY_MESSAGES,
  enrichUsageWithDailyReset,
  getUsageDayKey,
  isPremiumActive,
  normalizeUsageFromPerfil,
  shouldAlignUsageToDay,
} from "@/lib/premium";

/** Colunas de `perfis` usadas para controle de uso de IA. */
const PERFIL_USAGE_SELECT =
  "id, premium_ativo, premium_ate, uso_ia_mes, buscas_ia, roteiros_ia";

/**
 * @typedef {Object} ServerAccessResult
 * @property {boolean} allowed
 * @property {string} [code]
 * @property {string} [message]
 * @property {import('@/lib/premium').PremiumUsage} [usage]
 * @property {number} [status] - HTTP status sugerido (401, 403).
 * @property {Object} [perfil]
 */

/**
 * Obtém cliente Supabase server-side e usuário autenticado.
 * @returns {Promise<{ supabase: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User|null }>}
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Normaliza payload JSON retornado pelas RPCs de incremento de uso.
 * @param {Object|null|undefined} usageJson
 * @returns {import('@/lib/premium').PremiumUsage}
 */
function mapRpcUsage(usageJson) {
  if (!usageJson || typeof usageJson !== "object") {
    return normalizeUsageFromPerfil({});
  }

  const day = usageJson.day ?? usageJson.month ?? getUsageDayKey();

  const usage = {
    premium: Boolean(usageJson.premium),
    day,
    month: day,
    buscas: {
      used: Number(usageJson.buscas?.used) || 0,
      limit: Number(usageJson.buscas?.limit) || LIMITS.busca,
      remaining:
        usageJson.buscas?.remaining === null || usageJson.buscas?.remaining === undefined
          ? null
          : Number(usageJson.buscas.remaining),
    },
    roteiros: {
      used: Number(usageJson.roteiros?.used) || 0,
      limit: Number(usageJson.roteiros?.limit) || LIMITS.roteiro,
      remaining:
        usageJson.roteiros?.remaining === null ||
        usageJson.roteiros?.remaining === undefined
          ? null
          : Number(usageJson.roteiros.remaining),
    },
    climaDetalhes: {
      requiresPremium: !usageJson.premium,
    },
  };

  if (usageJson.resets_at) {
    const resetsAt = new Date(usageJson.resets_at);
    return enrichUsageWithDailyReset({
      ...usage,
      resetsAt: resetsAt.toISOString(),
      msUntilReset: Math.max(0, resetsAt.getTime() - Date.now()),
    });
  }

  return enrichUsageWithDailyReset(usage);
}

/**
 * Converte resposta da RPC em resultado de acesso padronizado.
 * @param {{ allowed?: boolean, code?: string, message?: string, usage?: Object }} payload
 * @returns {ServerAccessResult}
 */
function accessFromRpcPayload(payload) {
  if (!payload?.allowed) {
    return {
      allowed: false,
      code: payload?.code ?? "LIMIT_REACHED",
      message: payload?.message ?? "Limite de uso atingido.",
      usage: mapRpcUsage(payload?.usage),
      status: payload?.code === "LOGIN_REQUIRED" ? 401 : 403,
    };
  }

  return {
    allowed: true,
    usage: mapRpcUsage(payload?.usage),
    code: payload?.code ?? "OK",
  };
}

/**
 * Tenta incrementar uso via RPC do Supabase; retorna `null` se RPC não existir.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {'increment_busca_ia'|'increment_roteiro_ia'|'decrement_busca_ia'|'decrement_roteiro_ia'} rpcName
 * @param {string} userId
 * @returns {Promise<ServerAccessResult|null>}
 */
async function usageViaRpc(supabase, rpcName, userId) {
  const { data, error } = await supabase.rpc(rpcName, { p_user_id: userId });

  if (error) {
    const missingRpc =
      error.code === "PGRST202" ||
      error.message?.includes("Could not find the function") ||
      error.message?.includes("increment_") ||
      error.message?.includes("decrement_");

    if (missingRpc) return null;
    throw error;
  }

  return accessFromRpcPayload(data);
}

/**
 * Realinha `uso_ia_mes` e zera contadores quando o dia mudou ou a chave é legada `YYYY-MM`.
 * Persistência via RPC `align_perfil_usage_to_day` (contadores não são graváveis pelo cliente).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {Object|null|undefined} perfil
 * @returns {Promise<Object|null|undefined>} Perfil atualizado ou o mesmo.
 */
export async function alignPerfilUsageToDay(supabase, userId, perfil) {
  if (!perfil?.id || !shouldAlignUsageToDay(perfil)) {
    return perfil;
  }

  const { error } = await supabase.rpc("align_perfil_usage_to_day", {
    p_user_id: userId,
  });

  if (error) {
    const missingRpc =
      error.code === "PGRST202" ||
      error.message?.includes("Could not find the function") ||
      error.message?.includes("align_perfil_usage_to_day");

    if (missingRpc) {
      console.warn("alignPerfilUsageToDay: RPC ausente, normalização só em leitura");
      return perfil;
    }

    console.error("alignPerfilUsageToDay:", error);
    return perfil;
  }

  const day = getUsageDayKey();
  return {
    ...perfil,
    uso_ia_mes: day,
    buscas_ia: 0,
    roteiros_ia: 0,
  };
}

/**
 * Carrega perfil de uso e alinha contadores ao dia corrente (SP) quando necessário.
 * @param {string} userId
 * @returns {Promise<import('@/lib/premium').PremiumUsage>}
 */
export async function getPerfilUsage(userId) {
  const supabase = await createClient();

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select(PERFIL_USAGE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const missingColumn =
      error.code === "42703" ||
      error.message?.includes("premium_") ||
      error.message?.includes("buscas_ia") ||
      error.message?.includes("roteiros_ia") ||
      error.message?.includes("uso_ia_mes");

    if (missingColumn) {
      return normalizeUsageFromPerfil({});
    }

    throw error;
  }

  const aligned = await alignPerfilUsageToDay(supabase, userId, perfil ?? {});
  return normalizeUsageFromPerfil(aligned ?? {});
}

/**
 * Lê uso premium via service role (após ativação IAP, evita lag do trigger/RLS).
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @returns {Promise<import('@/lib/premium').PremiumUsage>}
 */
export async function getPerfilUsageFromAdmin(admin, userId) {
  const { data: perfil, error } = await admin
    .from("perfis")
    .select(PERFIL_USAGE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeUsageFromPerfil(perfil ?? {});
}

/**
 * Monta resposta de acesso negado com status HTTP sugerido.
 * @param {string} code
 * @param {string} message
 * @param {import('@/lib/premium').PremiumUsage} [usage]
 * @returns {ServerAccessResult}
 */
function deniedResponse(code, message, usage) {
  return {
    allowed: false,
    code,
    message,
    usage,
    status: code === "LOGIN_REQUIRED" ? 401 : 403,
  };
}

/**
 * Incremento de cota sem RPC no banco — fail-closed (contadores só via RPC SECURITY DEFINER).
 * @param {'busca'|'roteiro'} kind
 * @returns {ServerAccessResult}
 */
function incrementIaWithoutRpc(kind) {
  console.error(`check${kind === "busca" ? "Busca" : "Roteiro"}Access: RPC increment_*_ia ausente`);
  return deniedResponse(
    "USAGE_CHECK_FAILED",
    "Não foi possível verificar seu limite de uso. Tente novamente em instantes."
  );
}

/**
 * Estorna cota de busca reservada quando a chamada à IA falha (best-effort).
 * @param {string|null|undefined} userId
 * @param {{ user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<import('@/lib/premium').PremiumUsage|null>}
 */
export async function releaseBuscaIaUsage(userId, { user = null } = {}) {
  if (!userId) return null;

  try {
    const supabase = await createClient();
    const rpcResult = await usageViaRpc(supabase, "decrement_busca_ia", userId);
    if (rpcResult?.usage) return rpcResult.usage;

    console.warn("releaseBuscaIaUsage: RPC decrement_busca_ia ausente");
    return null;
  } catch (err) {
    console.error("releaseBuscaIaUsage:", err);
    return null;
  }
}

/**
 * Estorna cota de roteiro reservada quando a chamada à IA falha (best-effort).
 * @param {string|null|undefined} userId
 * @param {{ user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<import('@/lib/premium').PremiumUsage|null>}
 */
export async function releaseRoteiroIaUsage(userId, { user = null } = {}) {
  if (!userId) return null;

  try {
    const supabase = await createClient();
    const rpcResult = await usageViaRpc(supabase, "decrement_roteiro_ia", userId);
    if (rpcResult?.usage) return rpcResult.usage;

    console.warn("releaseRoteiroIaUsage: RPC decrement_roteiro_ia ausente");
    return null;
  } catch (err) {
    console.error("releaseRoteiroIaUsage:", err);
    return null;
  }
}

/**
 * Verifica (e opcionalmente incrementa) acesso à busca com IA.
 * @param {string|null|undefined} userId
 * @param {{ increment?: boolean, user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<ServerAccessResult>}
 */
export async function checkBuscaAccess(userId, { increment = false, user = null } = {}) {
  if (!userId) {
    return deniedResponse("LOGIN_REQUIRED", "Faça login para usar a busca com IA.");
  }

  const supabase = await createClient();

  if (!user) {
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  }

  if (increment) {
    const { data: perfilBefore } = await supabase
      .from("perfis")
      .select(PERFIL_USAGE_SELECT)
      .eq("id", userId)
      .maybeSingle();

    await alignPerfilUsageToDay(supabase, userId, perfilBefore ?? {});

    const rpcResult = await usageViaRpc(supabase, "increment_busca_ia", userId);
    if (rpcResult) return rpcResult;

    return incrementIaWithoutRpc("busca");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select(PERFIL_USAGE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("checkBuscaAccess read:", error);
    return deniedResponse(
      "USAGE_CHECK_FAILED",
      "Não foi possível verificar seu limite de uso. Tente novamente em instantes."
    );
  }

  const aligned = await alignPerfilUsageToDay(supabase, userId, perfil ?? {});
  const usageAligned = normalizeUsageFromPerfil(aligned ?? {});

  if (isPremiumActive(aligned)) {
    return { allowed: true, usage: usageAligned, perfil: aligned };
  }

  if (usageAligned.buscas.used >= LIMITS.busca) {
    return deniedResponse(
      "LIMIT_REACHED",
      LIMIT_DENY_MESSAGES.busca(LIMITS.busca),
      enrichUsageWithDailyReset(usageAligned)
    );
  }

  return { allowed: true, usage: usageAligned, perfil: aligned };
}

/**
 * Verifica (e opcionalmente incrementa) acesso à geração de roteiro com IA.
 * @param {string|null|undefined} userId
 * @param {{ increment?: boolean, user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<ServerAccessResult>}
 */
export async function checkRoteiroAccess(userId, { increment = false, user = null } = {}) {
  if (!userId) {
    return deniedResponse("LOGIN_REQUIRED", "Faça login para criar roteiros com IA.");
  }

  const supabase = await createClient();

  if (!user) {
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  }

  if (increment) {
    const { data: perfilBefore } = await supabase
      .from("perfis")
      .select(PERFIL_USAGE_SELECT)
      .eq("id", userId)
      .maybeSingle();

    await alignPerfilUsageToDay(supabase, userId, perfilBefore ?? {});

    const rpcResult = await usageViaRpc(supabase, "increment_roteiro_ia", userId);
    if (rpcResult) return rpcResult;

    return incrementIaWithoutRpc("roteiro");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select(PERFIL_USAGE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("checkRoteiroAccess read:", error);
    return deniedResponse(
      "USAGE_CHECK_FAILED",
      "Não foi possível verificar seu limite de uso. Tente novamente em instantes."
    );
  }

  const aligned = await alignPerfilUsageToDay(supabase, userId, perfil ?? {});
  const usageAligned = normalizeUsageFromPerfil(aligned ?? {});

  if (isPremiumActive(aligned)) {
    return { allowed: true, usage: usageAligned, perfil: aligned };
  }

  if (usageAligned.roteiros.used >= LIMITS.roteiro) {
    return deniedResponse(
      "LIMIT_REACHED",
      LIMIT_DENY_MESSAGES.roteiro(LIMITS.roteiro),
      enrichUsageWithDailyReset(usageAligned)
    );
  }

  return { allowed: true, usage: usageAligned, perfil: aligned };
}

/**
 * Reserva 1 busca com IA (incremento atômico antes da chamada à Claude).
 * Em falha da IA, chamar {@link releaseBuscaIaUsage} para estornar (usuários não premium).
 * @param {string|null|undefined} userId
 * @param {{ user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<ServerAccessResult>}
 */
export async function reserveBuscaIaUsage(userId, { user = null } = {}) {
  return checkBuscaAccess(userId, { increment: true, user });
}

/**
 * Reserva 1 roteiro com IA (incremento atômico antes da chamada à Claude).
 * Em falha da IA, chamar {@link releaseRoteiroIaUsage} para estornar (usuários não premium).
 * @param {string|null|undefined} userId
 * @param {{ user?: import('@supabase/supabase-js').User|null }} [options]
 * @returns {Promise<ServerAccessResult>}
 */
export async function reserveRoteiroIaUsage(userId, { user = null } = {}) {
  return checkRoteiroAccess(userId, { increment: true, user });
}

/** @deprecated Use {@link reserveBuscaIaUsage} */
export async function recordBuscaIaUsage(userId, options = {}) {
  return reserveBuscaIaUsage(userId, options);
}

/** @deprecated Use {@link reserveRoteiroIaUsage} */
export async function recordRoteiroIaUsage(userId, options = {}) {
  return reserveRoteiroIaUsage(userId, options);
}
