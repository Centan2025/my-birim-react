import React from 'react'
import { defineField, defineType } from 'sanity'
import { orderRankField } from '@sanity/orderable-document-list'
import { getPreviewUrl } from '../utils/previewUrl'

export default defineType({
  name: 'designer',
  title: 'Tasarımcı',
  type: 'document',
  fieldsets: [
    {
      name: 'profileMedia',
      title: '🎥 Profil Görseli & Art Direction',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: { source: (doc: any) => doc.name?.tr || doc.name?.en, maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    // ...(typeof window !== 'undefined' ? [orderRankField({ type: 'designer' })] : []),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Unvan / Rol',
      description: 'Örn: Mimar, Endüstriyel Tasarımcı, İç Mimar',
      type: 'localizedString',
    }),
    defineField({ name: 'bio', title: 'Biyografi', type: 'localizedPortableText' }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      fieldset: 'profileMedia',
      description: 'Varsayılan profil görseli. Mobil/Desktop klasörü yoksa bu kullanılır.',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      fieldset: 'profileMedia',
      description: 'Mobil özel klasörden otomatik yüklenir.',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      fieldset: 'profileMedia',
      description: 'Desktop özel klasörden otomatik yüklenir.',
    }),
  ],
  preview: {
    select: { title: 'name.tr', r2Url: 'imageR2.url' },
    prepare({ title, r2Url }) {
      let finalUrl = getPreviewUrl(r2Url)
      return {
        title: title || 'Tasarımcı',
        media: finalUrl ? (
          () => <img
            src={finalUrl}
            alt={title || 'Tasarımcı'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : undefined,
      }
    },
  },
})
