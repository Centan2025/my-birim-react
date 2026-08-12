import React from 'react'
import {defineType, defineField} from 'sanity'
import {Palette, Type} from 'lucide-react'
import PortableTextImagePreview from '../../components/PortableTextImagePreview'
import PortableTextImageInput from '../../components/PortableTextImageInput'
import {browserOnly, browserOnlyInput} from '../utils/browserOnly'

const createFontSizeDecorator = (title: string, value: string, px: string) => ({
  title,
  value,
  icon: () =>
    React.createElement('span', {style: {fontSize: '11px', fontWeight: 600, padding: '0 2px'}}, px),
  component: (props: {children: React.ReactNode}) =>
    React.createElement('span', {style: {fontSize: px}}, props.children),
})

/**
 * Zengin Metin (Portable Text) Editor Yapılandırması
 * Bu yapılandırma Türkçe ve İngilizce alanlar için ortak kullanılır.
 */
const portableTextBlocks = [
  {
    type: 'block',
    styles: [
      {title: 'Normal (Paragraf)', value: 'normal'},
      {title: 'Paragraf Başlık 1 (H1)', value: 'h1'},
      {title: 'Paragraf Başlık 2 (H2)', value: 'h2'},
      {title: 'Paragraf Başlık 3 (H3)', value: 'h3'},
      {title: 'Paragraf Başlık 4 (H4)', value: 'h4'},
      {title: 'Paragraf Başlık 5 (H5)', value: 'h5'},
      {title: 'Paragraf Başlık 6 (H6)', value: 'h6'},
      {title: 'Alıntı (Blockquote)', value: 'blockquote'},
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
        createFontSizeDecorator('Seçili Metin: 12px', 'size-12px', '12px'),
        createFontSizeDecorator('Seçili Metin: 14px', 'size-14px', '14px'),
        createFontSizeDecorator('Seçili Metin: 16px', 'size-16px', '16px'),
        createFontSizeDecorator('Seçili Metin: 18px', 'size-18px', '18px'),
        createFontSizeDecorator('Seçili Metin: 20px', 'size-20px', '20px'),
        createFontSizeDecorator('Seçili Metin: 24px', 'size-24px', '24px'),
        createFontSizeDecorator('Seçili Metin: 28px', 'size-28px', '28px'),
        createFontSizeDecorator('Seçili Metin: 32px', 'size-32px', '32px'),
        createFontSizeDecorator('Seçili Metin: 36px', 'size-36px', '36px'),
        createFontSizeDecorator('Seçili Metin: 48px', 'size-48px', '48px'),
        createFontSizeDecorator('Seçili Metin: 64px', 'size-64px', '64px'),
        createFontSizeDecorator('Seçili Metin: Küçük (14px)', 'size-sm', '14px'),
        createFontSizeDecorator('Seçili Metin: Orta (18px)', 'size-md', '18px'),
        createFontSizeDecorator('Seçili Metin: Büyük (24px)', 'size-lg', '24px'),
        createFontSizeDecorator('Seçili Metin: Çok Büyük (32px)', 'size-xl', '32px'),
        createFontSizeDecorator('Seçili Metin: Dev (48px)', 'size-2xl', '48px'),
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
      {
        name: 'verticalAlign',
        type: 'string',
        title: 'Dikey Hizalama',
        options: {
          list: [
            {title: 'Üste Yasla', value: 'top'},
            {title: 'Ortala', value: 'center'},
            {title: 'Alta Yasla', value: 'bottom'},
          ],
        },
        initialValue: 'top',
        description: 'Yan yana duran görsellerin dikey hiza seçeneği (Üste, Ortala, Alta).',
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
            {title: 'Sadece Metin (Çerçevesiz)', value: 'text'},
          ],
        },
        initialValue: 'primary',
      },
      {
        name: 'align',
        type: 'string',
        title: 'Buton Konumu (Hizalama)',
        options: {
          list: [
            {title: 'Sol', value: 'left'},
            {title: 'Ortala', value: 'center'},
            {title: 'Sağ', value: 'right'},
          ],
        },
        initialValue: 'center',
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
      options: {
        // Bu alanların arama sonuçlarını kirletmemesi için ağırlığını (weight) çok düşürüyoruz
        search: {weight: 0},
      },
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: portableTextBlocks,
      options: {
        search: {weight: 0},
      },
    }),
    defineField({
      name: 'it',
      title: 'Italiano',
      type: 'array',
      of: portableTextBlocks,
      options: {
        search: {weight: 0},
      },
    }),
    defineField({
      name: 'de',
      title: 'Deutsch',
      type: 'array',
      of: portableTextBlocks,
      options: {
        search: {weight: 0},
      },
    }),
    defineField({
      name: 'fr',
      title: 'Français',
      type: 'array',
      of: portableTextBlocks,
      options: {
        search: {weight: 0},
      },
    }),
    defineField({
      name: 'es',
      title: 'Español',
      type: 'array',
      of: portableTextBlocks,
      options: {
        search: {weight: 0},
      },
    }),
  ],
})
