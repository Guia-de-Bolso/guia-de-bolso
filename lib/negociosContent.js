import { PLANO_COMERCIAL_NOME, PLANO_COMERCIAL_PRECO } from "@/lib/planoComercial";
import { PERFIL_PROMO_FIM_PADRAO } from "@/lib/planoLancamento";
import { landingContactMailto } from "@/lib/landingContent";

export const NEGOCIOS_CONTACT_MAILTO = landingContactMailto(
  "Quero anunciar no Guia de Bolso — Imbituba"
);

const PROMO_FIM_LABEL = "fev/2027";

export const NEGOCIOS_HERO = {
  eyebrow: "Para estabelecimentos · Imbituba, SC",
  title: "Seu negócio na mão do turista.",
  subtitle:
    "O app é gratuito para quem visita a cidade. Seu negócio entra no guia oficial com perfil completo (utilitário ou fase de lançamento) — e pode evoluir para Parceiro com destaque premium, relatórios e badge verificado.",
  ctaPrimary: "Quero ser parceiro",
  ctaSecondary: "Ver planos no guia",
};

/** Três camadas comerciais — alinhado ao produto (Presença / Lançamento / Parceiro). */
export const NEGOCIOS_PLANOS_TIERS = [
  {
    id: "presenca",
    nome: "Presença",
    badge: "Grátis para sempre",
    descricao:
      "Farmácias, mercados, mecânicos e serviços de saúde. O turista encontra o perfil completo — horário, fotos, WhatsApp e história — sem custo para o estabelecimento.",
    features: [
      "Nome, endereço e horário ao vivo no app",
      "Botão IR AGORA (Google Maps, Apple Maps, Waze)",
      "WhatsApp, Instagram, site e telefone clicáveis",
      "Galeria, descrição completa, tags e avaliações",
      "História e cultura quando cadastrados",
      "Ideal para utilitários do dia a dia",
    ],
    nota: "Sem custo. Cadastro feito pela equipe do guia.",
    destacado: false,
  },
  {
    id: "lancamento",
    nome: "Lançamento",
    badge: `Grátis até ${PROMO_FIM_LABEL}`,
    descricao:
      "Restaurantes, bares, experiências e comércio de visita. Perfil completo gratuito enquanto o app ganha tração na região.",
    features: [
      "Galeria de fotos e descrição completa",
      "Instagram, cardápio, site e Facebook",
      "Avaliações moderadas visíveis",
      "Tags e horário em tempo real",
      "Perfil completo até o fim do verão 2026/27",
    ],
    nota: `Promo válida até ${PERFIL_PROMO_FIM_PADRAO.split("-").reverse().join("/")}. Depois, upgrade para Parceiro ou volta ao básico.`,
    destacado: false,
  },
  {
    id: "parceiro",
    nome: PLANO_COMERCIAL_NOME,
    badge: "Visibilidade premium",
    descricao:
      "Para quem quer ser a primeira escolha do turista — destaque na home, IA, QR Code e relatório mensal com dados reais.",
    features: [
      "Carrossel “Parceiros do Guia” na home",
      `Badge “${PLANO_COMERCIAL_NOME} do Guia” no perfil e nos cards`,
      "Prioridade na busca por IA e roteiros sugeridos",
      "QR Code personalizado + PDF para o balcão",
      "Relatório mensal: views, IR AGORA, QR e comparativo da categoria",
      "Perfil completo permanente + curadoria da equipe",
    ],
    nota: `A partir de R$ ${PLANO_COMERCIAL_PRECO}/mês · condições sob consulta`,
    destacado: true,
    cta: "Quero ser parceiro",
    mailtoSubject: `Plano ${PLANO_COMERCIAL_NOME} — Guia de Bolso`,
  },
];

/** Onde o estabelecimento aparece no app — usado no showcase. */
export const NEGOCIOS_APP_TOUCHPOINTS = [
  {
    id: "home",
    label: "Carrossel na home",
    title: "Primeira impressão na chegada",
    body: "Parceiros aparecem no carrossel “Parceiros do Guia” — exclusivo do plano pago, antes do turista rolar o feed.",
    screen: "home",
  },
  {
    id: "detalhe",
    label: "Perfil no app",
    title: "Página que converte visita em cliente",
    body: "Presença (utilitário): perfil completo sem cobrança. Lançamento e Parceiro: o mesmo perfil +, no pago, destaque na home.",
    screen: "detalhe",
  },
  {
    id: "busca",
    label: "Busca com IA",
    title: "Encontrado na pergunta certa",
    body: "Parceiros entram com prioridade quando o turista busca “restaurante com vista” ou “o que fazer hoje”.",
    screen: "busca",
  },
];

/** Benefícios do plano Parceiro (geração de leads). */
export const NEGOCIOS_PLANO_PARCEIRO = {
  nome: PLANO_COMERCIAL_NOME,
  descricao:
    "Visibilidade premium no guia oficial — além do perfil completo. O app continua gratuito para turistas.",
  notaLead: "Valores e condições sob consulta. Fale com a equipe.",
  features: NEGOCIOS_PLANOS_TIERS.find((tier) => tier.id === "parceiro")?.features ?? [],
  cta: "Quero ser parceiro",
  mailtoSubject: `Plano ${PLANO_COMERCIAL_NOME} — Guia de Bolso`,
};

/** @type {{ step: string; title: string; body: string }[]} */
export const NEGOCIOS_ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Contato rápido",
    body: "Envie nome, categoria e endereço. Dizemos se entra em Presença ou Lançamento.",
  },
  {
    step: "02",
    title: "Perfil no ar",
    body: "Fotos, horários, links e localização validados pela equipe do guia.",
  },
  {
    step: "03",
    title: "Dados reais",
    body: "Com tráfego no app, você recebe relatório e pode virar Parceiro com destaque premium.",
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
    role: "Gastronomia · Praia do Rosa",
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
    pergunta: "Quanto custa para estar no guia?",
    resposta:
      "Depende do plano. Presença é grátis para sempre (utilitários como farmácia e mercado), com perfil completo no app. Restaurantes e experiências têm o mesmo perfil grátis até fev/2027 (Lançamento). Parceiro é o plano pago com destaque na home, IA, QR Code e relatórios — a partir de R$ 299/mês, sob consulta.",
  },
  {
    pergunta: "Existe cadastro gratuito para negócios?",
    resposta:
      "Sim. Utilitários (farmácia, mercado, saúde) têm perfil completo grátis para sempre. Restaurantes e experiências também na fase de Lançamento. O plano Parceiro pago adiciona carrossel, badge, prioridade na IA, QR e relatórios.",
  },
  {
    pergunta: "Qual a diferença entre Presença, Lançamento e Parceiro?",
    resposta:
      "Presença: perfil completo grátis para sempre — farmácias, mercados, saúde, igrejas, museus e monumentos; sem carrossel nem badge. Lançamento: perfil completo grátis até fev/2027 — gastronomia e experiências. Parceiro: perfil completo + carrossel na home, badge, prioridade na IA, QR Code e relatório mensal.",
  },
  {
    pergunta: "O que acontece depois de fev/2027?",
    resposta:
      "Quem estava no Lançamento volta ao perfil teaser (galeria e links bloqueados) ou pode virar Parceiro para manter o perfil completo e ganhar visibilidade premium — com dados reais de visualizações e engajamento para decidir. Utilitários em Presença continuam com perfil completo.",
  },
  {
    pergunta: "Quem pode ser parceiro?",
    resposta:
      "Restaurantes, bares, comércio, serviços e experiências de Imbituba e região. Praias e trilhas públicas entram como curadoria editorial, não como anunciantes pagos.",
  },
  {
    pergunta: "Como o turista me encontra?",
    resposta:
      "Por categorias, busca, mapa, seção “Perto de você” e busca com IA. Parceiros têm carrossel exclusivo na home e badge no perfil.",
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
    "Estabelecimentos de Imbituba e região com plano Parceiro — carrossel na home, badge e relatórios.",
};

export const NEGOCIOS_CURADORIA_COPY = {
  eyebrow: "Curadoria local",
  title: "Atrativos e locais que só quem mora aqui conhece.",
  subtitle:
    "Não somos lista genérica da internet. Nossa equipe valida praias, trilhas e roteiros — parceiros entram nesse ecossistema de descoberta.",
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
    title: "Presença grátis",
    body: "Farmácias, mercados e saúde no mapa com perfil completo — horário, fotos, WhatsApp e história.",
    icon: "💊",
  },
  {
    title: "Lançamento generoso",
    body: `Restaurantes e experiências com perfil completo grátis até ${PROMO_FIM_LABEL} enquanto o app cresce.`,
    icon: "🚀",
  },
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
    title: "Relatório com dados",
    body: "Visualizações, IR AGORA, QR e comparativo com a categoria — prova para fechar o plano.",
    icon: "📊",
  },
  {
    title: "QR no balcão",
    body: "Link curto e PDF para imprimir — cada scan entra no relatório mensal.",
    icon: "📲",
  },
  {
    title: "Avaliações moderadas",
    body: "Reviews aprovados constroem reputação orgânica no guia oficial.",
    icon: "★",
  },
  {
    title: "Ecossistema local",
    body: "Seu negócio ao lado de atrativos curados — descoberta de verdade, não lista genérica.",
    icon: "🌿",
  },
];
