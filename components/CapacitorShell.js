"use client";

import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { FAVORITOS_OFFLINE_NAV_HREF, isFavoritosOfflineAllowedPath } from "@/lib/offlineNavigation";
import { initNativeSafeAreaInsets } from "@/lib/nativeSafeArea";
import { ensureSocialLoginInitialized } from "@/lib/nativeSocialLoginInit";
import { ensurePushNotificationListeners } from "@/lib/pushNotifications";

/**
 * Inicializa status bar, splash e classe no document para safe areas no app nativo.
 * @returns {null}
 */
export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let cancelled = false;

    const applySafeArea = () => {
      if (!cancelled) initNativeSafeAreaInsets();
    };

    (async () => {
      try {
        const status = await Network.getStatus();
        const path = window.location.pathname || "/";
        if (!status.connected && !isFavoritosOfflineAllowedPath(path)) {
          window.location.replace(FAVORITOS_OFFLINE_NAV_HREF);
          return;
        }
      } catch {
        /* Network plugin indisponível */
      }

      try {
        await SplashScreen.hide();
      } catch {
        /* splash opcional */
      }

      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#00000000" });
        }
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* status bar indisponível em alguns emuladores */
      }

      if (!cancelled) {
        document.documentElement.classList.add("capacitor-native");
        applySafeArea();
      }

      ensureSocialLoginInitialized().catch((error) => {
        console.warn("SocialLogin.initialize:", error);
      });

      ensurePushNotificationListeners();
    })();

    window.addEventListener("resize", applySafeArea);
    window.addEventListener("orientationchange", applySafeArea);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", applySafeArea);
      window.removeEventListener("orientationchange", applySafeArea);
      document.documentElement.classList.remove("capacitor-native");
    };
  }, []);

  return null;
}
