"use client";

import { useEffect } from "react";
import { registerServiceWorker, precacheFavoritosShell } from "@/lib/serviceWorker";

/**
 * Registra service worker para shell offline de favoritos (produção).
 * @returns {null}
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker().then(() => {
      if (typeof navigator !== "undefined" && navigator.onLine !== false) {
        void precacheFavoritosShell(["/favoritos"]);
      }
    });

    function onVisible() {
      if (document.visibilityState === "visible") {
        registerServiceWorker().then(() => {
          if (navigator.onLine !== false) {
            void precacheFavoritosShell(["/favoritos"]);
          }
        });
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
