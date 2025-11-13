import {defineType, defineField} from 'sanity'

export const linkMark = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'href', title: 'URL', type: 'url'}),
    defineField({name: 'blank', title: 'Yeni sekmede aç', type: 'boolean'}),
  ],
})

export const localizedPortableText = defineType({
  name: 'localizedPortableText',
  title: 'Çok Dilli Zengin Metin',
  type: 'object',
  fields: [
    defineField({
      name: 'tr',
      title: 'Türkçe',
      type: 'array',
      of: [
        {type: 'block', marks: {annotations: [{name: 'link', type: 'object', fields: [{name:'href', type:'url', title:'URL'}]}]}},
      ],
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: [
        {type: 'block', marks: {annotations: [{name: 'link', type: 'object', fields: [{name:'href', type:'url', title:'URL'}]}]}},
      ],
    }),
  ],
})







