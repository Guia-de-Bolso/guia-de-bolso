import CategoriasExplorarClient from "@/components/explorar/CategoriasExplorarClient";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchExplorarPageData } from "@/lib/explorarPageData";
import { buildExplorarMetadata } from "@/lib/seo";
import { buildCategoriaJsonLd } from "@/lib/seoJsonLd";

export const metadata = buildExplorarMetadata();

/**
 * Explorar — categorias com dados iniciais no servidor.
 * @returns {Promise<import('react').ReactElement>}
 */
export default async function CategoriasPage() {
  const initialData = await fetchExplorarPageData();

  return (
    <>
      <JsonLdScript
        data={buildCategoriaJsonLd(
          "Explorar Imbituba",
          "Categorias e lugares para descobrir em Imbituba, SC."
        )}
      />
      <div className="sr-only">
        <h1>Explorar lugares em Imbituba</h1>
        <p>
          {initialData?.totalLugares
            ? `${initialData.totalLugares} lugares em ${initialData.categoriasComLugares} categorias.`
            : "Guia de descoberta por categoria em Imbituba."}
        </p>
      </div>
      <CategoriasExplorarClient initialData={initialData} />
    </>
  );
}
