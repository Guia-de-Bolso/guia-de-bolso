import { getCategoriaHref } from "./categorias.js";
import { getCapaFromLugar, getFotosFromAtrativo } from "./fotos.js";
import { isLugarPublico } from "./lugarDetalhe.js";
import { getLugarPublicPath, getLugarPublicUrl } from "./lugarPublicPath.js";
import { getAtrativoNome } from "./atrativoDetalheDisplay.js";
import { mergeGuiaFaq, SITE_BRAND_NAME, SITE_NAME_SHORT } from "./seoBrand.js";
import { SOCIAL_LINKS, SITE_CONTACT_PHONE_E164 } from "./siteContact.js";
import { truncateMetaDescription } from "./seoText.js";
import { roteiroDetalhePath } from "./roteirosPaths.js";
import { getSiteUrl } from "./siteUrl.js";

const SITE_LABEL = SITE_NAME_SHORT;

const PUBLISHER = {
  "@type": "Organization",
  name: SITE_LABEL,
  alternateName: [SITE_BRAND_NAME, "Guia de Bolso SC", "Guia de Bolso turismo"],
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/logo.png`,
  sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.tiktok],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: SITE_CONTACT_PHONE_E164,
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
  description:
    "App e guia turístico de Imbituba, Santa Catarina — praias, gastronomia e roteiros. Não tem relação com serviços financeiros.",
};

/**
 * @param {object|null|undefined} localizacao
 * @returns {object|null}
 */
function buildPostalAddress(localizacao) {
  const endereco = localizacao?.endereco_completo?.trim();
  if (!endereco) return null;

  return {
    "@type": "PostalAddress",
    streetAddress: endereco,
    addressLocality: "Imbituba",
    addressRegion: "SC",
    addressCountry: "BR",
  };
}

/**
 * @param {object|null|undefined} localizacao
 * @returns {object|null}
 */
function buildGeo(localizacao) {
  const lat = Number(localizacao?.latitude);
  const lng = Number(localizacao?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    "@type": "GeoCoordinates",
    latitude: lat,
    longitude: lng,
  };
}

/**
 * @param {{ media?: number, count?: number }} [rating]
 * @returns {object|null}
 */
function buildAggregateRating(rating) {
  const count = Number(rating?.count) || 0;
  const media = Number(rating?.media);
  if (count <= 0 || !Number.isFinite(media) || media <= 0) return null;

  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(media * 10) / 10,
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * @param {object} lugar
 * @returns {string}
 */
export function getLugarSchemaType(lugar) {
  if (lugar?.categoria === "Gastronomia") return "FoodEstablishment";
  if (isLugarPublico(lugar)) return "TouristAttraction";
  return "LocalBusiness";
}

/**
 * JSON-LD para detalhe do lugar.
 * @param {object} lugar
 * @param {object|null} [localizacao]
 * @param {{ media?: number, count?: number }} [rating]
 * @returns {object}
 */
export function buildLugarJsonLd(lugar, localizacao = null, rating) {
  const type = getLugarSchemaType(lugar);
  const url = getLugarPublicUrl(lugar);
  const image = getCapaFromLugar(lugar);
  const description = truncateMetaDescription(
    lugar?.descricao || lugar?.descricao_longa || `Local em Imbituba: ${lugar?.nome}`
  );

  /** @type {Record<string, unknown>} */
  const node = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#place`,
    name: lugar?.nome,
    description,
    url,
    image: image || undefined,
    address: buildPostalAddress(localizacao) || undefined,
    geo: buildGeo(localizacao) || undefined,
    aggregateRating: buildAggregateRating(rating) || undefined,
    isAccessibleForFree: true,
  };

  if (lugar?.telefone) {
    node.telephone = lugar.telefone;
  }

  return node;
}

/**
 * BreadcrumbList para detalhe do lugar.
 * @param {object} lugar
 * @returns {object}
 */
export function buildLugarBreadcrumbJsonLd(lugar) {
  const base = getSiteUrl();
  const items = [
    { name: "Início", path: "/" },
  ];

  if (lugar?.categoria) {
    items.push({ name: lugar.categoria, path: getCategoriaHref(lugar.categoria) });
  }

  items.push({ name: lugar?.nome || "Lugar", path: getLugarPublicPath(lugar) });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

/**
 * @param {object} rota
 * @returns {object}
 */
export function buildAtrativoJsonLd(rota) {
  const nome = getAtrativoNome(rota);
  const url = `${getSiteUrl()}${roteiroDetalhePath(rota.id)}`;
  const image = getFotosFromAtrativo(rota)[0];

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: nome,
    description: truncateMetaDescription(rota?.descricao || `Atrativo curado em Imbituba: ${nome}`),
    url,
    image: image || undefined,
    touristType: "https://schema.org/Tourist",
    provider: PUBLISHER,
  };
}

/**
 * @param {string} categoriaNome
 * @param {string} [descricao]
 * @returns {object}
 */
export function buildCategoriaJsonLd(categoriaNome, descricao) {
  const url = `${getSiteUrl()}${getCategoriaHref(categoriaNome)}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoriaNome} em Imbituba`,
    description: truncateMetaDescription(
      descricao || `Locais de ${categoriaNome} em Imbituba, Santa Catarina.`
    ),
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "Guia de Bolso",
      url: getSiteUrl(),
    },
  };
}

/**
 * WebSite + Organization para a home.
 * @returns {object}
 */
export function buildHomeJsonLd() {
  const url = getSiteUrl();

  return toJsonLdGraph([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_LABEL,
      url,
      description: truncateMetaDescription(
        "Guia oficial de Imbituba — praias, trilhas, gastronomia e roteiros."
      ),
      inLanguage: "pt-BR",
      publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristInformationCenter",
      name: SITE_LABEL,
      url,
      description: "Guia de descoberta local para Imbituba, Santa Catarina, Brasil",
      areaServed: {
        "@type": "City",
        name: "Imbituba",
        containedInPlace: {
          "@type": "State",
          name: "Santa Catarina",
        },
      },
    },
  ]);
}

/**
 * JSON-LD da landing marketing (/) — Organization + WebSite + destino turístico + app nas lojas.
 * @returns {object}
 */
export function buildLandingJsonLd() {
  const url = getSiteUrl();

  return toJsonLdGraph([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_LABEL,
      alternateName: SITE_BRAND_NAME,
      url,
      description: truncateMetaDescription(
        "Guia turístico de Imbituba, SC — praias, gastronomia, roteiros e lugares curados. App grátis na App Store e no Google Play."
      ),
      inLanguage: "pt-BR",
      publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      ...PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: "Imbituba",
      description:
        "Destino litorâneo em Santa Catarina — Praia do Rosa, Praia da Vila, surf e turismo de natureza.",
      containedInPlace: {
        "@type": "State",
        name: "Santa Catarina",
        containedInPlace: { "@type": "Country", name: "Brasil" },
      },
      touristType: ["Praias", "Ecoturismo", "Gastronomia"],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_LABEL,
      alternateName: SITE_BRAND_NAME,
      applicationCategory: "TravelApplication",
      operatingSystem: "iOS, Android",
      url: `${url}/baixar`,
      downloadUrl: `${url}/baixar`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
      description: truncateMetaDescription(
        "App de turismo de Imbituba, SC — praias, gastronomia e busca com IA. Disponível na App Store e no Google Play."
      ),
    },
  ]);
}

/**
 * JSON-LD Article (+ FAQ opcional) para /guia/[slug].
 * @param {{ title: string, metaDescription: string, slug: string, faq?: { question: string, answer: string }[] }} guide
 * @returns {object}
 */
export function buildGuiaArticleJsonLd(guide) {
  const url = `${getSiteUrl()}/guia/${guide.slug}`;
  const faq = mergeGuiaFaq(guide.faq);

  /** @type {object[]} */
  const graphs = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: truncateMetaDescription(guide.metaDescription),
      url,
      inLanguage: "pt-BR",
      author: PUBLISHER,
      publisher: PUBLISHER,
      about: {
        "@type": "City",
        name: "Imbituba",
      },
    },
  ];

  if (faq.length) {
    graphs.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return toJsonLdGraph(graphs);
}

/**
 * JSON-LD AboutPage + FAQ para /sobre.
 * @returns {object}
 */
export function buildSobrePageJsonLd() {
  const url = `${getSiteUrl()}/sobre`;
  const faq = mergeGuiaFaq();

  return toJsonLdGraph([
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: `${SITE_BRAND_NAME} — turismo em Imbituba`,
      url,
      description: truncateMetaDescription(PUBLISHER.description),
      inLanguage: "pt-BR",
      isPartOf: { "@type": "WebSite", name: SITE_LABEL, url: getSiteUrl() },
      about: PUBLISHER,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ]);
}

/**
 * @param {object[]} graphs
 * @returns {object}
 */
export function toJsonLdGraph(graphs) {
  const filtered = graphs.filter(Boolean);
  if (filtered.length === 1) return filtered[0];
  return {
    "@context": "https://schema.org",
    "@graph": filtered.map((g) => {
      const { "@context": _ctx, ...rest } = g;
      return rest;
    }),
  };
}
