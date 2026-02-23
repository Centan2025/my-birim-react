import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'materialGroup',
  title: 'Malzeme Grubu',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Grup Adı',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'books',
      title: 'Kartelalar',
      type: 'array',
      of: [{type: 'materialSwatchBook'}],
    }),
  ],
  preview: {
    select: {title: 'title.tr'},
    prepare({title}) {
      return {title: title || 'Malzeme Grubu'}
    },
  },
})
