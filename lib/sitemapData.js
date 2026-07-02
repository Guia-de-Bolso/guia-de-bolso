import { getCategoriasVisiveis, getCategoriaHref } from "@/lib/categorias";
import { GUIA_GUIDES } from "@/lib/guiaCatalog";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { applyPublicLugarFilters } from "@/lib/publicCatalog";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/siteUrl";

/** @typedef {{ url: string, lastModified: Date, changeFrequency: import('next').MetadataRoute.Sitemap[number]['changeFrequency'], priority: number }} SitemapEntry */

/**
 * Páginas estáticas e hubs de conteúdo.
 * @param {string} base
 * @param {Date} now
 * @returns {SitemapEntry[]}
 */
function buildStaticSitemapEntries(base, now) {
  /** @type {Array<{ path: string, changeFrequency: SitemapEntry['changeFrequency'], priority: number }>} */
  const staticPages = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/imbituba", changeFrequency: "weekly", priority: 0.9 },
    { path: "/guia", changeFrequency: "weekly", priority: 0.88 },
    { path: "/para-negocios", changeFrequency: "monthly", priority: 0.85 },
    { path: "/sobre", changeFrequency: "monthly", priority: 0.82 },
    { path: "/categorias", changeFrequency: "weekly", priority: 0.85 },
    { path: "/termos", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
    { path: "/excluir-conta", changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const guide of GUIA_GUIDES) {
    staticPages.push({
      path: `/guia/${guide.slug}`,
      changeFrequency: "weekly",
      priority: guide.sitemapPriority ?? 0.85,
    });
  }

  return staticPages.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

/**
 * Entradas do sitemap para produção (domínio marketing + SEO).
 * @returns {Promise<SitemapEntry[]>}
 */
export async function fetchPublicSitemapEntries() {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();
  const entries = buildStaticSitemapEntries(base, now);

  for (const cat of getCategoriasVisiveis()) {
    entries.push({
      url: `${base}${getCategoriaHref(cat.nome)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  try {
    const supabase = await createClient();

    const { data: lugares, error: lugaresError } = await applyPublicLugarFilters(
      supabase.from("lugares").select("id, slug, created_at")
    ).limit(500);

    if (lugaresError) {
      console.warn("[sitemap] lugares:", lugaresError.message);
    } else {
      for (const lugar of lugares ?? []) {
        const path = getLugarPublicPath(lugar);
        if (path === "/") continue;
        const lastModified = lugar.created_at ? new Date(lugar.created_at) : now;
        entries.push({
          url: `${base}${path}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    }

    const { data: rotas, error: rotasError } = await supabase
      .from("rotas")
      .select("id, created_at")
      .limit(100);

    if (rotasError) {
      console.warn("[sitemap] rotas:", rotasError.message);
    } else {
      for (const rota of rotas ?? []) {
        if (!rota?.id) continue;
        entries.push({
          url: `${base}/atrativos/${rota.id}`,
          lastModified: rota.created_at ? new Date(rota.created_at) : now,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }
  } catch (err) {
    console.warn("[sitemap] fetch:", err instanceof Error ? err.message : err);
  }

  return entries;
}
