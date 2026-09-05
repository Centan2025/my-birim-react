import {DownloadIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'
import MediaExportTool from './mediaExport/MediaExportTool'

export const mediaExportTool = definePlugin({
  name: 'media-export',
  tools: [
    {
      name: 'media-export',
      title: 'Medya Dışa Aktar',
      icon: DownloadIcon,
      component: MediaExportTool,
    },
  ],
})

export default mediaExportTool
