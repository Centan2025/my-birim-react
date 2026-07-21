import {defineField, defineType} from 'sanity'
import LocalizedStringInput from '../../components/LocalizedStringInput'
import {browserOnlyInput} from '../utils/browserOnly'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Çok Dilli Metin',
  type: 'object',
  components: {
    input: browserOnlyInput(LocalizedStringInput),
  },
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
    defineField({
      name: 'it',
      title: 'Italiano',
      type: 'string',
    }),
    defineField({
      name: 'de',
      title: 'Deutsch',
      type: 'string',
    }),
    defineField({
      name: 'fr',
      title: 'Français',
      type: 'string',
    }),
    defineField({
      name: 'es',
      title: 'Español',
      type: 'string',
    }),
  ],
})
