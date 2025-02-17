import path from 'path';
import webpack from 'webpack';

/**
 * Next.js Configuration
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 * - Vercel Blob Integration: agents/rolodexterVS/tasks/active-tasks/vercel-blob-integration.html
 */
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
    // See agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html for structure details
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, './src'),
      '@components': path.join(__dirname, './src/components'),
      '@lib': path.join(__dirname, './src/lib'),
      '@utils': path.join(__dirname, './src/lib/utils'),
      '@db': path.join(__dirname, './src/lib/db'), // Direct import for database module
      '@styles': path.join(__dirname, './src/styles'),
      'pages': path.join(__dirname, './pages'),
      'api': path.join(__dirname, './pages/api')
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
    // Related to: agents/rolodexterVS/tasks/active-tasks/vercel-blob-integration.html
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