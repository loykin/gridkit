import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/shadcn': 'src/adapters/shadcn.tsx',
    'adapters/mui': 'src/adapters/mui.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    '@mui/material',
    '@emotion/react',
    '@emotion/styled',
  ],
  treeshake: true,
})
