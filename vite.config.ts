import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {visualizer} from 'rollup-plugin-visualizer'
import {removeConsole} from './vite-plugin-remove-console'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Remove console.log in production builds (keep error and warn)
    removeConsole({exclude: ['error', 'warn']}),
    // Bundle analyzer - only when ANALYZE env var is set
    process.env.ANALYZE === 'true' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  server: {
    port: 3000,
    hmr: {
      port: 3000,
      host: 'localhost',
      clientPort: 3001, // Tarayıcı 3001'den erişiyorsa
    },
    watch: {
      // Gereksiz dosya değişikliklerini ignore et
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.git/**',
        '**/birim-web/dist/**',
        '**/*.log',
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'sanity-vendor': ['@sanity/client', '@sanity/image-url'],
        },
      },
    },
  },
})
