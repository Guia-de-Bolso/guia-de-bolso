import { registrarLog } from "@/lib/logs";

const toggleLocks = new Set();

/**
 * @param {string} userId
 * @param {string} rotaId
 * @returns {string}
 */
function lockKey(userId, rotaId) {
  return `${userId}:${rotaId}`;
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError|null|undefined} error
 * @returns {boolean}
 */
function isDuplicateFavoritoError(error) {
  return error?.code === "23505";
}

/**
 * Alterna favorito de rota curada (otimista) com lock contra duplo toque.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('@supabase/supabase-js').User} user
 * @param {string} rotaId
 * @param {string} rotaNome
 * @param {(value: boolean | ((prev: boolean) => boolean)) => void} setIsFavorito
 * @returns {Promise<void>}
 */
export async function toggleRotasFavorita(
  supabase,
  user,
  rotaId,
  rotaNome,
  setIsFavorito
) {
  const key = lockKey(user.id, String(rotaId));
  if (toggleLocks.has(key)) return;

  toggleLocks.add(key);
  let eraFavorito = false;

  try {
    setIsFavorito((prev) => {
      eraFavorito = prev;
      return !prev;
    });

    if (eraFavorito) {
      const { error } = await supabase
        .from("rotas_favoritas")
        .delete()
        .eq("user_id", user.id)
        .eq("rota_id", rotaId);

      if (error) {
        setIsFavorito(true);
        return;
      }

      await registrarLog(supabase, user, "desfavoritou", {
        rota_id: rotaId,
        rota_nome: rotaNome,
      });
      return;
    }

    const { error } = await supabase
      .from("rotas_favoritas")
      .insert({ user_id: user.id, rota_id: rotaId });

    if (error && !isDuplicateFavoritoError(error)) {
      setIsFavorito(false);
      return;
    }

    await registrarLog(supabase, user, "favoritou", {
      rota_id: rotaId,
      rota_nome: rotaNome,
    });
  } finally {
    toggleLocks.delete(key);
  }
}
