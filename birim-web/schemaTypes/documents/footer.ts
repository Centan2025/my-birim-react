import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Altbilgi',
  type: 'document',
  fields: [
    defineField({name: 'copyrightText', title: 'Telif', type: 'localizedString'}),
    defineField({
      name: 'partnerNames',
      title: 'Partnerler',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'linkColumns',
      title: 'Bağlantı Sütunları',
      type: 'array',
      of: [{type: 'footerLinkColumn'}],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Sosyal Bağlantılar',
      type: 'array',
      of: [{type: 'socialLink'}],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Altbilgi'}
    },
  },
})



