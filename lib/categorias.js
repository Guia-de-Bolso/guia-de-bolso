/**
 * Catálogo de categorias do Guia de Bolso (Explorar + listagens).
 */

/** @typedef {Object} CategoriaExplore
 * @property {string} nome
 * @property {string} icone
 * @property {string} descricao
 * @property {string} descricaoCurta
 * @property {string} gradient - Classes Tailwind `from-* to-*`
 * @property {string} chipClass - Badge na listagem
 * @property {string} [destaque] - Texto opcional no card em destaque
 */

/** @type {CategoriaExplore[]} */
export const CATEGORIAS_EXPLORE = [
  {
    nome: "Natureza",
    icone: "🌿",
    descricao: "Praias, trilhas, lagoas e paisagens naturais",
    descricaoCurta: "Praias e trilhas",
    gradient: "from-emerald-200 via-teal-100 to-[#d4ede8]",
    chipClass: "bg-[#d4ede8] text-[#1a4a3a]",
  },
  {
    nome: "Gastronomia",
    icone: "🍽️",
    descricao: "Restaurantes, cafés e sabores locais",
    descricaoCurta: "Comer bem",
    gradient: "from-amber-100 via-orange-50 to-[#f0e4d4]",
    chipClass: "bg-[#f0e4d4] text-[#6b5344]",
  },
  {
    nome: "Noite",
    icone: "🌙",
    descricao: "Bares, música e vida noturna",
    descricaoCurta: "Vida noturna",
    gradient: "from-indigo-200 via-violet-100 to-[#e4d4f0]",
    chipClass: "bg-[#e4d4f0] text-[#5c4a6e]",
  },
  {
    nome: "Serviços",
    icone: "🔧",
    descricao: "Farmácias, mecânicos e utilidades",
    descricaoCurta: "Dia a dia",
    gradient: "from-sky-100 via-blue-50 to-[#c5dff5]",
    chipClass: "bg-[#c5dff5] text-[#2a5a7a]",
  },
  {
    nome: "Cultura",
    icone: "🏛️",
    descricao: "História, arte e eventos locais",
    descricaoCurta: "Cultura local",
    gradient: "from-purple-100 via-fuchsia-50 to-purple-50",
    chipClass: "bg-purple-100 text-purple-800",
  },
  {
    nome: "Aventura",
    icone: "🧗",
    descricao: "Esportes e experiências ao ar livre",
    descricaoCurta: "Adrenalina",
    gradient: "from-orange-100 via-red-50 to-orange-50",
    chipClass: "bg-orange-100 text-orange-800",
  },
  {
    nome: "Bem-estar",
    icone: "🧘",
    descricao: "Spas, yoga e momentos de calma",
    descricaoCurta: "Relaxar",
    gradient: "from-pink-100 via-rose-50 to-pink-50",
    chipClass: "bg-pink-100 text-pink-800",
  },
];

/** Categorias retiradas do produto (legado no banco / links antigos). */
export const CATEGORIAS_REMOVIDAS = new Set(["Hospedagem", "Compras"]);

/** @deprecated Use CATEGORIAS_REMOVIDAS. Mantido para imports antigos. */
export const CATEGORIAS_OCULTAS = CATEGORIAS_REMOVIDAS;

/** Atalhos de intenção na tela Explorar. */
export const EXPLORAR_MOOD_CHIPS = [
  { id: "praia", label: "Praia", emoji: "🏖️", categoria: "Natureza" },
  { id: "comer", label: "Comer", emoji: "🍽️", categoria: "Gastronomia" },
  { id: "trilha", label: "Trilha", emoji: "🥾", categoria: "Natureza" },
  { id: "noite", label: "Noite", emoji: "🌙", categoria: "Noite" },
  { id: "familia", label: "Família", emoji: "👨‍👩‍👧", href: "/?q=lugares+bom+para+família" },
  { id: "romantico", label: "Romântico", emoji: "💑", href: "/?q=lugar+romântico" },
];

/**
 * @param {string} nome
 * @returns {boolean}
 */
export function isCategoriaOculta(nome) {
  return CATEGORIAS_REMOVIDAS.has(nome);
}

/**
 * Categorias exibidas no app, SEO e marketing.
 * @returns {CategoriaExplore[]}
 */
export function getCategoriasVisiveis() {
  return CATEGORIAS_EXPLORE.filter((item) => !isCategoriaOculta(item.nome));
}

/**
 * @param {string} nome
 * @returns {string}
 */
export function getCategoriaHref(nome) {
  return `/categoria/${encodeURIComponent(nome)}`;
}

/**
 * @param {string} nome
 * @returns {CategoriaExplore|undefined}
 */
export function getCategoriaByNome(nome) {
  if (isCategoriaOculta(nome)) return undefined;
  return CATEGORIAS_EXPLORE.find((item) => item.nome === nome);
}

/**
 * Ordena categorias: mais lugares primeiro; vazias por último.
 * @param {CategoriaExplore[]} categorias
 * @param {Record<string, number>} counts
 * @returns {CategoriaExplore[]}
 */
export function sortCategoriasPorContagem(categorias, counts) {
  return [...categorias].sort((a, b) => {
    const ca = counts[a.nome] || 0;
    const cb = counts[b.nome] || 0;
    if (cb !== ca) return cb - ca;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

/**
 * Top N categorias com pelo menos um lugar.
 * @param {CategoriaExplore[]} categorias
 * @param {Record<string, number>} counts
 * @param {number} [limit=3]
 * @returns {CategoriaExplore[]}
 */
export function getCategoriasEmDestaque(categorias, counts, limit = 3) {
  return sortCategoriasPorContagem(categorias, counts)
    .filter((item) => (counts[item.nome] || 0) > 0)
    .slice(0, limit);
}
