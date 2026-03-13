import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5211',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5211',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
