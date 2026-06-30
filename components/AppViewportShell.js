"use client";

import { usePathname } from "next/navigation";
import { shouldUseAppViewportShell } from "@/lib/appViewport";

/**
 * Em telas largas (iPad), centraliza o app em coluna mobile com fundo full-screen.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function AppViewportShell({ children }) {
  const pathname = usePathname() ?? "/";

  if (!shouldUseAppViewportShell(pathname)) {
    return children;
  }

  return (
    <div className="app-viewport-shell">
      <div className="app-viewport-column">{children}</div>
    </div>
  );
}
