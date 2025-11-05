import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'Hakkımızda',
  type: 'document',
  fields: [
    defineField({name: 'heroImage', title: 'Hero Görseli', type: 'image', options: {hotspot: true}}),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString'}),
    defineField({name: 'storyTitle', title: 'Hikaye Başlığı', type: 'localizedString'}),
    defineField({name: 'storyContentP1', title: 'Hikaye Metni 1', type: 'localizedString'}),
    defineField({name: 'storyContentP2', title: 'Hikaye Metni 2', type: 'localizedString'}),
    defineField({name: 'storyImage', title: 'Hikaye Görseli', type: 'image', options: {hotspot: true}}),
    defineField({name: 'isQuoteVisible', title: 'Alıntıyı Göster', type: 'boolean'}),
    defineField({name: 'quoteText', title: 'Alıntı Metni', type: 'localizedString'}),
    defineField({name: 'quoteAuthor', title: 'Alıntı Yazarı', type: 'string'}),
    defineField({
      name: 'values',
      title: 'Değerler',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
          defineField({name: 'description', title: 'Açıklama', type: 'localizedString'}),
        ],
      }],
    }),
  ],
  preview: {
    select: {media: 'heroImage'},
    prepare({media}) {
      return {title: 'Hakkımızda', media}
    },
  },
})



