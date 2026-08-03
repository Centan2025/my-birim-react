import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'İletişim Sayfası',
  type: 'document',
  fieldsets: [
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
