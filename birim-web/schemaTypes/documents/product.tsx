import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import {renderPreviewMedia} from '../objects/shared'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'
import ReferenceInputFix from '../../components/ReferenceInputFix'

import {orderRankField} from '@sanity/orderable-document-list'
import ProductDocumentInput from '../../components/ProductDocumentInput'

export default defineType({
  name: 'product',
  title: 'Ürün',
  type: 'document',
  components: {
    input: ProductDocumentInput,
  },
  fieldsets: [
    {
      name: 'basicInfo',
      title: '📌 Temel Bilgiler & Kategori',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'publishing',
      title: '🌐 Yayın & Sıralama Ayarları',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'mediaGroup',
      title: '🖼️ Ürün Medyası & Görseller',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'bottomMediaPanelsGroup',
      title: '🎬 Alt Medya Panelleri',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'details',
      title: '📝 Açıklama, Malzemeler & İçerik',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'commerce',
      title: '🏷️ Fiyat & Stok Ayarları',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    orderRankField({type: 'product'}),
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      fieldset: 'basicInfo',
      options: {source: (doc: any) => doc?.name?.tr || doc?.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      fieldset: 'basicInfo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'designers',
      title: 'Tasarımcılar',
      type: 'array',
      fieldset: 'basicInfo',
      of: [
        {
          type: 'reference',
          to: [{type: 'designer'}],
          components: {
            input: ReferenceInputFix,
          },
        },
      ],
      description: 'Bu ürünü tasarlayan bir veya daha fazla tasarımcı ekleyebilirsiniz.',
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'reference',
      fieldset: 'basicInfo',
      to: [{type: 'category'}],
      validation: (Rule) =>
        Rule.required().error('Her ürünün en az bir kategoriye atanması zorunludur.'),
      components: {
        input: ReferenceInputFix,
      },
    }),

    defineField({
      name: 'year',
      title: 'Yıl',
      type: 'number',
      fieldset: 'basicInfo',
      validation: (Rule) => Rule.min(1900).max(2100),
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      fieldset: 'publishing',
      initialValue: true,
      description:
        'Bu ürünün web sitesinde görünüp görünmeyeceğini belirler. Kapalıysa ürün listede görünmez.',
    }),
    defineField({
      name: 'publishAt',
      title: 'Yayın Tarihi (Opsiyonel)',
      type: 'datetime',
      fieldset: 'publishing',
      description:
        'Belirli bir tarihten sonra görünsün istiyorsanız kullanın. Boş bırakırsanız hemen yayına girer.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sıra (Opsiyonel)',
      type: 'number',
      fieldset: 'publishing',
      description:
        'Kategori içindeki özel sıralama için. Küçük sayı önce gelir. Boş bırakırsanız yıl alanına göre sıralanır.',
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'localizedPortableText',
      fieldset: 'details',
    }),

    defineField({
      name: 'media',
      title: 'Ürün Medyası',
      type: 'array',
      fieldset: 'mediaGroup',
      of: [{type: 'productSimpleMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      validation: (Rule) =>
        Rule.custom((items: any) => {
          if (!Array.isArray(items)) return true
          const covers = items.filter((item) => item?.isCover)
          if (covers.length > 1) {
            return 'Sadece tek bir kapak görseli seçilebilir. Lütfen diğer kapak görsellerinin kapak seçimini kaldırın.'
          }
          return true
        }),
      description:
        'Ürün görselleri, videoları ve YouTube bağlantıları. İdeal görsel boyutu 1920x1080px veya 1:1 karedir. Sadece tek bir kapak görseli seçebilirsiniz.',
    }),
    defineField({
      name: 'buyable',
      title: 'Satın Alınabilir',
      type: 'boolean',
      fieldset: 'commerce',
    }),
    defineField({
      name: 'price',
      title: 'Fiyat',
      type: 'number',
      fieldset: 'commerce',
    }),
    defineField({
      name: 'currency',
      title: 'Para Birimi',
      type: 'string',
      fieldset: 'commerce',
    }),
    defineField({
      name: 'sku',
      title: 'Stok Kodu (SKU)',
      type: 'string',
      fieldset: 'commerce',
    }),
    defineField({
      name: 'stockStatus',
      title: 'Stok Durumu',
      type: 'string',
      fieldset: 'commerce',
      options: {
        list: [
          {title: 'Stokta', value: 'in_stock'},
          {title: 'Stok Dışı', value: 'out_of_stock'},
          {title: 'Preorder', value: 'preorder'},
        ],
      },
    }),
    defineField({
      name: 'dimensionImages',
      title: 'Ölçü Görselleri',
      type: 'array',
      fieldset: 'mediaGroup',
      of: [{type: 'productDimensionImage'}],
      description:
        'Ürünün ölçülerini gösteren teknik çizim veya şema görselleri. Her görselin altında bir başlık gösterilecektir. Bu görseller ürün detay sayfasında malzemelerden önce gösterilecektir.',
    }),
    defineField({
      name: 'materialSelections',
      title: 'Malzeme Seçimleri',
      type: 'array',
      fieldset: 'details',
      of: [{type: 'productMaterialSelection'}],
      description:
        'Bir veya birden fazla grubu seçin ve her gruptan kullanılacak malzemeleri işaretleyin.',
    }),
    defineField({
      name: 'showMaterials',
      title: 'Malzemeleri Göster',
      type: 'boolean',
      fieldset: 'details',
      initialValue: true,
    }),
    defineField({
      name: 'exclusiveContent',
      title: 'Özel İçerik',
      type: 'exclusiveContent',
      fieldset: 'details',
    }),
    defineField({
      name: 'showMediaPanels',
      title: 'Alt Medya Panellerini Göster',
      type: 'boolean',
      fieldset: 'bottomMediaPanelsGroup',
      initialValue: true,
      description:
        'Ürün detay sayfasının altındaki büyük medya panelleri bölümünün gösterilip gösterilmeyeceğini belirler.',
    }),
    defineField({
      name: 'mediaSectionTitle',
      title: 'Alt Medya Başlığı',
      type: 'localizedString',
      fieldset: 'bottomMediaPanelsGroup',
      description: 'Alt Medya bölüm başlığı (boş bırakılırsa varsayılan çeviri kullanılır)',
    }),
    defineField({
      name: 'mediaSectionText',
      title: 'Alt Medya Açıklama Metni',
      type: 'localizedPortableText',
      fieldset: 'bottomMediaPanelsGroup',
      description: 'Alt Medya bölümünde başlığın altında gösterilecek açıklama metni',
    }),
    defineField({
      name: 'bottomMedia',
      title: 'Alt Medya Panelleri',
      type: 'array',
      fieldset: 'bottomMediaPanelsGroup',
      of: [{type: 'productPanelMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description: 'Sayfa altındaki büyük medya panelleri.',
    }),
    defineField({
      name: 'showHeroNavigation',
      title: 'Hero Altı Navigasyonu Göster',
      type: 'boolean',
      fieldset: 'publishing',
      initialValue: false,
      description:
        'Hero bölümünün altındaki görsel/medya navigasyon (bant) bölümünün gösterilip gösterilmeyeceğini belirler. Kapalıysa hero bölümü ekranın altına kadar uzanır.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      media: 'media',
    },
    prepare(selection: any = {}) {
      const {name, media} = selection
      const coverItem = media?.find((m) => (m as any).isCover) || media?.[0]
      const r2Url =
        (coverItem as any)?.imageR2?.url ||
        (coverItem as any)?.imageMobileR2?.url ||
        (coverItem as any)?.imageDesktopR2?.url ||
        (coverItem as any)?.videoFileR2?.url ||
        (coverItem as any)?.thumbnailR2?.url ||
        (coverItem as any)?.url
      let finalUrl = getPreviewUrl(r2Url)
      const isMirrored =
        !!(coverItem as any)?.imageR2?.isMirrored ||
        !!(coverItem as any)?.imageMobileR2?.isMirrored ||
        !!(coverItem as any)?.imageDesktopR2?.isMirrored ||
        !!(coverItem as any)?.thumbnailR2?.isMirrored ||
        !!(coverItem as any)?.isMirrored

      return {
        title: name?.tr || name?.en || 'İsimsiz Ürün',
        media: renderPreviewMedia(finalUrl, (coverItem as any)?.type, isMirrored),
      }
    },
  },
})
