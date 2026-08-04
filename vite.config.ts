import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {visualizer} from 'rollup-plugin-visualizer'
import {removeConsole} from './vite-plugin-remove-console'
import {VitePWA} from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Remove console.log in production builds (keep error and warn)
    removeConsole({exclude: ['error', 'warn']}),
    // PWA desteği — service worker + web app manifest
    VitePWA({
      registerType: 'autoUpdate',
      // Dev modunda SW devre dışı (cache karmaşasını önler)
      devOptions: {enabled: false},
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Birim',
        short_name: 'Birim',
        description: 'Birim — Tasarım ve Mobilya',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'tr',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Uygulama kabuğu (HTML, JS, CSS) — stale-while-revalidate
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Sanity CDN ve R2 görsellerini önbelleğe al (30 gün)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/assets\.birim\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'birim-assets-images',
              expiration: {maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60},
              cacheableResponse: {statuses: [0, 200]},
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.sanity\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sanity-images',
              expiration: {maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60},
              cacheableResponse: {statuses: [0, 200]},
            },
          },
          {
            urlPattern: /^https:\/\/birim-assets\.web-birim\.workers\.dev\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'r2-cdn-assets',
              expiration: {maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60},
              cacheableResponse: {statuses: [0, 200]},
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {statuses: [0, 200]},
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60},
              cacheableResponse: {statuses: [0, 200]},
            },
          },
        ],
      },
    }),
    // Bundle analyzer - only when ANALYZE env var is set
    process.env.ANALYZE === 'true' &&
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    hmr: {
      port: 3001,
    },
    proxy: {
      '/api/sanity': {
        target: 'https://wn3a082f.api.sanity.io',
        changeOrigin: true,
        secure: true,
        rewrite: (p: string) => {
          const url = new URL(p, 'http://localhost')
          const query = url.searchParams.get('query') || ''
          const perspective = url.searchParams.get('perspective') || 'published'
          const newUrl = new URL(
            `/v2025-01-01/data/query/production`,
            'https://wn3a082f.api.sanity.io'
          )
          newUrl.searchParams.set('query', query)
          newUrl.searchParams.set('returnQuery', 'false')
          newUrl.searchParams.set('perspective', perspective)
          // Forward GROQ params
          for (const [key, val] of url.searchParams.entries()) {
            if (key.startsWith('$')) {
              newUrl.searchParams.set(key, val)
            }
          }
          return newUrl.pathname + newUrl.search
        },
      },
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
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
