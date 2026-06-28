/**
 * Plano comercial único (V1) — Parceiro do Guia, R$ 299/mês.
 * Visibilidade no app: `lugares.eh_parceiro` (toggle no admin de locais).
 * Tabela `planos` / `destaques` permanece legada no Supabase (não usada no app).
 */

export const PLANO_COMERCIAL_NOME = "Parceiro";
export const PLANO_COMERCIAL_PRECO = 299;
export const PLANO_COMERCIAL_FREQUENCIA = "mensal";

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<{ id: number|string, nome: string, preco: number, frequencia: string }|null>}
 */
export async function fetchPlanoComercial(supabase) {
  const { data, error } = await supabase
    .from("planos")
    .select("id, nome, frequencia, preco")
    .eq("nome", PLANO_COMERCIAL_NOME)
    .maybeSingle();

  if (!error && data) return normalizePlanoComercial(data);

  const { data: fallback } = await supabase
    .from("planos")
    .select("id, nome, frequencia, preco")
    .order("preco", { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallback ? normalizePlanoComercial(fallback) : null;
}

/**
 * Garante nome/preço do plano único V1 no banco (corrige legado R$ 199/229).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<{ id: number|string, nome: string, preco: number, frequencia: string }|null>}
 */
export async function ensurePlanoComercial(supabase) {
  const plano = await fetchPlanoComercial(supabase);
  if (!plano?.id) return null;

  const precoAtual = Number(plano.preco);
  const precisaAtualizar =
    plano.nome !== PLANO_COMERCIAL_NOME ||
    plano.frequencia !== PLANO_COMERCIAL_FREQUENCIA ||
    precoAtual !== PLANO_COMERCIAL_PRECO;

  if (!precisaAtualizar) return plano;

  const { data, error } = await supabase
    .from("planos")
    .update({
      nome: PLANO_COMERCIAL_NOME,
      frequencia: PLANO_COMERCIAL_FREQUENCIA,
      preco: PLANO_COMERCIAL_PRECO,
    })
    .eq("id", plano.id)
    .select("id, nome, frequencia, preco")
    .maybeSingle();

  if (error) {
    console.error("[ensurePlanoComercial]", error.message);
    return normalizePlanoComercial(plano);
  }

  return normalizePlanoComercial(data ?? plano);
}

/**
 * @param {object} plano
 * @returns {{ id: number|string, nome: string, preco: number, frequencia: string }}
 */
function normalizePlanoComercial(plano) {
  return {
    ...plano,
    nome: PLANO_COMERCIAL_NOME,
    frequencia: PLANO_COMERCIAL_FREQUENCIA,
    preco: PLANO_COMERCIAL_PRECO,
  };
}
