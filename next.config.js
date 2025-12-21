/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Match all API routes
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkOnly',
    },
    {
      // Match all navigation requests (pages)
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      // Match other requests (images, css, js, etc.)
      urlPattern: /.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    }
  ],
});

const nextConfig = {
  // Your Next.js configuration options here.
};

module.exports = withPWA(nextConfig);
