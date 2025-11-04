import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroMedia',
      title: 'Hero Media',
      type: 'array',
      of: [{type: 'heroMediaItem'}],
    }),
    defineField({name: 'isHeroTextVisible', title: 'Show Hero Text', type: 'boolean'}),
    defineField({name: 'isLogoVisible', title: 'Show Logo', type: 'boolean'}),
    defineField({
      name: 'featuredProducts',
      title: 'Featured Products',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
    }),
    defineField({
      name: 'featuredDesigner',
      title: 'Featured Designer',
      type: 'reference',
      to: [{type: 'designer'}],
    }),
    defineField({
      name: 'inspirationSection',
      title: 'Inspiration Section',
      type: 'object',
      fields: [
        defineField({name: 'backgroundImage', title: 'Background Image', type: 'image', options: {hotspot: true}}),
        defineField({name: 'title', title: 'Title', type: 'localizedString'}),
        defineField({name: 'subtitle', title: 'Subtitle', type: 'localizedString'}),
        defineField({name: 'buttonText', title: 'Button Text', type: 'localizedString'}),
        defineField({name: 'buttonLink', title: 'Button Link', type: 'string'}),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Home Page'}
    },
  },
})



