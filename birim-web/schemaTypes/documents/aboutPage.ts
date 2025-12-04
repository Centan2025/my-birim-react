import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'Hakkımızda',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImage',
      title: 'Hero Görseli',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString'}),
    defineField({name: 'storyTitle', title: 'Hikaye Başlığı', type: 'localizedString'}),
    defineField({name: 'storyContentP1', title: 'Hikaye Metni 1', type: 'localizedText'}),
    defineField({name: 'storyContentP2', title: 'Hikaye Metni 2', type: 'localizedText'}),
    defineField({
      name: 'storyImage',
      title: 'Hikaye Görseli',
      type: 'image',
      options: {hotspot: true},
    }),
    // Özel üçlü bölüm: Tarihçe / Kimlik / Kalite
    defineField({
      name: 'historySection',
      title: 'Tarihçe Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'content',
          title: 'Tarihçe Metni',
          type: 'localizedText',
        }),
      ],
    }),
    defineField({
      name: 'identitySection',
      title: 'Kimlik Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'content',
          title: 'Kimlik Metni',
          type: 'localizedText',
        }),
      ],
    }),
    defineField({
      name: 'qualitySection',
      title: 'Kalite Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'content',
          title: 'Kalite Metni',
          type: 'localizedText',
        }),
      ],
    }),
    defineField({
      name: 'values',
      title: 'Değerler',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
            defineField({name: 'description', title: 'Açıklama', type: 'localizedString'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {media: 'heroImage'},
    prepare({media}) {
      return {title: 'Hakkımızda', media}
    },
  },
})
