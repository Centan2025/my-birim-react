import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'İletişim Sayfası',
  type: 'document',
  fieldsets: [
    {
      name: 'generalGroup',
      title: 'ℹ️ Genel Bilgiler',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'locationsGroup',
      title: '📍 Lokasyonlar & Şubeler',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'seoGroup',
      title: '🔍 SEO & Arama Motoru',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Sayfa Başlığı',
      type: 'localizedString',
      fieldset: 'generalGroup',
      description: 'İletişim sayfasının ana başlığı (ör. İletişim / Contact)',
    }),
    defineField({
      name: 'subtitle',
      title: 'Alt Başlık / Açıklama',
      type: 'localizedText',
      fieldset: 'generalGroup',
      description: 'İletişim sayfasında üstte görünen açıklama metni',
    }),
    defineField({
      name: 'locations',
      title: 'Lokasyonlar',
      type: 'array',
      fieldset: 'locationsGroup',
      of: [{type: 'contactLocation'}],
      description: 'İletişim sayfasında listelenecek şubeler/lokasyonlar',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
      fieldset: 'seoGroup',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'İletişim Sayfası'}
    },
  },
})
