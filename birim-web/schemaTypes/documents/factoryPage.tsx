import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'

export default defineType({
  name: 'factoryPage',
  title: 'Fabrika',
  type: 'document',
  fieldsets: [
    {
      name: 'contentGroup',
      title: '📝 İçerik & Bilgiler',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'mediaGroup',
      title: '🖼️ Görsel Galerisi',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Sayfa Başlığı',
      type: 'localizedString',
      fieldset: 'contentGroup',
      initialValue: {tr: 'Fabrika', en: 'Factory'},
    }),
    defineField({
      name: 'content',
      title: 'Açıklama Metni',
      type: 'localizedPortableText',
      fieldset: 'contentGroup',
    }),
    defineField({
      name: 'gallery',
      title: 'Görsel Galerisi',
      type: 'array',
      fieldset: 'mediaGroup',
      of: [{type: 'productPanelMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description: 'Fabrikaya ait görseller veya videolar.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
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
