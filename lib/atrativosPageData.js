/**
 * Dados da aba Atrativos (lista com tags + roteiros do usuário logado).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ atrativos: object[], roteiros: object[] }>}
 */
export async function fetchAtrativosPageData(supabase) {
  const empty = { atrativos: [], roteiros: [] };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("rotas")
      .select("*, rotas_tags(tags(*))")
      .eq("ativa", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[atrativosPageData]", error.message);
      return empty;
    }

    let roteiros = [];
    if (user) {
      const { data: roteirosData } = await supabase
        .from("roteiros")
        .select("id, titulo, dias, perfil, interesses, conteudo, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      roteiros = roteirosData ?? [];
    }

    return {
      atrativos: data ?? [],
      roteiros,
    };
  } catch (err) {
    console.error("[atrativosPageData]", err);
    return empty;
  }
}
