import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Library peta (MapLibre) memang besar, tapi baru dimuat saat section peta hampir terlihat.
    chunkSizeWarningLimit: 1200,
  },
})
