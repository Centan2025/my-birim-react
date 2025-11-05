import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Birim Web',

  projectId: 'wn3a082f',
  dataset: 'production',

  plugins: [structureTool({ structure: deskStructure }), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
