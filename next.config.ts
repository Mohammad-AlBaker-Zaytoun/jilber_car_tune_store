import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Prisma's engine is a native binary — keep it external so the server bundle
  // loads it at runtime instead of trying to bundle it.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
