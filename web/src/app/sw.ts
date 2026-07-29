// Service Worker for MomDigital PWA
// Built with Serwist v9 (the modern successor to Workbox/next-pwa)
//
// Caching strategy overview:
//   - App shell (JS/CSS/fonts): CacheFirst — super fast repeat loads
//   - Images: StaleWhileRevalidate — show cached instantly, refresh in background
//   - Google Fonts: CacheFirst (1 year) — never re-download fonts
//   - Navigation/pages: NetworkFirst — always try fresh, fall back to cache
//   - next/static: CacheFirst (immutable, content-hashed)

// Pull in ServiceWorker types for this file only (avoids conflicts with 'dom' in tsconfig)
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | { url: string; revision: string | null })[];
};

const serwist = new Serwist({
  // Precache all Next.js build output (JS chunks, CSS, etc.)
  precacheEntries: self.__SW_MANIFEST,

  // Skip the waiting phase — new SW activates immediately on next visit
  skipWaiting: true,

  // Claim all open tabs right away so caching kicks in without a reload
  clientsClaim: true,

  // Enable Navigation Preload to reduce latency on navigations
  navigationPreload: true,

  // Runtime caching from @serwist/next/worker — tuned for Next.js apps
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

