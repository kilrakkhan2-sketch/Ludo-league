
/** @type {import('next').NextConfig} */
const env = {};

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (key.startsWith("''") && key.endsWith("''")) {
    key = key.substring(2, key.length - 2);
  }
  
  env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING = key;
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' }
    ],
  },
  env,
};

module.exports = nextConfig;
