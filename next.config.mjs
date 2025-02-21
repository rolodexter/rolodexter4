/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    BLOB_STORE_NAME: 'rolodexter4-documents'
  },
  webpack: (config, { isServer }) => {
    // Ignore .env files in webpack and suppress warnings
    config.ignoreWarnings = [
      { module: /\.env$/ },
      { message: /ENOENT: no such file or directory, stat.*\.env/ }
    ];
    return config;
  }
};

export default nextConfig;
