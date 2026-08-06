"use client";

import { AdminToastProvider } from "@/components/admin/AdminToastContext";

/**
 * Providers client do painel admin (toasts etc.).
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").JSX.Element}
 */
export default function AdminProviders({ children }) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
