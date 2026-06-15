"use client";

import LandingBusinessShowcase from "@/components/landing/LandingBusinessShowcase";
import LandingBusinessTestimonials from "@/components/landing/LandingBusinessTestimonials";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import NegociosCuradoriaSection from "@/components/negocios/NegociosCuradoriaSection";
import NegociosFaq, { NegociosHowItWorks } from "@/components/negocios/NegociosFaq";
import NegociosHero from "@/components/negocios/NegociosHero";
import NegociosParceirosSection from "@/components/negocios/NegociosParceirosSection";
import NegociosPlans from "@/components/negocios/NegociosPlans";
import NegociosFinalCta from "@/components/negocios/NegociosFinalCta";
import NegociosValueGrid from "@/components/negocios/NegociosValueGrid";
import { useLandingMotion } from "@/components/landing/useLandingRichMotion";
import { getLandingFallbackData } from "@/lib/landingPageData";

/**
 * @param {import('@/lib/landingPageData').LandingPageData} base
 * @returns {import('@/lib/negociosPageData').NegociosPageData}
 */
function getNegociosClientFallback(base) {
  return {
    ...base,
    parceirosTodos: base.parceiros ?? [],
    curadoria: { count: 0, amostra: [] },
    atrativosAmostra: base.atrativos ?? [],
  };
}

/**
 * Página dedicada para anunciantes / estabelecimentos.
 * @param {object} props
 * @param {import('@/lib/negociosPageData').NegociosPageData} [props.initialData]
 * @returns {import('react').ReactElement}
 */
export default function NegociosPageClient({ initialData }) {
  const data =
    initialData ?? getNegociosClientFallback(getLandingFallbackData());
  useLandingMotion();

  return (
    <>
      <LandingNavbar />
      <main id="conteudo-principal" className="pb-16">
        <NegociosHero stats={data.stats} />
        <NegociosValueGrid />
        <LandingBusinessShowcase
          parceiros={data.parceirosTodos?.length ? data.parceirosTodos : data.parceiros}
          showcase={data.showcase}
          categorias={data.categorias}
          stats={data.stats}
          sectionId="como-aparece"
          compact
        />
        <NegociosCuradoriaSection
          curadoria={data.curadoria}
          atrativosAmostra={data.atrativosAmostra}
          stats={data.stats}
        />
        <NegociosPlans />
        <NegociosHowItWorks />
        <NegociosParceirosSection
          parceirosTodos={data.parceirosTodos}
          total={data.stats?.parceirosCount}
        />
        <LandingBusinessTestimonials sectionId="depoimentos-parceiros" />
        <NegociosFaq />
        <NegociosFinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
