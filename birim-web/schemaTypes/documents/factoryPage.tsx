import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'

export default defineType({
  name: 'factoryPage',
  title: 'Fabrika',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Sayfa Başlığı',
      type: 'localizedString',
      initialValue: {tr: 'Fabrika', en: 'Factory'},
    }),
    defineField({
      name: 'content',
      title: 'Açıklama Metni',
      type: 'localizedPortableText',
    }),
    defineField({
      name: 'gallery',
      title: 'Görsel Galerisi',
      type: 'array',
      of: [{type: 'productPanelMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description: 'Fabrikaya ait görseller veya videolar.',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
    },
    prepare(selection: any) {
      const {title} = selection
      return {
        title: title || 'Fabrika',
      }
    },
  },
})
