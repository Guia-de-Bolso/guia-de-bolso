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
