import { registrarLog } from "@/lib/logs";

export { createFavoritosSyncGuard } from "./favoritosSync.js";

const toggleLocks = new Set();

/**
 * @param {string} userId
 * @param {string} lugarId
 * @returns {string}
 */
function favoritoLockKey(userId, lugarId) {
  return `${userId}:${lugarId}`;
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError|null|undefined} error
 * @returns {boolean}
 */
function isDuplicateFavoritoError(error) {
  return error?.code === "23505";
}

/**
 * Carrega ids de lugares favoritos do usuário.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function fetchFavoritoIds(supabase, userId) {
  const { data, error } = await supabase
    .from("favoritos")
    .select("lugar_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[favoritos] fetch:", error);
    return [];
  }

  return (data ?? []).map((f) => String(f.lugar_id));
}

/**
 * Alterna favorito de um lugar (otimista) e registra log.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('@supabase/supabase-js').User} user
 * @param {object} lugar - Precisa `id` e `nome`.
 * @param {(ids: string[] | ((prev: string[]) => string[])) => void} setFavoritoIds
 * @returns {Promise<void>}
 */
export async function toggleFavoritoLugar(supabase, user, lugar, setFavoritoIds) {
  const lugarId = String(lugar.id);
  const lockKey = favoritoLockKey(user.id, lugarId);
  if (toggleLocks.has(lockKey)) return;

  toggleLocks.add(lockKey);
  let jaFavorito = false;

  try {
    setFavoritoIds((prev) => {
      jaFavorito = prev.includes(lugarId);
      if (jaFavorito) return prev.filter((id) => id !== lugarId);
      return [...prev, lugarId];
    });

    if (jaFavorito) {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", user.id)
        .eq("lugar_id", lugar.id);

      if (error) {
        setFavoritoIds((prev) => (prev.includes(lugarId) ? prev : [...prev, lugarId]));
        return;
      }

      await registrarLog(supabase, user, "desfavoritou", {
        lugar_id: lugar.id,
        lugar_nome: lugar.nome,
      });
      return;
    }

    const { error } = await supabase
      .from("favoritos")
      .insert({ user_id: user.id, lugar_id: lugar.id });

    if (error && !isDuplicateFavoritoError(error)) {
      setFavoritoIds((prev) => prev.filter((id) => id !== lugarId));
      return;
    }

    await registrarLog(supabase, user, "favoritou", {
      lugar_id: lugar.id,
      lugar_nome: lugar.nome,
    });
  } finally {
    toggleLocks.delete(lockKey);
  }
}

/**
 * Alterna favorito com estado booleano (detalhe do lugar).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('@supabase/supabase-js').User} user
 * @param {object} lugar - Precisa `id` e `nome`.
 * @param {(value: boolean | ((prev: boolean) => boolean)) => void} setIsFavorito
 * @returns {Promise<void>}
 */
export async function toggleFavoritoLugarBoolean(supabase, user, lugar, setIsFavorito) {
  const lockKey = favoritoLockKey(user.id, String(lugar.id));
  if (toggleLocks.has(lockKey)) return;

  toggleLocks.add(lockKey);
  let eraFavorito = false;

  try {
    setIsFavorito((prev) => {
      eraFavorito = prev;
      return !prev;
    });

    if (eraFavorito) {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", user.id)
        .eq("lugar_id", lugar.id);

      if (error) {
        setIsFavorito(true);
        return;
      }

      await registrarLog(supabase, user, "desfavoritou", {
        lugar_id: lugar.id,
        lugar_nome: lugar.nome,
      });
      return;
    }

    const { error } = await supabase
      .from("favoritos")
      .insert({ user_id: user.id, lugar_id: lugar.id });

    if (error && !isDuplicateFavoritoError(error)) {
      setIsFavorito(false);
      return;
    }

    await registrarLog(supabase, user, "favoritou", {
      lugar_id: lugar.id,
      lugar_nome: lugar.nome,
    });
  } finally {
    toggleLocks.delete(lockKey);
  }
}
