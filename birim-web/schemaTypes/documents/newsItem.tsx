import React from 'react'
import {defineField, defineType} from 'sanity'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'
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
      name: 'media',
      title: 'Haber Medyası',
      type: 'array',
      components: {
        input: BulkMediaUploadInput
      },
      of: [
        {
          type: 'object',
          name: 'newsMedia',
          title: 'Haber Medyası',
          fieldsets: [
            {
              name: 'artDirection',
              title: '🎥 Art Direction',
              options: {collapsible: true, collapsed: false},
            },
          ],
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
              name: 'isCover',
              title: 'Kapak Görseli mi?',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'imageR2',
              title: 'Görsel (Tüm Cihazlar)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => !!parent?.type && parent?.type !== 'image',
            }),
            defineField({
              name: 'imageMobileR2',
              title: 'Görsel (Mobil)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => !!parent?.type && parent?.type !== 'image',
            }),
            defineField({
              name: 'imageDesktopR2',
              title: 'Görsel (Desktop)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => !!parent?.type && parent?.type !== 'image',
            }),
            defineField({
              name: 'videoFileR2',
              title: 'Video (Tüm Cihazlar)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'videoFileMobileR2',
              title: 'Video (Mobil)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'videoFileDesktopR2',
              title: 'Video (Desktop)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              hidden: ({parent}) => parent?.type !== 'video',
            }),
            defineField({
              name: 'url',
              title: 'URL (Video veya YouTube)',
              type: 'url',
              hidden: ({parent}) => !parent?.type || parent?.type === 'image',
            }),
            defineField({
              name: 'thumbnailR2',
              title: 'Önizleme Görseli (Thumbnail)',
              type: 'r2Asset',
              hidden: ({parent}) => !parent?.type || parent?.type === 'image',
            }),
            defineField({
              name: 'caption',
              title: 'Açıklama',
              type: 'localizedString',
            }),
          ],
          preview: {
            select: {
              type: 'type',
              isCover: 'isCover',
              imageUrl: 'imageR2.url',
              thumbUrl: 'thumbnailR2.url',
            },
            prepare({type, isCover, imageUrl, thumbUrl}) {
              const r2Url = type === 'image' ? imageUrl : thumbUrl || imageUrl
              let finalUrl = getPreviewUrl(r2Url)
              return {
                title: `${isCover ? '⭐ ' : ''}${type === 'image' ? 'Resim Öğesi' : type === 'video' ? 'Video Öğesi' : 'YouTube Öğesi'}`,
                media: finalUrl ? (
                  () => <img
                    src={finalUrl}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : undefined,
              }
            },
          },
        },
      ],
      description: 'Haber içerisindeki görseller ve videolar. Birini kapak olarak işaretleyebilirsiniz.',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr', 
      media: 'media'
    },
    prepare({title, media}) {
      const coverItem = media?.find((m: any) => m.isCover) || media?.[0]
      const r2Url = coverItem?.imageR2?.url || coverItem?.thumbnailR2?.url
      let finalUrl = getPreviewUrl(r2Url)

      return {
        title: title || 'Haber',
        media: finalUrl ? (
          () => <img
            src={finalUrl}
            alt={title || 'Haber'}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
