"use client";

import AppViewportShell from "@/components/AppViewportShell";
import CapacitorAppLinks from "@/components/CapacitorAppLinks";
import CapacitorShell from "@/components/CapacitorShell";
import FeedbackProvider from "@/components/FeedbackProvider";
import FavoritosBackgroundSync from "@/components/favoritos/FavoritosBackgroundSync";
import OfflineModeProvider from "@/components/OfflineModeProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SwrProvider from "@/components/SwrProvider";

/**
 * Providers client-side do app.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function ClientProviders({ children }) {
  return (
    <SwrProvider>
      <FeedbackProvider>
        <OfflineModeProvider>
          <ServiceWorkerRegister />
          <FavoritosBackgroundSync />
          <CapacitorShell />
          <CapacitorAppLinks />
          <AppViewportShell>{children}</AppViewportShell>
        </OfflineModeProvider>
      </FeedbackProvider>
    </SwrProvider>
  );
}
