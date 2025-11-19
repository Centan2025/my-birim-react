import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export default defineType({
  name: 'category',
  title: 'Kategori',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({type: 'category'}),
    defineField({name: 'name', title: 'Ad', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({name: 'heroImage', title: 'Kapak Görseli', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'menuImage',
      title: 'Menü Görseli',
      type: 'image',
      description: 'Ürünler menüsünde gösterilecek görsel (yatay dikdörtgen format önerilir)',
      options: {hotspot: true}
    }),
  ],
  preview: {
    select: {title: 'name.tr', media: 'heroImage'},
    prepare({title, media}) {
      return {title: title || 'Kategori', media}
    },
  },
})



