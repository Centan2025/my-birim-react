import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'newsItem',
  title: 'Haber',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.title?.tr || doc.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'date', title: 'Tarih', type: 'datetime'}),
    defineField({name: 'content', title: 'İçerik', type: 'localizedString'}),
    defineField({name: 'mainImage', title: 'Kapak Görseli', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'media',
      title: 'Medya',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'newsMedia',
          title: 'Haber Medyası',
          fields: [
            defineField({
              name: 'type',
              title: 'Tür',
              type: 'string',
              options: {list: [
                {title: 'Image', value: 'image'},
                {title: 'Video', value: 'video'},
                {title: 'YouTube', value: 'youtube'},
              ]},
              initialValue: 'image',
            }),
            defineField({name: 'url', title: 'URL', type: 'url'}),
            defineField({name: 'caption', title: 'Açıklama', type: 'localizedString'}),
            defineField({name: 'image', title: 'Görsel', type: 'image', options: {hotspot: true}}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title.tr', media: 'mainImage'},
    prepare({title, media}) {
      return {title: title || 'Haber', media}
    },
  },
})



