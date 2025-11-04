import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedString'}),
    defineField({
      name: 'locations',
      title: 'Locations',
      type: 'array',
      of: [{type: 'contactLocation'}],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Contact Page'}
    },
  },
})



