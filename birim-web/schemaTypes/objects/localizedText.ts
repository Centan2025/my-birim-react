import {defineType, defineField} from 'sanity'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Çok Dilli Metin (Uzun)',
  type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'text', rows: 4 }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4 }),
  ],
})
