import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'name', title: 'Name', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedString'}),
    defineField({name: 'heroImage', title: 'Hero Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'name.tr', media: 'heroImage'},
    prepare({title, media}) {
      return {title: title || 'Category', media}
    },
  },
})



