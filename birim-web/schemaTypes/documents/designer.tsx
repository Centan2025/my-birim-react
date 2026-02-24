import React from 'react'
import { defineField, defineType } from 'sanity'
import { orderRankField } from '@sanity/orderable-document-list'

export default defineType({
  name: 'designer',
  title: 'Tasarımcı',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: { source: (doc: any) => doc.name?.tr || doc.name?.en, maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: 'designer' }),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'bio', title: 'Biyografi', type: 'localizedPortableText' }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
    }),
  ],
  preview: {
    select: { title: 'name.tr', r2Url: 'imageR2.url' },
    prepare({ title, r2Url }) {
      return {
        title: title || 'Tasarımcı',
        media: r2Url ? (
          <img
            src={r2Url}
            alt={title || 'Tasarımcı'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : undefined
      }
    },
  },
})
