import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Ana Sayfa',
  type: 'document',
  fields: [
    defineField({
      name: 'heroMedia',
      title: 'Hero Medya',
      type: 'array',
      of: [{type: 'heroMediaItem'}],
    }),
    defineField({
      name: 'heroAutoPlay',
      title: 'Hero Medya Otomatik Geçiş',
      type: 'boolean',
      description: 'Hero medyanın otomatik olarak geçiş yapmasını sağlar',
      initialValue: true,
    }),
    defineField({name: 'isHeroTextVisible', title: 'Hero Metnini Göster', type: 'boolean'}),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      of: [{type: 'contentBlock'}],
      description: 'Hero bölümünün altında görünecek içerik blokları',
    }),
    defineField({
      name: 'inspirationSection',
      title: 'İlham Bölümü',
      type: 'object',
      fields: [
        defineField({
          name: 'backgroundImage',
          title: 'Arka Plan Görseli (Tüm Cihazlar)',
          type: 'image',
          options: {hotspot: true},
          description:
            'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
        }),
        defineField({
          name: 'backgroundImageMobile',
          title: 'Arka Plan Görseli (Mobil)',
          type: 'image',
          options: {hotspot: true},
          description:
            'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
        }),
        defineField({
          name: 'backgroundImageDesktop',
          title: 'Arka Plan Görseli (Desktop)',
          type: 'image',
          options: {hotspot: true},
          description:
            'Desktop cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
        }),
        defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
        defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
        defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
        defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Ana Sayfa'}
    },
  },
})
