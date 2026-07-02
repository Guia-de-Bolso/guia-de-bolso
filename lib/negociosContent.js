import { PLANO_COMERCIAL_NOME } from "@/lib/planoComercial";
import { landingContactMailto } from "@/lib/landingContent";

export const NEGOCIOS_CONTACT_MAILTO = landingContactMailto(
  "Quero anunciar no Guia de Bolso — Imbituba"
);

export const NEGOCIOS_HERO = {
  eyebrow: "Para estabelecimentos · Imbituba, SC",
  title: "Seu negócio na mão do turista.",
  subtitle:
    "Apareça no guia oficial quando alguém chega na cidade e pergunta “onde comer?”, “onde ficar?” ou “o que fazer agora?”. Plano Parceiro com destaque na home, perfil completo e badge verificado.",
  ctaPrimary: "Quero ser parceiro",
  ctaSecondary: "Ver como funciona no app",
};

/** Onde o estabelecimento aparece no app — usado no showcase. */
export const NEGOCIOS_APP_TOUCHPOINTS = [
  {
    id: "home",
    label: "Carrossel na home",
    title: "Primeira impressão na chegada",
    body: "Parceiros aparecem no carrossel “Parceiros do Guia” — a seção premium da home, antes do turista rolar o feed.",
    screen: "home",
  },
  {
    id: "detalhe",
    label: "Perfil completo",
    title: "Página que converte visita em cliente",
    body: "Fotos, horário em tempo real, mapa, Instagram, cardápio, site e botão IR AGORA — tudo no detalhe do seu estabelecimento.",
    screen: "detalhe",
  },
  {
    id: "busca",
    label: "Busca com IA",
    title: "Encontrado na pergunta certa",
    body: "Quando o turista busca “restaurante com vista” ou “pousada perto da praia”, parceiros entram no contexto da IA com prioridade.",
    screen: "busca",
  },
];

/** Benefícios do plano Parceiro (sem exibir preço — geração de leads). */
export const NEGOCIOS_PLANO_PARCEIRO = {
  nome: PLANO_COMERCIAL_NOME,
  descricao:
    "Plano comercial para restaurantes, pousadas, bares e comércio. O app continua gratuito para turistas — parceiros têm visibilidade premium no guia.",
  notaLead: "Valores e condições sob consulta. Fale com a equipe.",
  features: [
    "Carrossel “Parceiros do Guia” na home do app",
    `Badge “${PLANO_COMERCIAL_NOME} do Guia” no perfil, cards e resultados`,
    "Perfil completo: galeria, descrição, tags e horário ao vivo",
    "Ações rápidas: Instagram, cardápio, site, telefone e IR AGORA",
    "Prioridade na busca por IA e nos roteiros gerados para turistas",
    "Destaque na seção “Perto de você” com distância real",
    "Ecossistema de curadoria: parceiros ao lado de locais e atrativos validados pela equipe",
    "Visibilidade quando turistas exploram cantos escondidos e favoritos de morador",
    "QR Code personalizado + PDF para imprimir no balcão",
    "Relatório mensal: visualizações, scans de QR e cliques em IR AGORA",
    "Avaliações moderadas visíveis no perfil — prova social confiável",
    "Perfil validado e atualizado pela equipe do guia oficial",
  ],
  cta: "Quero ser parceiro",
  mailtoSubject: `Plano ${PLANO_COMERCIAL_NOME} — Guia de Bolso`,
};

/** @type {{ step: string; title: string; body: string }[]} */
export const NEGOCIOS_ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Contato rápido",
    body: "Envie nome, categoria e endereço do estabelecimento.",
  },
  {
    step: "02",
    title: "Perfil no ar",
    body: "Fotos, horários, links e localização validados pela equipe.",
  },
  {
    step: "03",
    title: "Visibilidade ativa",
    body: "Seu negócio entra como Parceiro do Guia — carrossel, badge e relatórios.",
  },
];

/** Depoimentos de estabelecimentos e operadores locais. */
export const NEGOCIOS_TESTIMONIALS = [
  {
    quote:
      "Nosso restaurante passou a aparecer para quem chega na cidade sem conhecer nada. O perfil completo faz diferença — turista vê horário e cardápio antes de sair.",
    name: "Ricardo M.",
    role: "Gastronomia · Imbituba",
    tipo: "estabelecimento",
  },
  {
    quote:
      "Ter badge de parceiro e estar no carrossel da home nos coloca na frente quando o turista abre o app pela primeira vez.",
    name: "Camila S.",
    role: "Natureza · Praia do Rosa",
    tipo: "estabelecimento",
  },
  {
    quote:
      "O QR no balcão vira canal direto: o cliente escaneia e cai no nosso perfil com avaliações e botão pro Maps.",
    name: "João P.",
    role: "Comércio · Centro",
    tipo: "estabelecimento",
  },
];

/** @type {{ pergunta: string; resposta: string }[]} */
export const NEGOCIOS_FAQ = [
  {
    pergunta: "Quanto custa para ser parceiro?",
    resposta:
      "O plano Parceiro é comercial — entre em contato para receber a proposta. O app para turistas é gratuito; estabelecimentos entram por parceria com visibilidade premium no guia.",
  },
  {
    pergunta: "Existe cadastro gratuito para negócios?",
    resposta:
      "Não. O gratuito é para quem usa o app como turista. Restaurantes, pousadas e comércio entram pelo plano Parceiro do Guia, com destaque e ferramentas exclusivas.",
  },
  {
    pergunta: "Quem pode ser parceiro?",
    resposta:
      "Restaurantes, pousadas, bares, comércio e serviços de Imbituba e região (Praia do Rosa, litoral sul). Praias e trilhas públicas entram como curadoria, não como anunciantes.",
  },
  {
    pergunta: "Como o turista me encontra?",
    resposta:
      "Pela home, categorias, busca com IA, seção “Perto de você” e atrativos curados. Parceiros têm destaque extra no carrossel e badge no perfil.",
  },
  {
    pergunta: "Preciso ter app instalado para gerenciar?",
    resposta:
      "Hoje o cadastro e atualizações são feitos com nossa equipe. Portal self-service para estabelecimentos está no roadmap.",
  },
  {
    pergunta: "O Guia de Bolso é o app de finanças Guiabolso?",
    resposta:
      "Não. Somos o guia turístico oficial de Imbituba, SC — praias, gastronomia e atrativos locais.",
  },
];

export const NEGOCIOS_PARCEIROS_COPY = {
  eyebrow: "Parceiros ativos",
  title: "Quem já anuncia no guia.",
  subtitle:
    "Estabelecimentos reais de Imbituba e região com badge Parceiro do Guia — visíveis no carrossel da home e no perfil completo.",
};

export const NEGOCIOS_CURADORIA_COPY = {
  eyebrow: "Curadoria local",
  title: "Atrativos e locais que só quem mora aqui conhece.",
  subtitle:
    "Não somos lista genérica da internet. Nossa equipe valida praias, trilhas, cantos escondidos e roteiros prontos — parceiros entram nesse ecossistema de descoberta.",
  benefits: [
    {
      title: "Locais escondidos",
      body: "Praias, trilhas e favoritos de morador — curados um a um, fora do óbvio.",
    },
    {
      title: "Atrativos prontos",
      body: "Roteiros com ordem, dicas e fotos — o turista segue no celular sem planilha.",
    },
    {
      title: "Confiança local",
      body: "Badge de curadoria separa o que é recomendação nossa do restante do catálogo.",
    },
  ],
};

/** Benefícios expandidos para landing e página B2B. */
export const NEGOCIOS_VALUE_PROPS = [
  {
    title: "Carrossel na home",
    body: "Parceiros aparecem no topo do app, quando o turista ainda está decidindo o dia.",
    icon: "🏠",
  },
  {
    title: "Badge verificado",
    body: "Selo “Parceiro do Guia” no perfil, cards e resultados — confiança instantânea.",
    icon: "✓",
  },
  {
    title: "Perfil que vende",
    body: "Galeria, horário ao vivo, Instagram, cardápio, site e navegação com um toque.",
    icon: "📱",
  },
  {
    title: "IA a seu favor",
    body: "Prioridade na busca e nos roteiros quando turistas descrevem o que procuram.",
    icon: "✨",
  },
  {
    title: "Perto de você",
    body: "Apareça para quem está na região com distância real e status aberto/fechado.",
    icon: "📍",
  },
  {
    title: "QR no balcão",
    body: "Link curto e PDF para imprimir — cada scan entra no relatório mensal.",
    icon: "📲",
  },
  {
    title: "Relatório mensal",
    body: "Visualizações, scans de QR e cliques em IR AGORA — saiba o retorno do guia.",
    icon: "📊",
  },
  {
    title: "Atrativos curados",
    body: "Roteiros montados pela equipe — parceiros podem aparecer no caminho do turista.",
    icon: "🗺️",
  },
  {
    title: "Ecossistema local",
    body: "Seu negócio ao lado de locais escondidos e favoritos de morador — descoberta de verdade.",
    icon: "🌿",
  },
  {
    title: "Avaliações moderadas",
    body: "Reviews aprovados constroem reputação orgânica no guia oficial.",
    icon: "★",
  },
];
