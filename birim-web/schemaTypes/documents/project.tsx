import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'
import {renderPreviewMedia} from '../objects/shared'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'
import {orderRankField} from '@sanity/orderable-document-list'

export default defineType({
  name: 'project',
  title: 'Proje',
  type: 'document',
  fieldsets: [
    {
      name: 'basicInfo',
      title: '📌 Temel Bilgiler',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'publishing',
      title: '🌐 Yayın & Sıralama Ayarları',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'mediaGroup',
      title: '🖼️ Proje Medyası & Görseller',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'contentGroup',
      title: '📝 İçerik & Bloklar',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru',
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
    orderRankField({type: 'project'}),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      fieldset: 'basicInfo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      fieldset: 'publishing',
      initialValue: true,
      description: 'Bu projenin web sitesinde listelerde görünüp görünmeyeceğini belirler.',
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
        'Küçük sayı önce gelir. Boş bırakırsanız oluşturulma tarihine göre (yeniden eskiye) sıralanır.',
    }),
    defineField({
      name: 'date',
      title: 'Yer + Tarih',
      type: 'localizedString',
      fieldset: 'basicInfo',
      description: 'Yer ve tarih bilgisini birlikte girin (örn: İstanbul + 15 Ocak 2024)',
    }),
    defineField({
      name: 'projectCategory',
      title: 'Proje Kategorisi',
      type: 'localizedString',
      fieldset: 'basicInfo',
      description: 'Proje türü bilgisi (örn: Mimari & İç Mekan, Mobilya Tasarım, İç Mimarlık)',
    }),
    defineField({
      name: 'media',
      title: 'Proje Medyası',
      type: 'array',
      fieldset: 'mediaGroup',
      of: [{type: 'productSimpleMediaItem'}],
      components: {
        input: BulkMediaUploadInput,
      },
      description:
        'Projeye ait tüm görsel ve videolar. İlk öğe listede önizleme olarak kullanılır.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Kısa Açıklama',
      type: 'localizedPortableText',
      fieldset: 'contentGroup',
    }),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      fieldset: 'contentGroup',
      of: [{type: 'contentBlock'}],
      options: {
        modal: {type: 'popover'},
      },
      description:
        'Proje detay sayfasında gösterilecek içerik blokları (ana sayfa ile aynı sistem)',
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
      titleObj: 'title',
      media: 'media',
    },
    prepare(selection: any = {}) {
      const {titleObj, media} = selection
      const coverItem = media?.find((m: any) => m.isCover) || media?.[0]
      const r2Url = coverItem?.imageR2?.url || coverItem?.thumbnailR2?.url
      let finalUrl = getPreviewUrl(r2Url)
      const displayTitle = titleObj?.tr || titleObj?.en || 'İsimsiz Proje'
      const isMirrored =
        !!(coverItem as any)?.imageR2?.isMirrored ||
        !!(coverItem as any)?.thumbnailR2?.isMirrored ||
        !!(coverItem as any)?.isMirrored

      return {
        title: displayTitle,
        media: renderPreviewMedia(finalUrl, (coverItem as any)?.type, isMirrored),
      }
    },
  },
})
