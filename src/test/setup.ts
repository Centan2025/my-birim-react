import '@testing-library/jest-dom'
import {cleanup} from '@testing-library/react'
import {afterEach} from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // Ignore in non-storage environments
  }
})

// Ensure sensitive backend keys are never leaked to client process.env
delete process.env['VITE_SUPABASE_SERVICE_ROLE_KEY']
delete process.env['VITE_JWT_SECRET']
delete process.env['VITE_ADMIN_SECRET']
delete process.env['VITE_HMAC_SECRET']
delete process.env['VITE_SANITY_WRITE_TOKEN']

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock IntersectionObserver (jsdom ortamında globalThis üzerinden tanımlıyoruz)
;(globalThis as unknown as Record<string, unknown>)['IntersectionObserver'] =
  class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
    unobserve() {}
  } as unknown as typeof IntersectionObserver
