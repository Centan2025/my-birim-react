import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cookiesPolicy',
  title: 'Çerez Politikası',
  type: 'document',
  actions: (prev) => prev,
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      initialValue: {tr: 'Çerez Politikası', en: 'Cookie Policy'},
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
      return {title: title || 'Çerez Politikası'}
    },
  },
})
