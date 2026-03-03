import React from 'react'
import { defineField, defineType } from 'sanity'
import { getPreviewUrl } from '../utils/previewUrl'

export default defineType({
  name: 'project',
  title: 'Proje',
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
      name: 'projectCategory',
      title: 'Proje Kategorisi',
      type: 'localizedString',
      description: 'Proje türü bilgisi (örn: Mimari & İç Mekan, Mobilya Tasarım, İç Mimarlık)',
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
    defineField({ name: 'excerpt', title: 'Kısa Açıklama', type: 'localizedPortableText' }),
    defineField({
      name: 'contentBlocks',
      title: 'İçerik Blokları',
      type: 'array',
      of: [{ type: 'contentBlock' }],
      description: 'Proje detay sayfasında gösterilecek içerik blokları (ana sayfa ile aynı sistem)',
    }),
  ],
  preview: {
    select: { title: 'title.tr', r2Url: 'coverR2.url' },
    prepare({ title, r2Url }) {
      let finalUrl = getPreviewUrl(r2Url)
      return {
        title: title || 'Proje',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt={title || 'Proje'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : undefined,
      }
    },
  },
})
