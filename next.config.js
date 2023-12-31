/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "build",
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  assetPrefix: "./",
};

module.exports = nextConfig;
