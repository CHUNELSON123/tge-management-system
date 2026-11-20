import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  allowedDevOrigins: (process.env.TGE_DEV_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
  async rewrites() {
    return process.env.TGE_DEV_API_PROXY === "1"
      ? [{ source: "/api/:path*", destination: "http://127.0.0.1:4000/api/:path*" }]
      : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
