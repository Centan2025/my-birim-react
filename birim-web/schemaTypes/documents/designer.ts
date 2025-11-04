import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'designer',
  title: 'Designer',
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
    defineField({name: 'bio', title: 'Bio', type: 'localizedString'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {
    select: {title: 'name.tr', media: 'image'},
    prepare({title, media}) {
      return {title: title || 'Designer', media}
    },
  },
})



