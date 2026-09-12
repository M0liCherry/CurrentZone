import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      // Frontend "Connect Device" flow calls the FastAPI backend on :8000.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
