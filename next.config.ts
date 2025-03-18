import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "build",
  compiler: {
    styledComponents: true,
  },
  assetPrefix: "./",
};

export default nextConfig;
