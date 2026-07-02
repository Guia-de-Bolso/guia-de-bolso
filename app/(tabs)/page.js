import HomePageClient from "@/components/home/HomePageClient";
import HomeSeoStatic from "@/components/home/HomeSeoStatic";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchHomePageInitialData } from "@/lib/homePageData";
import { buildHomeMetadata } from "@/lib/seo";
import { buildHomeJsonLd } from "@/lib/seoJsonLd";

export const metadata = buildHomeMetadata();

/**
 * Home — SSR do feed principal + shell SEO.
 * @returns {Promise<import('react').ReactElement>}
 */
export default async function HomePage() {
  const initialHomeData = await fetchHomePageInitialData();

  return (
    <>
      <JsonLdScript data={buildHomeJsonLd()} />
      <HomeSeoStatic lugaresCount={initialHomeData?.lugaresAtivos?.length ?? 0} />
      <HomePageClient initialHomeData={initialHomeData} />
    </>
  );
}
