import { SITE_DOMAIN } from "./siteContact.js";

/** Hostnames que exibem landing na raiz + rotas SEO públicas (sem app logado). */
export const MARKETING_HOSTS = new Set([SITE_DOMAIN, `www.${SITE_DOMAIN}`]);

/** Rotas estáticas exatas no domínio de marketing. */
export const PUBLIC_MARKETING_PATHS = new Set([
  "/",
  "/landing",
  "/termos",
  "/privacidade",
  "/excluir-conta",
  "/robots.txt",
  "/sitemap.xml",
  "/google8035674d06cf6295.html",
  "/llms.txt",
  "/imbituba",
  "/categorias",
  "/para-negocios",
  "/guia",
  "/sobre",
  "/baixar",
]);

/** Prefixos de rotas indexáveis (lugares, categorias, guias, rotas). */
export const PUBLIC_SEO_PATH_PREFIXES = [
  "/lugares/",
  "/categoria/",
  "/atrativos/",
  "/roteiros/",
  "/guia/",
];

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPublicSeoPath(pathname) {
  const path = String(pathname || "");
  if (!path.startsWith("/")) return false;
  return PUBLIC_SEO_PATH_PREFIXES.some(
    (prefix) => path.startsWith(prefix) && path.length > prefix.length
  );
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPublicMarketingPath(pathname) {
  return PUBLIC_MARKETING_PATHS.has(pathname) || isPublicSeoPath(pathname);
}

/**
 * @param {string} [host] - Host do request (sem porta).
 * @returns {boolean}
 */
export function isMarketingHost(host) {
  if (!host) return false;
  const normalized = host.toLowerCase().split(":")[0];
  return MARKETING_HOSTS.has(normalized);
}

/**
 * @param {import('next/server').NextRequest} request
 * @returns {string}
 */
export function getRequestHostname(request) {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
}

/** @typedef {"rewrite-landing" | "redirect-root" | "redirect-home" | "continue"} MarketingRouteAction */

/**
 * Decide a ação do middleware no domínio de marketing.
 * @param {string} pathname
 * @returns {MarketingRouteAction}
 */
export function getMarketingRouteAction(pathname) {
  if (pathname === "/landing") return "redirect-root";
  if (pathname === "/") return "rewrite-landing";
  // API, auth e assets de app — Vercel Cron e integrações usam o mesmo host de produção
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    return "continue";
  }
  if (!isPublicMarketingPath(pathname)) return "redirect-home";
  return "continue";
}
