import {
  filterLugaresByCategoria,
  normalizeLugaresTaxonomia,
} from "@/lib/lugarTaxonomia";

/** Select completo com joins usados na home e listagens. */
export const LUGAR_SELECT_FULL = "*, localizacoes(*), lugares_tags(tags(*))";

/** Select enxuto para cards e listagens (menos payload). */
export const LUGAR_SELECT_LIST =
  "id, nome, descricao, categoria, subcategoria, imagem_url, fotos, status, eh_parceiro, conteudo_curadoria, created_at, localizacoes(latitude, longitude, endereco_completo), lugares_tags(tags(id, nome))";

/** Select mínimo se join/RLS de tabelas relacionadas falhar. */
export const LUGAR_SELECT_BASE = "*";

/** Select mínimo para contagens por categoria (Explorar). */
export const LUGAR_SELECT_COUNTS = "id, categoria, subcategoria, imagem_url, fotos";

const LUGARES_PAGE_SIZE = 200;

/**
 * Busca lugares ativos; tenta select completo e faz fallback para `*`.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ limit?: number, eq?: Record<string, string> }} [options]
 * @returns {Promise<{ data: object[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function queryLugaresAtivos(
  supabase,
  { limit = 50, eq = {}, select = LUGAR_SELECT_LIST } = {}
) {
  let query = supabase
    .from("lugares")
    .select(select)
    .eq("status", "ativo")
    .limit(limit);

  for (const [column, value] of Object.entries(eq)) {
    query = query.eq(column, value);
  }

  const full = await query;
  if (!full.error) {
    return { data: full.data ?? [], error: null };
  }

  console.warn("[lugares] select enxuto falhou:", full.error.message);

  const fullJoin = await supabase
    .from("lugares")
    .select(LUGAR_SELECT_FULL)
    .eq("status", "ativo")
    .limit(limit);

  if (!fullJoin.error) {
    return { data: fullJoin.data ?? [], error: null };
  }

  console.warn("[lugares] select com joins falhou, usando *:", fullJoin.error.message);

  let fallbackQuery = supabase
    .from("lugares")
    .select(LUGAR_SELECT_BASE)
    .eq("status", "ativo")
    .limit(limit);

  for (const [column, value] of Object.entries(eq)) {
    fallbackQuery = fallbackQuery.eq(column, value);
  }

  const basic = await fallbackQuery;
  return { data: basic.data ?? [], error: basic.error };
}

/**
 * Busca todos os lugares ativos em páginas (sem limite arbitrário de 100).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ select?: string, eq?: Record<string, string>, pageSize?: number }} [options]
 * @returns {Promise<{ data: object[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function queryAllLugaresAtivos(
  supabase,
  { select = LUGAR_SELECT_COUNTS, eq = {}, pageSize = LUGARES_PAGE_SIZE } = {}
) {
  const fetchPage = async (pageSelect, offset, limit) => {
    let query = supabase
      .from("lugares")
      .select(pageSelect)
      .eq("status", "ativo")
      .range(offset, offset + limit - 1);

    for (const [column, value] of Object.entries(eq)) {
      query = query.eq(column, value);
    }

    return query;
  };

  const paginate = async (pageSelect) => {
    /** @type {object[]} */
    const all = [];
    let offset = 0;

    while (true) {
      const page = await fetchPage(pageSelect, offset, pageSize);
      if (page.error) {
        return { data: all, error: page.error };
      }

      const batch = page.data ?? [];
      all.push(...batch);

      if (batch.length < pageSize) {
        return { data: all, error: null };
      }

      offset += pageSize;
    }
  };

  const primary = await paginate(select);
  if (!primary.error) {
    return primary;
  }

  console.warn("[lugares] select contagens falhou:", primary.error.message);

  if (select === LUGAR_SELECT_BASE) {
    return primary;
  }

  return paginate(LUGAR_SELECT_BASE);
}

/**
 * Lugares ativos cuja categoria efetiva (subcategoria canônica) corresponde ao filtro.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} categoria
 * @param {number} [limit=100]
 * @returns {Promise<{ data: object[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function queryLugaresForCategoria(supabase, categoria, limit = 100) {
  const alvo = String(categoria ?? "").trim();
  if (!alvo) {
    return { data: [], error: null };
  }

  const { data, error } = await queryAllLugaresAtivos(supabase);

  if (error) {
    return { data: [], error };
  }

  const lugares = normalizeLugaresTaxonomia(
    filterLugaresByCategoria(data ?? [], alvo).slice(0, limit)
  );

  return { data: lugares, error: null };
}

/**
 * Busca lugares ativos por lista de ids (ex.: populares por favoritos).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<string|number>} ids
 * @returns {Promise<{ data: object[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function queryLugaresByIds(supabase, ids) {
  const idList = ids.filter((id) => id !== null && id !== undefined);
  if (idList.length === 0) {
    return { data: [], error: null };
  }

  const full = await supabase
    .from("lugares")
    .select(LUGAR_SELECT_FULL)
    .in("id", idList)
    .eq("status", "ativo");

  if (!full.error) {
    return { data: full.data ?? [], error: null };
  }

  const basic = await supabase
    .from("lugares")
    .select(LUGAR_SELECT_BASE)
    .in("id", idList)
    .eq("status", "ativo");

  return { data: basic.data ?? [], error: basic.error };
}
