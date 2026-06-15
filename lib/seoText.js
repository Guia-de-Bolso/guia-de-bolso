const DEFAULT_DESCRIPTION =
  "Guia oficial de Imbituba, SC — praias, trilhas, gastronomia, atrativos e busca com IA.";

/**
 * @param {string} [text]
 * @param {number} [max=160]
 * @returns {string}
 */
export function truncateMetaDescription(text, max = 160) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return DEFAULT_DESCRIPTION;
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}
