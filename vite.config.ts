import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      includeAssets: ["favicon.svg", "apple-touch-180.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,webp,png,svg,woff2,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
