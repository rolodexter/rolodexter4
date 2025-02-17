/** @type {import('next').NextConfig} */
const path = require('path')

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

    // Path aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
      '@components': path.join(__dirname, 'components'),
      '@lib': path.join(__dirname, 'lib'),
      '@styles': path.join(__dirname, 'styles'),
      '@utils': path.join(__dirname, 'utils')
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

    return config
  },
  // Environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }
}

module.exports = nextConfig