import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'kvkkPolicy',
  title: 'KVKK Aydınlatma Metni',
  type: 'document',
  __experimental_actions: [
    // 'create', // Singleton olduğu için create'i kaldırıyoruz
    'update',
    'publish',
    'delete',
  ],
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
