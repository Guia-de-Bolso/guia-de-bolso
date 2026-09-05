/**
 * Categoria efetiva do lugar: alinha `lugares.categoria` com subcategoria canônica.
 * Subcategorias exclusivas de uma categoria (ex.: Pubs → Noite) prevalecem sobre `categoria` incorreta no banco.
 */

/** Subcategorias que existem em apenas uma categoria no catálogo. */
const SUBCATEGORIA_CATEGORIA_UNICA = {
  Pubs: "Noite",
  Baladas: "Noite",
  Praias: "Natureza",
  Trilhas: "Natureza",
  Cachoeiras: "Natureza",
  Mirantes: "Natureza",
  Lagoas: "Natureza",
  Parques: "Natureza",
  "Piscinas naturais": "Natureza",
  Dunas: "Natureza",
  Ilhas: "Natureza",
  Restaurantes: "Gastronomia",
  Cafés: "Gastronomia",
  Padarias: "Gastronomia",
  Sorveterias: "Gastronomia",
  "Empório Gourmet": "Gastronomia",
  Farmácias: "Serviços",
  Mercados: "Serviços",
  Mecânicos: "Serviços",
  Salões: "Serviços",
  Saúde: "Serviços",
  Museus: "Cultura",
  Monumentos: "Cultura",
  "Igrejas e templos": "Cultura",
  Eventos: "Cultura",
  "Esportes radicais": "Aventura",
  "Passeios de barco": "Aventura",
  Escalada: "Aventura",
  Ciclismo: "Aventura",
  Spa: "Bem-estar",
  Yoga: "Bem-estar",
  Terapias: "Bem-estar",
};

/**
 * @param {{ categoria?: string|null, subcategoria?: string|null }} lugar
 * @returns {string}
 */
export function getEffectiveCategoria(lugar) {
  const stored = String(lugar?.categoria ?? "").trim();
  const sub = String(lugar?.subcategoria ?? "").trim();

  if (sub && SUBCATEGORIA_CATEGORIA_UNICA[sub]) {
    return SUBCATEGORIA_CATEGORIA_UNICA[sub];
  }

  return stored;
}

/**
 * @param {{ categoria?: string|null, subcategoria?: string|null }} lugar
 * @param {string} categoria
 * @returns {boolean}
 */
export function lugarMatchesCategoria(lugar, categoria) {
  const alvo = String(categoria ?? "").trim();
  if (!alvo) return true;
  return getEffectiveCategoria(lugar) === alvo;
}

/**
 * Spec para pré-filtro no PostgREST equivalente a `lugarMatchesCategoria`.
 * @param {string} categoria
 * @returns {{ categoria: string, uniqueSubsForCategoria: string[], allUniqueSubs: string[] }}
 */
export function getCategoriaQuerySpec(categoria) {
  const alvo = String(categoria ?? "").trim();
  /** @type {string[]} */
  const uniqueSubsForCategoria = [];
  /** @type {string[]} */
  const allUniqueSubs = [];

  for (const [sub, cat] of Object.entries(SUBCATEGORIA_CATEGORIA_UNICA)) {
    allUniqueSubs.push(sub);
    if (cat === alvo) uniqueSubsForCategoria.push(sub);
  }

  return { categoria: alvo, uniqueSubsForCategoria, allUniqueSubs };
}

/**
 * Mesma semântica de `lugarMatchesCategoria`, expressa com o spec do pré-filtro SQL.
 * @param {{ categoria?: string|null, subcategoria?: string|null }} lugar
 * @param {{ categoria: string, uniqueSubsForCategoria: string[], allUniqueSubs: string[] }} spec
 * @returns {boolean}
 */
export function lugarMatchesCategoriaQuerySpec(lugar, spec) {
  if (!spec?.categoria) return true;
  const sub = String(lugar?.subcategoria ?? "").trim();
  if (spec.uniqueSubsForCategoria.includes(sub)) return true;
  if (spec.allUniqueSubs.includes(sub)) return false;
  return String(lugar?.categoria ?? "").trim() === spec.categoria;
}

/**
 * @param {string} value
 * @returns {string}
 */
function quotePostgrestValue(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

/**
 * Cláusula `.or()` do PostgREST para categoria efetiva (sub exclusiva ou coluna categoria).
 * @param {string} categoria
 * @returns {string|null}
 */
export function buildCategoriaMatchOrFilter(categoria) {
  const spec = getCategoriaQuerySpec(categoria);
  if (!spec.categoria) return null;

  const catEq = `categoria.eq.${quotePostgrestValue(spec.categoria)}`;
  /** @type {string[]} */
  const parts = [];

  if (spec.uniqueSubsForCategoria.length > 0) {
    parts.push(
      `subcategoria.in.(${spec.uniqueSubsForCategoria.map(quotePostgrestValue).join(",")})`
    );
  }

  parts.push(`and(${catEq},subcategoria.is.null)`);

  if (spec.allUniqueSubs.length > 0) {
    parts.push(
      `and(${catEq},subcategoria.not.in.(${spec.allUniqueSubs.map(quotePostgrestValue).join(",")}))`
    );
  } else {
    parts.push(catEq);
  }

  return parts.join(",");
}

/**
 * @param {Array<object>} lugares
 * @param {string} categoria
 * @returns {Array<object>}
 */
export function filterLugaresByCategoria(lugares, categoria) {
  return (lugares ?? []).filter((lugar) => lugarMatchesCategoria(lugar, categoria));
}

/**
 * @param {object} lugar
 * @returns {object}
 */
export function normalizeLugarTaxonomia(lugar) {
  if (!lugar || typeof lugar !== "object") return lugar;

  const effective = getEffectiveCategoria(lugar);
  if (!effective || effective === lugar.categoria) return lugar;

  return { ...lugar, categoria: effective };
}

/**
 * @param {Array<object>} lugares
 * @returns {Array<object>}
 */
export function normalizeLugaresTaxonomia(lugares) {
  return (lugares ?? []).map(normalizeLugarTaxonomia);
}
