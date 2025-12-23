import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'newsItem',
  title: 'Haber',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: { source: (doc: any) => doc.title?.tr || doc.title?.en, maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'date', title: 'Tarih (Görünecek Tarih)', type: 'datetime' }),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      initialValue: true,
      description: 'Bu haberin web sitesinde listelerde görünüp görünmeyeceğini belirler.',
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
        'Küçük sayı önce gelir. Boş bırakırsanız tarih alanına göre (yeniden eskiye) sıralanır.',
    }),
    defineField({ name: 'content', title: 'İçerik', type: 'localizedPortableText' }),
    defineField({
      name: 'mainImage',
      title: 'Kapak Görseli (Tüm Cihazlar)',
      type: 'image',
      options: { hotspot: true },
      description:
        'Tüm cihazlar için varsayılan haber kapak görseli. Mobil veya desktop versiyonu yoksa bu kullanılır. Önerilen çözünürlük: Desktop 1600x900px (16:9), Mobil 1080x1350px (4:5).',
    }),
    defineField({
      name: 'mainImageMobile',
      title: 'Kapak Görseli (Mobil)',
      type: 'image',
      options: { hotspot: true },
      description:
        'Mobil cihazlar için özel kapak görseli (opsiyonel). Yoksa varsayılan görsel kullanılır. Önerilen çözünürlük: 1080x1350px veya 768x1024px.',
    }),
    defineField({
      name: 'mainImageDesktop',
      title: 'Kapak Görseli (Desktop)',
      type: 'image',
      options: { hotspot: true },
      description:
        'Desktop cihazlar için özel kapak görseli (opsiyonel). Yoksa varsayılan görsel kullanılır. Önerilen çözünürlük: 1600x900px veya 1920x1080px.',
    }),
    defineField({
      name: 'media',
      title: 'Medya',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'newsMedia',
          title: 'Haber Medyası',
          fields: [
            defineField({
              name: 'type',
              title: 'Tür',
              type: 'string',
              options: {
                list: [
                  { title: 'Image', value: 'image' },
                  { title: 'Video', value: 'video' },
                  { title: 'YouTube', value: 'youtube' },
                ],
              },
              initialValue: 'image',
            }),
            defineField({
              name: 'image',
              title: 'Görsel (Tüm Cihazlar)',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.type !== 'image',
              description:
                'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
            }),
            defineField({
              name: 'imageMobile',
              title: 'Görsel (Mobil)',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.type !== 'image',
              description:
                'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
            }),
            defineField({
              name: 'imageDesktop',
              title: 'Görsel (Desktop)',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.type !== 'image',
              description:
                'Desktop cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
            }),
            defineField({
              name: 'videoFile',
              title: 'Video Dosyası (Tüm Cihazlar)',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              hidden: ({ parent }) => parent?.type !== 'video',
              description:
                'Tüm cihazlar için varsayılan video. Mobil veya desktop versiyonu yoksa bu kullanılır.',
            }),
            defineField({
              name: 'videoFileMobile',
              title: 'Video Dosyası (Mobil)',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              hidden: ({ parent }) => parent?.type !== 'video',
              description:
                'Mobil cihazlar için özel video (opsiyonel). Yoksa varsayılan video kullanılır.',
            }),
            defineField({
              name: 'videoFileDesktop',
              title: 'Video Dosyası (Desktop)',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              hidden: ({ parent }) => parent?.type !== 'video',
              description:
                'Desktop cihazlar için özel video (opsiyonel). Yoksa varsayılan video kullanılır.',
            }),
            defineField({
              name: 'url',
              title: 'Video URL (veya YouTube URL)',
              type: 'url',
              hidden: ({ parent }) =>
                parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
              description:
                'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
            }),
            defineField({ name: 'caption', title: 'Açıklama', type: 'localizedString' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title.tr', media: 'mainImage' },
    prepare({ title, media }) {
      return { title: title || 'Haber', media }
    },
  },
})
