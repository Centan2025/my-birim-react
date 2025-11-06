import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Ürün',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'name', title: 'Ad', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'designer',
      title: 'Tasarımcı',
      type: 'reference',
      to: [{type: 'designer'}],
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({name: 'year', title: 'Yıl', type: 'number'}),
    defineField({name: 'description', title: 'Açıklama', type: 'localizedText'}),
    defineField({name: 'mainImage', title: 'Ana Görsel', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'alternativeImages',
      title: 'Alternatif Görseller',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'dimensionImages',
      title: 'Ölçü Görselleri',
      type: 'array',
      of: [{type: 'productDimensionImage'}],
      description: 'Ürünün ölçülerini gösteren teknik çizim veya şema görselleri. Her görselin altında bir başlık gösterilecektir. Bu görseller ürün detay sayfasında malzemelerden önce gösterilecektir.',
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
      name: 'materialSelections',
      title: 'Malzeme Seçimleri',
      type: 'array',
      of: [{ type: 'productMaterialSelection' }],
      description: 'Bir veya birden fazla grubu seçin ve her gruptan kullanılacak malzemeleri işaretleyin.'
    }),
    defineField({name: 'showMaterials', title: 'Malzemeleri Göster', type: 'boolean', initialValue: true}),
    defineField({
      name: 'variants',
      title: 'Varyantlar',
      type: 'array',
      of: [{type: 'productVariant'}],
    }),
    defineField({name: 'exclusiveContent', title: 'Özel İçerik', type: 'exclusiveContent'}),
  ],
  preview: {
    select: {title: 'name.tr', media: 'mainImage'},
    prepare({title, media}) {
      return {title: title || 'Ürün', media}
    },
  },
})



