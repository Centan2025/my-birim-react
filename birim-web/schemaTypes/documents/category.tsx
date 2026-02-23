import React from 'react'
import { defineField, defineType } from 'sanity'
import { orderRankField } from '@sanity/orderable-document-list'

export default defineType({
  name: 'category',
  title: 'Kategori',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: { source: (doc: any) => doc.name?.tr || doc.name?.en, maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: 'category' }),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'subtitle', title: 'Alt Başlık', type: 'localizedString' }),
    defineField({
      name: 'heroImage',
      title: 'Kapak Görseli',
      type: 'image',
      options: { hotspot: true },
      description:
        'Kategori sayfası hero alanı için yatay görsel. Önerilen çözünürlük: Desktop 1920x1080px (16:9), Mobil 1080x1920px (9:16).',
    }),
    defineField({
      name: 'heroImageR2',
      title: 'Kapak Görseli (R2)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'menuImage',
      title: 'Menü Görseli',
      type: 'image',
      description:
        'Ürünler menüsünde gösterilecek görsel. Yatay dikdörtgen format önerilir. Önerilen çözünürlük: 600x400px veya 800x500px.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'menuImageR2',
      title: 'Menü Görseli (R2)',
      type: 'r2Asset',
    }),
  ],
  preview: {
    select: { title: 'name.tr', media: 'heroImage', r2Url: 'heroImageR2.url' },
    prepare({ title, media, r2Url }) {
      return {
        title: title || 'Kategori',
        media: media || (r2Url ? (
          <img
            src={r2Url}
            alt={title || 'Kategori'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : undefined)
      }
    },
  },
})
