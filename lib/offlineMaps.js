/** Categorias em que o banner preventivo de mapas offline é mais relevante. */
export const OFFLINE_MAPS_PREPARE_CATEGORIES = new Set([
  "Natureza",
  "Aventura",
]);

export const OFFLINE_MAPS_SHEET_TITLE = "Sem internet para navegar";

export const OFFLINE_MAPS_SHEET_BODY =
  "A navegação passo a passo depende do app de mapas com a região baixada antes de sair. Se você já baixou o mapa de Imbituba no Google Maps ou Apple Maps, pode tentar abrir mesmo assim.";

export const OFFLINE_MAPS_PREPARE_BANNER =
  "Vai sem sinal? Baixe o mapa de Imbituba e região no Google Maps ou Apple Maps antes de sair.";

export const OFFLINE_MAPS_COORDS_HINT =
  "Use no app de mapas com mapa offline baixado, ou copie as coordenadas abaixo.";

/** @type {{ app: string, steps: string }[]} */
export const OFFLINE_MAPS_DOWNLOAD_TIPS = [
  {
    app: "Google Maps",
    steps: "Perfil → Mapas offline → selecione Imbituba e região → Baixar.",
  },
  {
    app: "Apple Maps",
    steps: "Abra o mapa da região → Toque em Baixar mapa (quando disponível no iOS).",
  },
  {
    app: "Waze",
    steps: "Menu → Configurações → Mapas offline → baixe a área antes de sair.",
  },
];

/**
 * @param {string} pathname
 * @param {boolean} isOnline
 * @param {string} [categoria]
 * @returns {boolean}
 */
export function shouldShowOfflineMapsPrepareBanner(pathname, isOnline, categoria) {
  if (!isOnline || !pathname) return false;

  if (pathname.startsWith("/favoritos") || pathname.startsWith("/atrativos")) {
    return true;
  }

  if (pathname.startsWith("/lugares") && categoria) {
    return OFFLINE_MAPS_PREPARE_CATEGORIES.has(categoria);
  }

  return false;
}
