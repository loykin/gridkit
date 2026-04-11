import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Import directly from source — no rebuild needed during development
      '@loykin/data-grid': resolve(__dirname, '../src/index.ts'),
      '@': resolve(__dirname, '../src'),
    },
  },
})
