/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize file watching for Windows environments
  webpack: (config, { isServer }) => {
    // Ignore watch errors for Windows system files
    config.watchOptions = {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/DumpStack.log.tmp',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys'
      ],
      poll: false,
      followSymlinks: false
    }
    return config
  }
}

module.exports = nextConfig