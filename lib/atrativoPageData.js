import { cache } from "react";
import { createPublicPageServerClient } from "@/lib/supabase/pageServer";

/**
 * Dados do detalhe do atrativo — cache por request (metadata + página).
 * @param {string} atrativoId
 * @returns {Promise<{
 *   rota: object|null,
 *   pontos: object[],
 *   dicas: object[],
 *   localizacao: object|null,
 *   error: import('@supabase/supabase-js').PostgrestError|null,
 * }>}
 */
export const fetchAtrativoPageData = cache(async function fetchAtrativoPageData(atrativoId) {
  const supabase = await createPublicPageServerClient();
  if (!supabase) {
    return { rota: null, pontos: [], dicas: [], localizacao: null, error: null };
  }

  const { data: rota, error } = await supabase
    .from("rotas")
    .select("*, rotas_tags(tags(*))")
    .eq("id", atrativoId)
    .maybeSingle();

  if (error) {
    return { rota: null, pontos: [], dicas: [], localizacao: null, error };
  }

  if (!rota) {
    return { rota: null, pontos: [], dicas: [], localizacao: null, error: null };
  }

  const [pontosRes, dicasRes, localizacaoRes] = await Promise.all([
    supabase
      .from("rota_pontos")
      .select("*, rota_ponto_detalhes(id, texto, ordem)")
      .eq("rota_id", atrativoId)
      .order("ordem", { ascending: true }),
    supabase
      .from("rota_dicas")
      .select("*")
      .eq("rota_id", atrativoId)
      .order("ordem", { ascending: true }),
    supabase
      .from("rotas_localizacoes")
      .select("*")
      .eq("rota_id", atrativoId)
      .maybeSingle(),
  ]);

  return {
    rota,
    pontos: pontosRes.data ?? [],
    dicas: dicasRes.data ?? [],
    localizacao: localizacaoRes.data ?? null,
    error: null,
  };
});
