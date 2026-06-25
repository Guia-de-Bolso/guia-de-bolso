import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.guiadebolso',
  appName: 'Guia de Bolso',
  webDir: 'out',
  server: {
    url: 'https://app.guiadebolso.app',
    cleartext: false,
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: true,
        twitter: false,
      },
    },
  },
};

export default config;