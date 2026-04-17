import {defineConfig} from 'sanity'

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
    open(method: string, url: string | URL, ...rest: unknown[]) {
      const self = this as unknown as { _sentryUrl?: string }
      self._sentryUrl = String(url)
      // @ts-expect-error monkey patching XHR signature
      super.open(method, url as string, ...rest as any[])
    }
    send(body?: Document | XMLHttpRequestBodyInit | null) {
      try {
        super.send(body)
      } catch (error) {
        const sentryUrl = (this as unknown as { _sentryUrl?: string })._sentryUrl
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

export default defineConfig({
  name: 'default',
  title: 'Birim Web',

  projectId: 'wn3a082f',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool(),
    excelImportTool(),
    mediaImportTool(),
    emailExportTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
