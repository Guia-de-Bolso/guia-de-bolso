/**
 * Dados da aba Roteiros (trilhas curadas com tags).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ atrativos: object[] }>}
 */
export async function fetchAtrativosPageData(supabase) {
  const empty = { atrativos: [] };

  try {
    const { data, error } = await supabase
      .from("rotas")
      .select("*, rotas_tags(tags(*))")
      .eq("ativa", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[atrativosPageData]", error.message);
      return empty;
    }

    return { atrativos: data ?? [] };
  } catch (err) {
    console.error("[atrativosPageData]", err);
    return empty;
  }
}
