"use client";

import AppViewportShell from "@/components/AppViewportShell";
import CapacitorShell from "@/components/CapacitorShell";
import FeedbackProvider from "@/components/FeedbackProvider";
import FavoritosBackgroundSync from "@/components/favoritos/FavoritosBackgroundSync";
import OfflineModeProvider from "@/components/OfflineModeProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

/**
 * Providers client-side do app.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function ClientProviders({ children }) {
  return (
    <FeedbackProvider>
      <OfflineModeProvider>
        <ServiceWorkerRegister />
        <FavoritosBackgroundSync />
        <CapacitorShell />
        <AppViewportShell>{children}</AppViewportShell>
      </OfflineModeProvider>
    </FeedbackProvider>
  );
}
