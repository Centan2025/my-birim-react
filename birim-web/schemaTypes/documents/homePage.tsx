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
      name: 'quickBannerTitle',
      title: 'Hero Altı Bant - Başlık',
      type: 'string',
      description: 'Örn: BİRİM TASARIM KOLEKSİYONU',
      initialValue: 'BİRİM TASARIM KOLEKSİYONU',
    }),
    defineField({
      name: 'quickBannerSubtitle',
      title: 'Hero Altı Bant - Alt Açıklama',
      type: 'string',
      description: 'Örn: ZAMANSIZ PARÇALAR VE MİMARİ ÇÖZÜMLERİ KEŞFEDİN',
      initialValue: 'ZAMANSIZ PARÇALAR VE MİMARİ ÇÖZÜMLERİ KEŞFEDİN',
    }),
    defineField({
      name: 'quickBannerButtonText',
      title: 'Hero Altı Bant - Düğme Metni',
      type: 'string',
      description: 'Örn: ÜRÜNLERİ KEŞFEDİN',
      initialValue: 'ÜRÜNLERİ KEŞFEDİN',
    }),
    defineField({
      name: 'quickBannerLink',
      title: 'Hero Altı Bant - Düğme Linki',
      type: 'string',
      description: 'Örn: /products',
      initialValue: '/products',
    }),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      of: [{type: 'contentBlock'}],
      description: 'Hero bölümünün altında görünecek içerik blokları',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
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
