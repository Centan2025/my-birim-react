/**
 * Vite plugin to remove console.log statements in production builds
 * Custom implementation to avoid external dependency issues
 */

import type {Plugin} from 'vite'

export function removeConsole(options: {exclude?: string[]} = {}): Plugin {
  const exclude = options.exclude || ['error', 'warn']

  return {
    name: 'remove-console',
    enforce: 'post',
    apply: 'build',
    transform(code: string, id: string) {
      // Skip node_modules and test files
      if (id.includes('node_modules') || id.includes('.test.') || id.includes('.spec.')) {
        return null
      }

      // Skip errorReporting.ts and webVitals.ts as they have complex console.log statements
      if (id.includes('errorReporting.ts') || id.includes('webVitals.ts')) {
        return null
      }

      // Only process JS/TS files
      if (!/\.(js|ts|jsx|tsx)$/.test(id)) {
        return null
      }

      // Remove console.log, console.debug, console.info
      // But keep console.error and console.warn (or excluded ones)
      let transformed = code

      // Remove console.log
      if (!exclude.includes('log')) {
        transformed = transformed.replace(/console\.log\([^)]*\);?/g, '')
      }

      // Remove console.debug
      if (!exclude.includes('debug')) {
        transformed = transformed.replace(/console\.debug\([^)]*\);?/g, '')
      }

      // Remove console.info
      if (!exclude.includes('info')) {
        transformed = transformed.replace(/console\.info\([^)]*\);?/g, '')
      }

      // Remove console.trace
      if (!exclude.includes('trace')) {
        transformed = transformed.replace(/console\.trace\([^)]*\);?/g, '')
      }

      // Remove console.table
      if (!exclude.includes('table')) {
        transformed = transformed.replace(/console\.table\([^)]*\);?/g, '')
      }

      return transformed !== code ? {code: transformed, map: null} : null
    },
  }
}
