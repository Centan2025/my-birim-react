import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Ayarları',
  type: 'document',
  fields: [
    defineField({name: 'logo', title: 'Logo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'headerText', title: 'Başlık Metni', type: 'string'}),
    defineField({name: 'isHeaderTextVisible', title: 'Başlık Metnini Göster', type: 'boolean'}),
    defineField({name: 'showProductPrevNext', title: 'Ürün Detayında Alt Önceki/Sonraki Düğmeleri', type: 'boolean', initialValue: false}),
  ],
  preview: {
    select: {title: 'headerText', media: 'logo'},
    prepare({title, media}) {
      return {title: title || 'Site Ayarları', media}
    },
  },
})



