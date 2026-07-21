import React from 'react'
import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {getPreviewUrl} from '../utils/previewUrl'
import {CategoryPreview} from '../../components/CategoryPreview'
import CategoryDocumentInput from '../../components/CategoryDocumentInput'

export default defineType({
  name: 'category',
  title: 'Kategori',
  type: 'document',
  components: {
    preview: CategoryPreview,
    input: CategoryDocumentInput,
  },
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc: any) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({type: 'category'}),
    defineField({
      name: 'name',
      title: 'Ad',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({
      name: 'heroImageR2',
      title: 'Kapak Görseli',
      type: 'r2Asset',
    }),
    defineField({
      name: 'menuImageR2',
      title: 'Menü Görseli',
      type: 'r2Asset',
    }),
  ],
  preview: {
    select: {_id: '_id', title: 'name.tr', r2Url: 'heroImageR2.url'},
    prepare({_id, title, r2Url}) {
      let finalUrl = getPreviewUrl(r2Url)
      return {
        _id,
        title: title || 'Kategori',
        media: finalUrl
          ? () => (
              <img
                src={finalUrl}
                alt={title || 'Kategori'}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )
          : undefined,
      }
    },
  },
})
