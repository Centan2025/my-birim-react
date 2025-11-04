import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'newsItem',
  title: 'News Item',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.title?.tr || doc.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'title', title: 'Title', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'date', title: 'Date', type: 'datetime'}),
    defineField({name: 'content', title: 'Content', type: 'localizedString'}),
    defineField({name: 'mainImage', title: 'Main Image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'newsMedia',
          title: 'News Media',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {list: [
                {title: 'Image', value: 'image'},
                {title: 'Video', value: 'video'},
                {title: 'YouTube', value: 'youtube'},
              ]},
              initialValue: 'image',
            }),
            defineField({name: 'url', title: 'URL', type: 'url'}),
            defineField({name: 'caption', title: 'Caption', type: 'localizedString'}),
            defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title.tr', media: 'mainImage'},
    prepare({title, media}) {
      return {title: title || 'News Item', media}
    },
  },
})



