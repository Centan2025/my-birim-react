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
      description:
        'Hakkımızda sayfası hero alanı için geniş görsel. Önerilen çözünürlük: Desktop 1920x1080px (16:9), Mobil 1080x1920px (9:16).',
    }),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString'}),
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
