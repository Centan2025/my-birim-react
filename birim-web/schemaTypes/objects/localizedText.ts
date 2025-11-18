import {defineType, defineField} from 'sanity'
import LocalizedTextInput from '../../components/LocalizedTextInput'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Çok Dilli Metin (Uzun)',
  type: 'object',
  components: {
    input: LocalizedTextInput,
  },
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'text', rows: 4 }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4 }),
    defineField({ name: 'it', title: 'Italiano', type: 'text', rows: 4 }),
  ],
})
