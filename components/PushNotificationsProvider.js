"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { PUSH_NAVIGATE_EVENT } from "@/lib/pushNotificationOpen";
import {
  clearPushNotificationsOnLogout,
  ensurePushNotificationListeners,
  syncPushNotificationsAfterLogin,
} from "@/lib/pushNotifications";

/**
 * Sincroniza push notifications com o estado de autenticação no app nativo.
 * Soft-nav no tap quando o app já está hidratado (sem reload completo).
 * @returns {null}
 */
export default function PushNotificationsProvider() {
  const router = useRouter();

  useEffect(() => {
    ensurePushNotificationListeners();

    /**
     * @param {Event} event
     */
    function onPushNavigate(event) {
      const path =
        event && typeof event === "object" && "detail" in event
          ? event.detail?.path
          : null;
      if (typeof path !== "string" || !path) return;

      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      router.replace(path);
    }

    window.addEventListener(PUSH_NAVIGATE_EVENT, onPushNavigate);

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        syncPushNotificationsAfterLogin().catch((error) => {
          console.warn("syncPushNotificationsAfterLogin:", error);
        });
        return;
      }

      if (event === "SIGNED_OUT") {
        clearPushNotificationsOnLogout().catch((error) => {
          console.warn("clearPushNotificationsOnLogout:", error);
        });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        syncPushNotificationsAfterLogin().catch((error) => {
          console.warn("syncPushNotificationsAfterLogin:", error);
        });
      }
    });

    return () => {
      window.removeEventListener(PUSH_NAVIGATE_EVENT, onPushNavigate);
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
