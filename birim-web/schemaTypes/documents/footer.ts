import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  fields: [
    defineField({name: 'copyrightText', title: 'Copyright', type: 'localizedString'}),
    defineField({
      name: 'partnerNames',
      title: 'Partners',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'linkColumns',
      title: 'Link Columns',
      type: 'array',
      of: [{type: 'footerLinkColumn'}],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{type: 'socialLink'}],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Footer'}
    },
  },
})



