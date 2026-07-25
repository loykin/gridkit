import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Import directly from source — no rebuild needed during development
      '@loykin/gridkit/adapters/shadcn': resolve(__dirname, '../src/adapters/shadcn.tsx'),
      '@loykin/gridkit/adapters/mui': resolve(__dirname, '../src/adapters/mui.tsx'),
      '@loykin/gridkit': resolve(__dirname, '../src/index.ts'),
      '@': resolve(__dirname, '../src'),
    },
  },
})
