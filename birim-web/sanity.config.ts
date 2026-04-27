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
  // Monkey-patch window.fetch to silently swallow Sentry ingest errors
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    try {
      return await originalFetch.apply(this, args)
    } catch (error) {
      const url =
        typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : ''
      if (url.includes('sentry.io') || url.includes('ingest.us.sentry.io')) {
        return new Response(null, {status: 200})
      }
      throw error
    }
  }

  // Monkey-patch XMLHttpRequest to silently swallow Sentry ingest errors
  const originalXHR = window.XMLHttpRequest
  window.XMLHttpRequest = class extends originalXHR {
    open(method: string, url: string | URL, ...rest: any[]) {
      ;(this as any)._sentryUrl = String(url)
      // @ts-ignore
      super.open(method, url, ...rest)
    }
    send(body?: Document | XMLHttpRequestBodyInit | null) {
      try {
        super.send(body)
      } catch (error) {
        const sentryUrl = (this as any)._sentryUrl
        if (
          sentryUrl &&
          (sentryUrl.includes('sentry.io') || sentryUrl.includes('ingest.us.sentry.io'))
        ) {
          // Ignore synchronous throws from adblockers crashing XHR
          console.warn('Caught XHR send error to Sentry:', error)
          return
        }
        throw error
      }
    }
  } as typeof originalXHR
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
