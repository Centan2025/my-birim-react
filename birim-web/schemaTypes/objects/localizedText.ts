import {defineType, defineField} from 'sanity'
import LocalizedTextInput from '../../components/LocalizedTextInput'
import {browserOnlyInput} from '../utils/browserOnly'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Çok Dilli Metin (Uzun)',
  type: 'object',
  components: {
    input: browserOnlyInput(LocalizedTextInput),
  },
  fields: [
    defineField({name: 'tr', title: 'Türkçe', type: 'text', rows: 4}),
    defineField({name: 'en', title: 'English', type: 'text', rows: 4}),
    defineField({name: 'it', title: 'Italiano', type: 'text', rows: 4}),
    defineField({name: 'de', title: 'Deutsch', type: 'text', rows: 4}),
    defineField({name: 'fr', title: 'Français', type: 'text', rows: 4}),
    defineField({name: 'es', title: 'Español', type: 'text', rows: 4}),
  ],
})
