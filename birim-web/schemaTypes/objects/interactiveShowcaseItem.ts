import {defineField, defineType} from 'sanity'
import InteractiveShowcaseItemInput from '../../components/InteractiveShowcaseItemInput'

export const interactiveShowcaseItem = defineType({
  name: 'interactiveShowcaseItem',
  title: 'İnteraktif Slayt Görseli',
  type: 'object',
  components: {
    input: InteractiveShowcaseItemInput,
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Slayt Başlığı (Opsiyonel)',
      type: 'localizedString',
      description: 'Görsel üzerinde veya altında görünebilecek özel başlık (TR / EN)',
    }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Masaüstü)',
      type: 'r2Asset',
      description: 'Ürünlerin kullanıldığı tam ekran arka plan görseli',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil - Opsiyonel)',
      type: 'r2Asset',
      description: 'Mobil ekranlar için özel dikey/kare kesim görsel',
    }),
    defineField({
      name: 'hotspots',
      title: 'Ürün Noktaları (Hotspots)',
      type: 'array',
      of: [{type: 'productHotspot'}],
      description: 'Görsel üzerinde işaretlenecek ürün noktaları',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
      hotspots: 'hotspots',
    },
    prepare({title, hotspots}) {
      const count = Array.isArray(hotspots) ? hotspots.length : 0
      return {
        title: title || 'İnteraktif Slayt Görseli',
        subtitle: `${count} ürün noktası işaretlendi`,
      }
    },
  },
})

export default interactiveShowcaseItem
