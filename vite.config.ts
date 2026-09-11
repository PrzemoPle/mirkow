import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

/** Numer wersji bierze się z package.json, żeby stopka nie rozjechała się z paczką. */
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
