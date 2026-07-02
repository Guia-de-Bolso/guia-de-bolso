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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
