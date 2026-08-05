import React from 'react'
import {defineField, defineType} from 'sanity'
import {localizedString} from './localizedString'
import MaterialSelectionInput from '../../components/MaterialSelectionInput'
import FontSelectorInput from '../../components/FontSelectorInput'
import BulkMediaUploadInput from '../../components/BulkMediaUploadInput'
import MirroredImageObjectInput from '../../components/MirroredImageObjectInput'
import SingleCoverBooleanInput from '../../components/SingleCoverBooleanInput'
import {browserOnlyInput} from '../utils/browserOnly'
import {getPreviewUrl} from '../utils/previewUrl'

/**
 * Medya önizlemeleri için yardımcı fonksiyon.
 * Görselse <img>, videosa <video> elementi döner.
 */
export const renderPreviewMedia = (
  url: string | undefined,
  type?: string,
  isMirrored?: boolean,
) => {
  if (!url) return undefined

  const isVideo = type === 'video' || url.match(/\.(mp4|webm|ogg|mov)$/i)
  const transformStyle = isMirrored ? 'scaleX(-1)' : 'none'

  // Eğer url bir görsel değilse ve tip videosa video elementi kullan
  if (isVideo && !url.match(/\.(webp|jpg|jpeg|png|gif|avif)$/i)) {
    return () =>
      React.createElement('video', {
        src: url,
        style: {width: '100%', height: '100%', objectFit: 'cover', transform: transformStyle},
        autoPlay: false,
        muted: true,
        playsInline: true,
        preload: 'metadata',
      })
  }

  return () =>
    React.createElement('img', {
      src: url,
      style: {width: '100%', height: '100%', objectFit: 'cover', transform: transformStyle},
    })
}

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
  fieldsets: [
    {
      name: 'artDirection',
      title: '🎥 Art Direction (Cihaz Bazlı Görseller)',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: [
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      validation: (Rule) => Rule.required(),
      description: 'Varsayılan görsel. Mobil/Desktop özel klasör yoksa bu kullanılır.',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      description: 'Mobil özel klasörden otomatik yüklenir.',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      description: 'Desktop özel klasörden otomatik yüklenir.',
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
    prepare(selection: Record<string, unknown>) {
      const {title, imageUrl, thumbUrl} = selection as any
      const finalUrl = getPreviewUrl(thumbUrl || imageUrl)

      return {
        title: title || 'İsimsiz Ölçü Görseli',
        media: renderPreviewMedia(
          finalUrl,
          (selection as any).mediaType || (selection as any).type,
        ),
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
    prepare(selection: Record<string, unknown>) {
      const {title, imageUrl, thumbUrl} = selection as any
      const finalUrl = getPreviewUrl(thumbUrl || imageUrl)

      return {
        title: title || 'İsimsiz Malzeme',
        media: renderPreviewMedia(
          finalUrl,
          (selection as any).mediaType || (selection as any).type,
        ),
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
    prepare(selection: Record<string, unknown>) {
      return {
        title: (selection.title as string) || 'İsimsiz Dosya',
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
        parent?.type === 'image' || (parent?.type === 'video' && parent?.videoFileR2),
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
      imageR2Url: 'imageR2.url',
      videoR2Url: 'videoFileR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: Record<string, unknown>) {
      const {type, title, subtitle, imageR2Url, videoR2Url, thumbUrl} = selection as any
      let mediaTitle = title
      if (!mediaTitle) {
        mediaTitle =
          type === 'image'
            ? 'Resim Medyası'
            : type === 'video'
              ? 'Video Medyası'
              : 'YouTube Medyası'
      }

      const finalUrl = getPreviewUrl(thumbUrl || imageR2Url || videoR2Url)

      return {
        title: mediaTitle,
        subtitle: subtitle || (type === 'image' ? 'Resim' : type === 'video' ? 'Video' : 'YouTube'),
        media: renderPreviewMedia(finalUrl, type),
      }
    },
  },
})

// Simpler media item for Alternative Media on product detail
export const productSimpleMediaItem = defineType({
  name: 'productSimpleMediaItem',
  title: 'Basit Medya Öğesi',
  type: 'object',
  components: {
    input: browserOnlyInput(MirroredImageObjectInput),
  },
  fieldsets: [
    {
      name: 'artDirection',
      title: '🎥 Art Direction (Cihaz Bazlı Medya)',
      options: {collapsible: true, collapsed: false},
    },
  ],
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
      name: 'isCover',
      title: 'Kapak Görseli mi?',
      type: 'boolean',
      initialValue: false,
      components: {
        input: browserOnlyInput(SingleCoverBooleanInput),
      },
      description:
        'Bu medya öğesini dökümanın ana kapak resmi olarak belirler. Sadece tek bir kapak görseli seçilebilir.',
    }),
    defineField({
      name: 'isMirrored',
      title: 'Aynala (Yatay Çevir)?',
      type: 'boolean',
      initialValue: false,
      description: 'Görselin yatay eksende ters (mirror/yansıma) olarak gösterilmesini sağlar.',
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Başlık (Opsiyonel)',
      type: 'localizedString',
      description: 'Görsel/Video için açıklayıcı başlık.',
    }),
    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      hidden: ({parent}) => parent?.type !== 'image',
    }),
    defineField({
      name: 'videoFileR2',
      title: 'Video (Tüm Cihazlar)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileMobileR2',
      title: 'Video (Mobil)',
      type: 'r2Asset',
      fieldset: 'artDirection',
      hidden: ({parent}) => parent?.type !== 'video',
    }),
    defineField({
      name: 'videoFileDesktopR2',
      title: 'Video (Desktop)',
      type: 'r2Asset',
      fieldset: 'artDirection',
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
      isCover: 'isCover',
      isMirrored: 'isMirrored',
      titleTr: 'title.tr',
      imageR2Url: 'imageR2.url',
      videoR2Url: 'videoFileR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: Record<string, unknown>) {
      const {type, isCover, isMirrored, titleTr, imageR2Url, videoR2Url, thumbUrl} =
        selection as any
      const finalUrl = getPreviewUrl(thumbUrl || imageR2Url || videoR2Url)

      return {
        title: `${isCover ? '⭐ ' : ''}${isMirrored ? '↔️ ' : ''}${titleTr || (type === 'image' ? 'Resim Öğesi' : type === 'video' ? 'Video Öğesi' : 'YouTube Öğesi')}`,
        media: renderPreviewMedia(finalUrl, type, !!isMirrored),
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
      imageR2Url: 'imageR2.url',
      videoR2Url: 'videoFileR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: Record<string, unknown>) {
      const {type, title, imageR2Url, videoR2Url, thumbUrl} = selection as any
      const finalUrl = getPreviewUrl(thumbUrl || imageR2Url || videoR2Url)

      const mediaTitle =
        title ||
        (type === 'image'
          ? 'Resim Medyası'
          : type === 'video'
            ? 'Video Medyası'
            : 'YouTube Medyası')
      return {
        title: mediaTitle,
        media: renderPreviewMedia(finalUrl, type),
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
  preview: {
    select: {
      titleTr: 'title.tr',
      titleEn: 'title.en',
      typeTr: 'type.tr',
      typeEn: 'type.en',
      address: 'address',
    },
    prepare(selection: Record<string, unknown>) {
      const {titleTr, titleEn, typeTr, typeEn, address} = selection as {
        titleTr?: string
        titleEn?: string
        typeTr?: string
        typeEn?: string
        address?: string
      }
      const title = titleTr || titleEn || 'İsimsiz Lokasyon'
      const locType = typeTr || typeEn || ''
      const subtitle = locType ? `${locType}${address ? ` — ${address}` : ''}` : address || ''
      return {
        title,
        subtitle,
      }
    },
  },
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
      imageR2Url: 'imageR2.url',
      videoR2Url: 'videoFileR2.url',
      thumbUrl: 'thumbnailR2.url',
    },
    prepare(selection: Record<string, unknown>) {
      const {type, imageR2Url, videoR2Url, thumbUrl} = selection as any
      const finalUrl = getPreviewUrl(thumbUrl || imageR2Url || videoR2Url)

      return {
        title:
          type === 'image'
            ? 'Resim Medyası'
            : type === 'video'
              ? 'Video Medyası'
              : 'YouTube Medyası',
        media: renderPreviewMedia(finalUrl, type),
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
  fieldsets: [
    {
      name: 'buttonGroup',
      title: '🔘 Düğme / Buton Ayarları',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'overlayGroup',
      title: '🖼️ Görsel Üzerindeki Yazı Ayarları (Slogan / Overlay)',
      options: {collapsible: true, collapsed: true},
    },
  ],
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
          {title: 'Paneller (Çoklu Görsel)', value: 'panels'},
        ],
      },
      initialValue: 'image',
    }),

    defineField({
      name: 'imageR2',
      title: 'Görsel (Tüm Cihazlar)',
      type: 'r2Asset',
      hidden: ({parent}) => !!parent?.mediaType && parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'imageMobileR2',
      title: 'Görsel (Mobil)',
      type: 'r2Asset',
      hidden: ({parent}) => !!parent?.mediaType && parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'imageDesktopR2',
      title: 'Görsel (Desktop)',
      type: 'r2Asset',
      hidden: ({parent}) => !!parent?.mediaType && parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'imagePanels',
      title: 'Panel Görselleri (Çoklu)',
      type: 'array',
      of: [{type: 'r2Asset'}],
      options: {
        layout: 'grid',
        modal: {type: 'popover'},
      },
      components: {
        input: BulkMediaUploadInput,
      },
      hidden: ({parent}) => parent?.mediaType !== 'panels',
      description: 'Yan yana dizilecek görselleri buraya ekleyin.',
    }),
    defineField({
      name: 'panelSize',
      title: 'Panel Boyutu',
      type: 'string',
      options: {
        list: [
          {title: 'Küçük', value: 'small'},
          {title: 'Orta', value: 'medium'},
          {title: 'Büyük', value: 'large'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'medium',
      hidden: ({parent}) => parent?.mediaType !== 'panels',
      description: 'Panellerin ne kadar büyük görüneceğini belirler.',
    }),
    defineField({
      name: 'panelFit',
      title: 'Panel Görsel Sığdırma Yöntemi',
      type: 'string',
      options: {
        list: [
          {title: 'Kapsa / Tam Doldur (Cover - Kırpılabilir)', value: 'cover'},
          {title: 'Sığdır / Tamamını Göster (Contain - Oranı Korur)', value: 'contain'},
          {title: 'Doğal Boyut (Natural)', value: 'natural'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'cover',
      hidden: ({parent}) => parent?.mediaType !== 'panels',
      description: 'Görsellerin panel alanına nasıl sığdırılacağını veya oturacağını belirler.',
    }),
    defineField({
      name: 'panelGap',
      title: 'Paneller Arası Boşluk',
      type: 'string',
      options: {
        list: [
          {title: 'Yok (0px)', value: 'none'},
          {title: 'Küçük (12px)', value: 'small'},
          {title: 'Orta (24px)', value: 'medium'},
          {title: 'Büyük (40px)', value: 'large'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'medium',
      hidden: ({parent}) => parent?.mediaType !== 'panels',
      description: 'Yan yana duran paneller arasındaki mesafeyi ayarlar.',
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
      hidden: ({parent}) => parent?.mediaType === 'image',
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
      name: 'linkText',
      title: 'Link Metni',
      type: 'localizedString',
      fieldset: 'buttonGroup',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'string',
      fieldset: 'buttonGroup',
    }),
    defineField({
      name: 'showButtonOnMedia',
      title: 'Butonu Görsel Üzerinde Göster',
      type: 'boolean',
      fieldset: 'buttonGroup',
      description:
        'Aktif edilirse buton metin alanında değil, resim/video üzerinde seçilen konumda görünür.',
      initialValue: false,
    }),
    defineField({
      name: 'buttonAlignment',
      title: 'Buton Hizalaması (Yatay)',
      type: 'string',
      fieldset: 'buttonGroup',
      options: {
        list: [
          {title: 'Sol', value: 'left'},
          {title: 'Orta', value: 'center'},
          {title: 'Sağ', value: 'right'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: ({parent}) => !!parent?.showButtonOnMedia,
      initialValue: 'left',
      description:
        'Buton metin alanındayken (medya üzerinde değilken) butonun bağımsız yatay hizalamasını belirler. Seçilmezse metin hizalamasını takip eder.',
    }),
    defineField({
      name: 'buttonPosition',
      title: 'Buton Konumu (Dikey)',
      type: 'string',
      fieldset: 'buttonGroup',
      options: {
        list: [
          {title: 'Metnin Altında (Varsayılan)', value: 'below'},
          {title: 'Metnin Üstünde (Başlıktan Sonra)', value: 'above'},
          {title: 'En Üstte (Başlıktan Önce)', value: 'top'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'below',
      hidden: ({parent}) => !!parent?.showButtonOnMedia,
      description:
        'Buton metin alanındayken (medya üzerinde değilken) metnin ve başlığın neresinde duracağını belirler.',
    }),
    defineField({
      name: 'buttonPositionOnMedia',
      title: 'Butonun Medya Üzerindeki Konumu',
      type: 'string',
      fieldset: 'buttonGroup',
      options: {
        list: [
          {title: 'Sol Üst', value: 'top-left'},
          {title: 'Üst Orta', value: 'top-center'},
          {title: 'Sağ Üst', value: 'top-right'},
          {title: 'Sol Orta', value: 'center-left'},
          {title: 'Merkez / Orta', value: 'center'},
          {title: 'Sağ Orta', value: 'center-right'},
          {title: 'Sol Alt', value: 'bottom-left'},
          {title: 'Alt Orta', value: 'bottom-center'},
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
      name: 'buttonOffsetOnMedia',
      title: 'Butonun Kenarlardan Uzaklığı (px)',
      type: 'number',
      fieldset: 'buttonGroup',
      description:
        'Butonun medya (resim/video) kenarlarından (üst, alt, sol, sağ) kaç piksel uzakta duracağını belirler (Varsayılan: 32px).',
      initialValue: 32,
      hidden: ({parent}) => !parent?.showButtonOnMedia,
      validation: (Rule) => Rule.min(0).max(300),
    }),
    defineField({
      name: 'buttonColor',
      title: 'Buton Yazı Rengi',
      type: 'string',
      fieldset: 'buttonGroup',
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
      name: 'overlayText',
      title: 'Görsel Üzerindeki Yazı (Opsiyonel)',
      type: 'localizedString',
      fieldset: 'overlayGroup',
      description: 'Görselin/Medyanın tam üzerine yerleştirilecek metin (ör. Slogan, Başlık)',
    }),
    defineField({
      name: 'overlayTextPosition',
      title: 'Görsel Üzerindeki Yazının Konumu',
      type: 'string',
      fieldset: 'overlayGroup',
      options: {
        list: [
          {title: 'Sol Üst', value: 'top-left'},
          {title: 'Üst Orta', value: 'top-center'},
          {title: 'Sağ Üst', value: 'top-right'},
          {title: 'Sol Orta', value: 'center-left'},
          {title: 'Merkez / Orta', value: 'center'},
          {title: 'Sağ Orta', value: 'center-right'},
          {title: 'Sol Alt', value: 'bottom-left'},
          {title: 'Alt Orta', value: 'bottom-center'},
          {title: 'Sağ Alt', value: 'bottom-right'},
        ],
      },
      initialValue: 'center',
      description: 'Görsel üzerindeki yazının konumunu seçin.',
    }),
    defineField({
      name: 'overlayTextSize',
      title: 'Görsel Üzerindeki Yazı Boyutu',
      type: 'string',
      fieldset: 'overlayGroup',
      options: {
        list: [
          {title: 'Küçük (Small)', value: 'small'},
          {title: 'Orta (Medium)', value: 'medium'},
          {title: 'Büyük (Large)', value: 'large'},
          {title: 'Ekstra Büyük (XL)', value: 'xlarge'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'medium',
      description: 'Görsel üzerindeki yazının boyutunu seçin.',
    }),
    defineField({
      name: 'overlayTextColor',
      title: 'Görsel Üzerindeki Yazı Rengi',
      type: 'string',
      fieldset: 'overlayGroup',
      options: {
        list: [
          {title: 'Beyaz', value: 'white'},
          {title: 'Siyah', value: 'black'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'white',
      description: 'Görsel üzerindeki yazının rengini seçin.',
    }),
    defineField({
      name: 'overlayTextFont',
      title: 'Görsel Üzerindeki Yazı Fontu',
      type: 'string',
      components: {
        input: browserOnlyInput(FontSelectorInput),
      },
      initialValue: 'Oswald',
      description: 'Görsel üzerindeki yazı için font seçin (Varsayılan: Oswald).',
    }),
    defineField({
      name: 'padding',
      title: 'İç Boşluk (Padding - px)',
      type: 'number',
      description:
        'Bloğun dört tarafına eklenecek boşluk (piksel). Çerçeve aktifse çerçeve ile içerik arasındaki mesafe olur.',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(200),
    }),
    defineField({
      name: 'borderColor',
      title: 'Çerçeve Rengi',
      type: 'color',
      hidden: ({parent}) => !parent?.hasBorder,
      description:
        'Çerçeve çizgisi için özel bir renk seçin. Boş bırakılırsa varsayılan koyu gri kullanılır.',
    }),
  ],
  preview: {
    select: {
      title: 'title.tr',
      titleFont: 'titleFont',
      contentFont: 'contentFont',
      mediaType: 'mediaType',
      imageR2Url: 'imageR2.url',
      videoR2Url: 'videoFileR2.url',
      thumbUrl: 'thumbnailR2.url',
      imagePanels: 'imagePanels',
      backgroundColor: 'backgroundColor',
      hasBorder: 'hasBorder',
      borderThickness: 'borderThickness',
    },
    prepare(selection: Record<string, unknown>) {
      const {
        title,
        titleFont,
        contentFont,
        mediaType,
        imageR2Url,
        videoR2Url,
        backgroundColor,
        thumbUrl,
        imagePanels,
        hasBorder,
        borderThickness,
      } = selection as any

      let finalUrl = getPreviewUrl(thumbUrl || imageR2Url || videoR2Url)
      if (mediaType === 'panels' && Array.isArray(imagePanels) && imagePanels.length > 0) {
        finalUrl = getPreviewUrl(imagePanels[0].url)
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
                : mediaType === 'panels'
                  ? 'Paralel Blok'
                  : 'Metin Bloğu'
      }
      return {
        title: mediaTitle,
        subtitle: `Fontlar: T:${titleFont || 'Normal'} C:${contentFont || 'Normal'} | Arka Plan: ${backgroundColor === 'white' ? 'Beyaz' : 'Gri'} | Çerçeve: ${hasBorder ? `${borderThickness || 1}px` : 'Kapalı'}`,
        media: renderPreviewMedia(finalUrl, mediaType),
      }
    },
  },
})
