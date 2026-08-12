import React from 'react'
import {defineField, defineType} from 'sanity'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'
import {getPreviewUrl} from '../utils/previewUrl'
import {renderPreviewMedia} from '../objects/shared'

export default defineType({
  name: 'newsItem',
  title: 'Haber',
  type: 'document',
  fieldsets: [
    {
      name: 'basicInfo',
      title: '📌 Temel Bilgiler (Başlık, ID & Tarih)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'publishing',
      title: '🌐 Yayın & Sıralama Ayarları',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'contentGroup',
      title: '📝 Haber Metni & İçerik Blokları',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'mediaGroup',
      title: '🖼️ Haber Medyası & Görseller',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru Ayarları',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      fieldset: 'basicInfo',
      options: {source: (doc: any) => doc.title?.tr || doc.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      fieldset: 'basicInfo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Haber Türü / Kategori',
      type: 'string',
      fieldset: 'basicInfo',
      description: 'Haberin kategorisi: Basın, Sergi & Etkinlik, Ödüller, Lansman vb.',
      options: {
        list: [
          {title: 'Basın (Press)', value: 'press'},
          {title: 'Sergi & Etkinlik (Exhibition & Events)', value: 'events'},
          {title: 'Ödüller (Awards)', value: 'awards'},
          {title: 'Lansman (Launch)', value: 'launch'},
        ],
        layout: 'dropdown',
      },
      initialValue: 'press',
    }),
    defineField({
      name: 'readTime',
      title: 'Okuma Süresi (Opsiyonel)',
      type: 'string',
      fieldset: 'basicInfo',
      description:
        'Örn: "3 dk okuma" veya "3 min read". Boş bırakılırsa içerik uzunluğuna göre otomatik hesaplanır.',
    }),
    defineField({
      name: 'date',
      title: 'Tarih (Görünecek Tarih)',
      type: 'datetime',
      fieldset: 'basicInfo',
    }),
    defineField({
      name: 'featured',
      title: 'Öne Çıkan / Manşet Haber',
      type: 'boolean',
      fieldset: 'publishing',
      initialValue: false,
      description:
        'Aktif edilirse bu haber, Haberler sayfasının en üstünde manşet görseliyle öne çıkarılır.',
    }),
    defineField({
      name: 'featuredBadgeTitle',
      title: 'Öne Çıkan Rozet Metni (Opsiyonel)',
      type: 'localizedString',
      fieldset: 'publishing',
      description:
        'Manşet görseli üzerindeki rozet metni. Örn: "ÖNE ÇIKAN HİKAYE", "EDİTÖRÜN SEÇİMİ", "ÖZEL HABER". Boş bırakılırsa varsayılan metin gösterilir.',
      hidden: ({document}) => !document?.featured,
    }),
    defineField({
      name: 'pressKitUrl',
      title: 'Basın Kiti / Medya İndirme Bağlantısı (Opsiyonel)',
      type: 'url',
      fieldset: 'publishing',
      description:
        'Basın veya mimarlar için haber ile ilgili indirilebilir materyal bağlantısı (ZIP / PDF).',
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      fieldset: 'publishing',
      initialValue: true,
      description: 'Bu haberin web sitesinde listelerde görünüp görünmeyeceğini belirler.',
    }),
    defineField({
      name: 'publishAt',
      title: 'Yayın Tarihi (Opsiyonel)',
      type: 'datetime',
      fieldset: 'publishing',
      description:
        'Belirli bir tarihten sonra görünsün istiyorsanız kullanın. Boş bırakırsanız hemen yayına girer.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sıra (Opsiyonel)',
      type: 'number',
      fieldset: 'publishing',
      description:
        'Küçük sayı önce gelir. Boş bırakırsanız tarih alanına göre (yeniden eskiye) sıralanır.',
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'localizedPortableText',
      fieldset: 'contentGroup',
    }),

    defineField({
      name: 'media',
      title: 'Haber Medyası',
      type: 'array',
      fieldset: 'mediaGroup',
      description:
        '💡 GÖRSEL ORAN ÖNERİSİ: Liste kartı kapak fotoğrafları için 4:3 (1200x900px) veya 3:2 (1200x800px) yatay editoryal oranlar; Manşet (Öne Çıkan) kartı için 16:9 (1920x1080px) yatay oran kullanılması tavsiye edilir.',
      components: {
        input: BulkMediaUploadInput,
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
              description:
                'Bu görsel haber kapak fotoğrafı olur. 📐 Önerilen Oran: Liste kartı için 4:3 (1200x900px), Manşet kartı için 16:9 (1920x1080px).',
            }),
            defineField({
              name: 'imageR2',
              title: 'Görsel (Tüm Cihazlar)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              description:
                '📐 Önerilen Oran: 16:9 veya 4:3 yatay editoryal format (Örn: 1920x1080px veya 1200x900px).',
              hidden: ({parent}) => !!parent?.type && parent?.type !== 'image',
            }),
            defineField({
              name: 'imageMobileR2',
              title: 'Görsel (Mobil)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              description:
                '📐 Mobil ekranlar için önerilen oran: 4:3 veya 1:1 kare (Örn: 800x600px veya 800x800px).',
              hidden: ({parent}) => !!parent?.type && parent?.type !== 'image',
            }),
            defineField({
              name: 'imageDesktopR2',
              title: 'Görsel (Desktop)',
              type: 'r2Asset',
              fieldset: 'artDirection',
              description:
                '📐 Geniş ekranlar için önerilen oran: 16:9 sinematik yatay format (Örn: 1920x1080px).',
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
                media: finalUrl
                  ? () => (
                      <img
                        src={finalUrl}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    )
                  : undefined,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
      media: 'media',
    },
    prepare(selection: any = {}) {
      const {title, media} = selection
      const coverItem = media?.find((m: any) => m.isCover) || media?.[0]
      const r2Url = coverItem?.imageR2?.url || coverItem?.thumbnailR2?.url
      let finalUrl = getPreviewUrl(r2Url)
      const isMirrored =
        !!(coverItem as any)?.imageR2?.isMirrored ||
        !!(coverItem as any)?.thumbnailR2?.isMirrored ||
        !!(coverItem as any)?.isMirrored

      return {
        title: title || 'Haber',
        media: renderPreviewMedia(
          finalUrl,
          (coverItem as any)?.mediaType || (coverItem as any)?.type,
          isMirrored,
        ),
      }
    },
  },
})
