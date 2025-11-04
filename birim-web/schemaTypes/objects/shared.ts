import {defineField, defineType} from 'sanity'
import {localizedString} from './localizedString'

export const productDimensionDetail = defineType({
  name: 'productDimensionDetail',
  title: 'Product Dimension Detail',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'localizedString'}),
    defineField({name: 'value', title: 'Value', type: 'string'}),
  ],
})

export const productDimensionSet = defineType({
  name: 'productDimensionSet',
  title: 'Product Dimension Set',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localizedString'}),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'array',
      of: [{type: 'productDimensionDetail'}],
    }),
  ],
})

export const productMaterial = defineType({
  name: 'productMaterial',
  title: 'Product Material',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localizedString'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
  ],
})

export const productVariant = defineType({
  name: 'productVariant',
  title: 'Product Variant',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localizedString'}),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({name: 'price', title: 'Price', type: 'number'}),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
  ],
})

export const downloadableItem = defineType({
  name: 'downloadableItem',
  title: 'Downloadable Item',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'localizedString'}),
    defineField({name: 'file', title: 'File', type: 'file'}),
  ],
})

export const exclusiveContent = defineType({
  name: 'exclusiveContent',
  title: 'Exclusive Content',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'drawings',
      title: 'Technical Drawings',
      type: 'array',
      of: [{type: 'downloadableItem'}],
    }),
    defineField({
      name: 'models3d',
      title: '3D Models',
      type: 'array',
      of: [{type: 'downloadableItem'}],
    }),
  ],
})

export const heroMediaItem = defineType({
  name: 'heroMediaItem',
  title: 'Hero Media Item',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: [
        {title: 'Image', value: 'image'},
        {title: 'Video', value: 'video'},
        {title: 'YouTube', value: 'youtube'},
      ]},
      initialValue: 'image',
    }),
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedString'}),
    defineField({name: 'isButtonVisible', title: 'Show Button', type: 'boolean'}),
    defineField({name: 'buttonText', title: 'Button Text', type: 'localizedString'}),
    defineField({name: 'buttonLink', title: 'Button Link', type: 'string'}),
  ],
})

export const footerLink = defineType({
  name: 'footerLink',
  title: 'Footer Link',
  type: 'object',
  fields: [
    defineField({name: 'text', title: 'Text', type: 'localizedString'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
  ],
})

export const footerLinkColumn = defineType({
  name: 'footerLinkColumn',
  title: 'Footer Link Column',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{type: 'footerLink'}],
    }),
  ],
})

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social Link',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'svgIcon', title: 'SVG Icon', type: 'text'}),
    defineField({name: 'isEnabled', title: 'Enabled', type: 'boolean'}),
  ],
})

export const contactLocation = defineType({
  name: 'contactLocation',
  title: 'Contact Location',
  type: 'object',
  fields: [
    defineField({name: 'type', title: 'Type', type: 'localizedString'}),
    defineField({name: 'title', title: 'Title', type: 'localizedString'}),
    defineField({name: 'address', title: 'Address', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'mapEmbedUrl', title: 'Map Embed URL', type: 'url'}),
  ],
})



