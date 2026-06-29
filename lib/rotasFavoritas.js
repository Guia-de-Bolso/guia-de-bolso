import {
  cacheAtrativoFavoritoFromServer,
  purgeOfflineFavorito,
} from "@/lib/favoritosOfflineFetch.js";
import { FAVORITO_OFFLINE_TYPES, FAVORITO_OFFLINE_SAVED_MESSAGE } from "@/lib/favoritosOffline.js";
import { registrarLog } from "@/lib/logs";
import { isMissingTableError } from "@/lib/supabaseErrors";

export { createFavoritosSyncGuard } from "./favoritosSync.js";
export { FAVORITO_OFFLINE_SAVED_MESSAGE };

const toggleLocks = new Set();

/**
 * Carrega rotas curadas favoritadas pelo usuário.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ rotas: object[], error: import('@supabase/supabase-js').PostgrestError | null, tableMissing?: boolean }>}
 */
export async function fetchRotasFavoritas(supabase, userId) {
  const { data, error } = await supabase
    .from("rotas_favoritas")
    .select("rota_id, rotas(*)")
    .eq("user_id", userId);

  if (!error) {
    const rotas = (data ?? [])
      .map((row) => {
        const nested = row.rotas;
        if (Array.isArray(nested)) return nested[0];
        return nested;
      })
      .filter(Boolean);

    return { rotas, error: null };
  }

  if (isMissingTableError(error)) {
    console.error("[rotas_favoritas] tabela ausente — rode supabase/rotas_favoritas.sql");
    return { rotas: [], error: null, tableMissing: true };
  }

  console.error("[rotas_favoritas] fetch join:", error);

  const { data: favoritos, error: favoritosError } = await supabase
    .from("rotas_favoritas")
    .select("rota_id")
    .eq("user_id", userId);

  if (favoritosError) {
    if (isMissingTableError(favoritosError)) {
      console.error("[rotas_favoritas] tabela ausente — rode supabase/rotas_favoritas.sql");
      return { rotas: [], error: null, tableMissing: true };
    }
    console.error("[rotas_favoritas] fetch ids:", favoritosError);
    return { rotas: [], error: favoritosError };
  }

  const ids = (favoritos ?? []).map((item) => item.rota_id);
  if (ids.length === 0) return { rotas: [], error: null };

  const { data: rotasData, error: rotasError } = await supabase
    .from("rotas")
    .select("*")
    .in("id", ids);

  if (rotasError) {
    console.error("[rotas_favoritas] fetch rotas:", rotasError);
    return { rotas: [], error: rotasError };
  }

  return { rotas: rotasData ?? [], error: null };
}

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
 * @returns {Promise<"added"|"removed"|"failed"|null>}
 */
export async function toggleRotasFavorita(
  supabase,
  user,
  rotaId,
  rotaNome,
  setIsFavorito
) {
  const key = lockKey(user.id, String(rotaId));
  if (toggleLocks.has(key)) return "failed";

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
        if (isMissingTableError(error)) {
          console.error("[rotas_favoritas] tabela ausente — rode supabase/rotas_favoritas.sql");
          setIsFavorito(true);
          return null;
        }
        console.error("[rotas_favoritas] delete:", error);
        setIsFavorito(true);
        return "failed";
      }

      await purgeOfflineFavorito(user.id, FAVORITO_OFFLINE_TYPES.ATIVO, String(rotaId));

      await registrarLog(supabase, user, "desfavoritou", {
        rota_id: rotaId,
        rota_nome: rotaNome,
      });
      return "removed";
    }

    const { error } = await supabase
      .from("rotas_favoritas")
      .insert({ user_id: user.id, rota_id: rotaId });

    if (error && !isDuplicateFavoritoError(error)) {
      if (isMissingTableError(error)) {
        console.error("[rotas_favoritas] tabela ausente — rode supabase/rotas_favoritas.sql");
        setIsFavorito(false);
        return null;
      }
      console.error("[rotas_favoritas] insert:", error);
      setIsFavorito(false);
      return "failed";
    }

    await cacheAtrativoFavoritoFromServer(supabase, user.id, String(rotaId));

    await registrarLog(supabase, user, "favoritou", {
      rota_id: rotaId,
      rota_nome: rotaNome,
    });
    return "added";
  } finally {
    toggleLocks.delete(key);
  }
}
