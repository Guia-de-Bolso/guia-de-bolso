/** Apps de navegação suportados no IR AGORA. */
export const NAV_APPS = [
  { key: "google", label: "Google Maps", emoji: "🗺️" },
  { key: "apple", label: "Apple Maps", emoji: "🍎" },
  { key: "waze", label: "Waze", emoji: "🚗" },
];

export const MAP_PREFERENCE_STORAGE_KEY = "map_app_preferido";

/** Benefícios exibidos na tela de perfil sem login. */
export const PERFIL_BENEFICIOS = [
  {
    id: "favoritos",
    emoji: "❤️",
    titulo: "Favoritos",
    descricao: "Salve praias, restaurantes e trilhas",
  },
  {
    id: "perto",
    emoji: "📍",
    titulo: "Perto de você",
    descricao: "Distância real com geolocalização",
  },
  {
    id: "avaliar",
    emoji: "⭐",
    titulo: "Avaliações",
    descricao: "Compartilhe experiências autênticas",
  },
  {
    id: "atrativos",
    emoji: "🗺️",
    titulo: "Atrativos e IA",
    descricao: "Roteiros e busca inteligente",
  },
];

/**
 * @param {import("@supabase/supabase-js").User | null} user
 * @param {{ nome?: string }} [perfil]
 * @returns {string}
 */
export function getUserName(user, perfil) {
  return (
    perfil?.nome ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuário"
  );
}

/**
 * @param {string} nome
 * @returns {string}
 */
export function getInitial(nome) {
  return String(nome || "?").charAt(0).toUpperCase();
}

/**
 * @param {import("@supabase/supabase-js").User | null} user
 * @returns {boolean}
 */
export function usesPhoneAuth(user) {
  if (!user) return false;

  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) {
    return providers.includes("phone") && !providers.includes("google");
  }

  if (user.app_metadata?.provider === "phone") return true;

  return Boolean(user.phone && !user.email);
}

/**
 * @param {import("@supabase/supabase-js").User | null} user
 * @returns {string}
 */
export function providerName(user) {
  const provider = user?.app_metadata?.provider;
  if (provider === "google") return "Google";
  if (provider === "phone") return "SMS";
  return provider || "Conta";
}

/**
 * @param {string} key
 * @returns {string}
 */
export function getNavAppLabel(key) {
  return NAV_APPS.find((app) => app.key === key)?.label || "Google Maps";
}

/**
 * @param {string} [createdAt]
 * @returns {string}
 */
export function formatMembroDesde(createdAt) {
  if (!createdAt) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

/**
 * @param {string} [value]
 * @returns {string}
 */
export function resolveAvatarUrl(user, perfil) {
  return (
    perfil?.foto_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}
