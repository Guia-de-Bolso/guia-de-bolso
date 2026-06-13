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
  { emoji: "🗺️", label: "Rotas curadas com mapa" },
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
      { emoji: "🍽️", text: "Gastronomia e vida local" },
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
      { emoji: "🟢", text: "Filtro “Abertos agora” na busca" },
      { emoji: "❤️", text: "Favoritos sincronizados na nuvem" },
    ],
  },
  {
    image: {
      src: "/onboarding/montanha.jpg",
      alt: "Montanhas e trilhas com vista panorâmica",
    },
    kicker: "Trilhas · Montanha",
    title: "Rotas curadas com mapa e etapas",
    subtitle:
      "Trilhas e caminhos publicados pelo guia, com distância, dicas e navegação no Maps.",
    stat: { value: "1 toque", label: "para abrir no Google ou Waze" },
    highlights: [
      { emoji: "🥾", text: "Rotas passo a passo no app" },
      { emoji: "🗺️", text: "IR AGORA com app de mapas preferido" },
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
      "Na home, descreva o que quer (“almoço romântico”, “praia aberta agora”). Em Rotas, gere um roteiro de vários dias com lugares reais do guia.",
    stat: {
      value: `${LIMITS.busca}+${LIMITS.roteiro}`,
      label: "usos grátis por dia com IA",
    },
    highlights: [
      {
        emoji: "💬",
        text: `${LIMITS.busca} buscas IA grátis por dia (renova à meia-noite, horário de Brasília)`,
      },
      {
        emoji: "🧭",
        text: `${LIMITS.roteiro} roteiros personalizados grátis por dia — ideal para planejar o fim de semana`,
      },
      {
        emoji: "✨",
        text: "Guia Premium: buscas e roteiros ilimitados no app",
      },
    ],
  },
];
