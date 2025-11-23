import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // KONFIGURASI TAMBAHAN:
  server: {
    proxy: {
      // Meneruskan request /api ke Backend (Port 3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Polyfill untuk 'global' yang dibutuhkan beberapa lib kriptografi lama
  define: {
    'global': 'window',
  }
})