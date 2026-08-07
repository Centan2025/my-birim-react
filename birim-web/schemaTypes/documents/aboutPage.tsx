import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'aboutPage',
  title: 'Hakkımızda',
  type: 'document',
  fieldsets: [
    {
      name: 'heroGroup',
      title: '🎬 Hero & Manifesto Bölümü',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'timelineGroup',
      title: '⏳ Tarihçe Zaman Çizelgesi (Timeline)',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'historyGroup',
      title: '📜 Tarihçe Bölümü',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'identityGroup',
      title: '🆔 Kimlik Bölümü',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'qualityGroup',
      title: '⭐ Kalite Bölümü',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'valuesGroup',
      title: '💎 Kurumsal Değerler',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO Ayarları',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'heroImageR2',
      title: 'Hero Görseli (R2)',
      type: 'r2Asset',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Başlığı',
      type: 'localizedString',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Alt Başlığı',
      type: 'localizedString',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'manifestoLabel',
      title: 'Manifesto Etiketi',
      type: 'localizedString',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'manifestoQuote',
      title: 'Felsefe / Manifesto Alıntısı',
      type: 'localizedString',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'timelineTitle',
      title: 'Tarihçe Zaman Çizelgesi Başlığı',
      type: 'localizedString',
      fieldset: 'timelineGroup',
    }),
    defineField({
      name: 'timelineSubtitle',
      title: 'Tarihçe Zaman Çizelgesi Alt Başlığı',
      type: 'localizedString',
      fieldset: 'timelineGroup',
    }),
    defineField({
      name: 'eras',
      title: 'Tarihçe Dönemleri / Dönüm Noktaları',
      type: 'array',
      fieldset: 'timelineGroup',
      of: [
        {
          type: 'object',
          name: 'eraItem',
          title: 'Dönem',
          fields: [
            defineField({name: 'year', title: 'Yıl / Dönem', type: 'string'}),
            defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
            defineField({name: 'description', title: 'Açıklama', type: 'localizedString'}),
            defineField({name: 'imageR2', title: 'Dönem Görseli (R2)', type: 'r2Asset'}),
          ],
          preview: {
            select: {
              title: 'title.tr',
              subtitle: 'year',
            },
            prepare({title, subtitle}) {
              return {
                title: title || 'Dönem',
                subtitle: subtitle || '',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'historySection',
      title: 'Tarihçe Bölümü',
      type: 'object',
      fieldset: 'historyGroup',
      options: {collapsible: true, collapsed: false},
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
      fieldset: 'identityGroup',
      options: {collapsible: true, collapsed: false},
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
      fieldset: 'qualityGroup',
      options: {collapsible: true, collapsed: false},
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
      fieldset: 'valuesGroup',
      of: [
        {
          type: 'object',
          name: 'valueItem',
          fields: [
            defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
            defineField({name: 'description', title: 'Açıklama', type: 'localizedString'}),
          ],
          preview: {
            select: {
              title: 'title.tr',
              subtitle: 'title.en',
            },
            prepare({title, subtitle}) {
              return {
                title: title || subtitle || 'Değer',
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
    select: {r2Url: 'heroImageR2.url'},
    prepare({r2Url}) {
      let finalUrl = getPreviewUrl(r2Url)
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
