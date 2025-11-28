import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'kvkkPolicy',
  title: 'KVKK Aydınlatma Metni',
  type: 'document',
  actions: (prev) => prev,
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
      initialValue: {tr: 'KVKK Aydınlatma Metni', en: 'KVKK Disclosure'},
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
      return {title: title || 'KVKK Aydınlatma Metni'}
    },
  },
})
