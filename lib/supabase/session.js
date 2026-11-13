/**
 * Leitura de sessão.
 * O refresh do JWT continua no middleware (`middleware.js`).
 * Escritas com service role usam `getVerifiedUser`, que consulta o Auth.
 * @module lib/supabase/session
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
function safeAuthErrorMessage(error) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error && typeof error === "object" && "message" in error ? error.message : "");
  return raw.replace(/\s+/g, " ").slice(0, 180);
}

/**
 * Lê o usuário dos cookies de sessão sem chamar o servidor de auth.
 * Serve para interface. Não usar o id deste objeto em escrita com service role.
 * @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabase
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getSessionUser(supabase) {
  if (!supabase) return null;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.warn("[getSessionUser]", safeAuthErrorMessage(error));
    return null;
  }

  return session?.user ?? null;
}

/**
 * Usuário confirmado pelo Auth server (`getUser`).
 * Sessão expirada, token inválido ou id ausente devolvem null.
 * O objeto `user` do cookie é ignorado.
 * @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabase
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getVerifiedUser(supabase) {
  if (!supabase?.auth?.getUser) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
      if (error) console.warn("[getVerifiedUser]", safeAuthErrorMessage(error));
      return null;
    }
    return data.user;
  } catch (err) {
    console.warn("[getVerifiedUser]", safeAuthErrorMessage(err));
    return null;
  }
}

/**
 * Id de escrita privilegiada. Só existe se o Auth confirmou o usuário.
 * @param {{ id?: string }|null|undefined} verifiedUser
 * @returns {string|null}
 */
export function serviceRoleUserId(verifiedUser) {
  const id = typeof verifiedUser?.id === "string" ? verifiedUser.id.trim() : "";
  return id || null;
}

/**
 * A operação de banco usa o mesmo id que o Auth confirmou.
 * @param {string|null|undefined} userId
 * @param {{ id?: string }|null|undefined} verifiedUser
 * @returns {boolean}
 */
export function verifiedUserMatches(userId, verifiedUser) {
  const id = typeof userId === "string" ? userId.trim() : "";
  return Boolean(id) && verifiedUser?.id === id;
}
