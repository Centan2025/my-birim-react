import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Proje',
  type: 'document',
  fields: [
    defineField({ name: 'id', title: 'ID (Slug)', type: 'slug', options: { source: (doc)=> doc.title?.tr || doc.title?.en, maxLength: 96 }, validation: (Rule)=> Rule.required() }),
    defineField({ name: 'title', title: 'Başlık', type: 'localizedString', validation: (Rule)=> Rule.required() }),
    defineField({ name: 'date', title: 'Yer + Tarih', type: 'localizedString', description: 'Yer ve tarih bilgisini birlikte girin (örn: İstanbul + 15 Ocak 2024)' }),
    defineField({ name: 'cover', title: 'Kapak Görseli', type: 'image', options: {hotspot: true} }),
    defineField({ name: 'excerpt', title: 'Kısa Açıklama', type: 'localizedText' }),
    defineField({ 
      name: 'media', 
      title: 'Medya (Görsel ve Video)', 
      type: 'array', 
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'type',
              title: 'Tür',
              type: 'string',
              options: { list: [
                { title: 'Image', value: 'image' },
                { title: 'Video', value: 'video' },
                { title: 'YouTube', value: 'youtube' },
              ]},
              initialValue: 'image',
            }),
            defineField({
              name: 'image',
              title: 'Görsel',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.type !== 'image',
            }),
            defineField({
              name: 'videoFile',
              title: 'Video Dosyası',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              hidden: ({ parent }) => parent?.type !== 'video',
              description: 'Video dosyasını sürükle-bırak ile yükleyin',
            }),
            defineField({
              name: 'url',
              title: 'Video URL (veya YouTube URL)',
              type: 'url',
              hidden: ({ parent }) => parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
              description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
            }),
          ],
        }
      ]
    }),
    defineField({ name: 'body', title: 'İçerik', type: 'localizedText' })
  ],
  preview: {
    select: { title: 'title.tr', media: 'cover' },
    prepare({title, media}) { return { title: title || 'Proje', media } }
  }
})
