import type { CapacitorConfig } from "@capacitor/cli";

const liveReloadUrl = process.env.CAPACITOR_LIVE_RELOAD_URL?.trim();
const useLocalBundle = process.env.CAPACITOR_USE_LOCAL_BUNDLE === "1";

const plugins = {
  SocialLogin: {
    providers: {
      google: true,
      facebook: false,
      apple: true,
      twitter: false,
    },
  },
  PushNotifications: {
    presentationOptions: ["badge", "sound", "alert"],
  },
};

/**
 * Produção nativa (padrão): WebView remota (https://app.guiadebolso.app).
 * Um servidor real é necessário porque as rotas dinâmicas (detalhe de lugar,
 * atrativo e categoria) dependem de conteúdo vindo do banco em tempo de
 * execução. O bundle estático local só serve os params pré-renderizados no
 * build — qualquer local novo/fora do conjunto gera 404 + reload da página.
 *
 * Dev ao vivo: CAPACITOR_LIVE_RELOAD_URL=http://IP:3000
 * Bundle local (experimental): CAPACITOR_USE_LOCAL_BUNDLE=1
 */
function getServerConfig(): CapacitorConfig["server"] {
  if (liveReloadUrl) {
    return {
      url: liveReloadUrl,
      cleartext: liveReloadUrl.startsWith("http://"),
    };
  }

  if (useLocalBundle) {
    return {
      hostname: "app.guiadebolso.app",
      androidScheme: "https",
      iosScheme: "https",
    };
  }

  return {
    url: "https://app.guiadebolso.app",
    cleartext: false,
  };
}

const config: CapacitorConfig = {
  appId: "app.guiadebolso",
  appName: "Guia de Bolso",
  webDir: "out",
  server: getServerConfig(),
  plugins,
};

export default config;
