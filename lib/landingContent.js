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
};

export const LANDING_CONTACT_EMAIL = SITE_CONTACT_EMAIL;

export const LANDING_CONTACT_PHONE = SITE_CONTACT_PHONE_DISPLAY;

/** @param {string} [subject] */
export function landingContactMailto(subject = "Contato — Guia de Bolso") {
  return `mailto:${LANDING_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export const LANDING_DOWNLOAD_HREF = "/baixar";

export const LANDING_HERO = {
  eyebrow: "Guia turístico · Imbituba, SC",
  line1: "Guia turístico de",
  line2: "Imbituba.",
  subtitle:
    "Praias, gastronomia e roteiros com IA — favorite lugares e trilhas e leve tudo offline. Já disponível na App Store e no Google Play.",
  ctaDownload: "Baixar o app",
  ctaExplore: "Explorar a cidade",
  ctaBusiness: "Cadastrar meu negócio",
};

export const LANDING_DOWNLOAD = {
  kicker: "Já nas lojas",
  title: "Disponível no iPhone e no Android",
  hint: "Baixe grátis na App Store ou no Google Play. O link abre a loja certa no seu celular.",
  stores: "App Store · Google Play",
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

/** @type {{ step: string; title: string; body: string }[]} */
export const LANDING_STEPS = [
  {
    step: "01",
    title: "Baixe o app",
    body: "Grátis na App Store e no Google Play.",
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
