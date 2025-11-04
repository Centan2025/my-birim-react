import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID (Slug)',
      type: 'slug',
      options: {source: (doc) => doc.name?.tr || doc.name?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'name', title: 'Name', type: 'localizedString', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'designer',
      title: 'Designer',
      type: 'reference',
      to: [{type: 'designer'}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({name: 'description', title: 'Description', type: 'localizedString'}),
    defineField({name: 'mainImage', title: 'Main Image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'alternativeImages',
      title: 'Alternative Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'array',
      of: [{type: 'productDimensionSet'}],
    }),
    defineField({name: 'buyable', title: 'Buyable', type: 'boolean'}),
    defineField({name: 'price', title: 'Price', type: 'number'}),
    defineField({name: 'currency', title: 'Currency', type: 'string'}),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({
      name: 'stockStatus',
      title: 'Stock Status',
      type: 'string',
      options: {
        list: [
          {title: 'In Stock', value: 'in_stock'},
          {title: 'Out of Stock', value: 'out_of_stock'},
          {title: 'Preorder', value: 'preorder'},
        ],
      },
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [{type: 'productMaterial'}],
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [{type: 'productVariant'}],
    }),
    defineField({name: 'exclusiveContent', title: 'Exclusive Content', type: 'exclusiveContent'}),
  ],
  preview: {
    select: {title: 'name.tr', media: 'mainImage'},
    prepare({title, media}) {
      return {title: title || 'Product', media}
    },
  },
})



