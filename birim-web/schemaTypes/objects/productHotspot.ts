import {defineField, defineType} from 'sanity'

export const productHotspot = defineType({
  name: 'productHotspot',
  title: 'Ürün Noktası (Hotspot)',
  type: 'object',
  fields: [
    defineField({
      name: 'x',
      title: 'X Koordinatı (%)',
      type: 'number',
      description: 'Görselin solundan sağa yüzdelik konumu (0 - 100)',
      validation: (Rule) => Rule.required().min(0).max(100),
      initialValue: 50,
    }),
    defineField({
      name: 'y',
      title: 'Y Koordinatı (%)',
      type: 'number',
      description: 'Görselin üstünden alta yüzdelik konumu (0 - 100)',
      validation: (Rule) => Rule.required().min(0).max(100),
      initialValue: 50,
    }),
    defineField({
      name: 'product',
      title: 'İlişkili Ürün',
      type: 'reference',
      to: [{type: 'product'}],
      description: 'Bu noktaya tıklandığında gösterilecek ürün',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Özel Etiket / Başlık (Opsiyonel)',
      type: 'localizedString',
      description: 'Ürün adını özel bir metinle ezmek isterseniz doldurun',
    }),
  ],
  preview: {
    select: {
      productTitle: 'product.name.tr',
      productSlug: 'product.slug.current',
      x: 'x',
      y: 'y',
    },
    prepare({productTitle, productSlug, x, y}) {
      return {
        title: productTitle || productSlug || 'İlişkili Ürün',
        subtitle: `Konum: X: %${x ?? 50}, Y: %${y ?? 50}`,
      }
    },
  },
})

export default productHotspot
