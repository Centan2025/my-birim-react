import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Proje',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc: any) => doc.title?.tr || doc.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      initialValue: true,
      description: 'Bu projenin web sitesinde listelerde görünüp görünmeyeceğini belirler.',
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
        'Küçük sayı önce gelir. Boş bırakırsanız oluşturulma tarihine göre (yeniden eskiye) sıralanır.',
    }),
    defineField({
      name: 'date',
      title: 'Yer + Tarih',
      type: 'localizedString',
      description: 'Yer ve tarih bilgisini birlikte girin (örn: İstanbul + 15 Ocak 2024)',
    }),
    defineField({
      name: 'coverR2',
      title: 'Kapak Görseli (Tüm Cihazlar)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'coverMobileR2',
      title: 'Kapak Görseli (Mobil)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'coverDesktopR2',
      title: 'Kapak Görseli (Desktop)',
      type: 'r2Asset',
    }),
    defineField({name: 'excerpt', title: 'Kısa Açıklama', type: 'localizedPortableText'}),
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
              name: 'imageR2',
              title: 'Görsel (Tüm Cihazlar)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'image',
            }),
            defineField({
              name: 'imageMobileR2',
              title: 'Görsel (Mobil)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'image',
            }),
            defineField({
              name: 'imageDesktopR2',
              title: 'Görsel (Desktop)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'image',
            }),
            defineField({
              name: 'videoFileR2',
              title: 'Video Dosyası (Tüm Cihazlar)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'videoFileMobileR2',
              title: 'Video Dosyası (Mobil)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'videoFileDesktopR2',
              title: 'Video Dosyası (Desktop)',
              type: 'r2Asset',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'url',
              title: 'Video URL (veya YouTube URL)',
              type: 'url',
              hidden: ({parent}) => parent?.type === 'image',
              description:
                'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
            }),
          ],
        },
      ],
    }),
    defineField({name: 'body', title: 'İçerik', type: 'localizedPortableText'}),
  ],
  preview: {
    select: {title: 'title.tr', r2Url: 'coverR2.url'},
    prepare({title, r2Url}) {
      let finalUrl = r2Url
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      return {
        title: title || 'Proje',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt={title || 'Proje'}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
