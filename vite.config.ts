
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Fix: Safely map process.env.API_KEY for the browser
    'process.env': {
      API_KEY: process.env.API_KEY || ''
    }
  }
})
