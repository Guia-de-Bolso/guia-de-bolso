"use client";

import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { useEffect, useState } from "react";
import { isBrowserOnline } from "@/lib/networkStatus";

/**
 * Estado de conectividade (navegador + Capacitor Network no app nativo).
 * @returns {{ isOnline: boolean, ready: boolean }}
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let networkListener;

    async function readStatus() {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Network.getStatus();
          if (!cancelled) setIsOnline(status.connected);
          return;
        } catch {
          /* fallback abaixo */
        }
      }
      if (!cancelled) setIsOnline(isBrowserOnline());
    }

    readStatus().finally(() => {
      if (!cancelled) setReady(true);
    });

    function onBrowserOnline() {
      setIsOnline(true);
    }

    function onBrowserOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", onBrowserOnline);
    window.addEventListener("offline", onBrowserOffline);

    if (Capacitor.isNativePlatform()) {
      Network.addListener("networkStatusChange", (status) => {
        setIsOnline(status.connected);
      }).then((handle) => {
        networkListener = handle;
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("online", onBrowserOnline);
      window.removeEventListener("offline", onBrowserOffline);
      networkListener?.remove();
    };
  }, []);

  return { isOnline, ready };
}
