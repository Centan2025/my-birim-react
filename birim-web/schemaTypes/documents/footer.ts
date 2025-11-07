import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'footer',
  title: 'Altbilgi',
  type: 'document',
  fields: [
    defineField({name: 'copyrightText', title: 'Telif', type: 'localizedString'}),
    defineField({
      name: 'partners',
      title: 'Partnerler',
      type: 'array',
      of: [{type: 'footerPartner'}],
      description: 'Yeni format: Logo, isim ve link ile partner ekleyebilirsiniz',
    }),
    defineField({
      name: 'partnerNames',
      title: 'Partner İsimleri (Eski Format)',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Eski format - kullanımdan kaldırıldı. Lütfen yukarıdaki "Partnerler" alanını kullanın.',
      hidden: true, // Gizli tutuyoruz ama schema'da var olması gerekiyor
    }),
    defineField({
      name: 'linkColumns',
      title: 'Bağlantı Sütunları',
      type: 'array',
      of: [{type: 'footerLinkColumn'}],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Sosyal Bağlantılar',
      type: 'array',
      of: [{type: 'socialLink'}],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Altbilgi'}
    },
  },
})



