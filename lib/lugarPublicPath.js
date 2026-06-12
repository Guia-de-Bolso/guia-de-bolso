/** UUID v4 (ids de lugares no Supabase). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {string} [value]
 * @returns {boolean}
 */
export function isLugarUuidParam(value) {
  return Boolean(value && UUID_RE.test(String(value).trim()));
}

/**
 * ID numérico legado na URL (`/lugares/42`).
 * @param {string} [value]
 * @returns {boolean}
 */
export function isNumericLugarIdParam(value) {
  return /^\d+$/.test(String(value || "").trim());
}

/**
 * Caminho público canônico do detalhe do lugar (prefere slug).
 * @param {{ id?: string, slug?: string|null }} lugar
 * @param {{ from?: string }} [options]
 * @returns {string}
 */
export function getLugarPublicPath(lugar, options = {}) {
  const slug = lugar?.slug?.trim();
  let path = "/";

  if (slug) {
    path = `/lugares/${encodeURIComponent(slug)}`;
  } else {
    const id = lugar?.id;
    if (id) path = `/lugares/${id}`;
  }

  const from = String(options.from ?? "").trim();
  if (from.startsWith("/") && !from.startsWith("//")) {
    return `${path}?from=${encodeURIComponent(from)}`;
  }

  return path;
}

/**
 * @param {{ id?: string, slug?: string|null }} lugar
 * @param {string} [origin]
 * @returns {string}
 */
export function getLugarPublicUrl(lugar, origin) {
  const base = String(origin || "").replace(/\/$/, "");
  return `${base}${getLugarPublicPath(lugar)}`;
}

/**
 * Resolve lugar ativo por segmento de rota (`slug` ou UUID legado).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} param
 * @param {string} [select]
 */
export async function fetchLugarAtivoByRouteParam(
  supabase,
  param,
  select = "id, nome, slug, descricao, descricao_longa, categoria, subcategoria, imagem_url, fotos, status, created_at"
) {
  const key = String(param || "").trim();
  if (!key) {
    return { data: null, error: null };
  }

  const queryAtivo = () =>
    supabase.from("lugares").select(select).eq("status", "ativo");

  if (isLugarUuidParam(key)) {
    return queryAtivo().eq("id", key).maybeSingle();
  }

  const bySlug = await queryAtivo().eq("slug", key.toLowerCase()).maybeSingle();
  if (bySlug.error) {
    return bySlug;
  }
  if (bySlug.data) {
    return bySlug;
  }

  if (isNumericLugarIdParam(key)) {
    return queryAtivo().eq("id", key).maybeSingle();
  }

  return { data: null, error: null };
}
