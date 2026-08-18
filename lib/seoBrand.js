/** Marca pública e desambiguação vs Guiabolso (finanças). */

export const SITE_NAME_SHORT = "Guia de Bolso";

/** Nome completo para applicationName, rodapés e snippets. */
export const SITE_BRAND_NAME = "Guia de Bolso Imbituba";

export const SITE_DEFAULT_DESCRIPTION =
  "Guia turístico oficial de Imbituba, SC — praias, trilhas, gastronomia, atrativos e busca com IA. App grátis na App Store e no Google Play. Sem relação com Guiabolso (finanças).";

/** FAQ padrão injetada em artigos /guia quando ainda não existir equivalente. */
export const GUIA_FINANCE_DISAMBIGUATION_FAQ = {
  question: "Guia de Bolso é o Guiabolso de finanças?",
  answer:
    "Não. O Guia de Bolso Imbituba é um app e site de turismo em Imbituba, Santa Catarina. Não tem relação com produtos financeiros nem com a empresa Guiabolso.",
};

/**
 * Garante FAQ de desambiguação no início da lista.
 * @param {import('./guiaCatalog.js').GuiaFaq[]|undefined} customFaq
 * @returns {import('./guiaCatalog.js').GuiaFaq[]}
 */
export function mergeGuiaFaq(customFaq = []) {
  const list = Array.isArray(customFaq) ? [...customFaq] : [];
  const hasDisambiguation = list.some((item) => {
    const q = item.question.toLowerCase();
    return q.includes("guiabolso") || q.includes("finanç") || q.includes("financ");
  });
  if (hasDisambiguation) return list;
  return [GUIA_FINANCE_DISAMBIGUATION_FAQ, ...list];
}
