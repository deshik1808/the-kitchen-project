/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds (set STATIC_EXPORT=true)
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),

  // Proxy API calls to n8n to avoid CORS issues
  async rewrites() {
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_API_URL || 'https://n8n.srv1155211.hstgr.cloud/webhook';
    return [
      {
        source: '/api/n8n/:path*',
        destination: `${n8nUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
