import {defineField, defineType} from 'sanity'

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
    defineField({name: 'isHeroTextVisible', title: 'Hero Metnini Göster', type: 'boolean'}),
    defineField({name: 'isLogoVisible', title: 'Logoyu Göster', type: 'boolean'}),
    defineField({
      name: 'featuredProducts',
      title: 'Öne Çıkan Ürünler',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
    defineField({
      name: 'featuredDesigner',
      title: 'Öne Çıkan Tasarımcı',
      type: 'reference',
      to: [{type: 'designer'}],
    }),
    defineField({
      name: 'inspirationSection',
      title: 'İlham Bölümü',
      type: 'object',
      fields: [
        defineField({name: 'backgroundImage', title: 'Arka Plan Görseli', type: 'image', options: {hotspot: true}}),
        defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
        defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
        defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
        defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Ana Sayfa'}
    },
  },
})



