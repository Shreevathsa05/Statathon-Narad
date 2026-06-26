import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.lottie'],
  server: {
    port: 5174,
    proxy: {
      '/speech': {
        target: process.env.VITE_AI_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
