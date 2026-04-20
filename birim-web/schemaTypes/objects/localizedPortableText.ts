import {defineType, defineField} from 'sanity'
import {Palette} from 'lucide-react'
import PortableTextImagePreview from '../../components/PortableTextImagePreview'
import PortableTextImageInput from '../../components/PortableTextImageInput'
import {browserOnly, browserOnlyInput} from '../utils/browserOnly'

/**
 * Zengin Metin (Portable Text) Editor Yapılandırması
 * Bu yapılandırma Türkçe ve İngilizce alanlar için ortak kullanılır.
 */
const portableTextBlocks = [
  {
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'Başlık 1', value: 'h1'},
      {title: 'Başlık 2', value: 'h2'},
      {title: 'Başlık 3', value: 'h3'},
      {title: 'Başlık 4', value: 'h4'},
      {title: 'Başlık 5', value: 'h5'},
      {title: 'Başlık 6', value: 'h6'},
      {title: 'Alıntı', value: 'blockquote'},
    ],
    lists: [
      {title: 'Madde İşaretli', value: 'bullet'},
      {title: 'Numaralı', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Kalın', value: 'strong'},
        {title: 'İtalik', value: 'em'},
        {title: 'Altı Çizili', value: 'underline'},
        {title: 'Üstü Çizili', value: 'strike-through'},
        {title: 'Kod', value: 'code'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            {
              name: 'href',
              type: 'url',
              title: 'URL',
              validation: (Rule: any) =>
                Rule.uri({
                  scheme: ['http', 'https', 'mailto', 'tel'],
                }),
            },
            {
              name: 'blank',
              title: 'Yeni sekmede aç',
              type: 'boolean',
              initialValue: false,
            },
          ],
        },
        {
          name: 'internalLink',
          type: 'object',
          title: 'İç Link',
          fields: [
            {
              name: 'reference',
              type: 'reference',
              title: 'Referans',
              to: [
                {type: 'product'},
                {type: 'project'},
                {type: 'newsItem'},
                {type: 'designer'},
                {type: 'category'},
              ],
            },
          ],
        },
        {
          name: 'textColor',
          type: 'object',
          title: 'Metin Rengi',
          icon: Palette,
          fields: [
            {
              name: 'color',
              title: 'Renk Seçin',
              type: 'color',
            },
          ],
        },
      ],
    },
  },
  // Görsel Ekleme (R2 üzerinden)
  {
    name: 'portableTextImage',
    type: 'object',
    title: 'Görsel (R2)',
    fields: [
      {
        name: 'imageR2',
        type: 'r2Asset',
        title: 'Görsel',
      },
      {
        name: 'alt',
        type: 'string',
        title: 'Alternatif Metin',
        description: 'Ekran okuyucular için görsel açıklaması.',
      },
      {
        name: 'caption',
        type: 'string',
        title: 'Altyazı',
      },
      {
        name: 'layout',
        type: 'string',
        title: 'Yerleşim',
        options: {
          list: [
            {title: 'Tam Genişlik', value: 'full'},
            {title: 'Merkez', value: 'center'},
            {title: 'Yan Yana (Sol Kolon)', value: 'left'},
            {title: 'Yan Yana (Sağ Kolon)', value: 'right'},
          ],
        },
        initialValue: 'full',
      },
    ],
    components: {
      preview: browserOnly(PortableTextImagePreview),
      input: browserOnlyInput(PortableTextImageInput),
    },
    preview: {
      select: {
        imageR2: 'imageR2',
        caption: 'caption',
        alt: 'alt',
      },
    },
  },
  // YouTube Video Ekleme
  {
    name: 'youtube',
    type: 'object',
    title: 'YouTube Video',
    fields: [
      {
        name: 'url',
        type: 'url',
        title: 'YouTube URL',
      },
      {
        name: 'caption',
        type: 'string',
        title: 'Video Altyazı',
      },
    ],
  },
  // Ayırıcı (Divider)
  {
    name: 'divider',
    type: 'object',
    title: 'Ayırıcı Çizgi',
    fields: [
      {
        name: 'style',
        type: 'string',
        title: 'Stil',
        options: {
          list: [
            {title: 'İnce Çizgi', value: 'thin'},
            {title: 'Kalın Çizgi', value: 'thick'},
            {title: 'Noktalı Çizgi', value: 'dotted'},
          ],
        },
        initialValue: 'thin',
      },
    ],
  },
  // Call to Action (Buton)
  {
    name: 'cta',
    type: 'object',
    title: 'Buton (CTA)',
    fields: [
      {
        name: 'text',
        type: 'localizedString',
        title: 'Buton Metni',
      },
      {
        name: 'link',
        type: 'url',
        title: 'Link URL',
      },
      {
        name: 'style',
        type: 'string',
        title: 'Stil',
        options: {
          list: [
            {title: 'Siyah Buton', value: 'primary'},
            {title: 'Beyaz Buton', value: 'secondary'},
            {title: 'Çerçeveli', value: 'outline'},
          ],
        },
        initialValue: 'primary',
      },
    ],
  },
]

export const localizedPortableText = defineType({
  name: 'localizedPortableText',
  title: 'Çok Dilli Zengin Metin',
  type: 'object',
  fields: [
    defineField({
      name: 'tr',
      title: 'Türkçe',
      type: 'array',
      of: portableTextBlocks,
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: portableTextBlocks,
    }),
  ],
})
