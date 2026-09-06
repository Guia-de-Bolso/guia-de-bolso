/** @typedef {{ nome: string, icone: string, categoriasTag: string[] }} CategoriaAtrativo */

/** @type {CategoriaAtrativo[]} */
export const CATEGORIAS_ATRATIVO = [
  { nome: "Trilha", icone: "🥾", categoriasTag: ["Natureza", "Aventura"] },
  { nome: "Passeio urbano", icone: "🏙️", categoriasTag: ["Cultura", "Serviços", "Bem-estar"] },
  { nome: "Roteiro de praias", icone: "🏖️", categoriasTag: ["Natureza"] },
  { nome: "Cultural / histórico", icone: "🏛️", categoriasTag: ["Cultura"] },
  { nome: "Gastronômico", icone: "🍽️", categoriasTag: ["Gastronomia"] },
  { nome: "Mirantes e panorâmicos", icone: "🌄", categoriasTag: ["Natureza", "Aventura"] },
];

export const CATEGORIA_ATRATIVO_PADRAO = CATEGORIAS_ATRATIVO[0].nome;

export const MAX_TAGS_ATRATIVO = 5;

/** Tipos previstos no produto, sem roteiro publicado hoje — ficam fora do filtro da aba. */
export const CATEGORIAS_ATRATIVO_RESERVADAS = new Set([
  "Passeio urbano",
  "Cultural / histórico",
  "Gastronômico",
]);

/**
 * Normaliza texto de categoria para uma opção válida do catálogo.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function normalizeCategoriaAtrativo(value) {
  const texto = String(value || "").trim();
  if (!texto) return CATEGORIA_ATRATIVO_PADRAO;

  const found = CATEGORIAS_ATRATIVO.find(
    (item) => item.nome.toLowerCase() === texto.toLowerCase()
  );
  return found?.nome ?? CATEGORIA_ATRATIVO_PADRAO;
}

/**
 * Metadados visuais da categoria (ícone + label).
 * @param {string|null|undefined} value
 * @returns {CategoriaAtrativo}
 */
export function getCategoriaAtrativoMeta(value) {
  const nome = normalizeCategoriaAtrativo(value);
  return CATEGORIAS_ATRATIVO.find((item) => item.nome === nome) ?? CATEGORIAS_ATRATIVO[0];
}

/**
 * Label formatado com ícone para chips e cabeçalhos.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatCategoriaAtrativoLabel(value) {
  const meta = getCategoriaAtrativoMeta(value);
  return `${meta.icone} ${meta.nome}`;
}

/**
 * Tipos que realmente aparecem no catálogo (só o que tem pelo menos um roteiro).
 * @param {Array<{ categoria?: string|null }>} rotas
 * @returns {CategoriaAtrativo[]}
 */
export function listCategoriasAtrativoEmUso(rotas) {
  const nomes = new Set(
    (rotas ?? []).map((item) => normalizeCategoriaAtrativo(item?.categoria))
  );
  return CATEGORIAS_ATRATIVO.filter((item) => nomes.has(item.nome));
}
