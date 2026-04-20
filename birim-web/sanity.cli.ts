/**
 * SHIM: Prevention of 'Element is not defined' and other browser-only globals
 * during Sanity CLI schema extraction in Node.js environments.
 */
if (typeof window === 'undefined') {
  const noop = () => {}
  const mockClass = class {}
  // @ts-ignore
  globalThis.window = globalThis.window || {}
  // @ts-ignore
  globalThis.document = globalThis.document || {
    createElement: () => ({
      style: {},
      appendChild: noop,
      removeChild: noop,
      setAttribute: noop,
      getAttribute: () => null,
      classList: {add: noop, remove: noop},
    }),
    getElementById: () => null,
    querySelectorAll: () => [],
    documentElement: {style: {}},
    body: {appendChild: noop, style: {}},
    head: {appendChild: noop},
    activeElement: null,
  }
  // @ts-ignore
  globalThis.Element = globalThis.Element || mockClass
  // @ts-ignore
  globalThis.HTMLElement =
    globalThis.HTMLElement || class HTMLElement extends (globalThis.Element as any) {}
  // @ts-ignore
  globalThis.HTMLDivElement =
    globalThis.HTMLDivElement || class extends (globalThis.HTMLElement as any) {}
  // @ts-ignore
  if (!globalThis.Element.prototype.matches) globalThis.Element.prototype.matches = () => false
  // @ts-ignore
  if (!globalThis.Element.prototype.closest) globalThis.Element.prototype.closest = () => null
  // @ts-ignore
  globalThis.navigator = globalThis.navigator || {userAgent: 'node'}
}

import {defineCliConfig} from 'sanity/cli'
import path from 'path'

export default defineCliConfig({
  api: {
    projectId: 'wn3a082f',
    dataset: 'production',
  },
  studioHost: 'birim',
  deployment: {
    appId: 'uhq1n1x3jfninkphme61bf2x',
  },
  vite: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@sentry/react': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/browser': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/core': path.resolve(__dirname, './scripts/dummy-sentry.js'),
        },
      },
    }
  },
})
