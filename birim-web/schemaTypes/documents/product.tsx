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
  fields: [
    orderRankField({type: 'product'}),
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc: any) => doc?.name?.tr || doc?.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'designers',
      title: 'Tasarımcılar',
      type: 'array',
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
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required().error('Her ürünün en az bir kategoriye atanması zorunludur.'),
      components: {
        input: ReferenceInputFix,
      },
    }),

    defineField({name: 'year', title: 'Yıl', type: 'number', validation: (Rule) => Rule.min(1900).max(2100)}),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      initialValue: true,
      description:
        'Bu ürünün web sitesinde görünüp görünmeyeceğini belirler. Kapalıysa ürün listede görünmez.',
    }),
    defineField({
      name: 'publishAt',
      title: 'Yayın Tarihi (Opsiyonel)',
      type: 'datetime',
      description:
        'Belirli bir tarihten sonra görünsün istiyorsanız kullanın. Boş bırakırsanız hemen yayına girer.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sıra (Opsiyonel)',
      type: 'number',
      description:
        'Kategori içindeki özel sıralama için. Küçük sayı önce gelir. Boş bırakırsanız yıl alanına göre sıralanır.',
    }),
    defineField({name: 'description', title: 'Açıklama', type: 'localizedPortableText'}),

    defineField({
      name: 'media',
      title: 'Ürün Medyası',
      type: 'array',
      of: [{type: 'productSimpleMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description:
        'Ürün görselleri, videoları ve YouTube bağlantıları. İdeal görsel boyutu 1920x1080px veya 1:1 karedir. Birini kapak olarak işaretleyebilirsiniz.',
    }),
    defineField({name: 'buyable', title: 'Satın Alınabilir', type: 'boolean'}),
    defineField({name: 'price', title: 'Fiyat', type: 'number'}),
    defineField({name: 'currency', title: 'Para Birimi', type: 'string'}),
    defineField({name: 'sku', title: 'Stok Kodu (SKU)', type: 'string'}),
    defineField({
      name: 'stockStatus',
      title: 'Stok Durumu',
      type: 'string',
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
      of: [{type: 'productDimensionImage'}],
      description:
        'Ürünün ölçülerini gösteren teknik çizim veya şema görselleri. Her görselin altında bir başlık gösterilecektir. Bu görseller ürün detay sayfasında malzemelerden önce gösterilecektir.',
    }),
    defineField({
      name: 'materialSelections',
      title: 'Malzeme Seçimleri',
      type: 'array',
      of: [{type: 'productMaterialSelection'}],
      description:
        'Bir veya birden fazla grubu seçin ve her gruptan kullanılacak malzemeleri işaretleyin.',
    }),
    defineField({
      name: 'showMaterials',
      title: 'Malzemeleri Göster',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({name: 'exclusiveContent', title: 'Özel İçerik', type: 'exclusiveContent'}),
    defineField({
      name: 'bottomMedia',
      title: 'Alt Medya Panelleri',
      type: 'array',
      of: [{type: 'productPanelMediaItem'}],
      description: 'Sayfa altındaki büyük medya panelleri.',
    }),
    defineField({
      name: 'mediaSectionTitle',
      title: 'Alt Medya Başlığı',
      type: 'localizedString',
      description: 'Alt Medya bölüm başlığı (boş bırakılırsa varsayılan çeviri kullanılır)',
    }),
    defineField({
      name: 'mediaSectionText',
      title: 'Alt Medya Açıklama Metni',
      type: 'localizedPortableText',
      description: 'Alt Medya bölümünde başlığın altında gösterilecek açıklama metni',
    }),
    defineField({
      name: 'showMediaPanels',
      title: 'Alt Medya Panellerini Göster',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      media: 'media',
    },
    prepare({name, media}: {name?: {tr?: string; en?: string}; media?: any[]}) {
      const coverItem = media?.find((m) => (m as any).isCover) || media?.[0]
      const r2Url =
        (coverItem as any)?.imageR2?.url ||
        (coverItem as any)?.videoFileR2?.url ||
        (coverItem as any)?.thumbnailR2?.url
      let finalUrl = getPreviewUrl(r2Url)
      const isMirrored =
        !!(coverItem as any)?.imageR2?.isMirrored || !!(coverItem as any)?.isMirrored

      return {
        title: name?.tr || name?.en || 'İsimsiz Ürün',
        media: renderPreviewMedia(finalUrl, (coverItem as any)?.type, isMirrored),
      }
    },
  },
})
