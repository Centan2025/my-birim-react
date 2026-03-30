import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'factoryPage',
  title: 'Fabrika',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImageR2',
      title: 'Hero Görseli (R2)',
      type: 'r2Asset',
    }),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString'}),
    defineField({
      name: 'content',
      title: 'Açıklama Metni',
      type: 'localizedPortableText',
    }),
    defineField({
      name: 'gallery',
      title: 'Fabrika Görselleri',
      type: 'array',
      of: [{type: 'productPanelMediaItem'}],
      description: 'Fabrikaya ait geniş görseller veya videolar.',
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle.tr',
      r2Url: 'heroImageR2.url',
    },
    prepare(selection: any) {
      const {title, r2Url} = selection
      const finalUrl = getPreviewUrl(r2Url)
      return {
        title: title || 'Fabrika',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt="Fabrika"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
