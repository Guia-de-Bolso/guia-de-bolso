import { Suspense } from "react";
import { notFound } from "next/navigation";
import CategoriaPageClient from "@/components/categoria/CategoriaPageClient";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { getCategoriaByNome } from "@/lib/categorias";
import { queryLugaresForCategoria } from "@/lib/lugaresQuery";
import { buildCategoriaMetadata } from "@/lib/seo";
import { buildCategoriaJsonLd } from "@/lib/seoJsonLd";
import { fetchCapacitorCategoriaSlugs } from "@/lib/capacitorStaticParams";
import { createPageServerClient } from "@/lib/supabase/pageServer";

export async function generateStaticParams() {
  return fetchCapacitorCategoriaSlugs();
}

/**
 * @param {string} raw
 * @returns {string}
 */
function decodeCategoriaSlug(raw) {
  try {
    return decodeURIComponent(String(raw ?? "").trim());
  } catch {
    return String(raw ?? "").trim();
  }
}

/**
 * @param {{ params: Promise<{ slug: string }> }} props
 * @returns {Promise<import('next').Metadata>}
 */
export async function generateMetadata({ params }) {
  const categoria = decodeCategoriaSlug((await params).slug);
  const meta = getCategoriaByNome(categoria);

  if (!meta) {
    return {
      title: `Categoria | Guia de Bolso`,
      robots: { index: false, follow: false },
    };
  }

  return buildCategoriaMetadata(categoria);
}

/**
 * Listagem pública por categoria — SSR inicial + metadata.
 * @param {{ params: Promise<{ slug: string }> }} props
 * @returns {Promise<import('react').ReactElement>}
 */
export default async function CategoriaPage({ params }) {
  const categoria = decodeCategoriaSlug((await params).slug);
  const meta = getCategoriaByNome(categoria);

  if (!meta) notFound();

  const supabase = await createPageServerClient();

  const [{ data: lugares, error: lugaresError }, { data: subcategorias }] = await Promise.all([
    queryLugaresForCategoria(supabase, categoria, 100),
    supabase.from("subcategorias").select("*").eq("categoria", categoria).order("nome"),
  ]);

  if (lugaresError) {
    console.error("[categoria] lugares:", lugaresError.message);
  }

  return (
    <>
      <JsonLdScript data={buildCategoriaJsonLd(categoria, meta.descricao)} />
      <div className="sr-only">
        <h1>{categoria} em Imbituba</h1>
        <p>{meta.descricao}</p>
        <p>{(lugares ?? []).length} locais em {categoria}, Imbituba</p>
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
            Carregando…
          </div>
        }
      >
        <CategoriaPageClient
          categoria={categoria}
          categoriaMeta={meta}
          initialLugares={lugares ?? []}
          initialSubcategorias={subcategorias ?? []}
        />
      </Suspense>
    </>
  );
}
