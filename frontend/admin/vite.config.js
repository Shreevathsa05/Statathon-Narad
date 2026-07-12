import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/question-generation': {
        target: process.env.VITE_AI_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/speech': {
        target: process.env.VITE_AI_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})