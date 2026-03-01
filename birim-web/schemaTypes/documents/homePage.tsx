import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

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
          name: 'backgroundImageR2',
          title: 'Arka Plan Görseli (Tüm Cihazlar)',
          type: 'r2Asset',
        }),
        defineField({
          name: 'backgroundImageMobileR2',
          title: 'Arka Plan Görseli (Mobil)',
          type: 'r2Asset',
        }),
        defineField({
          name: 'backgroundImageDesktopR2',
          title: 'Arka Plan Görseli (Desktop)',
          type: 'r2Asset',
        }),
        defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
        defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
        defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
        defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
      ],
    }),
  ],
  preview: {
    select: {r2Url: 'heroMedia.0.imageR2.url'},
    prepare({r2Url}) {
      let finalUrl = getPreviewUrl(r2Url)
      return {
        title: 'Ana Sayfa',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt="Ana Sayfa"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
