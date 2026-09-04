/**
 * Quebra texto editorial em parágrafos (linhas em branco no cadastro).
 * @module lib/proseParagraphs
 */

/**
 * @param {unknown} texto
 * @returns {string[]}
 */
export function splitProseParagraphs(texto) {
  const t = String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!t) return [];
  return t
    .split(/\n[ \t]*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}
