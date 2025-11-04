import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({name: 'heroImage', title: 'Hero Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'heroTitle', title: 'Hero Title', type: 'localizedString'}),
    defineField({name: 'heroSubtitle', title: 'Hero Subtitle', type: 'localizedString'}),
    defineField({name: 'storyTitle', title: 'Story Title', type: 'localizedString'}),
    defineField({name: 'storyContentP1', title: 'Story Content P1', type: 'localizedString'}),
    defineField({name: 'storyContentP2', title: 'Story Content P2', type: 'localizedString'}),
    defineField({name: 'storyImage', title: 'Story Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'isQuoteVisible', title: 'Show Quote', type: 'boolean'}),
    defineField({name: 'quoteText', title: 'Quote Text', type: 'localizedString'}),
    defineField({name: 'quoteAuthor', title: 'Quote Author', type: 'string'}),
    defineField({
      name: 'values',
      title: 'Values',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Title', type: 'localizedString'}),
          defineField({name: 'description', title: 'Description', type: 'localizedString'}),
        ],
      }],
    }),
  ],
  preview: {
    select: {media: 'heroImage'},
    prepare({media}) {
      return {title: 'About Page', media}
    },
  },
})



