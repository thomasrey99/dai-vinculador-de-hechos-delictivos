/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // xlsx (SheetJS) detecta el entorno revisando si "fs" está definido; el
  // bundling de webpack para el servidor rompe esa detección. Lo dejamos
  // externo para que se resuelva con require() normal de Node.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('xlsx');
    }
    return config;
  },
};

module.exports = nextConfig;
