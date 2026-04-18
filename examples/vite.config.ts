import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Import directly from source — no rebuild needed during development
      '@loykin/gridkit/styles': resolve(__dirname, '../src/styles/index.css'),
      '@loykin/gridkit': resolve(__dirname, '../src/index.ts'),
      '@': resolve(__dirname, '../src'),
    },
  },
})
