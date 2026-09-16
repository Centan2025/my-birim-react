import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      sanity: path.resolve(__dirname, './src/test/mocks/sanity.ts'),
      '@sanity/orderable-document-list': path.resolve(
        __dirname,
        './src/test/mocks/sanityOrderableDocumentList.ts'
      ),
      '@sanity/ui': path.resolve(__dirname, './src/test/mocks/sanityUi.ts'),
      '@sanity/icons': path.resolve(__dirname, './src/test/mocks/sanityIcons.ts'),
      'styled-components': path.resolve(__dirname, './src/test/mocks/styledComponents.ts'),
      '@portabletext/editor': path.resolve(__dirname, './src/test/mocks/portableTextEditor.ts'),
      'browser-image-compression': path.resolve(
        __dirname,
        './src/test/mocks/browserImageCompression.ts'
      ),
      'react-image-crop': path.resolve(__dirname, './src/test/mocks/reactImageCrop.ts'),
      xlsx: path.resolve(__dirname, './src/test/mocks/xlsx.ts'),
      jszip: path.resolve(__dirname, './src/test/mocks/jszip.ts'),
    },
  },
})
