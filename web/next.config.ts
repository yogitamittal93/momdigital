import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import withSerwistInit from "@serwist/next";

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

// PWA / Service Worker — only for web builds, not mobile (Capacitor handles
// offline natively). Also disabled outside production to keep hot-reload working.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",       // your SW source (TypeScript OK)
  swDest: "public/sw.js",       // compiled output served statically
  disable: isMobileBuild || process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);

