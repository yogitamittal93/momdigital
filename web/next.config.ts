import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Check if we are running in the monorepo workspace or a standalone Docker container
const isMonorepo = fs.existsSync(path.join(__dirname, "../package.json"));

// When EXPORT_MOBILE=true, produce a fully-static export consumed by
// Capacitor (Android / iOS WebView). The live Docker/web build always
// uses the default `standalone` output — this env flag is ONLY set by the
// `build:mobile` script.
const isMobileBuild = process.env.EXPORT_MOBILE === "true";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : "standalone",
  // Capacitor WebViews load pages as file://…/index.html, so each route
  // directory must contain an actual index.html. trailingSlash achieves this.
  trailingSlash: isMobileBuild ? true : undefined,
  images: isMobileBuild ? { unoptimized: true } : {},
  turbopack: isMonorepo
    ? {
        root: path.join(__dirname, "../"),
      }
    : undefined,
};

export default nextConfig;

