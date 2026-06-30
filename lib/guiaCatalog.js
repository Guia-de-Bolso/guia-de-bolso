import { getCategoriaHref, getCategoriasVisiveis } from "./categorias.js";

/**
 * @typedef {Object} GuiaLink
 * @property {string} href
 * @property {string} label
 */

/**
 * @typedef {Object} GuiaSection
 * @property {string} heading
 * @property {string[]} paragraphs
 * @property {GuiaLink[]} [links]
 */

/**
 * @typedef {Object} GuiaFaq
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef {Object} GuiaGuide
 * @property {string} slug
 * @property {string} title
 * @property {string} metaTitle
 * @property {string} metaDescription
 * @property {string} intro
 * @property {GuiaSection[]} sections
 * @property {GuiaFaq[]} [faq]
 * @property {GuiaLink[]} relatedGuides
 * @property {GuiaLink} ctaPrimary
 * @property {GuiaLink} [ctaSecondary]
 * @property {string} [listPlacesCategory] - Busca lugares desta categoria no Supabase
 * @property {number} [listPlacesLimit]
 * @property {number} sitemapPriority
 */

/** @type {GuiaGuide[]} */
export const GUIA_GUIDES = [
  {
    slug: "o-que-fazer-em-imbituba",
    title: "O que fazer em Imbituba, SC",
    metaTitle: "O que fazer em Imbituba — guia completo 2026",
    metaDescription:
      "Praias, Praia do Rosa, gastronomia, trilhas e roteiros em Imbituba, SC. Curadoria do Guia de Bolso — turismo local com lugares verificados.",
    intro:
      "Imbituba é um dos destinos mais procurados do litoral sul catarinense — entre praias urbanas, a região da Praia do Rosa, surf, gastronomia e natureza. Este guia resume o essencial; no Guia de Bolso você encontra lugares verificados, horários e atrativos atualizados.",
    sections: [
      {
        heading: "Melhores praias",
        paragraphs: [
          "A Praia da Vila fica no centro e é ótima para um passeio rápido. A região da Praia do Rosa e Garopaba (vizinha) concentra paisagens e surf de nível mundial. Ibiraquera e outras praias da cidade oferecem águas calmas e trilhas.",
        ],
        links: [
          { href: "/guia/melhores-praias-imbituba", label: "Ver melhores praias" },
          { href: getCategoriaHref("Natureza"), label: "Natureza em Imbituba" },
        ],
      },
      {
        heading: "Gastronomia e onde comer",
        paragraphs: [
          "De frutos do mar a cafés e bares, Imbituba tem oferta para todos os estilos. Confira horários ao vivo e avaliações moderadas na listagem do guia.",
        ],
        links: [
          { href: "/guia/onde-comer-em-imbituba", label: "Onde comer em Imbituba" },
          { href: getCategoriaHref("Gastronomia"), label: "Restaurantes no guia" },
        ],
      },
      {
        heading: "Natureza, trilhas e aventura",
        paragraphs: [
          "Trilhas, mirantes e experiências ao ar livre aparecem nas categorias Natureza e Aventura. Na temporada, a observação de baleias é um dos principais atrativos da região.",
        ],
        links: [
          { href: getCategoriaHref("Natureza"), label: "Natureza" },
          { href: getCategoriaHref("Aventura"), label: "Aventura" },
        ],
      },
      {
        heading: "Roteiro sugerido de 3 dias",
        paragraphs: [
          "Dia 1 — Praias: Praia da Vila + região do Rosa (pôr do sol). Dia 2 — Gastronomia e centro: almoço local, passeio e noite leve. Dia 3 — Natureza: trilha ou praia tranquila + café da manhã.",
        ],
        links: [{ href: "/guia/roteiro-3-dias-imbituba", label: "Roteiro detalhado de 3 dias" }],
      },
      {
        heading: "Explore por categoria",
        paragraphs: ["Navegue por todos os tipos de experiência em Imbituba no guia."],
        links: getCategoriasVisiveis().map((cat) => ({
          href: getCategoriaHref(cat.nome),
          label: `${cat.icone} ${cat.nome}`,
        })),
      },
    ],
    faq: [
      {
        question: "Guia de Bolso é o Guiabolso de finanças?",
        answer:
          "Não. Somos um app e site de turismo em Imbituba, sem relação com produtos financeiros.",
      },
      {
        question: "Como achar lugares atualizados?",
        answer:
          "Abra o guia, filtre por categoria ou busque por nome — cada lugar tem mapa, horário e link para navegação.",
      },
    ],
    relatedGuides: [
      { href: "/guia/melhores-praias-imbituba", label: "Melhores praias" },
      { href: "/guia/praia-do-rosa", label: "Praia do Rosa" },
      { href: "/guia/onde-comer-em-imbituba", label: "Onde comer" },
      { href: "/guia/roteiro-3-dias-imbituba", label: "Roteiro de 3 dias" },
      { href: "/guia/melhores-cafes-imbituba", label: "Melhores cafés" },
      { href: "/guia/lugares-escondidos-imbituba", label: "Lugares escondidos" },
      { href: "/guia/praia-da-vila-imbituba", label: "Praia da Vila" },
    ],
    ctaPrimary: { href: "/categorias", label: "Explorar lugares" },
    ctaSecondary: { href: "/imbituba", label: "Sobre Imbituba" },
    sitemapPriority: 0.9,
  },
  {
    slug: "melhores-praias-imbituba",
    title: "Melhores praias de Imbituba",
    metaTitle: "Melhores praias de Imbituba, SC — guia 2026",
    metaDescription:
      "Praia da Vila, Ibiraquera, Rosa e mais: compare praias de Imbituba com dicas de acesso, surf e família. Guia de Bolso Imbituba.",
    intro:
      "O litoral de Imbituba combina praias urbanas, vilas de pescadores e paisagens preservadas. Este guia ajuda a escolher a praia certa para cada dia — e no app você vê distância, horários e como chegar.",
    sections: [
      {
        heading: "Praia da Vila",
        paragraphs: [
          "A praia mais central da cidade, com boa infraestrutura e fácil acesso a serviços. Ideal para quem está hospedado em Imbituba e quer um passeio sem longos deslocamentos.",
        ],
      },
      {
        heading: "Ibiraquera e lagoa",
        paragraphs: [
          "Ambiente mais tranquilo, com lagoa e mar próximos — muito procurado por famílias e por quem busca kitesurf e stand-up paddle em dias de vento.",
        ],
      },
      {
        heading: "Região da Praia do Rosa",
        paragraphs: [
          "Embora muita gente associe o Rosa a Garopaba, a região faz parte do roteiro clássico de quem visita Imbituba. Surf, mirantes e pôr do sol fazem parte da experiência.",
        ],
        links: [{ href: "/guia/praia-do-rosa", label: "Guia completo da Praia do Rosa" }],
      },
      {
        heading: "Como escolher",
        paragraphs: [
          "Dia de surf e vento: Rosa e Ibiraquera. Dia de passeio rápido: Praia da Vila. Dia de natureza: combine praia com trilha leve na categoria Natureza do guia.",
        ],
      },
    ],
    faq: [
      {
        question: "Qual a melhor praia para crianças em Imbituba?",
        answer:
          "Ibiraquera e trechos mais calmos da Praia da Vila costumam ser boas opções; confira condições do mar no dia no guia.",
      },
    ],
    relatedGuides: [
      { href: "/guia/praia-do-rosa", label: "Praia do Rosa" },
      { href: "/guia/o-que-fazer-em-imbituba", label: "O que fazer em Imbituba" },
    ],
    ctaPrimary: { href: getCategoriaHref("Natureza"), label: "Ver praias no guia" },
    ctaSecondary: { href: "/categorias", label: "Todas as categorias" },
    listPlacesCategory: "Natureza",
    listPlacesLimit: 8,
    sitemapPriority: 0.88,
  },
  {
    slug: "praia-do-rosa",
    title: "Guia completo da Praia do Rosa",
    metaTitle: "Praia do Rosa — guia de turismo e dicas 2026",
    metaDescription:
      "Surf, pôr do sol e o que fazer na Praia do Rosa (região de Imbituba/Garopaba). Roteiros no Guia de Bolso.",
    intro:
      "A Praia do Rosa é um dos cartões-postais do litoral sul de Santa Catarina — ondas fortes, falésias, gastronomia e uma vila charmosa. Muitos visitantes de Imbituba incluem o Rosa no roteiro; aqui está o essencial para planejar.",
    sections: [
      {
        heading: "Surf e natureza",
        paragraphs: [
          "O Rosa é referência mundial em surf. Mesmo sem prancha, vale caminhar pela areia, observar as ondas e respeitar as regras de preservação da área.",
        ],
      },
      {
        heading: "Pôr do sol e mirantes",
        paragraphs: [
          "Reserve o fim da tarde para o pôr do sol — um dos rituais mais famosos da região. Chegue com antecedência em alta temporada.",
        ],
      },
      {
        heading: "Onde comer perto do Rosa",
        paragraphs: [
          "A oferta gastronômica na vila e arredores vai de cafés a restaurantes com frutos do mar. Use o guia para filtrar por horário aberto e avaliações.",
        ],
        links: [{ href: "/guia/onde-comer-em-imbituba", label: "Onde comer na região" }],
      },
      {
        heading: "Como chegar a partir de Imbituba",
        paragraphs: [
          "O deslocamento é curto de carro; planeje estacionamento e trânsito em feriados. No Guia de Bolso, abra o lugar e use Ir agora para navegar no app de mapas preferido.",
        ],
      },
    ],
    faq: [
      {
        question: "Praia do Rosa fica em Imbituba?",
        answer:
          "A região é vizinha e muito visitada por quem se hospeda em Imbituba; o Rosa é tradicionalmente ligado a Garopaba, mas integra o turismo do litoral sul.",
      },
    ],
    relatedGuides: [
      { href: "/guia/melhores-praias-imbituba", label: "Melhores praias" },
      { href: "/guia/roteiro-3-dias-imbituba", label: "Roteiro 3 dias" },
    ],
    ctaPrimary: { href: getCategoriaHref("Natureza"), label: "Lugares de natureza" },
    ctaSecondary: { href: "/imbituba", label: "Sobre Imbituba" },
    sitemapPriority: 0.88,
  },
  {
    slug: "onde-comer-em-imbituba",
    title: "Onde comer em Imbituba",
    metaTitle: "Onde comer em Imbituba — restaurantes e dicas",
    metaDescription:
      "Restaurantes, frutos do mar, bares e cafés em Imbituba, SC. Horários ao vivo e curadoria no Guia de Bolso.",
    intro:
      "A cena gastronômica de Imbituba mistura sabores do mar, culinária brasileira e opções para o dia a dia do viajante. Este guia orienta por estilo de refeição — e abaixo você encontra estabelecimentos cadastrados no Guia de Bolso.",
    sections: [
      {
        heading: "Frutos do mar e almoço à beira-mar",
        paragraphs: [
          "Peixe fresco e moquecas aparecem em vários pontos da cidade e da orla. Prefira locais com horário atualizado no guia para evitar surpresas na alta temporada.",
        ],
      },
      {
        heading: "Cafés e brunch",
        paragraphs: [
          "Para começar o dia antes da praia, veja também o guia de melhores cafés — muitas opções concentram-se no centro e na região da Praia da Vila.",
        ],
        links: [{ href: "/guia/melhores-cafes-imbituba", label: "Melhores cafés" }],
      },
      {
        heading: "Noite e bares",
        paragraphs: [
          "Bares e música ao vivo estão na categoria Noite. Combine com responsabilidade e verifique se o local está aberto no dia.",
        ],
        links: [{ href: getCategoriaHref("Noite"), label: "Vida noturna no guia" }],
      },
    ],
    faq: [
      {
        question: "Como saber se o restaurante está aberto?",
        answer: "No Guia de Bolso, cada lugar exibe status de funcionamento em tempo real quando disponível.",
      },
    ],
    relatedGuides: [
      { href: "/guia/melhores-cafes-imbituba", label: "Melhores cafés" },
      { href: "/guia/o-que-fazer-em-imbituba", label: "O que fazer na cidade" },
    ],
    ctaPrimary: { href: getCategoriaHref("Gastronomia"), label: "Todos os restaurantes" },
    ctaSecondary: { href: "/para-negocios", label: "Cadastrar restaurante" },
    listPlacesCategory: "Gastronomia",
    listPlacesLimit: 12,
    sitemapPriority: 0.87,
  },
  {
    slug: "roteiro-3-dias-imbituba",
    title: "Roteiro de 3 dias em Imbituba",
    metaTitle: "Roteiro de 3 dias em Imbituba — praia, comida e natureza",
    metaDescription:
      "Planeje um fim de semana longo em Imbituba: praias, gastronomia e trilhas. Roteiro dia a dia pelo Guia de Bolso.",
    intro:
      "Três dias são suficientes para sentir o ritmo de Imbituba sem correria: uma praia icônica, boa comida e um passeio de natureza. Ajuste conforme clima e temporada de baleias.",
    sections: [
      {
        heading: "Dia 1 — Praias e pôr do sol",
        paragraphs: [
          "Manhã na Praia da Vila. À tarde, desloque-se para a região do Rosa para caminhada e pôr do sol. Jantar com frutos do mar ou opção no centro.",
        ],
        links: [{ href: "/guia/melhores-praias-imbituba", label: "Guia de praias" }],
      },
      {
        heading: "Dia 2 — Gastronomia e centro",
        paragraphs: [
          "Café da manhã local, passeio pelo comércio e almoço em restaurante da listagem Gastronomia. Noite leve em bar ou música ao vivo, se preferir.",
        ],
        links: [{ href: "/guia/onde-comer-em-imbituba", label: "Onde comer" }],
      },
      {
        heading: "Dia 3 — Natureza e despedida",
        paragraphs: [
          "Trilha curta ou praia mais calma (Ibiraquera). Almoço tranquilo e partida. Na temporada de baleias, reserve um passeio com operador credenciado.",
        ],
        links: [{ href: getCategoriaHref("Aventura"), label: "Aventura no guia" }],
      },
    ],
    relatedGuides: [
      { href: "/guia/o-que-fazer-em-imbituba", label: "Guia geral" },
      { href: "/guia/praia-do-rosa", label: "Praia do Rosa" },
    ],
    ctaPrimary: { href: "/categorias", label: "Montar seu roteiro" },
    ctaSecondary: { href: "/guia/lugares-escondidos-imbituba", label: "Lugares menos óbvios" },
    sitemapPriority: 0.86,
  },
  {
    slug: "melhores-cafes-imbituba",
    title: "Melhores cafés de Imbituba",
    metaTitle: "Melhores cafés de Imbituba — onde tomar café",
    metaDescription:
      "Cafés, padarias e brunch em Imbituba para começar o dia antes da praia. Lista curada no Guia de Bolso.",
    intro:
      "Um bom café define o tom do dia de viagem. Em Imbituba você encontra opções no centro, na orla e no caminho para as praias — confira abaixo lugares da categoria Gastronomia com foco em café e brunch.",
    sections: [
      {
        heading: "Quando ir",
        paragraphs: [
          "Nos fins de semana de verão, chegue cedo nos cafés mais procurados. Use o guia para ver se o local está aberto antes de se deslocar.",
        ],
      },
      {
        heading: "Combine com o roteiro",
        paragraphs: [
          "Café + Praia da Vila funciona bem em um único dia; em outro, parta cedo para Ibiraquera ou Rosa após o brunch.",
        ],
        links: [{ href: "/guia/roteiro-3-dias-imbituba", label: "Roteiro de 3 dias" }],
      },
    ],
    relatedGuides: [
      { href: "/guia/onde-comer-em-imbituba", label: "Onde comer" },
      { href: "/guia/o-que-fazer-em-imbituba", label: "O que fazer" },
    ],
    ctaPrimary: { href: getCategoriaHref("Gastronomia"), label: "Ver gastronomia" },
    listPlacesCategory: "Gastronomia",
    listPlacesLimit: 10,
    sitemapPriority: 0.85,
  },
  {
    slug: "lugares-escondidos-imbituba",
    title: "Lugares escondidos em Imbituba",
    metaTitle: "Lugares secretos e menos óbvios em Imbituba",
    metaDescription:
      "Cantos menos turísticos de Imbituba: trilhas, praias tranquilas e experiências locais. Curadoria Guia de Bolso.",
    intro:
      "Além dos destinos famosos, Imbituba guarda cantos que moradores e guias locais preferem — trilhas leves, praias com menos movimento e negócios de bairro. A curadoria do Guia de Bolso prioriza lugares reais, não listas genéricas da internet.",
    sections: [
      {
        heading: "Fuja do óbvio com critério",
        paragraphs: [
          "“Lugar secreto” não significa área de risco ou acesso proibido. Respeite sinalização, leve água em trilhas e consulte condições do mar.",
        ],
      },
      {
        heading: "Como descobrir no app",
        paragraphs: [
          "Use tags e subcategorias no guia, filtre por Natureza ou Aventura e leia avaliações aprovadas de quem visitou. A busca com IA ajuda a montar roteiros por intenção (“lugar tranquilo”, “pôr do sol”).",
        ],
      },
      {
        heading: "Apoie o comércio local",
        paragraphs: [
          "Muitos “achados” são pequenos negócios familiares. Avaliar e compartilhar no guia fortalece a economia local.",
        ],
        links: [{ href: "/para-negocios", label: "Cadastrar meu negócio" }],
      },
    ],
    relatedGuides: [
      { href: "/guia/melhores-praias-imbituba", label: "Melhores praias" },
      { href: "/guia/o-que-fazer-em-imbituba", label: "Guia geral" },
    ],
    ctaPrimary: { href: "/categorias", label: "Explorar curadoria" },
    listPlacesCategory: "Aventura",
    listPlacesLimit: 8,
    sitemapPriority: 0.84,
  },
  {
    slug: "praia-da-vila-imbituba",
    title: "Praia da Vila — guia prático",
    metaTitle: "Praia da Vila, Imbituba — o que fazer e como chegar",
    metaDescription:
      "A praia mais central de Imbituba: infraestrutura, família, serviços e dicas de horário. Guia de Bolso Imbituba.",
    intro:
      "A Praia da Vila é o cartão-postal urbano de Imbituba — fácil acesso, comércio por perto e ótima base para quem está na cidade pela primeira vez. Este guia resume o que esperar e como aproveitar no app.",
    sections: [
      {
        heading: "Por que visitar",
        paragraphs: [
          "Ideal para passeios rápidos, caminhadas na orla e dias em que você não quer deslocamentos longos. Boa opção para combinar praia com almoço na cidade.",
        ],
      },
      {
        heading: "Para quem é",
        paragraphs: [
          "Famílias, casais e quem prefere infraestrutura. Surfistas costumam buscar outros picos da região, mas a Vila funciona bem para um dia tranquilo.",
        ],
      },
      {
        heading: "Dicas práticas",
        paragraphs: [
          "Confira condições do mar e horário de sol no dia. No Guia de Bolso, veja estabelecimentos abertos perto e use Ir agora para navegação.",
        ],
        links: [{ href: getCategoriaHref("Natureza"), label: "Mais praias e natureza" }],
      },
    ],
    relatedGuides: [
      { href: "/guia/melhores-praias-imbituba", label: "Melhores praias" },
      { href: "/guia/o-que-fazer-em-imbituba", label: "Guia geral" },
    ],
    ctaPrimary: { href: getCategoriaHref("Natureza"), label: "Ver praias no guia" },
    listPlacesCategory: "Natureza",
    listPlacesLimit: 6,
    sitemapPriority: 0.83,
  },
  {
    slug: "surf-imbituba",
    title: "Surf em Imbituba e região",
    metaTitle: "Surf em Imbituba, SC — praias, picos e temporada",
    metaDescription:
      "Onde surfar perto de Imbituba: Rosa, Ibiraquera e dicas de maré e vento. Roteiro no Guia de Bolso Imbituba.",
    intro:
      "Imbituba e o litoral sul catarinense são referência em surf no Brasil. Este guia orienta picos clássicos, segurança e como montar o dia usando lugares e atrativos do app.",
    sections: [
      {
        heading: "Picos mais procurados",
        paragraphs: [
          "A região da Praia do Rosa e Ibiraquera concentra ondas fortes e vento — muito frequentados por surfistas e kitesurfistas. A Praia da Vila é mais voltada a passeio.",
        ],
        links: [
          { href: "/guia/praia-do-rosa", label: "Guia Praia do Rosa" },
          { href: "/guia/melhores-praias-imbituba", label: "Comparar praias" },
        ],
      },
      {
        heading: "Segurança e respeito",
        paragraphs: [
          "Respeite faixas de banho, sinalização e comunidade local. Em dias de mar agitado, priorize praias com salva-vidas e informe-se sobre correntes.",
        ],
      },
      {
        heading: "Depois da praia",
        paragraphs: [
          "Combine surf com gastronomia na cidade — filtre restaurantes abertos e com boas avaliações no guia.",
        ],
        links: [{ href: "/guia/onde-comer-em-imbituba", label: "Onde comer" }],
      },
    ],
    relatedGuides: [
      { href: "/guia/praia-do-rosa", label: "Praia do Rosa" },
      { href: "/guia/melhores-praias-imbituba", label: "Melhores praias" },
    ],
    ctaPrimary: { href: getCategoriaHref("Natureza"), label: "Explorar natureza" },
    listPlacesCategory: "Natureza",
    listPlacesLimit: 8,
    sitemapPriority: 0.83,
  },
];

/**
 * @param {string} slug
 * @returns {GuiaGuide|undefined}
 */
export function getGuiaBySlug(slug) {
  return GUIA_GUIDES.find((g) => g.slug === slug);
}

/** @returns {string[]} */
export function getAllGuiaSlugs() {
  return GUIA_GUIDES.map((g) => g.slug);
}

/** @returns {GuiaLink[]} */
export function getGuiaIndexLinks() {
  return GUIA_GUIDES.map((g) => ({
    href: `/guia/${g.slug}`,
    label: g.title,
  }));
}
