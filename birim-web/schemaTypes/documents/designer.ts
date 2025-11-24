import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export default defineType({
  name: 'designer',
  title: 'Tasarımcı',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({type: 'designer'}),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'bio', title: 'Biyografi', type: 'localizedText'}),
    defineField({
      name: 'image',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
    }),
    defineField({
      name: 'imageMobile',
      title: 'Görsel (Mobil)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
    }),
    defineField({
      name: 'imageDesktop',
      title: 'Görsel (Desktop)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Desktop cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
    }),
  ],
  preview: {
    select: {title: 'name.tr', media: 'image'},
    prepare({title, media}) {
      return {title: title || 'Tasarımcı', media}
    },
  },
})
