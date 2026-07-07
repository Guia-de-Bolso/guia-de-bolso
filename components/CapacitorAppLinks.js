"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { openCapacitorAppLink } from "@/lib/capacitorAppLinks";

/**
 * Abre rotas de conteúdo quando o app é lançado via universal/app link.
 * @returns {null}
 */
export default function CapacitorAppLinks() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let cancelled = false;
    let urlListener;

    (async () => {
      try {
        const launch = await App.getLaunchUrl();
        if (!cancelled && launch?.url) {
          openCapacitorAppLink(launch.url);
        }
      } catch {
        /* getLaunchUrl indisponível */
      }

      try {
        urlListener = await App.addListener("appUrlOpen", (event) => {
          openCapacitorAppLink(event.url);
        });
      } catch {
        /* listener indisponível */
      }
    })();

    return () => {
      cancelled = true;
      urlListener?.remove?.();
    };
  }, []);

  return null;
}
