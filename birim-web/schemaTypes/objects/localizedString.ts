import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized String',
  type: 'object',
  fields: [
    defineField({
      name: 'tr',
      title: 'Türkçe',
      type: 'string',
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
    }),
  ],
})



