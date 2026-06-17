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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
  images: {
    minimumCacheTTL: 2592000,
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
};

export default nextConfig;
