import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'İletişim',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({
      name: 'locations',
      title: 'Lokasyonlar',
      type: 'array',
      of: [{type: 'contactLocation'}],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'İletişim'}
    },
  },
})
