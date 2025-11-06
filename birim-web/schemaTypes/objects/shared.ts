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
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({name: 'isButtonVisible', title: 'Butonu Göster', type: 'boolean'}),
    defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
    defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
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



