import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'materialGroup',
  title: 'Malzeme Grubu',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Grup Adı', type: 'localizedString', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'items',
      title: 'Malzemeler',
      type: 'array',
      of: [{ type: 'productMaterial' }],
    }),
  ],
  preview: {
    select: { title: 'title.tr' },
    prepare({ title }) { return { title: title || 'Malzeme Grubu' } },
  },
})


