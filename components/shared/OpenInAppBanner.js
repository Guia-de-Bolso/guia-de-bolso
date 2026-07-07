"use client";

import { useEffect, useState } from "react";
import { isCapacitorNative } from "@/lib/capacitorNavigation";
import { detectOpenInAppPlatform, isWhatsAppInAppBrowser } from "@/lib/inAppBrowser";
import {
  buildOpenInNativeAppHref,
  buildStoreInstallHref,
} from "@/lib/openInNativeApp";

/**
 * Banner fixo para abrir o conteúdo no app a partir do browser do WhatsApp.
 * @param {{ path: string }} props
 * @returns {import("react").ReactElement|null}
 */
export default function OpenInAppBanner({ path }) {
  const [openHref, setOpenHref] = useState(null);
  const [storeHref, setStoreHref] = useState(null);

  useEffect(() => {
    if (isCapacitorNative() || !isWhatsAppInAppBrowser()) return;

    const platform = detectOpenInAppPlatform();
    setOpenHref(buildOpenInNativeAppHref(path, platform));
    setStoreHref(buildStoreInstallHref(platform));
  }, [path]);

  if (!openHref) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[70] border-b border-[#163d31] bg-[#1a4a3a] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-lg">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-medium leading-snug">
          Melhor experiência no app Guia de Bolso
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {storeHref && (
            <a
              href={storeHref}
              className="rounded-full border border-white/35 px-3 py-1.5 text-xs font-semibold text-white/95"
            >
              Baixar
            </a>
          )}
          <a
            href={openHref}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1a4a3a]"
          >
            Abrir no app
          </a>
        </div>
      </div>
    </div>
  );
}
