import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Birim Web',

  projectId: 'qiizbly2',
  dataset: 'urunler',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
