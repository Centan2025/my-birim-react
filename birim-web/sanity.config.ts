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
          if (schemaType === 'category') {
            return S.document().views([
              S.view
                .component(CategoryProductsView)
                .title('Modeller')
                .icon(() => '📦'),
              S.view.form().title('Düzenle').id('editor'),
              S.view
                .component(PreviewView)
                .title('Önizleme')
                .icon(() => '👁️'),
            ])
          }

          return S.document().views([
            S.view.form().title('Düzenle'),
            S.view
              .component(PreviewView)
              .title('Önizleme')
              .icon(() => '👁️'),
          ])
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
