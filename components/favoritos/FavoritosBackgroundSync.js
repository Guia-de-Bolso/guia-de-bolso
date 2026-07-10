"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { runFavoritosBackgroundSync } from "@/lib/favoritosBackgroundSync";
import { listOfflineFavoritos } from "@/lib/favoritosOffline";
import { buildFavoritosPrecachePaths } from "@/lib/serviceWorkerPaths";
import { precacheFavoritosShell } from "@/lib/serviceWorker";
import { createClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase/session";

/**
 * Mantém cache offline de favoritos atualizado quando o app está online.
 * @returns {null}
 */
export default function FavoritosBackgroundSync() {
  const { isOnline, ready } = useNetworkStatus();

  useEffect(() => {
    if (!ready || !isOnline) return undefined;

    let cancelled = false;

    async function syncNow() {
      const supabase = createClient();
      const user = await getSessionUser(supabase);
      if (cancelled || !user?.id) return;

      await runFavoritosBackgroundSync(supabase, user.id);
      if (!cancelled) {
        const currentUser = await getSessionUser(supabase);
        if (currentUser?.id) {
          const cached = await listOfflineFavoritos(currentUser.id);
          const paths = buildFavoritosPrecachePaths(cached.lugares, cached.atrativos);
          await precacheFavoritosShell(paths);
        } else {
          await precacheFavoritosShell(["/favoritos"]);
        }
      }
    }

    syncNow();

    function onVisible() {
      if (document.visibilityState === "visible") {
        syncNow();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    let appListener;

    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) syncNow();
      }).then((handle) => {
        appListener = handle;
      });
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      appListener?.remove();
    };
  }, [ready, isOnline]);

  return null;
}
