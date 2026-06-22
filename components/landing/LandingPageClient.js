"use client";

import LandingAppShowcase from "@/components/landing/LandingAppShowcase";
import LandingBusinessBenefits from "@/components/landing/LandingBusinessBenefits";
import LandingBusinessShowcase from "@/components/landing/LandingBusinessShowcase";
import LandingBusinessTestimonials from "@/components/landing/LandingBusinessTestimonials";
import LandingDiscover from "@/components/landing/LandingDiscover";
import LandingFinalCta from "@/components/landing/LandingFinalCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingMobileCta from "@/components/landing/LandingMobileCta";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingPartners from "@/components/landing/LandingPartners";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingTouristBenefits from "@/components/landing/LandingTouristBenefits";
import { useLandingMotion } from "@/components/landing/useLandingRichMotion";
import { getLandingFallbackData } from "@/lib/landingPageData";

/**
 * Landing premium — SSR, motion cinematográfico, dual audience.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData} [props.initialData]
 * @returns {import('react').ReactElement}
 */
export default function LandingPageClient({ initialData }) {
  const data = initialData ?? getLandingFallbackData();
  useLandingMotion();

  return (
    <>
      <LandingNavbar />
      <main id="conteudo-principal" className="pb-24 sm:pb-0">
        <LandingHero
          stats={data.stats}
          hasLiveData={data.hasLiveData}
          showcase={data.showcase}
          categorias={data.categorias}
          heroBackdrop={data.heroBackdrop}
        />
        <LandingSocialProof
          stats={data.stats}
          showcase={data.showcase}
          hasLiveData={data.hasLiveData}
        />
        <LandingDiscover
          discoverShowcase={data.discoverShowcase}
          categorias={data.categorias}
          hasLiveData={data.hasLiveData}
        />
        <LandingHowItWorks />
        <LandingTouristBenefits />
        <LandingAppShowcase categorias={data.categorias} stats={data.stats} />
        <LandingPartners stats={data.stats} />
        <LandingBusinessShowcase
          showcase={data.showcase}
          categorias={data.categorias}
          stats={data.stats}
          genericPartners
        />
        <LandingBusinessBenefits stats={data.stats} />
        <LandingBusinessTestimonials genericPartners />
        <LandingTestimonials stats={data.stats} />
        <LandingFinalCta />
      </main>
      <LandingFooter />
      <LandingMobileCta />
    </>
  );
}
