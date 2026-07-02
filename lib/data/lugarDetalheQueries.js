import { AVALIACAO_STATUS_APROVADOS } from "@/lib/avaliacoes";
import { applyPublicLugarFilters } from "@/lib/publicCatalog";
/**
 * Carrega lugar ativo por id.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 */
export function fetchLugarAtivo(supabase, id) {
  return applyPublicLugarFilters(supabase.from("lugares").select("*"))
    .eq("id", id)
    .maybeSingle();
}

/**
 * Fotos da tabela legada `fotos_lugar`.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 */
export function fetchFotosLugarLegado(supabase, id) {
  return supabase.from("fotos_lugar").select("*").eq("lugar_id", id);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 */
export function fetchLocalizacaoLugar(supabase, id) {
  return supabase.from("localizacoes").select("*").eq("lugar_id", id).maybeSingle();
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 */
export function fetchTagsLugar(supabase, id) {
  return supabase.from("lugares_tags").select("tags(*)").eq("lugar_id", id);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} id
 */
export function fetchFavoritoLugar(supabase, userId, lugarId) {
  return supabase
    .from("favoritos")
    .select("lugar_id")
    .eq("user_id", userId)
    .eq("lugar_id", lugarId)
    .maybeSingle();
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} lugarId
 */
export function fetchJaAvaliouLugar(supabase, userId, lugarId) {
  return supabase
    .from("avaliacoes")
    .select("id")
    .eq("user_id", userId)
    .eq("lugar_id", lugarId)
    .maybeSingle();
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} lugarId
 */
export function fetchAvaliacoesLugar(supabase, lugarId) {
  return supabase
    .from("avaliacoes")
    .select("*, perfis:user_id(nome, foto_url, created_at)")
    .eq("lugar_id", lugarId)
    .in("status", AVALIACAO_STATUS_APROVADOS)
    .order("created_at", { ascending: false });
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} categoria
 * @param {string} nomeSubcategoria
 */
export function fetchSubcategoria(supabase, categoria, nomeSubcategoria) {
  return supabase
    .from("subcategorias")
    .select("*")
    .eq("categoria", categoria)
    .eq("nome", nomeSubcategoria)
    .maybeSingle();
}
