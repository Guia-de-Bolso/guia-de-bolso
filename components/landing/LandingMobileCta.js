"use client";

import LandingButton from "@/components/landing/LandingButton";
import { LANDING_DOWNLOAD_HREF, LANDING_HERO } from "@/lib/landingContent";
import { useLandingNav } from "@/hooks/useLandingNav";

/**
 * CTAs fixos no mobile — thumb-friendly, sempre visíveis.
 * @returns {import('react').ReactElement}
 */
export default function LandingMobileCta() {
  const { exploreHref } = useLandingNav();

  return (
    <div
      className="landing-glass fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(10,22,18,0.08)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      role="group"
      aria-label="Ações principais"
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <LandingButton
          href={LANDING_DOWNLOAD_HREF}
          variant="primary"
          size="md"
          className="min-w-0 !px-4 text-[13px]"
        >
          {LANDING_HERO.ctaDownload}
        </LandingButton>
        <LandingButton
          href={exploreHref}
          variant="secondary"
          size="md"
          className="min-w-0 !px-4 text-[13px]"
        >
          {LANDING_HERO.ctaExplore}
        </LandingButton>
      </div>
    </div>
  );
}
