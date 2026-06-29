"use client";

import CapacitorShell from "@/components/CapacitorShell";
import FeedbackProvider from "@/components/FeedbackProvider";
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
        <CapacitorShell />
        {children}
      </OfflineModeProvider>
    </FeedbackProvider>
  );
}
