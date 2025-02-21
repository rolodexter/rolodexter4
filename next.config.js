import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import webpack from 'webpack';

/**
 * Next.js Configuration
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 * - Vercel Blob Integration: agents/rolodexterVS/tasks/active-tasks/vercel-blob-integration.html
 */

// ES modules replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Allow serving static HTML files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'html'],
  
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
      '@': join(__dirname, './src'),
      '@components': join(__dirname, './src/components'),
      '@lib': join(__dirname, './src/lib'),
      '@utils': join(__dirname, './src/lib/utils'),
      '@db': join(__dirname, './src/lib/db'), // Direct import for database module
      '@styles': join(__dirname, './src/styles'),
      'pages': join(__dirname, './pages'),
      'api': join(__dirname, './pages/api')
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

    // Make assets directory accessible
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    });

    return config
  },
  // Environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    BLOB_STORE_NAME: 'rolodexter4-documents'
  },

  // Configure static file serving
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/projects/:path*',
          destination: '/api/static/:path*',
        },
      ],
    };
  },

  // Configure headers for static files
  async headers() {
    return [
      {
        source: '/projects/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    domains: [],
  },
};

export default nextConfig;