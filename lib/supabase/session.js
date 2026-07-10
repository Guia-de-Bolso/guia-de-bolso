/**
 * Leitura de sessão sem refresh no Supabase Auth.
 * O refresh fica exclusivamente no middleware (`middleware.js`).
 * @module lib/supabase/session
 */

/**
 * Lê o usuário dos cookies de sessão sem chamar o servidor de auth para refresh.
 * Use em Server Components, Route Handlers e client após o middleware renovar o token.
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
    console.warn("[getSessionUser]", error.message);
    return null;
  }

  return session?.user ?? null;
}
