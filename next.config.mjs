import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Falha o build na Vercel se as variáveis públicas do Supabase não estiverem definidas.
 * Sem elas, o JS de produção não consegue buscar lugares (lista vazia na home).
 */
function assertSupabasePublicEnvForDeploy() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && key) return;

  const message =
    "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY " +
    "na Vercel (Settings → Environment Variables).";

  const isVercelProduction =
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

  if (isVercelProduction) {
    throw new Error(
      `Build bloqueado (Production): ${message} Marque Production + Preview e redeploy.`
    );
  }

  if (process.env.VERCEL === "1") {
    console.warn(
      `[next.config] Preview sem Supabase público — ${message} O app preview pode ficar sem dados até configurar Preview.`
    );
    return;
  }

  console.warn(`[next.config] ${message}`);
}

assertSupabasePublicEnvForDeploy();

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

/**
 * Origens extras do `next dev` (Capacitor live reload via IP da LAN).
 * Sem isso o Next 16 bloqueia chunks/HMR e a home fica no skeleton eterno.
 * @returns {string[]}
 */
function getAllowedDevOrigins() {
  const origins = new Set(["127.0.0.1", "localhost", "127.0.0.1:3000", "localhost:3000"]);

  const liveReload = process.env.CAPACITOR_LIVE_RELOAD_URL?.trim();
  if (liveReload) {
    try {
      const url = new URL(liveReload);
      if (url.hostname) {
        origins.add(url.hostname);
        if (url.host) origins.add(url.host);
      }
    } catch {
      /* ignore */
    }
  }

  const extra = process.env.ALLOWED_DEV_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const value = part.trim();
      if (value) origins.add(value);
    }
  }

  // IPs comuns de rede local (live reload no celular)
  for (const host of ["192.168.1.8", "192.168.0.10", "192.168.1.10"]) {
    origins.add(host);
    origins.add(`${host}:3000`);
  }

  return [...origins];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o Turbopack use ~/package-lock.json como raiz do monorepo.
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: getAllowedDevOrigins(),
  ...(isCapacitorBuild
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  async redirects() {
    return [
      { source: "/rotas", destination: "/atrativos", permanent: true },
      { source: "/rotas/:id", destination: "/atrativos/:id", permanent: true },
      { source: "/admin/rotas", destination: "/admin/atrativos", permanent: true },
      { source: "/admin/rotas/nova", destination: "/admin/atrativos/nova", permanent: true },
      {
        source: "/admin/rotas/:id/editar",
        destination: "/admin/atrativos/:id/editar",
        permanent: true,
      },
      { source: "/api/rotas", destination: "/api/atrativos", permanent: true },
      { source: "/api/rotas/:path*", destination: "/api/atrativos/:path*", permanent: true },
      { source: "/admin/lugares", destination: "/admin/locais", permanent: true },
      { source: "/admin/destaques", destination: "/admin/locais", permanent: true },
      { source: "/admin/destaques/:path*", destination: "/admin/locais", permanent: true },
    ];
  },
  images: {
    ...(isCapacitorBuild ? { unoptimized: true } : { minimumCacheTTL: 2592000, qualities: [60, 75] }),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rsdjbqzjdyeaedyqwrvc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/ffmpeg/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
