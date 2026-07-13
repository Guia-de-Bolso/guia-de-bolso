"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  clearPushNotificationsOnLogout,
  ensurePushNotificationListeners,
  syncPushNotificationsAfterLogin,
} from "@/lib/pushNotifications";

/**
 * Sincroniza push notifications com o estado de autenticação no app nativo.
 * @returns {null}
 */
export default function PushNotificationsProvider() {
  useEffect(() => {
    ensurePushNotificationListeners();

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
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
