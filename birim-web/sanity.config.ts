import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'
import {deskStructure} from './deskStructure'
import {excelImportTool} from './tools/excelImport'
import {mediaImportTool} from './tools/mediaImport'

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
  ],

  schema: {
    types: schemaTypes,
  },
})
