/** @type {import('next').NextConfig} */

const pwa_disabled = false;

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: pwa_disabled,
});

const nextConfig = {
  // Your Next.js configuration options here.
  // For example, you can add image optimization domains:
  // images: {
  //   domains: ['example.com'],
  // },
};

module.exports = withPWA(nextConfig);
