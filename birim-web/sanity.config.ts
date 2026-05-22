import {defineConfig} from 'sanity'

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

if (typeof window !== 'undefined') {
  const BLOCKED_DOMAINS = [
    'sentry.io',
    'ingest.us.sentry.io',
    'api.vector.co',
    'sanity.io/v2025-02-19/agent',
    '/presence/',
    '/tasks/',
    '/schedule/',
  ]
  const isBlocked = (url: any) => {
    const s = String(url || '')
    return BLOCKED_DOMAINS.some((domain) => s.includes(domain))
  }

  const noise = [
    'sentry',
    'WebSocket',
    'ERR_QUIC_PROTOCOL_ERROR',
    'ERR_CONNECTION_REFUSED',
    'failed to load resource',
    'sanity.io/v2025-02-19/agent',
    'Messaging',
    '/presence/',
    '/tasks/',
    'WebSocket connection to',
    'socket/production',
    'createConnect.ts',
    'ERR_HTTP2_PROTOCOL_ERROR',
  ]
  const isNoise = (m: any) => {
    const s = String(m || '').toLowerCase()
    return noise.some((n) => s.includes(n.toLowerCase()))
  }

  // 1. Intercept fetch
  const originalFetch = window.fetch
  window.fetch = async function (input, init) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as any)?.url || ''

    if (isBlocked(url)) {
      return new Response('{}', {
        status: 200,
        headers: {'content-type': 'application/json'},
      })
    }
    try {
      return await originalFetch.apply(this, [input, init])
    } catch (err) {
      if (isNoise(err)) return new Response('{}', {status: 200})
      throw err
    }
  }

  // 2. Intercept XMLHttpRequest
  const originalXHR = window.XMLHttpRequest
  window.XMLHttpRequest = class extends originalXHR {
    private _blocked = false
    open(method: string, url: string | URL, ...rest: any[]) {
      this._blocked = isBlocked(url)
      if (!this._blocked) {
        // @ts-ignore
        super.open(method, url, ...rest)
      }
    }
    send(body?: Document | XMLHttpRequestBodyInit | null) {
      if (this._blocked) {
        Object.defineProperty(this, 'readyState', {get: () => 4, configurable: true})
        Object.defineProperty(this, 'status', {get: () => 200, configurable: true})
        Object.defineProperty(this, 'responseText', {get: () => '{}', configurable: true})
        setTimeout(() => {
          if (typeof this.onreadystatechange === 'function')
            this.onreadystatechange(new Event('readystatechange'))
          if (typeof this.onload === 'function') this.onload(new Event('load'))
        }, 0)
        return
      }
      try {
        super.send(body)
      } catch (err) {
        if (!isNoise(err)) throw err
      }
    }
  } as any

  // 3. Intercept sendBeacon
  const originalSendBeacon = window.navigator.sendBeacon
  if (originalSendBeacon) {
    window.navigator.sendBeacon = function (url, data) {
      if (isBlocked(url)) return true
      return originalSendBeacon.apply(this, [url, data])
    }
  }

  // 4. Image (Pixel) Tracking
  const originalImage = window.Image
  // @ts-ignore
  window.Image = class extends originalImage {
    constructor() {
      super()
      const self = this
      let src = ''
      Object.defineProperty(this, 'src', {
        get() {
          return src
        },
        set(val) {
          src = val
          if (isBlocked(val)) {
            setTimeout(() => {
              if (self.onload) self.onload(new Event('load'))
            }, 0)
            return
          }
          self.setAttribute('src', val)
        },
      })
    }
  }

  // 5. Script Element Blocking
  const originalCreateElement = document.createElement
  document.createElement = function (tag: string, options?: ElementCreationOptions) {
    const el = originalCreateElement.apply(document, [tag, options])
    if (tag.toLowerCase() === 'script') {
      let src = ''
      Object.defineProperty(el, 'src', {
        get() {
          return src
        },
        set(val) {
          src = val
          if (isBlocked(val)) return
          el.setAttribute('src', val)
        },
      })
    }
    return el
  } as any

  // 6. Console Silencing
  const originalError = console.error
  const originalWarn = console.warn
  const originalLog = console.log

  console.error = function (...args: any[]) {
    if (args.some((arg) => isNoise(arg) || isNoise(args.join(' ')))) return
    originalError.apply(console, args)
  }
  console.warn = function (...args: any[]) {
    if (args.some((arg) => isNoise(arg) || isNoise(args.join(' ')))) return
    originalWarn.apply(console, args)
  }
  console.log = function (...args: any[]) {
    if (args.some((arg) => isNoise(arg) || isNoise(args.join(' ')))) return
    originalLog.apply(console, args)
  }

  // 7. WebSocket Silencing
  const originalWS = window.WebSocket
  // @ts-ignore
  window.WebSocket = class extends originalWS {
    constructor(url: string | URL, protocols?: string | string[]) {
      try {
        const ws = new originalWS(url, protocols)
        ws.addEventListener('error', (e) => {
          if (isNoise(url)) {
            // Silently close on error for noisy domains
            ws.close()
          }
        })
        return ws
      } catch (e) {
        if (isNoise(url))
          return {addEventListener: () => {}, close: () => {}, send: () => {}} as any
        throw e
      }
    }
  }

  // 8. Global error silencing
  window.addEventListener(
    'error',
    (e) => {
      if (isNoise(e.message) || isNoise(e.filename) || isNoise(e.error)) e.preventDefault()
    },
    true,
  )

  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '')
    if (isNoise(msg)) {
      event.preventDefault()
    }
  })
}
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'
import {deskStructure} from './deskStructure'
import {excelImportTool} from './tools/excelImport'
import {mediaImportTool} from './tools/mediaImport'
import {emailExportTool} from './tools/emailExport'
import {colorInput} from '@sanity/color-input'
import {CategoryProductsView} from './components/CategoryProductsView'
import {PreviewView} from './components/PreviewView'

export default defineConfig({
  name: 'default',
  title: 'Birim Web',

  projectId: 'wn3a082f',
  dataset: 'production',

  search: {
    strategy: 'groq2024',
  },

  plugins: [
    structureTool({
      structure: deskStructure,
      defaultDocumentNode: (S, {schemaType}) => {
        const previewTypes = [
          'product',
          'project',
          'newsItem',
          'designer',
          'category',
          'homePage',
          'aboutPage',
          'factoryPage',
          'contactPage',
        ]
        if (previewTypes.includes(schemaType)) {
          const views = [S.view.form().title('Düzenle')]

          // Kategori ise "Modeller" görünümünü de ekle
          if (schemaType === 'category') {
            views.push(
              S.view
                .component(CategoryProductsView)
                .title('Modeller')
                .icon(() => '📦'),
            )
          }

          // Önizleme sekmesini ekle
          views.push(
            S.view
              .component(PreviewView)
              .title('Önizleme')
              .icon(() => '👁️'),
          )

          return S.document().views(views)
        }

        return S.document().views([S.view.form()])
      },
    }),
    visionTool(),
    excelImportTool(),
    mediaImportTool(),
    emailExportTool(),
    colorInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
