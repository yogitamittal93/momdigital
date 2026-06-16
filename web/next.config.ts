import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Check if we are running in the monorepo workspace or a standalone Docker container
const isMonorepo = fs.existsSync(path.join(__dirname, "../package.json"));

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  turbopack: isMonorepo
    ? {
        root: path.join(__dirname, "../"),
      }
    : undefined,
};

export default nextConfig;
