import React from 'react'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Ana Sayfa',
  type: 'document',
  fields: [
    defineField({
      name: 'heroMedia',
      title: 'Hero Medya',
      type: 'array',
      of: [{ type: 'heroMediaItem' }],
    }),
    defineField({
      name: 'heroAutoPlay',
      title: 'Hero Medya Otomatik Geçiş',
      type: 'boolean',
      description: 'Hero medyanın otomatik olarak geçiş yapmasını sağlar',
      initialValue: true,
    }),
    defineField({ name: 'isHeroTextVisible', title: 'Hero Metnini Göster', type: 'boolean' }),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      of: [{ type: 'contentBlock' }],
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
          options: { hotspot: true },
          description:
            'Tüm cihazlar için varsayılan arka plan görseli. Mobil veya desktop versiyonu yoksa bu kullanılır. Önerilen çözünürlük: Desktop 1920x1080px, Mobil 1080x1920px.',
        }),
        defineField({
          name: 'backgroundImageR2',
          title: 'Arka Plan Görseli (R2) - Tüm Cihazlar',
          type: 'r2Asset',
        }),
        defineField({
          name: 'backgroundImageMobile',
          title: 'Arka Plan Görseli (Mobil)',
          type: 'image',
          options: { hotspot: true },
          description:
            'Mobil cihazlar için özel arka plan görseli (opsiyonel). Yoksa varsayılan görsel kullanılır. Önerilen çözünürlük: 1080x1920px (dikey).',
        }),
        defineField({
          name: 'backgroundImageMobileR2',
          title: 'Arka Plan Görseli (R2) - Mobil',
          type: 'r2Asset',
        }),
        defineField({
          name: 'backgroundImageDesktop',
          title: 'Arka Plan Görseli (Desktop)',
          type: 'image',
          options: { hotspot: true },
          description:
            'Desktop cihazlar için özel arka plan görseli (opsiyonel). Yoksa varsayılan görsel kullanılır. Önerilen çözünürlük: 1920x1080px veya 1920x1200px.',
        }),
        defineField({
          name: 'backgroundImageDesktopR2',
          title: 'Arka Plan Görseli (R2) - Desktop',
          type: 'r2Asset',
        }),
        defineField({ name: 'title', title: 'Başlık', type: 'localizedString' }),
        defineField({ name: 'subtitle', title: 'Alt Başlık', type: 'localizedString' }),
        defineField({ name: 'buttonText', title: 'Buton Metni', type: 'localizedString' }),
        defineField({ name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { media: 'heroMedia.0.image', r2Url: 'heroMedia.0.imageR2.url' },
    prepare({ media, r2Url }) {
      return {
        title: 'Ana Sayfa',
        media: media || (r2Url ? (
          <img
            src={r2Url}
            alt="Ana Sayfa"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : undefined)
      }
    },
  },
})
