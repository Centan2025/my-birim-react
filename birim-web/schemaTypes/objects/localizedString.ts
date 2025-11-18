import {defineField, defineType} from 'sanity'
import LocalizedStringInput from '../../components/LocalizedStringInput'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Çok Dilli Metin',
  type: 'object',
  components: {
    input: LocalizedStringInput,
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
  ],
})



