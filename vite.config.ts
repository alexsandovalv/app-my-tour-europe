import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En GitHub Pages la app vive en /app-my-tour-europe/; el workflow define BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: { sourcemap: true },
})
