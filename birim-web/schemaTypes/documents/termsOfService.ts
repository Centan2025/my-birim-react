import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'termsOfService',
  title: 'Kullanım Şartları',
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
      validation: Rule => Rule.required(),
      initialValue: { tr: 'Kullanım Şartları', en: 'Terms of Service' }
    }),
    defineField({name: 'content', title: 'İçerik', type: 'localizedPortableText', validation: Rule => Rule.required()}),
    defineField({name: 'updatedAt', title: 'Güncellenme Tarihi', type: 'datetime', initialValue: () => new Date().toISOString()}),
  ],
  preview: {
    select: {title: 'title.tr'},
    prepare({title}) {
      return {title: title || 'Kullanım Şartları'}
    },
  },
})

