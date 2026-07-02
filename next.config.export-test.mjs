
function assertSupabasePublicEnvForDeploy() {}
assertSupabasePublicEnvForDeploy();
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  async redirects() { return []; },
};
export default nextConfig;
