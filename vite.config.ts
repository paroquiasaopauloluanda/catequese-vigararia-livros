import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // ignora erros de tipos no build de produção
    // (o tsc serve só para desenvolvimento local)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js'],
          xlsx: ['xlsx'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  esbuild: {
    // ignora erros de tipo TS no build
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})