import {UploadIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'
import MediaImportTool from './mediaImport/MediaImportTool'

export const mediaImportTool = definePlugin({
  name: 'media-import',
  tools: [
    {
      name: 'media-import',
      title: 'Medya İçe Aktar',
      icon: UploadIcon,
      component: MediaImportTool,
    },
  ],
})
