import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite enviar imagen principal y presentaciones
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
