import {
  buildCategoriaMatchOrFilter,
  filterLugaresByCategoria,
  normalizeLugaresTaxonomia,
} from "./lugarTaxonomia.js";
import { applyPublicLugarFilters } from "./publicCatalog.js";

/** Select completo com joins usados na home e listagens. */
export const LUGAR_SELECT_FULL = "*, localizacoes(*), lugares_tags(tags(*))";

/** Select enxuto para cards e listagens (menos payload). */
export const LUGAR_SELECT_LIST =
  "id, nome, slug, descricao, categoria, subcategoria, imagem_url, fotos, video_url, status, eh_parceiro, parceiro_inicio_em, perfil_promo_ate, conteudo_curadoria, horarios, mostrar_horarios, created_at, localizacoes(latitude, longitude, endereco_completo), lugares_tags(tags(id, nome, icone))";

/** Select mínimo para ranking + contexto IA em `/api/buscar` (sem localizacoes). */
export const LUGAR_SELECT_BUSCA_CONTEXT =
  "id, nome, descricao, categoria, subcategoria, horarios, mostrar_horarios, eh_parceiro, conteudo_curadoria, lugares_tags(tags(nome))";

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
  let query = applyPublicLugarFilters(
    supabase.from("lugares").select(select)
  ).limit(limit);

  for (const [column, value] of Object.entries(eq)) {
    query = query.eq(column, value);
  }

  const full = await query;
  if (!full.error) {
    return { data: full.data ?? [], error: null };
  }

  console.warn("[lugares] select enxuto falhou:", full.error.message);

  const fullJoin = await applyPublicLugarFilters(
    supabase.from("lugares").select(LUGAR_SELECT_FULL)
  ).limit(limit);

  if (!fullJoin.error) {
    return { data: fullJoin.data ?? [], error: null };
  }

  console.warn("[lugares] select com joins falhou, usando *:", fullJoin.error.message);

  let fallbackQuery = applyPublicLugarFilters(
    supabase.from("lugares").select(LUGAR_SELECT_BASE)
  ).limit(limit);

  for (const [column, value] of Object.entries(eq)) {
    fallbackQuery = fallbackQuery.eq(column, value);
  }

  const basic = await fallbackQuery;
  return { data: basic.data ?? [], error: basic.error };
}

/**
 * Busca todos os lugares ativos em páginas (sem limite arbitrário de 100).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ select?: string, eq?: Record<string, string>, or?: string|null, pageSize?: number }} [options]
 * @returns {Promise<{ data: object[], error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function queryAllLugaresAtivos(
  supabase,
  { select = LUGAR_SELECT_COUNTS, eq = {}, or = null, pageSize = LUGARES_PAGE_SIZE } = {}
) {
  const fetchPage = async (pageSelect, offset, limit) => {
    let query = applyPublicLugarFilters(supabase.from("lugares").select(pageSelect));

    for (const [column, value] of Object.entries(eq)) {
      query = query.eq(column, value);
    }

    if (or) {
      query = query.or(or);
    }

    return query.range(offset, offset + limit - 1);
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

  console.warn("[lugares] select paginado falhou:", primary.error.message);

  if (or || select === LUGAR_SELECT_BASE) {
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

  const orFilter = buildCategoriaMatchOrFilter(alvo);
  let { data, error } = await queryAllLugaresAtivos(supabase, {
    select: LUGAR_SELECT_LIST,
    or: orFilter,
  });

  if (error && orFilter) {
    console.warn("[lugares] pré-filtro de categoria falhou, varrendo catálogo:", error.message);
    ({ data, error } = await queryAllLugaresAtivos(supabase, {
      select: LUGAR_SELECT_LIST,
    }));
  }

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

  const full = await applyPublicLugarFilters(
    supabase.from("lugares").select(LUGAR_SELECT_LIST).in("id", idList)
  );

  if (!full.error) {
    return { data: full.data ?? [], error: null };
  }

  const basic = await applyPublicLugarFilters(
    supabase.from("lugares").select(LUGAR_SELECT_BASE).in("id", idList)
  );

  return { data: basic.data ?? [], error: basic.error };
}

/**
 * Reordena lugares na sequência dos IDs retornados pela IA (PostgREST não garante ordem do `.in()`).
 * @param {object[]} lugares
 * @param {Array<string|number>} ids
 * @returns {object[]}
 */
export function orderLugaresByIds(lugares, ids) {
  const byId = new Map((lugares ?? []).map((lugar) => [String(lugar.id), lugar]));
  return (ids ?? []).map((id) => byId.get(String(id))).filter(Boolean);
}
