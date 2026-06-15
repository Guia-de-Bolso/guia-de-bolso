"use client";

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { initNativeSafeAreaInsets } from "@/lib/nativeSafeArea";

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
