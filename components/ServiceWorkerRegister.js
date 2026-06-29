"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/serviceWorker";

/**
 * Registra service worker para shell offline de favoritos (produção).
 * @returns {null}
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();

    function onVisible() {
      if (document.visibilityState === "visible") {
        registerServiceWorker();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
