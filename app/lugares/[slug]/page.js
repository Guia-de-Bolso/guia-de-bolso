import { notFound, permanentRedirect } from "next/navigation";
import JsonLdScript from "@/components/seo/JsonLdScript";
import LugarPageClient from "@/components/lugar/LugarPageClient";
import LugarSeoStatic from "@/components/lugar/LugarSeoStatic";
import { fetchLugarPageInitialData } from "@/lib/lugarPageData";
import { fetchLugarSeoBundle } from "@/lib/lugarSeoData";
import { isLugarUuidParam } from "@/lib/lugarPublicPath";
import { buildLugarMetadata } from "@/lib/seo";
import { buildLugarBreadcrumbJsonLd, buildLugarJsonLd, toJsonLdGraph } from "@/lib/seoJsonLd";
import { fetchCapacitorLugarSlugs } from "@/lib/capacitorStaticParams";
import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { createPublicPageServerClient } from "@/lib/supabase/pageServer";

// Só exporta params no export estático do Capacitor. Na web, a ausência de
// generateStaticParams mantém a rota dinâmica (SSR sob demanda), com 404 real
// e sem quebra de `DYNAMIC_SERVER_USAGE`.
export const generateStaticParams = isCapacitorBuild()
  ? async () => fetchCapacitorLugarSlugs()
  : undefined;

/**
 * @param {{ params: Promise<{ slug: string }> }} props
 * @returns {Promise<import('next').Metadata>}
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createPublicPageServerClient();
  const { lugar } = await fetchLugarSeoBundle(supabase, slug);

  if (!lugar) {
    return {
      title: `Lugar não encontrado | Guia de Bolso`,
      robots: { index: false, follow: false },
    };
  }

  return buildLugarMetadata(lugar);
}

/**
 * Detalhe público do lugar — URL canônica por slug; UUID legado redireciona 301.
 * @param {{ params: Promise<{ slug: string }> }} props
 * @returns {Promise<import('react').ReactElement>}
 */
export default async function LugarPage({ params }) {
  const { slug } = await params;
  const supabase = await createPublicPageServerClient();
  const initialData = await fetchLugarPageInitialData(supabase, slug);

  if (initialData.error) {
    console.error("[lugares] fetch:", initialData.error.message);
    notFound();
  }

  const { lugar, localizacao, rating } = initialData;

  if (!lugar) notFound();

  if (!isCapacitorBuild() && isLugarUuidParam(slug) && lugar.slug) {
    permanentRedirect(`/lugares/${encodeURIComponent(lugar.slug)}`);
  }

  const jsonLd = toJsonLdGraph([
    buildLugarJsonLd(lugar, localizacao, rating ?? undefined),
    buildLugarBreadcrumbJsonLd(lugar),
  ]);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <LugarSeoStatic
        nome={lugar.nome}
        descricao={lugar.descricao || lugar.descricao_longa}
        categoria={lugar.categoria}
      />
      <LugarPageClient
        lugarId={lugar.id}
        initialData={{
          lugar,
          localizacao,
          rating,
          tags: initialData.tags,
          fotos: initialData.fotos,
        }}
      />
    </>
  );
}
