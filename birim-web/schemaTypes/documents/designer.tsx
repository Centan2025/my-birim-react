import React from 'react'
import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'designer',
  title: 'Tasarımcı',
  type: 'document',
  fieldsets: [
    {
      name: 'basicInfo',
      title: '👤 Profil & Biyografi',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'profileMedia',
      title: '🎥 Profil Görselleri (Desktop & Mobil)',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      fieldset: 'basicInfo',
      options: {source: (doc: any) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({type: 'designer'}),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      fieldset: 'basicInfo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Unvan / Rol',
      description: 'Örn: Mimar, Endüstriyel Tasarımcı, İç Mimar',
      type: 'localizedString',
      fieldset: 'basicInfo',
    }),
    defineField({
      name: 'bio',
      title: 'Biyografi',
      type: 'localizedPortableText',
      fieldset: 'basicInfo',
    }),
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
    select: {name: 'name', r2Url: 'imageR2.url'},
    prepare({name, r2Url}: {name?: {tr?: string; en?: string}; r2Url?: string}) {
      let finalUrl = getPreviewUrl(r2Url)
      const displayTitle = name?.tr || name?.en || 'İsimsiz Tasarımcı'
      return {
        title: displayTitle,
        media: finalUrl
          ? () => (
              <img
                src={finalUrl}
                alt={displayTitle}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )
          : undefined,
      }
    },
  },
})
