/** @type {import('next').NextConfig} */
const env = {};

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (key.startsWith("''") && key.endsWith("''")) {
      key = key.substring(2, key.length - 2);
    }

    const serviceAccount = JSON.parse(key);

    env.FIREBASE_PROJECT_ID = serviceAccount.project_id;
    env.FIREBASE_CLIENT_EMAIL = serviceAccount.client_email;
    env.FIREBASE_PRIVATE_KEY = serviceAccount.private_key;

  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY in next.config.js", e);
  }
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
