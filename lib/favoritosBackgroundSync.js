import { syncAllFavoritosOffline } from "@/lib/favoritosOfflineFetch";
import {
  markBackgroundSyncAt,
  shouldRunBackgroundSync,
} from "@/lib/favoritosSyncThrottle";

/**
 * Sincroniza favoritos offline + shell do SW (com throttle de sessão).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export async function runFavoritosBackgroundSync(supabase, userId, options = {}) {
  if (!supabase || !userId) return false;
  if (!options.force && !shouldRunBackgroundSync()) return false;

  markBackgroundSyncAt();

  try {
    await syncAllFavoritosOffline(supabase, userId);
    return true;
  } catch (error) {
    console.warn("[favoritosBackgroundSync]", error);
    return false;
  }
}
