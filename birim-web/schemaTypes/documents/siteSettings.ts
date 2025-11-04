import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'logo', title: 'Logo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'headerText', title: 'Header Text', type: 'string'}),
    defineField({name: 'isHeaderTextVisible', title: 'Show Header Text', type: 'boolean'}),
  ],
  preview: {
    select: {title: 'headerText', media: 'logo'},
    prepare({title, media}) {
      return {title: title || 'Site Settings', media}
    },
  },
})



