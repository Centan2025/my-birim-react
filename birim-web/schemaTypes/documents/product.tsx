import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import {renderPreviewMedia} from '../utils/renderPreviewMedia'
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
      title: '🛒 SHOP SATIŞ KONFİGÜRASYONU',
      options: {collapsible: true, collapsed: false},
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
      title: 'E-Ticarette Satılabilir',
      type: 'boolean',
      fieldset: 'commerce',
      description:
        'Bu ürünün yapısal olarak BİRİM SHOP üzerinden doğrudan satışa uygun olup olmadığını belirler.',
    }),
    defineField({
      name: 'sale_enabled',
      title: 'Satış Aktif',
      type: 'boolean',
      fieldset: 'commerce',
      initialValue: false,
      description:
        'Bu ürünün şu anda BİRİM SHOP üzerinde aktif olarak satışa sunulup sunulmadığını belirler.',
    }),
    defineField({
      name: 'sales_mode',
      title: 'Satış Modu',
      type: 'string',
      fieldset: 'commerce',
      initialValue: 'NONE',
      options: {
        list: [
          {title: 'Satışa Kapalı (NONE)', value: 'NONE'},
          {title: 'Doğrudan Satış (DIRECT)', value: 'DIRECT'},
          {title: 'Varyant / Konfigüre Edilebilir (CONFIGURABLE)', value: 'CONFIGURABLE'},
          {title: 'Sadece Teklif Talebi (QUOTE)', value: 'QUOTE'},
        ],
      },
      description:
        'Ürünün satış davranışı: NONE (Satışa kapalı), DIRECT (Tekil doğrudan satış), CONFIGURABLE (Varyantlı), QUOTE (Teklif talebi).',
      validation: (Rule) =>
        Rule.custom((salesMode, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && (!salesMode || salesMode === 'NONE')) {
            return 'Satışa açık (sale_enabled=true) ürünlerde Satış Modu NONE olamaz.'
          }
          return true
        }),
    }),
    defineField({
      name: 'price',
      title: 'Fiyat',
      type: 'number',
      fieldset: 'commerce',
      validation: (Rule) =>
        Rule.custom((price, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && doc?.sales_mode === 'DIRECT') {
            if (price === undefined || price === null || price <= 0) {
              return 'Doğrudan satış (DIRECT) modu için geçerli bir ürün fiyatı gereklidir.'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'currency',
      title: 'Para Birimi',
      type: 'string',
      fieldset: 'commerce',
      initialValue: 'TRY',
      options: {
        list: [
          {title: 'TRY (₺)', value: 'TRY'},
          {title: 'EUR (€)', value: 'EUR'},
          {title: 'USD ($)', value: 'USD'},
        ],
      },
      validation: (Rule) =>
        Rule.custom((currency, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && doc?.sales_mode === 'DIRECT') {
            if (!currency) {
              return 'Doğrudan satış (DIRECT) modu için para birimi seçilmelidir.'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'sku',
      title: 'Stok Kodu (SKU)',
      type: 'string',
      fieldset: 'commerce',
      validation: (Rule) =>
        Rule.custom((sku, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && doc?.sales_mode === 'DIRECT') {
            if (!sku || !String(sku).trim()) {
              return 'Doğrudan satış (DIRECT) modu için Stok Kodu (SKU) zorunludur.'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'stockStatus',
      title: 'Stok Durumu',
      type: 'string',
      fieldset: 'commerce',
      initialValue: 'in_stock',
      options: {
        list: [
          {title: 'Stokta (in_stock)', value: 'in_stock'},
          {title: 'Stok Dışı (out_of_stock)', value: 'out_of_stock'},
          {title: 'Ön Sipariş (preorder)', value: 'preorder'},
        ],
      },
      validation: (Rule) =>
        Rule.custom((stockStatus, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && !stockStatus) {
            return 'Satışa açık ürünler için stok durumu seçilmelidir.'
          }
          return true
        }),
    }),
    defineField({
      name: 'leadTimeWeeks',
      title: 'Genel Termin / Üretim Süresi (Hafta)',
      type: 'number',
      fieldset: 'commerce',
      description: 'Sipariş sonrası üretim ve teslimat süresi (hafta cinsinden, örn: 4).',
    }),
    defineField({
      name: 'selectedDimensions',
      title: "Shop'ta Satılacak Ölçüler",
      type: 'array',
      fieldset: 'commerce',
      of: [{type: 'productSellableDimension'}],
      description:
        'Katalogda tanımlı ölçü çizelgelerinden veya ölçü görsellerinden hangilerinin online satışta seçilebileceğini belirler.',
    }),
    defineField({
      name: 'selectedMaterials',
      title: "Shop'ta Satılacak Malzemeler / Renkler",
      type: 'array',
      fieldset: 'commerce',
      of: [{type: 'productSellableMaterial'}],
      description:
        'Katalogda tanımlı malzeme seçimlerinden (kartela ve renkler) hangilerinin online satışta sunulacağını belirler.',
    }),
    defineField({
      name: 'variants',
      title: 'Ürün Varyantları',
      type: 'array',
      fieldset: 'commerce',
      of: [{type: 'productVariant'}],
      description:
        'Ürünün farklı ölçü, renk veya malzeme kombinasyonlarına özel varyant seçenekleri.',
      validation: (Rule) =>
        Rule.custom((variants: any, context) => {
          const doc = context.document as Record<string, any> | undefined
          if (doc?.sale_enabled && doc?.sales_mode === 'CONFIGURABLE') {
            if (!Array.isArray(variants) || variants.length === 0) {
              return 'CONFIGURABLE satış modu için en az 1 varyant eklenmelidir.'
            }
            const hasEnabled = variants.some((v) => v?.enabled === true)
            if (!hasEnabled) {
              return 'CONFIGURABLE satış modu için en az 1 aktif (enabled) varyant bulunmalıdır.'
            }
          }
          return true
        }),
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
      categoryName: 'category.name.tr',
      sales_mode: 'sales_mode',
      price: 'price',
      currency: 'currency',
      sku: 'sku',
      stockStatus: 'stockStatus',
      variants: 'variants',
      sale_enabled: 'sale_enabled',
    },
    prepare(selection: Record<string, unknown> = {}) {
      const {
        name,
        media,
        categoryName,
        sales_mode,
        price,
        currency,
        sku,
        stockStatus,
        variants,
        sale_enabled,
      } = selection as {
        name?: {tr?: string; en?: string}
        media?: Array<{
          type?: string
          isCover?: boolean
          isMirrored?: boolean
          imageR2?: {url?: string; isMirrored?: boolean}
          imageDesktopR2?: {url?: string; isMirrored?: boolean}
          imageMobileR2?: {url?: string; isMirrored?: boolean}
          videoFileR2?: {url?: string; isMirrored?: boolean}
          videoFileDesktopR2?: {url?: string; isMirrored?: boolean}
          videoFileMobileR2?: {url?: string; isMirrored?: boolean}
          thumbnailR2?: {url?: string; isMirrored?: boolean}
          url?: string
        }>
        categoryName?: string
        sales_mode?: string
        price?: number
        currency?: string
        sku?: string
        stockStatus?: string
        variants?: Array<{enabled?: boolean}>
        sale_enabled?: boolean
      }
      const coverItem = media?.find((m) => m.isCover) || media?.[0]
      const r2Url =
        coverItem?.imageR2?.url ||
        coverItem?.imageDesktopR2?.url ||
        coverItem?.imageMobileR2?.url ||
        coverItem?.thumbnailR2?.url ||
        coverItem?.videoFileR2?.url ||
        coverItem?.videoFileDesktopR2?.url ||
        coverItem?.videoFileMobileR2?.url ||
        coverItem?.url
      const finalUrl = getPreviewUrl(r2Url)
      const isMirrored =
        (coverItem?.imageR2?.url && coverItem?.imageR2?.isMirrored) ||
        (coverItem?.imageDesktopR2?.url && coverItem?.imageDesktopR2?.isMirrored) ||
        (coverItem?.imageMobileR2?.url && coverItem?.imageMobileR2?.isMirrored) ||
        !!coverItem?.thumbnailR2?.isMirrored ||
        !!coverItem?.isMirrored

      const parts: string[] = []
      if (categoryName) parts.push(categoryName)

      if (sales_mode === 'DIRECT') {
        parts.push('DIRECT')
        if (typeof price === 'number' && price > 0) {
          const curSym =
            currency === 'TRY'
              ? '₺'
              : currency === 'EUR'
                ? '€'
                : currency === 'USD'
                  ? '$'
                  : currency || ''
          parts.push(`${curSym}${price.toLocaleString('tr-TR')}`)
        }
      } else if (sales_mode === 'CONFIGURABLE') {
        const variantCount = Array.isArray(variants) ? variants.length : 0
        const activeCount = Array.isArray(variants) ? variants.filter((v) => v?.enabled).length : 0
        parts.push(
          activeCount > 0
            ? `CONFIGURABLE (${activeCount} Aktif / ${variantCount} Varyant)`
            : `CONFIGURABLE (${variantCount} Varyant)`,
        )
      } else if (sales_mode === 'QUOTE') {
        parts.push('QUOTE (Teklif)')
      }

      if (sku) {
        parts.push(`SKU: ${sku}`)
      }

      if (stockStatus) {
        const stockLabel =
          stockStatus === 'in_stock'
            ? 'Stokta'
            : stockStatus === 'out_of_stock'
              ? 'Stok Dışı'
              : stockStatus === 'preorder'
                ? 'Ön Sipariş'
                : stockStatus
        parts.push(stockLabel)
      }

      return {
        title: name?.tr || name?.en || 'İsimsiz Ürün',
        subtitle: parts.length > 0 ? parts.join(' · ') : undefined,
        media: renderPreviewMedia(finalUrl, coverItem?.type, isMirrored),
      }
    },
  },
})
