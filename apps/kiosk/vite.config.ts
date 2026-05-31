import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Hotel Kiosk",
        short_name: "Kiosk",
        description: "Self-service hotel check-in / check-out kiosk",
        display: "standalone",
        start_url: "/",
        theme_color: "#1d4ed8",
        background_color: "#ffffff",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/trpc\/.*/,
            handler: "NetworkFirst",
            options: { cacheName: "trpc-cache", networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3002,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  resolve: {
    alias: { "@": "/src" },
  },
})
