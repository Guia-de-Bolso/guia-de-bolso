import { isMissingTableError } from "./supabaseErrors.js";

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @param {{ token: string, platform: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, message: string }>}
 */
export async function upsertPushToken(admin, userId, { token, platform }) {
  const now = new Date().toISOString();

  const { error } = await admin.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform,
      enabled: true,
      updated_at: now,
    },
    { onConflict: "token" }
  );

  if (error) {
    if (isMissingTableError(error)) {
      return {
        ok: false,
        message: "Tabela push_tokens ausente. Aplique a migration no Supabase.",
      };
    }

    return { ok: false, message: error.message };
  }

  return { ok: true };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @param {string} [token]
 * @returns {Promise<{ ok: true, disabled: number } | { ok: false, message: string }>}
 */
export async function disablePushTokens(admin, userId, token) {
  let query = admin
    .from("push_tokens")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (token) {
    query = query.eq("token", token);
  }

  const { data, error } = await query.select("id");

  if (error) {
    if (isMissingTableError(error)) {
      return { ok: true, disabled: 0 };
    }

    return { ok: false, message: error.message };
  }

  return { ok: true, disabled: data?.length ?? 0 };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string[]} userIds
 * @returns {Promise<{ tokens: string[], missingTable: boolean }>}
 */
export async function getEnabledPushTokensForUsers(admin, userIds) {
  if (!userIds.length) {
    return { tokens: [], missingTable: false };
  }

  const { data, error } = await admin
    .from("push_tokens")
    .select("token")
    .in("user_id", userIds)
    .eq("enabled", true);

  if (error) {
    if (isMissingTableError(error)) {
      return { tokens: [], missingTable: true };
    }

    throw new Error(error.message);
  }

  const tokens = [...new Set((data ?? []).map((row) => row.token).filter(Boolean))];
  return { tokens, missingTable: false };
}

/**
 * Desativa tokens inválidos após falha no FCM.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string[]} tokens
 * @returns {Promise<number>}
 */
export async function disableInvalidPushTokens(admin, tokens) {
  if (!tokens.length) return 0;

  const { data, error } = await admin
    .from("push_tokens")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .in("token", tokens)
    .select("id");

  if (error) {
    if (isMissingTableError(error)) return 0;
    throw new Error(error.message);
  }

  return data?.length ?? 0;
}
