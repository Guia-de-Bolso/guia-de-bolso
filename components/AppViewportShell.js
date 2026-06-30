"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { shouldUseAppViewportShell } from "@/lib/appViewport";

/**
 * Em telas largas (iPad), centraliza o app em coluna mobile com fundo full-screen.
 * Só no host do app — a landing em guiadebolso.app permanece full-width.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function AppViewportShell({ children }) {
  const pathname = usePathname() ?? "/";
  const [useShell, setUseShell] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    setUseShell(shouldUseAppViewportShell(pathname, host));
  }, [pathname]);

  if (!useShell) {
    return children;
  }

  return (
    <div className="app-viewport-shell">
      <div className="app-viewport-column">{children}</div>
    </div>
  );
}
