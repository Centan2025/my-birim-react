import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contactPage',
  title: 'İletişim Sayfası',
  type: 'document',
  fields: [
    defineField({
      name: 'locations',
      title: 'Lokasyonlar',
      type: 'array',
      of: [{type: 'contactLocation'}],
      description: 'İletişim sayfasında listelenecek şubeler/lokasyonlar',
    }),
    defineField({
      name: 'seo',
      title: 'SEO & Arama Motoru Ayarları',
      type: 'seoFields',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'İletişim Sayfası'}
    },
  },
})
