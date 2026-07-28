/**
 * Garante linha em `perfis` após login (OAuth, SMS, etc.).
 * @module lib/ensurePerfil
 */

import {
  isPlaceholderAutorNome,
  resolveAutorDisplayName,
} from "./autorDisplayName.js";

/**
 * Nome de exibição a partir do usuário Supabase Auth.
 * @param {import('@supabase/supabase-js').User} user
 * @returns {string}
 */
export function getPerfilDisplayName(user) {
  return resolveAutorDisplayName({ user });
}

/**
 * Upsert do perfil do usuário logado (client ou server Supabase).
 * Preserva nome customizado já salvo (ex.: "Como quer aparecer?").
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('@supabase/supabase-js').User} user
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function ensurePerfil(supabase, user) {
  if (!user?.id) return { ok: false, error: "Usuário inválido" };

  const { data: existing } = await supabase
    .from("perfis")
    .select("nome, foto_url, email")
    .eq("id", user.id)
    .maybeSingle();

  const resolvedNome = getPerfilDisplayName(user);
  const nome = !isPlaceholderAutorNome(existing?.nome)
    ? String(existing.nome).trim()
    : resolvedNome;

  const fotoUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    existing?.foto_url ??
    null;

  const payload = {
    id: user.id,
    nome,
    email: user.email ?? existing?.email ?? null,
    foto_url: fotoUrl,
  };

  const { error } = await supabase.from("perfis").upsert(payload, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    const missingEmail =
      error.code === "42703" || error.message?.includes("email");

    if (missingEmail) {
      const { nome: nomePayload, foto_url, id } = payload;
      const { error: retryError } = await supabase.from("perfis").upsert(
        { id, nome: nomePayload, foto_url },
        { onConflict: "id" }
      );
      if (retryError) {
        console.error("[ensurePerfil]", retryError.message);
        return { ok: false, error: retryError.message };
      }
      return { ok: true };
    }

    console.error("[ensurePerfil]", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
