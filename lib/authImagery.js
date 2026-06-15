import { PREFETURA_SUPPORT_LINE } from "@/lib/institutionalSupport";
import { LIMITS } from "@/lib/premium";

/**
 * Fotos do onboarding em `/public/onboarding` (sem dependência externa em runtime).
 * Login ainda pode usar Unsplash até migrar para asset local.
 */

/** Hero da página /login — litoral / praia. */
export const LOGIN_HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
  alt: "Praia e mar em Imbituba, Santa Catarina",
};

/** Benefícios exibidos na tela de login (carrossel de valor). */
export const LOGIN_VALUE_PILLS = [
  { emoji: "🌊", label: "Praias e clima ao vivo" },
  { emoji: "🗺️", label: "Atrativos curados com mapa" },
  { emoji: "✨", label: "Busca em português com IA" },
  { emoji: "❤️", label: "Favoritos e avaliações" },
];

/**
 * Slides do onboarding — uma paisagem por tela (praia, lagoa, montanha, cachoeira).
 */
export const ONBOARDING_SLIDES = [
  {
    image: {
      src: "/onboarding/praia.jpg",
      alt: "Praia e ondas na costa de Santa Catarina",
    },
    kicker: PREFETURA_SUPPORT_LINE,
    title: "O litoral que moradores recomendam",
    subtitle:
      "O guia de turismo local com apoio da administração municipal — praias, restaurantes e experiências selecionadas.",
    stat: { value: "25+", label: "lugares ativos no guia" },
    highlights: [
      { emoji: "🏖️", text: "Praias e natureza perto de você" },
      { emoji: "📍", text: "Distância em tempo real com GPS" },
    ],
  },
  {
    image: {
      src: "/onboarding/lagoa.jpg",
      alt: "Lagoa e águas calmas ao amanhecer",
    },
    kicker: "Natureza · Lagoa",
    title: "Lagoas, mirantes e cantos escondidos",
    subtitle:
      "Explore por categoria, veja o que está aberto agora e salve favoritos com sua conta.",
    stat: { value: "8", label: "categorias para explorar" },
    highlights: [
      { emoji: "🌿", text: "Natureza, aventura e bem-estar" },
      { emoji: "❤️", text: "Favoritos sincronizados na nuvem" },
    ],
  },
  {
    image: {
      src: "/onboarding/montanha.jpg",
      alt: "Montanhas e trilhas com vista panorâmica",
    },
    kicker: "Trilhas · Montanha",
    title: "Atrativos curados com mapa e etapas",
    subtitle:
      "Trilhas e caminhos publicados pelo guia, com distância, dicas e navegação no Maps.",
    stat: { value: "1 toque", label: "para abrir no Google ou Waze", compact: true },
    highlights: [
      { emoji: "🥾", text: "Atrativos passo a passo no app" },
      { emoji: "⭐", text: "Avalie lugares após visitar" },
    ],
  },
  {
    image: {
      src: "/onboarding/cachoeira.jpg",
      alt: "Cachoeira em meio à mata atlântica",
    },
    kicker: "Inteligência artificial",
    title: "Busque e monte roteiros em português",
    subtitle:
      "Descreva o que quer na home e gere roteiros com lugares reais do guia em Atrativos.",
    stat: {
      value: `${LIMITS.busca}+${LIMITS.roteiro}`,
      label: "usos grátis com IA por dia",
      compact: true,
    },
    highlights: [
      { emoji: "💬", text: `${LIMITS.busca} buscas com IA por dia` },
      { emoji: "🧭", text: `${LIMITS.roteiro} roteiros com IA por dia` },
    ],
  },
];
