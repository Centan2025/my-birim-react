import {definePlugin} from 'sanity'
import {EmailExportTool} from './emailExport/EmailExportTool'

export const emailExportTool = definePlugin({
  name: 'email-export',
  tools: [
    {
      name: 'email-export',
      title: 'Tüm Üyeleri Dışa Aktar',
      component: EmailExportTool,
    },
  ],
})
