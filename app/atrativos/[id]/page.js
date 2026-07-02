import { notFound } from "next/navigation";
import JsonLdScript from "@/components/seo/JsonLdScript";
import AtrativoDetalhePremium from "@/components/atrativos/AtrativoDetalhePremium";
import AtrativoSeoStatic from "@/components/atrativos/AtrativoSeoStatic";
import { buildAtrativoMetadata } from "@/lib/seo";
import { buildAtrativoJsonLd } from "@/lib/seoJsonLd";
import { getFotosFromAtrativo } from "@/lib/fotos";
import { getGoogleMapsDirectionsUrlForAtrativo } from "@/lib/atrativoMaps";
import {
  formatAtrativoDistancia,
  formatAtrativoDuracao,
  getAtrativoMapsSubtitulo,
  getAtrativoNome,
} from "@/lib/atrativoDetalheDisplay";
import { getCategoriaAtrativoMeta } from "@/lib/atrativos";
import { getTagsFromAtrativo } from "@/lib/tags";
import { fetchCapacitorAtrativoIds } from "@/lib/capacitorStaticParams";
import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { createPublicPageServerClient } from "@/lib/supabase/pageServer";

// Params só no export estático do Capacitor; na web a rota fica dinâmica.
export const generateStaticParams = isCapacitorBuild()
  ? async () => fetchCapacitorAtrativoIds()
  : undefined;

/**
 * @param {{ params: Promise<{ id: string }> }} props
 * @returns {Promise<import('next').Metadata>}
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createPublicPageServerClient();
  const { data: rota } = await supabase.from("rotas").select("*").eq("id", id).maybeSingle();

  if (!rota) {
    return { title: "Atrativo não encontrado | Guia de Bolso", robots: { index: false, follow: false } };
  }

  return buildAtrativoMetadata(rota);
}

/**
 * Página de detalhe da rota/trilha.
 * @param {{ params: Promise<{ id: string }> }} props
 * @returns {Promise<import("react").ReactElement>}
 */
export default async function AtrativoDetalhePage({ params }) {
  const { id } = await params;
  const supabase = await createPublicPageServerClient();

  const { data: rota } = await supabase
    .from("rotas")
    .select("*, rotas_tags(tags(*))")
    .eq("id", id)
    .maybeSingle();

  if (!rota) notFound();

  const { data: pontosData } = await supabase
    .from("rota_pontos")
    .select("*, rota_ponto_detalhes(id, texto, ordem)")
    .eq("rota_id", id)
    .order("ordem", { ascending: true });

  const { data: dicasData } = await supabase
    .from("rota_dicas")
    .select("*")
    .eq("rota_id", id)
    .order("ordem", { ascending: true });

  const { data: localizacao } = await supabase
    .from("rotas_localizacoes")
    .select("*")
    .eq("rota_id", id)
    .maybeSingle();

  const pontos = pontosData ?? [];
  const dicas = dicasData ?? [];
  const nome = getAtrativoNome(rota);
  const categoria = getCategoriaAtrativoMeta(rota.categoria);
  const tags = getTagsFromAtrativo(rota);
  const fotos = getFotosFromAtrativo(rota);
  const mapsHref = getGoogleMapsDirectionsUrlForAtrativo(rota, localizacao);
  return (
    <>
      <JsonLdScript data={buildAtrativoJsonLd(rota)} />
      <AtrativoSeoStatic nome={nome} descricao={rota.descricao || ""} categoria={categoria.nome} />
      <AtrativoDetalhePremium
      rotaId={id}
      rota={rota}
      localizacao={localizacao}
      nome={nome}
      descricao={rota.descricao || ""}
      fotos={fotos}
      categoria={{ nome: categoria.nome, icone: categoria.icone }}
      tags={tags.map((t) => ({ id: t.id, nome: t.nome, icone: t.icone }))}
      duracao={formatAtrativoDuracao(rota)}
      distancia={formatAtrativoDistancia(rota)}
      dificuldade={rota.dificuldade || "Fácil"}
      mapsHref={mapsHref}
      mapsSubtitulo={getAtrativoMapsSubtitulo(rota, localizacao)}
      infoCards={[]}
      pontos={pontos}
      dicas={dicas}
    />
    </>
  );
}
