/**
 * Textos e placeholders genéricos da landing — sem identificar parceiros reais.
 */

/** @param {number} [count] */
export function formatParceirosCadastrados(count) {
  if (!count || count <= 0) return null;
  const label = count === 1 ? "parceiro cadastrado" : "parceiros cadastrados";
  return `${count} ${label}`;
}

/** @param {number} [count] */
export function formatAvaliacoesAprovadas(count) {
  if (!count || count <= 0) return null;
  const label = count === 1 ? "avaliação aprovada" : "avaliações aprovadas";
  return `${count} ${label}`;
}

/**
 * Métricas públicas da landing: só números reais (nunca 0 ou traço).
 * @param {{ totalLugares?: number, parceirosCount?: number, avaliacoesCount?: number, categoriasComLugares?: number }|null|undefined} stats
 * @returns {Array<{ label: string, value: number }>}
 */
export function socialProofMetrics(stats) {
  /** @type {Array<{ label: string, value: number }>} */
  const items = [];
  if (stats?.totalLugares > 0) {
    items.push({ label: "Lugares verificados", value: stats.totalLugares });
  }
  if (stats?.parceirosCount > 0) {
    items.push({ label: "Parceiros oficiais", value: stats.parceirosCount });
  }
  if (stats?.avaliacoesCount > 0) {
    items.push({ label: "Avaliações aprovadas", value: stats.avaliacoesCount });
  } else if (stats?.categoriasComLugares > 0) {
    items.push({ label: "Categorias no guia", value: stats.categoriasComLugares });
  }
  return items.slice(0, 3);
}

/** @param {number} [count] */
export function formatParceirosNoGuia(count) {
  if (!count || count <= 0) return null;
  const label = count === 1 ? "parceiro no guia" : "parceiros no guia";
  return `${count} ${label}`;
}

/** Placeholder anônimo para mockups de telefone na landing. */
export const LANDING_MOCK_PARTNER_PLACE = {
  id: "landing-mock-partner",
  nome: "Estabelecimento parceiro",
  categoria: "Gastronomia",
  capa: null,
  descricao:
    "Perfil completo com fotos, horário, mapa e links — tudo que o turista precisa antes de ir.",
  ehParceiro: true,
};

/** Depoimentos B2B anônimos — apenas na landing. */
export const LANDING_GENERIC_BUSINESS_TESTIMONIALS = [
  {
    quote:
      "Passamos a aparecer para quem chega na cidade sem conhecer nada. O perfil completo faz diferença — turista vê horário e cardápio antes de sair.",
    name: "Anunciante local",
    role: "Estabelecimento · Imbituba",
  },
  {
    quote:
      "Ter badge de parceiro e estar no carrossel da home nos coloca na frente quando o turista abre o app pela primeira vez.",
    name: "Estabelecimento parceiro",
    role: "Praia do Rosa · Imbituba",
  },
  {
    quote:
      "O QR no balcão vira canal direto: o cliente escaneia e cai no perfil com avaliações e botão pro Maps.",
    name: "Comércio local",
    role: "Centro · Imbituba",
  },
];
