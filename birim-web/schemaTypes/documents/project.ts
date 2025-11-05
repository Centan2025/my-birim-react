import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Proje',
  type: 'document',
  fields: [
    defineField({ name: 'id', title: 'ID (Slug)', type: 'slug', options: { source: (doc)=> doc.title?.tr || doc.title?.en, maxLength: 96 }, validation: (Rule)=> Rule.required() }),
    defineField({ name: 'title', title: 'Başlık', type: 'localizedString', validation: (Rule)=> Rule.required() }),
    defineField({ name: 'date', title: 'Tarih', type: 'date' }),
    defineField({ name: 'cover', title: 'Kapak Görseli', type: 'image', options: {hotspot: true} }),
    defineField({ name: 'excerpt', title: 'Kısa Açıklama', type: 'localizedText' }),
    defineField({ name: 'gallery', title: 'Galeri', type: 'array', of: [{ type: 'image', options: {hotspot: true} }] }),
    defineField({ name: 'body', title: 'İçerik', type: 'localizedText' })
  ],
  preview: {
    select: { title: 'title.tr', media: 'cover' },
    prepare({title, media}) { return { title: title || 'Proje', media } }
  }
})
