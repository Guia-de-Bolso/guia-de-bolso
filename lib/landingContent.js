import { FAVORITO_OFFLINE_BENEFIT_BODY } from "@/lib/favoritosOffline";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
} from "@/lib/siteContact";

export const LANDING_SECTION_IDS = {
  categorias: "categorias",
  comoFunciona: "como-funciona",
  turistas: "turistas",
  negociosShowcase: "negocios-app",
  negocios: "negocios",
  app: "app",
  parceiros: "parceiros",
  depoimentos: "depoimentos",
  contato: "contato",
  listaEspera: "lista-espera",
};

/** @deprecated Use LANDING_SECTION_IDS.categorias */
export const LANDING_SECTION_IDS_LEGACY = {
  descobrir: LANDING_SECTION_IDS.categorias,
  funcionalidades: LANDING_SECTION_IDS.turistas,
  estabelecimentos: LANDING_SECTION_IDS.negocios,
  usuarios: LANDING_SECTION_IDS.categorias,
  contato: LANDING_SECTION_IDS.contato,
  comoFunciona: LANDING_SECTION_IDS.comoFunciona,
};

export const LANDING_CONTACT_EMAIL = SITE_CONTACT_EMAIL;

export const LANDING_CONTACT_PHONE = SITE_CONTACT_PHONE_DISPLAY;

/** @param {string} [subject] */
export function landingContactMailto(subject = "Contato — Guia de Bolso") {
  return `mailto:${LANDING_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export const LANDING_NAV_LINKS = [
  { label: "Explorar", href: `#${LANDING_SECTION_IDS.categorias}` },
  { label: "Experiência", href: `#${LANDING_SECTION_IDS.app}` },
  { label: "Anunciantes", href: "/para-negocios" },
  { label: "Parceiros", href: `#${LANDING_SECTION_IDS.parceiros}` },
];

export const LANDING_HERO = {
  eyebrow: "Guia turístico · Imbituba, SC",
  line1: "Guia turístico de",
  line2: "Imbituba.",
  subtitle:
    "Praias, gastronomia e roteiros com IA — favorite lugares e trilhas e leve tudo offline, mesmo sem sinal.",
  ctaExplore: "Explorar a cidade",
  ctaBusiness: "Cadastrar meu negócio",
};

/** @type {{ title: string; body: string }[]} */
export const LANDING_TOURIST_BENEFITS = [
  {
    title: "Curadoria de morador",
    body: "Lugares reais — não listas genéricas de viagem.",
  },
  {
    title: "Decisão na hora",
    body: "Aberto agora, distância e detalhes antes de sair.",
  },
  {
    title: "Favoritos offline",
    body: FAVORITO_OFFLINE_BENEFIT_BODY,
  },
  {
    title: "Avaliações confiáveis",
    body: "Reviews moderados, com rosto local.",
  },
];

/** @type {{ title: string; body: string }[]} */
export const LANDING_BUSINESS_BENEFITS = [
  {
    title: "Visível na chegada",
    body: "Quem pisa em Imbituba encontra você no guia.",
  },
  {
    title: "Perfil completo",
    body: "Fotos, horário, mapa e links em um lugar.",
  },
  {
    title: "Reputação orgânica",
    body: "Avaliações aprovadas constroem confiança.",
  },
  {
    title: "Badge de parceiro",
    body: "Selo verificado no perfil e nos cards — destaque sobre a listagem comum.",
  },
];

/** @type {{ step: string; title: string; body: string }[]} */
export const LANDING_STEPS = [
  {
    step: "01",
    title: "Abra o guia",
    body: "Interface clara, feita para o celular.",
  },
  {
    step: "02",
    title: "Escolha a categoria",
    body: "Natureza, gastronomia, noite — tudo organizado.",
  },
  {
    step: "03",
    title: "Vá com confiança",
    body: "Favorite antes de sair — detalhes, mapa e trilhas disponíveis offline.",
  },
];

/** @type {{ quote: string; name: string; role: string }[]} */
export const LANDING_TESTIMONIALS = [
  {
    quote:
      "Finalmente um guia que parece feito por quem mora aqui — não por algoritmo genérico.",
    name: "Marina L.",
    role: "Turista · Praia do Rosa",
  },
  {
    quote:
      "Anunciar no guia mudou como chegamos a quem visita a cidade pela primeira vez.",
    name: "Anunciante local",
    role: "Estabelecimento · Imbituba",
  },
  {
    quote: "Visual limpo, informação certa. É o que faltava em Imbituba.",
    name: "Ana P.",
    role: "Moradora · Imbituba",
  },
];

export const LANDING_FEATURES = LANDING_TOURIST_BENEFITS.map((b, i) => ({
  id: String(i),
  title: b.title,
  description: b.body,
}));

export const LANDING_STEPS_USER = LANDING_STEPS.map((s, i) => ({
  step: i + 1,
  title: s.title,
  description: s.body,
}));

export const LANDING_STEPS_BUSINESS = [
  { step: 1, title: "Contato", description: "Envie os dados do seu negócio." },
  { step: 2, title: "Perfil", description: "Fotos, horário e localização." },
  { step: 3, title: "Publicação", description: "Você entra no mapa do guia." },
];
