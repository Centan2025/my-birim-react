import React from 'react'
import {defineField, defineType} from 'sanity'
import {getPreviewUrl} from '../utils/previewUrl'

export default defineType({
  name: 'aboutPageV2',
  title: 'Hakkımızda (Mimari V2)',
  type: 'document',
  fieldsets: [
    {
      name: 'heroGroup',
      title: '🎬 Hero Bölümü (Ana Görsel & Başlıklar)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'manifestoGroup',
      title: '💬 Manifesto & Felsefe Bölümü',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'timelineGroup',
      title: '⏳ Tarihçe Zaman Çizelgesi (Timeline)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'identityGroup',
      title: '🆔 Kimlik Bölümü',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'qualityGroup',
      title: '⭐ Kalite Bölümü',
      options: {collapsible: true, collapsed: false},
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
      title: 'Hero Görseli (Masaüstü R2)',
      type: 'r2Asset',
      fieldset: 'heroGroup',
    }),
    defineField({
      name: 'heroImageMobileR2',
      title: 'Hero Görseli (Mobil R2)',
      type: 'r2Asset',
      fieldset: 'heroGroup',
    }),
    defineField({name: 'heroBadge', title: 'Hero Üst Etiketi', type: 'localizedString', fieldset: 'heroGroup'}),
    defineField({name: 'heroTitle', title: 'Hero Başlığı', type: 'localizedString', fieldset: 'heroGroup'}),
    defineField({name: 'heroSubtitle', title: 'Hero Alt Başlığı', type: 'localizedString', fieldset: 'heroGroup'}),
    defineField({name: 'manifestoLabel', title: 'Manifesto Etiketi', type: 'localizedString', fieldset: 'manifestoGroup'}),
    defineField({
      name: 'manifestoQuote',
      title: 'Felsefe / Manifesto Alıntısı',
      type: 'localizedString',
      fieldset: 'manifestoGroup',
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
            defineField({name: 'imageR2', title: 'Dönem Görseli (Masaüstü R2)', type: 'r2Asset'}),
            defineField({
              name: 'imageMobileR2',
              title: 'Dönem Görseli (Mobil R2)',
              type: 'r2Asset',
            }),
          ],
          preview: {
            select: {
              title: 'title.tr',
              subtitle: 'year',
              r2Url: 'imageR2.url',
            },
            prepare({title, subtitle, r2Url}) {
              const finalUrl = getPreviewUrl(r2Url)
              return {
                title: title || 'Dönem',
                subtitle: subtitle || '',
                media: finalUrl ? (
                  <img
                    src={finalUrl}
                    alt={title || ''}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : undefined,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'identitySection',
      title: 'Kimlik Bölümü',
      type: 'object',
      fieldset: 'identityGroup',
      fields: [
        defineField({name: 'title', title: 'Bölüm Başlığı', type: 'localizedString'}),
        defineField({
          name: 'content',
          title: 'Kimlik Metni',
          type: 'localizedPortableText',
        }),
        defineField({name: 'imageR2', title: 'Ana Görsel (Masaüstü R2)', type: 'r2Asset'}),
        defineField({name: 'imageMobileR2', title: 'Ana Görsel (Mobil R2)', type: 'r2Asset'}),
        defineField({
          name: 'media',
          title: 'Medya Galerisi',
          type: 'array',
          of: [{type: 'productPanelMediaItem'}],
          description: 'Bölüm için ek görseller veya videolar (R2).',
        }),
      ],
    }),
    defineField({
      name: 'qualitySection',
      title: 'Kalite Bölümü',
      type: 'object',
      fieldset: 'qualityGroup',
      fields: [
        defineField({name: 'title', title: 'Bölüm Başlığı', type: 'localizedString'}),
        defineField({
          name: 'content',
          title: 'Kalite Metni',
          type: 'localizedPortableText',
        }),
        defineField({name: 'imageR2', title: 'Ana Görsel (Masaüstü R2)', type: 'r2Asset'}),
        defineField({name: 'imageMobileR2', title: 'Ana Görsel (Mobil R2)', type: 'r2Asset'}),
        defineField({
          name: 'media',
          title: 'Medya Galerisi',
          type: 'array',
          of: [{type: 'productPanelMediaItem'}],
          description: 'Bölüm için ek görseller veya videolar (R2).',
        }),
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
      const finalUrl = getPreviewUrl(r2Url)
      return {
        title: 'Hakkımızda (Mimari V2)',
        media: finalUrl ? (
          <img
            src={finalUrl}
            alt="Hakkımızda V2"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : undefined,
      }
    },
  },
})
