import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'newsItem',
  title: 'Haber',
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
    defineField({name: 'date', title: 'Tarih (Görünecek Tarih)', type: 'datetime'}),
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
    defineField({name: 'content', title: 'İçerik', type: 'localizedPortableText'}),
    defineField({
      name: 'mainImageR2',
      title: 'Kapak Görseli (Tüm Cihazlar)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'mainImageMobileR2',
      title: 'Kapak Görseli (Mobil)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'mainImageDesktopR2',
      title: 'Kapak Görseli (Desktop)',
      type: 'r2Asset',
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
            defineField({name: 'caption', title: 'Açıklama', type: 'localizedString'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title.tr', r2Url: 'mainImageR2.url'},
    prepare({title, r2Url}) {
      let finalUrl = getPreviewUrl(r2Url)
      return {
        title: title || 'Haber',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt={title || 'Haber'}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
