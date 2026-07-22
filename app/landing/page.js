import LandingPageClient from "@/components/landing/LandingPageClient";
import LandingSeoIntro from "@/components/landing/LandingSeoIntro";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchLandingPageData } from "@/lib/landingPageData";
import { buildLandingJsonLd } from "@/lib/seoJsonLd";
import { buildLandingMetadata } from "@/lib/seo";

export const metadata = buildLandingMetadata();

/** ISR — mock do app na landing reflete parceiros/catálogo atualizados. */
export const revalidate = 60;

/**
 * Landing marketing — SSR com lugares e categorias reais.
 * @returns {Promise<import('react').ReactElement>}
 */
export default async function LandingPage() {
  const initialData = await fetchLandingPageData();

  return (
    <>
      <JsonLdScript data={buildLandingJsonLd()} />
      <LandingSeoIntro />
      <LandingPageClient initialData={initialData} />
    </>
  );
}
