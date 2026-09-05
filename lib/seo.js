import { getCategoriaByNome, getCategoriaHref } from "@/lib/categorias";
import { getCapaFromLugar, getFotosFromAtrativo } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { roteiroDetalhePath } from "@/lib/roteirosPaths";
import { getAtrativoNome } from "@/lib/atrativoDetalheDisplay";
import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_ICONS, SITE_MANIFEST } from "@/lib/siteIcons.js";

import { SITE_BRAND_NAME, SITE_DEFAULT_DESCRIPTION, SITE_NAME_SHORT } from "./seoBrand.js";
import { truncateMetaDescription } from "./seoText.js";

export const SITE_NAME = SITE_NAME_SHORT;
const DEFAULT_DESCRIPTION = SITE_DEFAULT_DESCRIPTION;

export { truncateMetaDescription };

/**
 * @returns {URL}
 */
export function getMetadataBase() {
  return new URL(`${getSiteUrl()}/`);
}

/**
 * @param {object} options
 * @param {string} options.title - Sem sufixo do site (exceto se já incluir).
 * @param {string} [options.description]
 * @param {string} [options.path] - Caminho absoluto começando com /.
 * @param {string} [options.image] - URL absoluta ou relativa da imagem OG.
 * @param {boolean} [options.noIndex]
 * @returns {import('next').Metadata}
 */
export function buildPageMetadata({ title, description, path = "/", image, noIndex = false }) {
  const base = getMetadataBase();
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(canonicalPath.slice(1), base).toString();
  const desc = truncateMetaDescription(description);
  const fullTitle =
    title === SITE_NAME
      ? SITE_NAME
      : title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`;

  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : new URL(image.replace(/^\//, ""), base).toString()
    : new URL("opengraph-image", base).toString();

  const robots = noIndex ? { index: false, follow: false } : { index: true, follow: true };

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    robots,
    icons: SITE_ICONS,
    manifest: SITE_MANIFEST,
    applicationName: SITE_BRAND_NAME,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description: desc,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [imageUrl],
    },
  };
}

/**
 * @param {object} lugar
 * @returns {import('next').Metadata}
 */
export function buildLugarMetadata(lugar) {
  const nome = lugar?.nome || "Lugar";
  const categoria = lugar?.categoria ? ` · ${lugar.categoria}` : "";
  const title = `${nome}${categoria} · Imbituba`;
  const description =
    lugar?.descricao ||
    lugar?.descricao_longa ||
    `Confira ${nome} no Guia de Bolso — Imbituba, Santa Catarina.`;
  const image = getCapaFromLugar(lugar) || undefined;

  return buildPageMetadata({
    title,
    description,
    path: getLugarPublicPath(lugar),
    image,
  });
}

/**
 * @param {string} categoriaNome
 * @returns {import('next').Metadata}
 */
export function buildCategoriaMetadata(categoriaNome) {
  const meta = getCategoriaByNome(categoriaNome);
  const title = `${categoriaNome} em Imbituba`;
  const description =
    meta?.descricao ||
    `Descubra locais de ${categoriaNome} em Imbituba, SC — Guia de Bolso.`;

  return buildPageMetadata({
    title,
    description,
    path: getCategoriaHref(categoriaNome),
  });
}

/**
 * @param {object} rota
 * @returns {import('next').Metadata}
 */
export function buildAtrativoMetadata(rota) {
  const nome = getAtrativoNome(rota);
  const categoria = rota?.categoria ? ` · ${rota.categoria}` : "";
  const title = `${nome}${categoria} · Roteiro em Imbituba`;
  const fotos = getFotosFromAtrativo(rota);

  return buildPageMetadata({
    title,
    description: rota?.descricao || `Roteiro curado ${nome} no Guia de Bolso.`,
    path: roteiroDetalhePath(rota.id),
    image: fotos[0],
  });
}

/** Metadata padrão do site (layout). */
export const DEFAULT_SITE_METADATA = buildPageMetadata({
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

/**
 * Metadata da home (título e descrição dedicados).
 * @returns {import('next').Metadata}
 */
export function buildHomeMetadata() {
  return buildPageMetadata({
    title: "O que fazer em Imbituba, SC",
    description:
      "Praias, gastronomia, trilhas e atrativos em Imbituba. Busca com IA, mapas e curadoria local no Guia de Bolso.",
    path: "/",
  });
}

/**
 * Metadata da página Explorar / categorias.
 * @returns {import('next').Metadata}
 */
export function buildExplorarMetadata() {
  return buildPageMetadata({
    title: "Explorar Imbituba — categorias e lugares",
    description:
      "Navegue por Natureza, Gastronomia, Noite e mais. Encontre lugares em Imbituba por categoria.",
    path: "/categorias",
  });
}

/**
 * Metadata da landing Imbituba.
 * @returns {import('next').Metadata}
 */
export function buildImbitubaMetadata() {
  return buildPageMetadata({
    title: "Guia turístico de Imbituba, Santa Catarina",
    description:
      "Praias como Praia do Rosa e Praia da Vila, gastronomia, natureza e roteiros. Tudo no Guia de Bolso.",
    path: "/imbituba",
  });
}

/**
 * Metadata da landing marketing (/landing).
 * @returns {import('next').Metadata}
 */
export function buildLandingMetadata() {
  return buildPageMetadata({
    title: "Guia turístico de Imbituba, SC",
    description:
      "O que fazer em Imbituba: praias, Praia do Rosa, restaurantes e atrativos curados. App grátis na App Store e no Google Play — Guia de Bolso Imbituba.",
    path: "/",
  });
}

/**
 * Metadata da página Sobre (marca + desambiguação).
 * @returns {import('next').Metadata}
 */
export function buildSobreMetadata() {
  return buildPageMetadata({
    title: "Sobre o Guia de Bolso Imbituba — turismo, não finanças",
    description:
      "Conheça o Guia de Bolso Imbituba: app e site de turismo em Imbituba, SC, grátis na App Store e no Google Play. Sem relação com Guiabolso (finanças).",
    path: "/sobre",
  });
}

/**
 * Metadata de um artigo em /guia/[slug].
 * @param {{ metaTitle: string, metaDescription: string, slug: string }} guide
 * @returns {import('next').Metadata}
 */
export function buildGuiaMetadata(guide) {
  return buildPageMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: `/guia/${guide.slug}`,
  });
}

/**
 * Metadata do índice de guias.
 * @returns {import('next').Metadata}
 */
export function buildGuiaIndexMetadata() {
  return buildPageMetadata({
    title: "Guias de turismo em Imbituba, SC",
    description:
      "Praias, Praia do Rosa, onde comer, roteiros e lugares secretos. Artigos do Guia de Bolso — turismo local em Imbituba.",
    path: "/guia",
  });
}

/**
 * Metadata da landing B2B — estabelecimentos.
 * @returns {import('next').Metadata}
 */
export function buildParaNegociosMetadata() {
  return buildPageMetadata({
    title: "Anuncie no Guia de Bolso — Imbituba",
    description:
      "Apareça para turistas em Imbituba: carrossel na home, badge verificado, perfil completo e busca com IA. Plano Parceiro para estabelecimentos — fale conosco.",
    path: "/para-negocios",
  });
}
