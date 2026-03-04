/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ayuda a que Next.js tracee e incluya sharp correctamente
  outputFileTracingIncludes: {
    '/**/*': [
      'node_modules/sharp/**/*',
      'node_modules/libvips/**/*',   // a veces ayuda
    ],
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
