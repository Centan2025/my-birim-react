import {defineField, defineType} from 'sanity'
import {localizedString} from './localizedString'
import MaterialSelectionInput from '../../components/MaterialSelectionInput'

export const productDimensionDetail = defineType({
  name: 'productDimensionDetail',
  title: 'Ürün Ölçü Detayı',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Etiket', type: 'localizedString'}),
    defineField({name: 'value', title: 'Değer', type: 'string'}),
  ],
})

export const productDimensionSet = defineType({
  name: 'productDimensionSet',
  title: 'Ürün Ölçü Seti',
  type: 'object',
  fields: [
    defineField({
      name: 'details',
      title: 'Detaylar',
      type: 'array',
      of: [{type: 'productDimensionDetail'}],
    }),
  ],
})

export const productDimensionImage = defineType({
  name: 'productDimensionImage',
  title: 'Ölçü Görseli',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Görsel', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString', description: 'Görselin altında görünecek başlık'}),
  ],
})

export const productMaterial = defineType({
  name: 'productMaterial',
  title: 'Ürün Malzemesi',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Ad', type: 'localizedString'}),
    defineField({name: 'image', title: 'Görsel', type: 'image', options: {hotspot: true}}),
  ],
})

export const materialSwatchBook = defineType({
  name: 'materialSwatchBook',
  title: 'Kartela',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'localizedString', validation: (Rule)=> Rule.required() }),
    defineField({ name: 'items', title: 'Malzemeler', type: 'array', of: [{ type: 'productMaterial' }] })
  ],
})

export const downloadableItem = defineType({
  name: 'downloadableItem',
  title: 'İndirilebilir Öğe',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Ad', type: 'localizedString'}),
    defineField({name: 'file', title: 'Dosya', type: 'file'}),
  ],
})

export const exclusiveContent = defineType({
  name: 'exclusiveContent',
  title: 'Özel İçerik',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Görseller',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'drawings',
      title: 'Teknik Çizimler',
      type: 'array',
      of: [{type: 'downloadableItem'}],
    }),
    defineField({
      name: 'models3d',
      title: '3D Modeller',
      type: 'array',
      of: [{type: 'downloadableItem'}],
    }),
  ],
})

export const heroMediaItem = defineType({
  name: 'heroMediaItem',
  title: 'Hero Medya Öğesi',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Tür',
      type: 'string',
      options: {list: [
        {title: 'Image', value: 'image'},
        {title: 'Video', value: 'video'},
        {title: 'YouTube', value: 'youtube'},
      ]},
      initialValue: 'image',
    }),
    // For image type, allow direct image upload
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: { hotspot: true },
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    // For video, allow file upload
    defineField({
      name: 'videoFile',
      title: 'Video Dosyası',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      hidden: ({parent}) => parent?.type !== 'video',
      description: 'Video dosyasını sürükle-bırak ile yükleyin',
    }),
    // For video/youtube or external image, allow URL
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.'
    }),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({name: 'isButtonVisible', title: 'Butonu Göster', type: 'boolean'}),
    defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
    defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
  ],
})

// Simpler media item for Alternative Media on product detail
export const productSimpleMediaItem = defineType({
  name: 'productSimpleMediaItem',
  title: 'Basit Medya Öğesi',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Tür',
      type: 'string',
      options: { list: [
        { title: 'Image', value: 'image' },
        { title: 'Video', value: 'video' },
        { title: 'YouTube', value: 'youtube' },
      ]},
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video Dosyası',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      hidden: ({ parent }) => parent?.type !== 'video',
      description: 'Video dosyasını sürükle-bırak ile yükleyin',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({ parent }) => parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
  ],
})

// Panel medyası (Alt Medya): sadece başlık, görüntü/video/YouTube
export const productPanelMediaItem = defineType({
  name: 'productPanelMediaItem',
  title: 'Panel Medya Öğesi',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Tür',
      type: 'string',
      options: { list: [
        { title: 'Image', value: 'image' },
        { title: 'Video', value: 'video' },
        { title: 'YouTube', value: 'youtube' },
      ]},
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video Dosyası',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      hidden: ({ parent }) => parent?.type !== 'video',
      description: 'Video dosyasını sürükle-bırak ile yükleyin',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({ parent }) => parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({ name: 'title', title: 'Başlık', type: 'localizedString' }),
    defineField({ 
      name: 'description', 
      title: 'Açıklama', 
      type: 'localizedText',
      description: 'Bu medya öğesi için açıklama metni'
    }),
    defineField({ 
      name: 'link', 
      title: 'Link URL', 
      type: 'string',
      description: 'Bu medya öğesi için link URL\'si (isteğe bağlı)'
    }),
    defineField({ 
      name: 'linkText', 
      title: 'Link Metni', 
      type: 'localizedString',
      description: 'Link için gösterilecek metin (link URL doluysa gösterilir)'
    }),
  ],
})

export const footerPartner = defineType({
  name: 'footerPartner',
  title: 'Footer Partner',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'İsim', type: 'localizedString', description: 'Logo yoksa gösterilecek metin'}),
    defineField({name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true }}),
    defineField({name: 'url', title: 'Link URL', type: 'url'}),
  ],
})

export const footerLink = defineType({
  name: 'footerLink',
  title: 'Altbilgi Bağlantısı',
  type: 'object',
  fields: [
    defineField({name: 'text', title: 'Metin', type: 'localizedString'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
  ],
})

export const footerLinkColumn = defineType({
  name: 'footerLinkColumn',
  title: 'Altbilgi Bağlantı Sütunu',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({
      name: 'links',
      title: 'Bağlantılar',
      type: 'array',
      of: [{type: 'footerLink'}],
    }),
  ],
})

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Sosyal Bağlantı',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Ad', type: 'string'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'svgIcon', title: 'SVG İkon', type: 'text'}),
    defineField({name: 'isEnabled', title: 'Aktif', type: 'boolean'}),
  ],
})

export const legalLink = defineType({
  name: 'legalLink',
  title: 'Yasal Bağlantı',
  type: 'object',
  fields: [
    defineField({name: 'text', title: 'Metin', type: 'localizedString'}),
    defineField({
      name: 'url', 
      title: 'URL', 
      type: 'string',
      description: 'İç link için: /cookies, /about gibi. Dış link için: https://example.com gibi tam URL.',
      validation: (Rule) => Rule.required()
    }),
    defineField({name: 'isVisible', title: 'Görünür', type: 'boolean', initialValue: true}),
  ],
})

export const contactLocation = defineType({
  name: 'contactLocation',
  title: 'İletişim Lokasyonu',
  type: 'object',
  fields: [
    defineField({name: 'type', title: 'Tür', type: 'localizedString'}),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'address', title: 'Adres', type: 'string'}),
    defineField({name: 'phone', title: 'Telefon', type: 'string'}),
    defineField({name: 'email', title: 'E-posta', type: 'string'}),
    defineField({name: 'mapEmbedUrl', title: 'Harita Embed URL', type: 'url'}),
  ],
})

// Product-specific: group-based material selection
export const productMaterialSelection = defineType({
  name: 'productMaterialSelection',
  title: 'Malzeme Seçimi (Grup Bazlı)',
  type: 'object',
  components: {
    input: MaterialSelectionInput,
  },
  fields: [
    defineField({
      name: 'group',
      title: 'Malzeme Grubu',
      type: 'reference',
      to: [{ type: 'materialGroup' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'materials',
      title: 'Seçilen Malzemeler',
      type: 'array',
      of: [{ type: 'productMaterial' }],
      description: 'Seçilen gruptan bu ürün için kullanılacak malzemeler',
    }),
  ],
})

export const contentBlock = defineType({
  name: 'contentBlock',
  title: 'İçerik Bloğu',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Medya Türü',
      type: 'string',
      options: {
        list: [
          {title: 'Görsel', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: { hotspot: true },
      hidden: ({parent}) => parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video Dosyası',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      hidden: ({parent}) => parent?.mediaType !== 'video',
      description: 'Video dosyasını sürükle-bırak ile yükleyin',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.mediaType === 'image' || (parent?.mediaType === 'video' && parent?.videoFile),
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({
      name: 'description',
      title: 'Açıklama Metni',
      type: 'localizedText',
    }),
    defineField({
      name: 'linkText',
      title: 'Link Metni',
      type: 'localizedString',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'string',
    }),
    defineField({
      name: 'position',
      title: 'Konum',
      type: 'string',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Sağ', value: 'right'},
          {title: 'Orta', value: 'center'},
          {title: 'Tam Genişlik', value: 'full'},
        ],
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'order',
      title: 'Sıra',
      type: 'number',
      description: 'Hero bölümünden sonra görünecek sıra (düşük sayı önce görünür)',
      initialValue: 0,
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Arka Plan Rengi',
      type: 'string',
      options: {
        list: [
          {title: 'Beyaz', value: 'white'},
          {title: 'Gri', value: 'gray'},
        ],
      },
      initialValue: 'white',
      description: 'İçerik bloğunun arka plan rengi (varsayılan: Beyaz)',
    }),
    defineField({
      name: 'textAlignment',
      title: 'Yazı Hizalaması',
      type: 'string',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Orta', value: 'center'},
          {title: 'Sağ', value: 'right'},
        ],
      },
      initialValue: 'left',
      description: 'Yazıların hizalaması (varsayılan: Sol)',
    }),
  ],
})



