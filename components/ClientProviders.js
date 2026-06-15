"use client";

import CapacitorShell from "@/components/CapacitorShell";
import FeedbackProvider from "@/components/FeedbackProvider";

/**
 * Providers client-side do app.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function ClientProviders({ children }) {
  return (
    <FeedbackProvider>
      <CapacitorShell />
      {children}
    </FeedbackProvider>
  );
}
