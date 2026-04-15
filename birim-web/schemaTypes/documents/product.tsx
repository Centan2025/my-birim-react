import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'

import { orderRankField } from '@sanity/orderable-document-list'

export default defineType({
  name: 'product',
  title: 'Ürün',
  type: 'document',
  fields: [
    // ...(typeof window !== 'undefined' ? [orderRankField({ type: 'product' })] : []),
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
      of: [{type: 'reference', to: [{type: 'designer'}]}],
      description: 'Bu ürünü tasarlayan bir veya daha fazla tasarımcı ekleyebilirsiniz.',
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({name: 'year', title: 'Yıl', type: 'number'}),
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
        input: BulkMediaUploadInput
      },
      description: 'Ürün görselleri, videoları ve YouTube bağlantıları. Birini kapak olarak işaretleyebilirsiniz.',
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
      description:
        'Sayfa altındaki büyük medya panelleri.',
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
  ],
  preview: {
    select: {
      title: 'name.tr', 
      media: 'media'
    },
    prepare({title, media}) {
      const coverItem = media?.find((m: any) => m.isCover) || media?.[0]
      const r2Url = coverItem?.imageR2?.url || coverItem?.thumbnailR2?.url
      let finalUrl = getPreviewUrl(r2Url)

      return {
        title: title || 'Ürün',
        media: finalUrl ? (
          () => <img
            src={finalUrl}
            alt={title || 'Ürün'}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
