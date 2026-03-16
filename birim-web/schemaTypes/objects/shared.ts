import React from 'react'
import {defineField, defineType} from 'sanity'
import {localizedString} from './localizedString'
import MaterialSelectionInput from '../../components/MaterialSelectionInput'
import FontSelectorInput from '../../components/FontSelectorInput'
import {getPreviewUrl} from '../utils/previewUrl'
import {browserOnlyInput} from '../utils/browserOnly'

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
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      validation: (Rule) => Rule.required(),
      description:
        'Tüm cihazlar için varsayılan görsel. Mobil veya desktop versiyonu yoksa bu kullanılır.',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      description:
        'Mobil cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      description:
        'Desktop cihazlar için özel görsel (opsiyonel). Yoksa varsayılan görsel kullanılır.',
    }),
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      description: 'Görselin altında görünecek başlık',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {title, imageUrl, thumbUrl} = selection
      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      return {
        title: title || 'İsimsiz Ölçü Görseli',
        media: finalUrl
          ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
          : undefined,
      }
    },
  },
})

export const productMaterial = defineType({
  name: 'productMaterial',
  title: 'Ürün Malzemesi',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Ad', type: 'localizedString'}),
    defineField({name: 'imageR2', title: 'Görsel', type: 'r2Asset'}),
  ],
  preview: {
    select: {
      title: 'name.tr',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {title, imageUrl, thumbUrl} = selection
      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      return {
        title: title || 'İsimsiz Malzeme',
        media: finalUrl
          ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
          : undefined,
      }
    },
  },
})

export const materialSwatchBook = defineType({
  name: 'materialSwatchBook',
  title: 'Kartela',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Malzemeler',
      type: 'array',
      of: [{type: 'productMaterial'}],
    }),
  ],
})

export const downloadableItem = defineType({
  name: 'downloadableItem',
  title: 'İndirilebilir Öğe',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Ad', type: 'localizedString'}),
    defineField({name: 'fileR2', title: 'Dosya', type: 'r2Asset'}),
  ],
  preview: {
    select: {
      title: 'name.tr',
    },
    prepare(selection: any) {
      return {
        title: selection.title || 'İsimsiz Dosya',
        media: () => '📄',
      }
    },
  },
})

export const exclusiveContent = defineType({
  name: 'exclusiveContent',
  title: 'Özel İçerik',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Ek Görseller',
      type: 'array',
      of: [{type: 'r2Asset'}],
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
      name: 'isPublished',
      title: 'Yayında Göster',
      type: 'boolean',
      initialValue: true,
      description: 'Bu hero öğesinin ana sayfadaki slider’da görünüp görünmeyeceğini belirler.',
    }),
    defineField({
      name: 'publishAt',
      title: 'Yayın Tarihi (Opsiyonel)',
      type: 'datetime',
      description:
        'Belirli bir tarihten sonra gösterilsin istiyorsanız kullanın. Boş bırakırsanız hemen yayına girer.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sıra (Opsiyonel)',
      type: 'number',
      description:
        'Küçük sayı önce gelir. Boş bırakırsanız Studio’daki drag‑drop sırasına göre gösterilir.',
    }),
    defineField({
      name: 'type',
      title: 'Tür',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      initialValue: 'image',
    }),
    // For image type, allow direct image upload
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    // Art Direction: Mobil için görsel
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    // Art Direction: Desktop için görsel
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    // For video, allow file upload
    defineField({
      name: 'videoFileR2',
      title: 'Video Dosyası (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    // Art Direction: Mobil için video
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video Dosyası (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    // Art Direction: Desktop için video
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video Dosyası (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    // For video/youtube or external image, allow URL
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) =>
        parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFile),
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({
      name: 'thumbnailR2',
      title: 'Video Önizleme Görseli (Thumbnail)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video veya YouTube ögesi için listede görünecek küçük resim (opsiyonel).',
    }),

    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'subtitle', title: 'Alt Başlık', type: 'localizedString'}),
    defineField({
      name: 'textPosition',
      title: 'Metin Konumu',
      type: 'string',
      options: {
        list: [
          {title: 'Merkez', value: 'center'},
          {title: 'Sol', value: 'left'},
          {title: 'Sağ', value: 'right'},
        ],
      },
      initialValue: 'center',
      description: 'Metinlerin hero medya üzerindeki konumu',
    }),
    defineField({name: 'isButtonVisible', title: 'Butonu Göster', type: 'boolean'}),
    defineField({name: 'buttonText', title: 'Buton Metni', type: 'localizedString'}),
    defineField({name: 'buttonLink', title: 'Buton Bağlantısı', type: 'string'}),
  ],
  preview: {
    select: {
      type: 'type',
      title: 'title.tr',
      subtitle: 'subtitle.tr',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {type, title, subtitle, imageUrl, thumbUrl} = selection
      let mediaTitle = title
      if (!mediaTitle) {
        mediaTitle =
          type === 'image'
            ? 'Resim Medyası'
            : type === 'video'
              ? 'Video Medyası'
              : 'YouTube Medyası'
      }

      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {
          // ignore
        }
      }

      return {
        title: mediaTitle,
        subtitle: subtitle || (type === 'image' ? 'Resim' : type === 'video' ? 'Video' : 'YouTube'),
        media:
          type === 'image' && finalUrl
            ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
            : undefined,
      }
    },
  },
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
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFileR2',
      title: 'Video Dosyası (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video Dosyası (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video Dosyası (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.type === 'image',
    }),
    defineField({
      name: 'thumbnailR2',
      title: 'Video Önizleme Görseli (Thumbnail)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video veya YouTube ögesi için listede görünecek küçük resim (opsiyonel).',
    }),
  ],
  preview: {
    select: {
      type: 'type',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {type, imageUrl, thumbUrl} = selection
      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      return {
        title:
          type === 'image' ? 'Resim Öğesi' : type === 'video' ? 'Video Öğesi' : 'YouTube Öğesi',
        media:
          type === 'image' && finalUrl
            ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
            : undefined,
      }
    },
  },
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
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      initialValue: 'image',
    }),

    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFileR2',
      title: 'Video Dosyası (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video Dosyası (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video Dosyası (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({
      name: 'thumbnailR2',
      title: 'Video Önizleme Görseli (Thumbnail)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video veya YouTube ögesi için listede görünecek küçük resim (opsiyonel).',
    }),

    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'localizedText',
      description: 'Bu medya öğesi için açıklama metni',
    }),
    defineField({
      name: 'link',
      title: 'Link URL',
      type: 'string',
      description: "Bu medya öğesi için link URL'si (isteğe bağlı)",
    }),
    defineField({
      name: 'linkText',
      title: 'Link Metni',
      type: 'localizedString',
    }),
  ],
  preview: {
    select: {
      type: 'type',
      title: 'title.tr',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {type, title, imageUrl, thumbUrl} = selection
      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      const mediaTitle =
        title ||
        (type === 'image'
          ? 'Resim Medyası'
          : type === 'video'
            ? 'Video Medyası'
            : 'YouTube Medyası')
      return {
        title: mediaTitle,
        media:
          type === 'image' && finalUrl
            ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
            : undefined,
      }
    },
  },
})

export const footerPartner = defineType({
  name: 'footerPartner',
  title: 'Footer Partner',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'İsim',
      type: 'localizedString',
      description: 'Logo yoksa gösterilecek metin',
    }),
    defineField({name: 'logoR2', title: 'Logo', type: 'r2Asset'}),
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
      description:
        'İç link için: /cookies, /about gibi. Dış link için: https://example.com gibi tam URL.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'isVisible', title: 'Görünür', type: 'boolean', initialValue: true}),
  ],
})

export const contactLocation = defineType({
  name: 'contactLocation',
  title: 'Lokasyon',
  type: 'object',
  fields: [
    defineField({name: 'type', title: 'Tür (Showroom, Fabrika vb.)', type: 'localizedString'}),
    defineField({name: 'title', title: 'Başlık', type: 'localizedString'}),
    defineField({name: 'address', title: 'Adres', type: 'string'}),
    defineField({name: 'phone', title: 'Telefon', type: 'string'}),
    defineField({name: 'email', title: 'E-posta', type: 'string'}),
    defineField({
      name: 'mapEmbedUrl',
      title: 'Google Maps Embed URL',
      type: 'string',
      description: "Google Maps embed linki veya normal harita URL'si",
    }),
    defineField({
      name: 'media',
      title: 'Lokasyon Medyaları',
      type: 'array',
      of: [{type: 'contactLocationMedia'}],
      description: 'Lokasyon için bant şeklinde gösterilecek medyalar',
    }),
    defineField({
      name: 'isMediaVisible',
      title: 'Medyaları Göster',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})

export const contactLocationMedia = defineType({
  name: 'contactLocationMedia',
  title: 'Lokasyon Medyası',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Tür',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFileR2',
      title: 'Video Dosyası (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video Dosyası (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video Dosyası (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({
      name: 'thumbnailR2',
      title: 'Video Önizleme Görseli (Thumbnail)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video veya YouTube ögesi için listede görünecek küçük resim (opsiyonel).',
    }),
  ],
  preview: {
    select: {
      type: 'type',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: any) {
      const {type, imageUrl, thumbUrl} = selection
      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {}
      }
      return {
        title:
          type === 'image'
            ? 'Resim Medyası'
            : type === 'video'
              ? 'Video Medyası'
              : 'YouTube Medyası',
        media:
          type === 'image' && finalUrl
            ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
            : undefined,
      }
    },
  },
})

// Product-specific: group-based material selection
export const productMaterialSelection = defineType({
  name: 'productMaterialSelection',
  title: 'Malzeme Seçimi (Grup Bazlı)',
  type: 'object',
  components: {
    input: browserOnlyInput(MaterialSelectionInput),
  },
  fields: [
    defineField({
      name: 'group',
      title: 'Malzeme Grubu',
      type: 'reference',
      to: [{type: 'materialGroup'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'materials',
      title: 'Seçilen Malzemeler',
      type: 'array',
      of: [{type: 'productMaterial'}],
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
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'image',
    }),
    // Görsel konumu – doğrudan görsel alanlarının altında
    defineField({
      name: 'position',
      title: 'Görsel Konumu',
      type: 'string',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Sağ', value: 'right'},
          {title: 'Orta', value: 'center'},
          {title: 'Tam Genişlik', value: 'full'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
      description: 'Görselin blok içinde konumunu belirler.',
    }),
    defineField({
      name: 'videoFileR2',
      title: 'Video Dosyası (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video Dosyası (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video Dosyası (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'url',
      title: 'Video URL (veya YouTube URL)',
      type: 'url',
      hidden: ({parent}) => parent?.mediaType === 'image',
      description: 'Video dosyası yüklediyseniz bu alanı boş bırakın. YouTube için kullanın.',
    }),
    defineField({
      name: 'thumbnailR2',
      title: 'Video Önizleme Görseli (Thumbnail)',
      type: 'r2Asset',
      hidden: ({parent}) => parent?.type === 'image',
      description: 'Video veya YouTube ögesi için listede görünecek küçük resim (opsiyonel).',
    }),

    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'localizedString',
      description: 'İçerik bloğu için başlık metni',
    }),
    defineField({
      name: 'titleFont',
      title: 'Başlık Fontu',
      type: 'string',
      components: {
        input: browserOnlyInput(FontSelectorInput),
      },
      initialValue: 'normal',
      description: 'Başlık için font stili seçin.',
    }),
    defineField({
      name: 'contentFont',
      title: 'İçerik Fontu',
      type: 'string',
      components: {
        input: browserOnlyInput(FontSelectorInput),
      },
      initialValue: 'normal',
      description: 'Açıklama metni için font stili seçin.',
    }),
    defineField({
      name: 'titlePosition',
      title: 'Başlık Konumu',
      type: 'string',
      options: {
        list: [
          {title: 'Altta', value: 'below'},
          {title: 'Üstte', value: 'above'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'below',
      description: 'Başlığın görselin üstünde mi yoksa altında mı duracağını belirler.',
    }),
    defineField({
      name: 'titleAlignment',
      title: 'Başlık Hizalaması (Yatay)',
      type: 'string',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Orta', value: 'center'},
          {title: 'Sağ', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      description: 'Başlığın yatay hizalamasını belirler.',
    }),
    defineField({
      name: 'description',
      title: 'Açıklama Metni',
      type: 'localizedPortableText',
    }),
    // Metin konumu seçeneği (Altta / Üstte)
    defineField({
      name: 'textPosition',
      title: 'Metin Konumu',
      type: 'string',
      options: {
        list: [
          {title: 'Altta', value: 'below'},
          {title: 'Üstte', value: 'above'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'below',
      description: 'Yazıların görselin üstünde mi yoksa altında mı duracağını belirler.',
    }),
    defineField({
      name: 'textAlignment',
      title: 'Metin Hizalaması (Yatay)',
      type: 'string',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Orta', value: 'center'},
          {title: 'Sağ', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
      description:
        'Açıklama metninin yatay hizalamasını belirler. Başlık için özel hizalama seçilmediyse başlığı da etkiler.',
    }),
    defineField({
      name: 'verticalAlignment',
      title: 'Metin Hizalaması (Dikey)',
      type: 'string',
      options: {
        list: [
          {title: 'Üst', value: 'top'},
          {title: 'Orta', value: 'center'},
          {title: 'Alt', value: 'bottom'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
      description:
        'Görsel sol/sağ seçildiğinde, yanındaki metinlerin yukarı, orta veya aşağı yaslanmasını sağlar.',
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
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'white',
      description: 'İçerik bloğunun arka plan rengi (varsayılan: Beyaz)',
    }),
    defineField({
      name: 'hasBorder',
      title: 'Çerçeve Göster',
      type: 'boolean',
      description: 'Aktif edilirse içerik bloğu kendi sınırları içinde çerçeve ile gösterilir.',
      initialValue: false,
    }),
    defineField({
      name: 'borderThickness',
      title: 'Çerçeve Kalınlığı (px)',
      type: 'number',
      hidden: ({parent}) => !parent?.hasBorder,
      initialValue: 1,
      validation: (Rule) => Rule.min(1).max(12),
      description: 'Çerçeve kalınlığını piksel cinsinden belirler (1-12).',
    }),
    defineField({
      name: 'spacingBottom',
      title: 'Alt Boşluk (px)',
      type: 'number',
      description: 'Bu bloğun altına eklenecek boşluk (piksel). Varsayılan: 0',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(200),
    }),
    defineField({
      name: 'showButtonOnMedia',
      title: 'Butonu Medya Üzerinde Göster',
      type: 'boolean',
      description:
        'Aktif edilirse buton metin alanında değil, resim/video üzerinde seçilen konumda görünür.',
      initialValue: false,
    }),
    defineField({
      name: 'buttonPositionOnMedia',
      title: 'Butonun Medya Üzerindeki Konumu',
      type: 'string',
      options: {
        list: [
          {title: 'Merkez', value: 'center'},
          {title: 'Sol Üst', value: 'top-left'},
          {title: 'Sağ Üst', value: 'top-right'},
          {title: 'Sol Alt', value: 'bottom-left'},
          {title: 'Sağ Alt', value: 'bottom-right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'center',
      hidden: ({parent}) => !parent?.showButtonOnMedia,
      description: 'Butonun medya (resim/video) üzerindeki duracağı konumu seçin.',
    }),
    defineField({
      name: 'buttonColor',
      title: 'Buton Yazı Rengi',
      type: 'string',
      options: {
        list: [
          {title: 'Siyah', value: 'black'},
          {title: 'Beyaz', value: 'white'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'black',
      hidden: ({parent}) => !parent?.showButtonOnMedia,
      description: 'Medya üzerindeki buton metninin rengini seçin.',
    }),
    defineField({
      name: 'padding',
      title: 'İç Boşluk (Padding - px)',
      type: 'number',
      description: 'Bloğun dört tarafına eklenecek boşluk (piksel). Çerçeve aktifse çerçeve ile içerik arasındaki mesafe olur.',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(200),
    }),
    defineField({
      name: 'borderColor',
      title: 'Çerçeve Rengi',
      type: 'color',
      hidden: ({parent}) => !parent?.hasBorder,
      description: 'Çerçeve çizgisi için özel bir renk seçin. Boş bırakılırsa varsayılan koyu gri kullanılır.',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
      titleFont: 'titleFont',
      contentFont: 'contentFont',
      mediaType: 'mediaType',
      imageUrl: 'imageR2.url',
      thumbUrl: 'thumbnailR2.url',
      backgroundColor: 'backgroundColor',
      hasBorder: 'hasBorder',
      borderThickness: 'borderThickness',
    },
    prepare(selection: any) {
      const {
        title,
        titleFont,
        contentFont,
        mediaType,
        imageUrl,
        backgroundColor,
        thumbUrl,
        hasBorder,
        borderThickness,
      } = selection

      let sourceUrl =
        selection.type === 'image' || selection.mediaType === 'image'
          ? imageUrl
          : thumbUrl || imageUrl
      let finalUrl = sourceUrl
      const domain = process.env.SANITY_STUDIO_R2_DOMAIN
      if (finalUrl && domain && finalUrl.includes('.r2.dev') && !domain.includes('.r2.dev')) {
        try {
          const parsed = new URL(finalUrl)
          const path = parsed.pathname.startsWith('/')
            ? parsed.pathname.substring(1)
            : parsed.pathname
          finalUrl = `${domain}/${path}`
        } catch (e) {
          // ignore
        }
      }

      let mediaTitle = title
      if (!mediaTitle) {
        mediaTitle =
          mediaType === 'image'
            ? 'Resim Bloğu'
            : mediaType === 'video'
              ? 'Video Bloğu'
              : mediaType === 'youtube'
                ? 'YouTube Bloğu'
                : 'Metin Bloğu'
      }
      return {
        title: mediaTitle,
        subtitle: `Fontlar: T:${titleFont || 'Normal'} C:${contentFont || 'Normal'} | Arka Plan: ${backgroundColor === 'white' ? 'Beyaz' : 'Gri'} | Çerçeve: ${hasBorder ? `${borderThickness || 1}px` : 'Kapalı'}`,
        media:
          mediaType === 'image' && finalUrl
            ? () => React.createElement('img', {src: finalUrl, style: {objectFit: 'cover'}})
            : undefined,
      }
    },
  },
})
