import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'distanceSalesAgreement',
  title: 'Mesafeli Satış Sözleşmesi',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      initialValue: {tr: 'Mesafeli Satış Sözleşmesi', en: 'Distance Sales Agreement'},
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'localizedPortableText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Güncellenme Tarihi',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {title: 'title.tr'},
    prepare({title}) {
      return {title: title || 'Mesafeli Satış Sözleşmesi'}
    },
  },
})
