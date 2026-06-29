"use client";

import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  FAVORITOS_OFFLINE_NAV_HREF,
  isFavoritosOfflineAllowedPath,
} from "@/lib/offlineNavigation";

const OfflineModeContext = createContext({
  isOnline: true,
  ready: false,
  offlineLimited: false,
});

/**
 * @returns {import("react").ContextType<typeof OfflineModeContext>}
 */
export function useOfflineMode() {
  return useContext(OfflineModeContext);
}

/**
 * Modo offline: redireciona para favoritos no app nativo e limita navegação.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function OfflineModeProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnline, ready } = useNetworkStatus();
  const nativeBootHandled = useRef(false);
  const offlineLimited = ready && !isOnline;

  useEffect(() => {
    if (!ready || isOnline) return;
    if (isFavoritosOfflineAllowedPath(pathname)) return;

    if (Capacitor.isNativePlatform() && !nativeBootHandled.current) {
      nativeBootHandled.current = true;
      window.location.replace(FAVORITOS_OFFLINE_NAV_HREF);
      return;
    }

    router.replace(FAVORITOS_OFFLINE_NAV_HREF);
  }, [ready, isOnline, pathname, router]);

  const value = useMemo(
    () => ({
      isOnline,
      ready,
      offlineLimited,
    }),
    [isOnline, ready, offlineLimited]
  );

  return <OfflineModeContext.Provider value={value}>{children}</OfflineModeContext.Provider>;
}
