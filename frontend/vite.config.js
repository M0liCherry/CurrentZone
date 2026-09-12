import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
<<<<<<< HEAD
      // Frontend "Connect Device" flow calls the FastAPI backend on :8000.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
=======
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
>>>>>>> 0931b3ffcbb54bf8e324a4080cb28534dcb0c580
    },
  },
})
