import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Trigger GitHub Actions build
export default defineConfig({
  base: '/lab-siskom/',
  plugins: [react()],

  // ── Build Optimization ──────────────────────────────────────
  build: {
    // Target modern browsers (desktop + tablet)
    target: 'es2020',

    // Enable CSS code splitting per chunk
    cssCodeSplit: true,

    // Inline assets smaller than 4KB
    assetsInlineLimit: 4096,

    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Vendor: React ecosystem — rarely changes, long-cache
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Icons: lucide-react is tree-shaken but still significant
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },

    // Chunk size warning threshold (KB)
    chunkSizeWarningLimit: 500,

    // Enable source maps for debugging (production)
    sourcemap: false,

    // Minification — Vite 8 uses oxc by default (esbuild is deprecated)
    minify: true,
  },

  // ── CSS Optimization ────────────────────────────────────────
  css: {
    // Enable CSS modules sourcemaps in dev only
    devSourcemap: true,
  },

  // ── Server (dev) ────────────────────────────────────────────
  server: {
    // Pre-transform known heavy deps
    warmup: {
      clientFiles: [
        './src/pages/Landing.tsx',
        './src/pages/LabWorkbench.tsx',
        './src/instruments/Oscilloscope.tsx',
      ],
    },
  },
})
