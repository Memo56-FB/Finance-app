/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: process.env.FINANCE_NEXT_DIST_DIR ?? '.next',
  experimental: { agentUpgrade: 'security' },
};
export default nextConfig;
