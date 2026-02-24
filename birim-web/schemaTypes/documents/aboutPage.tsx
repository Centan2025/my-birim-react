import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'Hakkımızda',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImageR2',
      title: 'Hero Görseli (R2)',
      type: 'r2Asset',
    }),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString'}),
    // Özel üçlü bölüm: Tarihçe / Kimlik / Kalite
    defineField({
      name: 'historySection',
      title: 'Tarihçe Bölümü',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Bölüm Başlığı', type: 'localizedString'}),
        defineField({
          name: 'content',
          title: 'Tarihçe Metni',
          type: 'localizedPortableText',
        }),
        defineField({name: 'imageR2', title: 'Ana Görsel (R2)', type: 'r2Asset'}),
        defineField({
          name: 'media',
          title: 'Medya Galerisi',
          type: 'array',
          of: [{type: 'productPanelMediaItem'}],
          description: 'Bölüm için ek görseller veya videolar.',
        }),
      ],
    }),
    defineField({
      name: 'identitySection',
      title: 'Kimlik Bölümü',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Bölüm Başlığı', type: 'localizedString'}),
        defineField({
          name: 'content',
          title: 'Kimlik Metni',
          type: 'localizedPortableText',
        }),
        defineField({name: 'imageR2', title: 'Ana Görsel (R2)', type: 'r2Asset'}),
        defineField({
          name: 'media',
          title: 'Medya Galerisi',
          type: 'array',
          of: [{type: 'productPanelMediaItem'}],
          description: 'Bölüm için ek görseller veya videolar.',
        }),
      ],
    }),
    defineField({
      name: 'qualitySection',
      title: 'Kalite Bölümü',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Bölüm Başlığı', type: 'localizedString'}),
        defineField({
          name: 'content',
          title: 'Kalite Metni',
          type: 'localizedPortableText',
        }),
        defineField({name: 'imageR2', title: 'Ana Görsel (R2)', type: 'r2Asset'}),
        defineField({
          name: 'media',
          title: 'Medya Galerisi',
          type: 'array',
          of: [{type: 'productPanelMediaItem'}],
          description: 'Bölüm için ek görseller veya videolar.',
        }),
      ],
    }),
    defineField({
      name: 'values',
      title: 'Değerler',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
            defineField({name: 'description', title: 'Açıklama', type: 'localizedString'}),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {r2Url: 'heroImageR2.url'},
    prepare({r2Url}) {
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
        title: 'Hakkımızda',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt="Hakkımızda"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
