
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Prevent crash if process is undefined in browser, but users should ideally use import.meta.env
    'process.env': process.env
  }
})
