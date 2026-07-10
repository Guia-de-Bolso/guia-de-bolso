/** Tipos de comida para filtro quando o interesse Gastronomia está ativo (tags em `tags`). */
export const ROTEIRO_GASTRONOMIA_TIPOS = [
  { label: "Pizza", emoji: "🍕", tag: "Pizza" },
  { label: "Sushi", emoji: "🍣", tag: "Sushi" },
  { label: "Hambúrguer", emoji: "🍔", tag: "Hambúrguer" },
  { label: "Churrasco", emoji: "🥩", tag: "Churrasco" },
  { label: "Massas", emoji: "🍝", tag: "Massas" },
  { label: "Cozinha italiana", emoji: "🇮🇹", tag: "Cozinha italiana" },
  { label: "Cozinha japonesa", emoji: "🇯🇵", tag: "Cozinha japonesa" },
  { label: "Cozinha mexicana", emoji: "🌯", tag: "Cozinha mexicana" },
  { label: "Cozinha árabe", emoji: "🧆", tag: "Cozinha árabe" },
  { label: "Cozinha chinesa", emoji: "🥡", tag: "Cozinha chinesa" },
  { label: "Rodízio", emoji: "🥩", tag: "Rodízio" },
  { label: "Frutos do mar", emoji: "🦐", tag: "Frutos do mar" },
  { label: "Prato feito", emoji: "🍱", tag: "Prato feito" },
  { label: "Por kilo", emoji: "⚖️", tag: "Por kilo" },
];

const TAGS_GASTRONOMIA = new Set(ROTEIRO_GASTRONOMIA_TIPOS.map((item) => item.tag));

/**
 * @param {string[]} [interesses]
 * @returns {boolean}
 */
export function isGastronomiaInteresseAtivo(interesses) {
  return (interesses ?? []).some(
    (item) => String(item ?? "").trim().toLowerCase() === "gastronomia"
  );
}

/**
 * @param {string} tag
 * @returns {boolean}
 */
export function isRoteiroGastronomiaTag(tag) {
  return TAGS_GASTRONOMIA.has(String(tag ?? "").trim());
}
