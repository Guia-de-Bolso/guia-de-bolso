import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.guiadebolso.imbituba',
  appName: 'Guia de Bolso',
  webDir: 'out',
  server: {
    url: 'https://app.guiadebolso.app',
    cleartext: false,
  },
};

export default config;