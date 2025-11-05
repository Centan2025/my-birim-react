import {defineField, defineType} from 'sanity'

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
    defineField({name: 'name', title: 'Ad', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'bio', title: 'Biyografi', type: 'localizedText'}),
    defineField({name: 'image', title: 'Görsel', type: 'image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'name.tr', media: 'image'},
    prepare({title, media}) {
      return {title: title || 'Tasarımcı', media}
    },
  },
})



