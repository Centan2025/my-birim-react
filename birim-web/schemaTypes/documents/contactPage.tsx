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
  ],
  preview: {
    prepare() {
      return {title: 'İletişim Sayfası'}
    },
  },
})
