/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,

  // ============================================================
  // IMAGE OPTIMIZATION
  // ============================================================
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'almokhtabar.com' },
      { protocol: 'https', hostname: 'cdn.almokhtabar.com' },
      { protocol: 'https', hostname: 'images.almokhtabar.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [475, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    loader: 'default',
  },

  // ============================================================
  // EXPERIMENTAL
  // ============================================================
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-popover',
      'framer-motion',
      'react-hook-form',
      'react-hot-toast',
    ],
    scrollRestoration: true,
    nextScriptWorkers: false,
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'FCP', 'INP', 'TTFB'],
    optimizeServerReact: true,
    caseSensitiveRoutes: true,
    useLightningcss: false,
  },

  // ============================================================
  // COMPILER
  // ============================================================
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' && {
      exclude: ['error', 'warn'],
    },
    reactRemoveProperties: process.env.NODE_ENV === 'production' && {
      properties: ['^data-testid$'],
    },
  },

  // ============================================================
  // WEBPACK
  // ============================================================
  webpack: (config, { dev, isServer }) => {
    // Tree-shaking: remove moment.js locale data except ar + en
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    );
    // Split larger vendor chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        radix: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'vendor-radix',
          chunks: 'all',
          priority: 30,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
          name: 'vendor-charts',
          chunks: 'all',
          priority: 20,
        },
        framer: {
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          name: 'vendor-framer',
          chunks: 'all',
          priority: 20,
        },
      };
    }
    return config;
  },

  // ============================================================
  // HEADERS
  // ============================================================
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-Powered-By', value: '' },
      ],
    },
    {
      source: '/:path*.((?:jpg|jpeg|gif|png|webp|avif|svg|ico))',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'Surrogate-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/fonts/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/favicon.ico',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
    {
      source: '/robots.txt',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
    {
      source: '/sitemap.xml',
      headers: [
        { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        { key: 'Surrogate-Control', value: 'no-store' },
      ],
    },
  ],

  // ============================================================
  // REDIRECTS
  // ============================================================
  redirects: async () => [
    { source: '/index.html', destination: '/', permanent: true },
    { source: '/index.php', destination: '/', permanent: true },
    { source: '/en/ar/:path*', destination: '/:path*', permanent: true },
    { source: '/ar/en/:path*', destination: '/en/:path*', permanent: true },
  ],
};

module.exports = nextConfig;
