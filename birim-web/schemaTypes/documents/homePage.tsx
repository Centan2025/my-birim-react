import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'homePage',
  title: 'Ana Sayfa',
  type: 'document',
  fieldsets: [
    {
      name: 'heroGroup',
      title: '🎬 Hero Bölümü (Manşet)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'quickBannerGroup',
      title: '⚡ Hero Altı Hızlı Bant (Quick Banner)',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'showcaseGroup',
      title: '🎯 İnteraktif Ürün Görselleri (Hotspot Slider)',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'blocksGroup',
      title: '📑 İçerik Blokları',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru Ayarları',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'heroMedia',
      title: 'Hero Medya',
      type: 'array',
      fieldset: 'heroGroup',
      of: [{type: 'heroMediaItem'}],
    }),
    defineField({
      name: 'heroAutoPlay',
      title: 'Hero Medya Otomatik Geçiş',
      type: 'boolean',
      fieldset: 'heroGroup',
      description: 'Hero medyanın otomatik olarak geçiş yapmasını sağlar',
      initialValue: true,
    }),
    defineField({
      name: 'heroAutoPlayInterval',
      title: 'Hero Otomatik Geçiş Hızı (Saniye)',
      type: 'number',
      fieldset: 'heroGroup',
      hidden: ({parent}) => !parent?.heroAutoPlay,
      description:
        'Her bir hero slaytının ekranda kaç saniye kalacağını belirler (Varsayılan: 5 saniye).',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(60),
    }),
    defineField({
      name: 'isHeroTextVisible',
      title: 'Hero Metnini Göster',
      type: 'boolean',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'quickBannerTitle',
      title: 'Hero Altı Bant - Başlık',
      type: 'localizedString',
      fieldset: 'quickBannerGroup',
      description: 'Görünecek ana başlık (TR / EN)',
    }),
    defineField({
      name: 'quickBannerSubtitle',
      title: 'Hero Altı Bant - Alt Açıklama',
      type: 'localizedString',
      fieldset: 'quickBannerGroup',
      description: 'Görünecek alt açıklama metni (TR / EN)',
    }),
    defineField({
      name: 'quickBannerButtonText',
      title: 'Hero Altı Bant - Düğme Metni',
      type: 'localizedString',
      fieldset: 'quickBannerGroup',
      description: 'Görünecek düğme yazısı (TR / EN)',
    }),
    defineField({
      name: 'quickBannerLink',
      title: 'Hero Altı Bant - Düğme Linki',
      type: 'string',
      fieldset: 'quickBannerGroup',
      description: 'Örn: /products',
      initialValue: '/products',
    }),
    defineField({
      name: 'interactiveShowcaseTitle',
      title: 'İnteraktif Ürün Görselleri - Bölüm Başlığı',
      type: 'localizedString',
      fieldset: 'showcaseGroup',
      description: 'İnteraktif alanın üstünde görünecek başlık (TR / EN)',
    }),
    defineField({
      name: 'interactiveShowcase',
      title: 'İnteraktif Ürün Görselleri (Hotspot Slider)',
      type: 'array',
      fieldset: 'showcaseGroup',
      of: [{type: 'interactiveShowcaseItem'}],
      description:
        'Ürünlerin kullanıldığı tam ekran görseller ve üzerlerindeki tıklanabilir ürün noktaları',
    }),
    defineField({
      name: 'interactiveShowcaseBlockIndex',
      title: 'İnteraktif Alan Gösterim Sırası (İçerik Bloğu İndeksi)',
      type: 'number',
      fieldset: 'showcaseGroup',
      description:
        'Bu alanın kaçıncı içerik bloğundan sonra gösterileceği (0: Hero altı banttan sonra, 1: 1. bloktan sonra, 2: 2. bloktan sonra vb.)',
      initialValue: 1,
    }),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      fieldset: 'blocksGroup',
      of: [{type: 'contentBlock'}],
      description: 'Hero bölümünün altında görünecek içerik blokları',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
    }),
  ],
  preview: {
    select: {r2Url: 'heroMedia.0.imageR2.url'},
    prepare(selection: any = {}) {
      const {r2Url} = selection
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
