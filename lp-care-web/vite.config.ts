import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Pinned off Vite's default (5173) — that port is reserved for the
    // *other* project in this repo, medtech's web/. Its Google OAuth
    // client is only authorized for http://localhost:5173, so if this app
    // grabs 5173 first, web/ gets bumped to 5174 and Google Sign-In fails
    // outright with a 403 "origin not allowed" error.
    port: 5180,
    strictPort: true,
  },
})
