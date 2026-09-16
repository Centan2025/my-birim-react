import {defineField, defineType} from 'sanity'

export const productVariant = defineType({
  name: 'productVariant',
  title: 'Ürün Varyantı',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Varyant ID',
      type: 'string',
      description: 'Varyant için benzersiz tanımlayıcı (örn. VAR-NAT-240).',
    }),
    defineField({
      name: 'title',
      title: 'Varyant Başlığı',
      type: 'localizedString',
      description: 'Varyantın adı veya kombinasyon tanımı (örn. Meşe / 240 cm).',
    }),
    defineField({
      name: 'sku',
      title: 'Varyant SKU',
      type: 'string',
      description: 'Varyanta özel stok kodu.',
    }),
    defineField({
      name: 'price',
      title: 'Varyant Fiyatı',
      type: 'number',
      description: 'Varyanta özel fiyat (boş bırakılırsa ana ürün fiyatı geçerlidir).',
    }),
    defineField({
      name: 'currency',
      title: 'Para Birimi',
      type: 'string',
      initialValue: 'TRY',
    }),
    defineField({
      name: 'options',
      title: 'Varyant Seçenekleri (Key/Value)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'variantOption',
          title: 'Varyant Seçeneği',
          fields: [
            defineField({
              name: 'name',
              title: 'Özellik Adı (örn. COLOR, SIZE, MATERIAL)',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Değer (örn. Natural, 240, Oak)',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              name: 'name',
              value: 'value',
            },
            prepare(selection) {
              const {name, value} = selection
              return {
                title: `${name || 'Özellik'}: ${value || '-'}`,
              }
            },
          },
        },
      ],
      description: 'Varyantı niteleyen seçenekler (örn. COLOR: Natural, SIZE: 240, MATERIAL: Oak).',
    }),
    defineField({
      name: 'enabled',
      title: 'Varyant Aktif',
      type: 'boolean',
      initialValue: true,
      description: 'Bu varyantın satışta/seçimde aktif olup olmadığını belirler.',
    }),
  ],
  preview: {
    select: {
      titleTr: 'title.tr',
      titleEn: 'title.en',
      sku: 'sku',
      price: 'price',
      currency: 'currency',
      enabled: 'enabled',
    },
    prepare(selection) {
      const {titleTr, titleEn, sku, price, currency, enabled} = selection
      const title = titleTr || titleEn || sku || 'İsimsiz Varyant'
      const priceStr = price !== undefined ? ` - ${price} ${currency || 'TRY'}` : ''
      const status = enabled === false ? ' (Pasif)' : ''
      return {
        title: `${title}${priceStr}${status}`,
        subtitle: sku ? `SKU: ${sku}` : undefined,
      }
    },
  },
})

export default productVariant
