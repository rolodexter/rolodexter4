import path from 'path';
import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enhanced webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Optimize file watching
    config.watchOptions = {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/DumpStack.log.tmp',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys',
        '**/tmp/**',
        '**/temp/**'
      ],
      poll: false,
      followSymlinks: false,
      // Add aggregation timeout to reduce CPU load
      aggregateTimeout: 300
    }

    // Path aliases for cleaner imports - aligned with tsconfig.json
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, './src'),
      '@components': path.join(__dirname, './src/components'),
      '@lib': path.join(__dirname, './src/lib'),
      '@utils': path.join(__dirname, './src/lib/utils'),
      '@db': path.join(__dirname, './src/lib/db'),
      '@styles': path.join(__dirname, './src/styles')
    }

    // Development-specific optimizations
    if (dev) {
      config.devServer = {
        ...config.devServer,
        watchOptions: {
          ignored: config.watchOptions.ignored
        }
      }
    }

    // Skip blob sync during build if environment variables aren't available
    if (process.env.VERCEL_ENV === 'production' && !process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('Skipping blob sync during build - BLOB_READ_WRITE_TOKEN not available');
      config.plugins = config.plugins || [];
      config.plugins.push(new webpack.DefinePlugin({
        'process.env.SKIP_BLOB_SYNC': JSON.stringify('true'),
      }));
    }

    return config
  },
  // Environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    BLOB_STORE_NAME: 'rolodexter4-documents'
  }
}

export default nextConfig;