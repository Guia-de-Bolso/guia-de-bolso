"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { BOTTOM_NAV_HREFS } from "@/lib/bottomNavRoutes";
import { resolveBottomNavTab } from "@/lib/tabShell";

/**
 * Layout das abas principais — mantém painéis visitados montados em memória
 * para troca instantânea entre Início, Explorar, Roteiros, Favoritos e Perfil.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function TabsShell({ children }) {
  const pathname = usePathname();
  const { root: activeRoot, isRoot: isActiveRoot } = resolveBottomNavTab(pathname);
  const [tabCache, setTabCache] = useState(() => ({}));

  useLayoutEffect(() => {
    if (!isActiveRoot || !activeRoot) return;

    setTabCache((prev) => {
      if (prev[activeRoot] === children) return prev;
      return { ...prev, [activeRoot]: children };
    });
  }, [activeRoot, children, isActiveRoot]);

  const showLiveChildren =
    !isActiveRoot || !activeRoot || !tabCache[activeRoot];

  return (
    <>
      {BOTTOM_NAV_HREFS.map((href) => {
        const panel = tabCache[href];
        if (!panel) return null;

        const isVisible = isActiveRoot && activeRoot === href;

        return (
          <div key={href} hidden={!isVisible} {...(!isVisible ? { inert: true } : {})}>
            {panel}
          </div>
        );
      })}

      {showLiveChildren ? children : null}

      <BottomNav />
    </>
  );
}
