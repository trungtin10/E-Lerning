import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => {
  // When running Vite behind ngrok, set HMR_HOST to the ngrok domain (no protocol)
  // Example: HMR_HOST=glumpy-dyspeptically-felecia.ngrok-free.dev
  const hmrHost = process.env.HMR_HOST

  return {
    plugins: [react()],
    server: {
      host: true,
      strictPort: true,
      allowedHosts: [
        'glumpy-dyspeptically-felecia.ngrok-free.dev',
        'localhost'
      ],
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      hmr: {
        host: hmrHost || 'glumpy-dyspeptically-felecia.ngrok-free.dev',
        protocol: 'wss',
        clientPort: 443,
        overlay: false
      },
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
}
})
