import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'newsItem',
  title: 'Haber',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.title?.tr || doc.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'date', title: 'Tarih', type: 'datetime'}),
    defineField({name: 'content', title: 'İçerik', type: 'localizedText'}),
    defineField({
      name: 'mainImage',
      title: 'Kapak Görseli (Tüm Cihazlar)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
    }),
    defineField({
      name: 'mainImageMobile',
      title: 'Kapak Görseli (Mobil)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
    }),
    defineField({
      name: 'mainImageDesktop',
      title: 'Kapak Görseli (Desktop)',
      type: 'image',
      options: {hotspot: true},
      description:
        'Desktop cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
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
                  {title: 'Image', value: 'image'},
                  {title: 'Video', value: 'video'},
                  {title: 'YouTube', value: 'youtube'},
                ],
              },
              initialValue: 'image',
            }),
            defineField({
              name: 'image',
              title: 'Görsel (Tüm Cihazlar)',
              type: 'image',
              options: {hotspot: true},
              hidden: ({parent}) => parent?.type !== 'image',
              description:
                'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
            }),
            defineField({
              name: 'imageMobile',
              title: 'Görsel (Mobil)',
              type: 'image',
              options: {hotspot: true},
              hidden: ({parent}) => parent?.type !== 'image',
              description:
                'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
            }),
            defineField({
              name: 'imageDesktop',
              title: 'Görsel (Desktop)',
              type: 'image',
              options: {hotspot: true},
              hidden: ({parent}) => parent?.type !== 'image',
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
              hidden: ({parent}) => parent?.type !== 'video',
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
              hidden: ({parent}) => parent?.type !== 'video',
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
              hidden: ({parent}) => parent?.type !== 'video',
              description:
                'Desktop cihazlar için özel video (opsiyonel). Yoksa varsayılan video kullanılır.',
            }),
            defineField({
              name: 'url',
              title: 'Video URL (veya YouTube URL)',
              type: 'url',
              hidden: ({parent}) =>
                parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
              description:
                'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
            }),
            defineField({name: 'caption', title: 'Açıklama', type: 'localizedString'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title.tr', media: 'mainImage'},
    prepare({title, media}) {
      return {title: title || 'Haber', media}
    },
  },
})
