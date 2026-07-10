import { getSessionUser } from "./supabase/session.js";

/**
 * Snapshot serializável do usuário Supabase para props server → client.
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 * @returns {import('@/lib/perfilPageData').PerfilAuthUser|null}
 */
export function serializePerfilAuthUser(user) {
  if (!user?.id) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    created_at: user.created_at ?? null,
    user_metadata: user.user_metadata ?? {},
    app_metadata: user.app_metadata ?? {},
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ favoritos: number, avaliacoes: number, roteiros: number }>}
 */
async function fetchPerfilStats(supabase, userId) {
  const [favoritosRes, avaliacoesRes, roteirosRes] = await Promise.all([
    supabase
      .from("favoritos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("roteiros")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    favoritos: favoritosRes.count ?? 0,
    avaliacoes: avaliacoesRes.count ?? 0,
    roteiros: roteirosRes.count ?? 0,
  };
}

/**
 * Dados iniciais da aba Perfil (SSR).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<import('@/lib/perfilPageData').PerfilPageInitialData>}
 */
export async function fetchPerfilPageInitialData(supabase) {
  const user = await getSessionUser(supabase);

  if (!user) {
    return {
      user: null,
      perfil: null,
      stats: { favoritos: 0, avaliacoes: 0, roteiros: 0 },
    };
  }

  const [perfilRes, stats] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", user.id).maybeSingle(),
    fetchPerfilStats(supabase, user.id),
  ]);

  return {
    user: serializePerfilAuthUser(user),
    perfil: perfilRes.data ?? null,
    stats,
  };
}

/**
 * @typedef {Object} PerfilAuthUser
 * @property {string} id
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string|null} created_at
 * @property {Record<string, unknown>} user_metadata
 * @property {Record<string, unknown>} app_metadata
 */

/**
 * @typedef {Object} PerfilPageInitialData
 * @property {PerfilAuthUser|null} user
 * @property {object|null} perfil
 * @property {{ favoritos: number, avaliacoes: number, roteiros: number }} stats
 */
