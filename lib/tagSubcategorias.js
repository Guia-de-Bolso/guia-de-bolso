/**
 * Filtros de tags por subcategoria (sem dependência de rotas).
 */

/**
 * @param {unknown} value
 * @returns {Array<{ categoria: string, nome: string }>}
 */
export function normalizeSubcategoriasJson(value) {
  if (!value) return [];
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const item of value) {
    const categoria = String(item?.categoria ?? "").trim();
    const nome = String(item?.nome ?? "").trim();
    if (!categoria || !nome) continue;

    const key = `${categoria}::${nome}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ categoria, nome });
  }

  return result;
}

/**
 * @param {Array<{ categoria: string, nome: string }>} subcategorias
 * @returns {string[]}
 */
export function deriveCategoriasFromSubcategorias(subcategorias) {
  const set = new Set();
  for (const item of normalizeSubcategoriasJson(subcategorias)) {
    set.add(item.categoria);
  }
  return [...set];
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeCategoriasJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

/**
 * @param {{ categorias?: string[]|null }} tag
 * @param {string} categoria
 * @returns {boolean}
 */
export function tagMatchesCategoria(tag, categoria) {
  const categorias = tag?.categorias;
  if (categorias === undefined || categorias === null) return true;
  if (!Array.isArray(categorias) || categorias.length === 0) return false;
  return categorias.includes(categoria);
}

/**
 * @param {{ subcategorias?: Array<{ categoria?: string, nome?: string }>|null, categorias?: string[]|null }} tag
 * @param {string} categoria
 * @param {string} subcategoria
 * @returns {boolean}
 */
export function tagMatchesSubcategoria(tag, categoria, subcategoria) {
  const cat = String(categoria ?? "").trim();
  const sub = String(subcategoria ?? "").trim();
  if (!cat || !sub) return false;

  const refs = normalizeSubcategoriasJson(tag?.subcategorias);
  if (refs.length > 0) {
    return refs.some((item) => item.categoria === cat && item.nome === sub);
  }

  return tagMatchesCategoria(tag, cat);
}

/**
 * @param {Array<Object>} [tags]
 * @param {string} categoria
 * @returns {Array<Object>}
 */
export function filterTagsByCategoria(tags, categoria) {
  return (tags ?? []).filter((tag) => tagMatchesCategoria(tag, categoria));
}

/**
 * @param {Array<Object>} [tags]
 * @param {string} categoria
 * @param {string} subcategoria
 * @returns {Array<Object>}
 */
export function filterTagsBySubcategoria(tags, categoria, subcategoria) {
  return (tags ?? []).filter((tag) => tagMatchesSubcategoria(tag, categoria, subcategoria));
}

/**
 * @param {string[]} [tagIds]
 * @param {Array<Object>} [tags]
 * @param {string} categoria
 * @returns {string[]}
 */
export function filterTagIdsByCategoria(tagIds, tags, categoria) {
  return (tagIds ?? []).filter((id) => {
    const tag = (tags ?? []).find((item) => String(item.id) === String(id));
    return tag && tagMatchesCategoria(tag, categoria);
  });
}

/**
 * @param {string[]} [tagIds]
 * @param {Array<Object>} [tags]
 * @param {string} categoria
 * @param {string} subcategoria
 * @returns {string[]}
 */
export function filterTagIdsBySubcategoria(tagIds, tags, categoria, subcategoria) {
  return (tagIds ?? []).filter((id) => {
    const tag = (tags ?? []).find((item) => String(item.id) === String(id));
    return tag && tagMatchesSubcategoria(tag, categoria, subcategoria);
  });
}

/**
 * Normaliza IDs de tags (string + únicos, ordem estável).
 * @param {Array<string|number>|null|undefined} tagIds
 * @returns {string[]}
 */
export function normalizeSelectedTagIds(tagIds) {
  const seen = new Set();
  const result = [];
  for (const raw of tagIds ?? []) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Alterna uma tag na seleção, respeitando o limite só entre tags compatíveis.
 * @param {Array<string|number>|null|undefined} currentIds
 * @param {string|number} tagId
 * @param {{
 *   tags?: Array<Object>,
 *   categoria?: string,
 *   subcategoria?: string,
 *   max?: number,
 *   match?: (tag: object, categoria: string, subcategoria: string) => boolean,
 * }} [options]
 * @returns {{ next: string[], limitReached: boolean }}
 */
export function toggleSelectedTagId(currentIds, tagId, options = {}) {
  const id = String(tagId ?? "").trim();
  const max = Number(options.max) > 0 ? Number(options.max) : 5;
  const normalized = normalizeSelectedTagIds(currentIds);

  if (!id) {
    return { next: normalized, limitReached: false };
  }

  if (normalized.includes(id)) {
    return {
      next: normalized.filter((item) => item !== id),
      limitReached: false,
    };
  }

  const tags = options.tags ?? [];
  const categoria = String(options.categoria ?? "").trim();
  const subcategoria = String(options.subcategoria ?? "").trim();
  const match =
    typeof options.match === "function"
      ? options.match
      : (tag, cat, sub) => tagMatchesSubcategoria(tag, cat, sub);

  const compatibleCount =
    categoria && subcategoria
      ? normalized.filter((selectedId) => {
          const tag = tags.find((item) => String(item.id) === selectedId);
          return tag && match(tag, categoria, subcategoria);
        }).length
      : normalized.length;

  if (compatibleCount >= max) {
    return { next: normalized, limitReached: true };
  }

  return { next: [...normalized, id], limitReached: false };
}
