import groq from 'groq'
import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  FactoryPageContent,
} from '../../types'
import {
  sanity,
  useSanity,
  mapImage,
  mapMediaUrl,
  rewriteR2Url,
  extractPalette,
  mapR2Metadata,
  type SanityImageLike,
} from './client'
import {getItem} from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
  HOME_PAGE: 'birim_home_page',
  ABOUT_PAGE: 'birim_about_page',
  CONTACT_PAGE: 'birim_contact_page',
  FACTORY_PAGE: 'birim_factory_page',
}

const mapProductMedia = (row: unknown): Record<string, unknown>[] => {
  const r = row as Record<string, unknown>
  const mediaArr = Array.isArray(r?.['media']) ? (r['media'] as Record<string, unknown>[]) : []
  return mediaArr
    .map((m: Record<string, unknown>) => {
      const type = m?.['type'] as string | undefined
      if (type !== 'image' && type !== 'video' && type !== 'youtube') return null
      const url = mapMediaUrl(m)
      const urlMobile = mapMediaUrl(m, true, false)
      const urlDesktop = mapMediaUrl(m, false, true)
      const metadata = m?.['imageR2'] ? mapR2Metadata(m['imageR2']) : {}
      const result: Record<string, unknown> = {
        type,
        url,
        title: m?.['title'],
        description: m?.['description'],
        link: m?.['link'],
        linkText: m?.['linkText'],
        ...metadata,
      }
      if (urlMobile && urlMobile !== url) result['urlMobile'] = urlMobile
      if (urlDesktop && urlDesktop !== url) result['urlDesktop'] = urlDesktop
      return result
    })
    .filter((m): m is Record<string, unknown> => !!m && typeof m['url'] === 'string')
}

export const getAboutPageContent = async (): Promise<AboutPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type in ["aboutPageV2", "aboutPage"] && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{
            ...,
            heroImageR2,
            heroImageMobileR2,
            eras[]{ ..., imageR2, imageMobileR2 },
            historySection{ ..., imageR2, imageMobileR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } },
            identitySection{ ..., imageR2, imageMobileR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } },
            qualitySection{ ..., imageR2, imageMobileR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } }
        }`
    const data = await sanity.fetch(q)
    if (data) {
      if (data.heroImageR2?.url) {
        data.heroImage = {
          url: mapImage(data.heroImageR2),
          palette: extractPalette(data.heroImageR2),
          ...mapR2Metadata(data.heroImageR2),
        }
      } else if (data.heroImage) {
        data.heroImage = {
          url: mapImage(data.heroImage as SanityImageLike),
          palette: extractPalette(data.heroImage as SanityImageLike),
        }
      }
      if (data.heroImageMobileR2?.url) {
        data.heroImageMobile = {
          url: mapImage(data.heroImageMobileR2),
          palette: extractPalette(data.heroImageMobileR2),
          ...mapR2Metadata(data.heroImageMobileR2),
        }
      } else if (data.heroImageMobile) {
        data.heroImageMobile = {
          url: mapImage(data.heroImageMobile as SanityImageLike),
          palette: extractPalette(data.heroImageMobile as SanityImageLike),
        }
      }
      if (Array.isArray(data.eras)) {
        data.eras = data.eras.map((era: Record<string, unknown>) => {
          const imgR2 = (era['imageR2'] || era['image']) as SanityImageLike | undefined
          const imgMobR2 = (era['imageMobileR2'] || era['imageMobile']) as
            | SanityImageLike
            | undefined
          const imgMeta = imgR2 ? mapR2Metadata(imgR2) : {}
          const imgMobMeta = imgMobR2 ? mapR2Metadata(imgMobR2) : {}

          return {
            ...era,
            image: {
              url: mapImage(imgR2),
              ...imgMeta,
            },
            imageMobile: {
              url: mapImage(imgMobR2),
              ...imgMobMeta,
            },
          }
        })
      }
      if (data.historySection) {
        const hsMeta = mapR2Metadata(data.historySection.imageR2)
        data.historySection.image = {
          url: mapImage(data.historySection.imageR2),
          ...hsMeta,
        }
        if (data.historySection.imageMobileR2) {
          data.historySection.imageMobile = {
            url: mapImage(data.historySection.imageMobileR2),
            ...mapR2Metadata(data.historySection.imageMobileR2),
          }
        }
        data.historySection.media = mapProductMedia(data.historySection)
      }
      if (data.identitySection) {
        const idMeta = mapR2Metadata(data.identitySection.imageR2)
        data.identitySection.image = {
          url: mapImage(data.identitySection.imageR2),
          ...idMeta,
        }
        if (data.identitySection.imageMobileR2) {
          data.identitySection.imageMobile = {
            url: mapImage(data.identitySection.imageMobileR2),
            ...mapR2Metadata(data.identitySection.imageMobileR2),
          }
        }
        data.identitySection.media = mapProductMedia(data.identitySection)
      }
      if (data.qualitySection) {
        const qsMeta = mapR2Metadata(data.qualitySection.imageR2)
        data.qualitySection.image = {
          url: mapImage(data.qualitySection.imageR2),
          ...qsMeta,
        }
        if (data.qualitySection.imageMobileR2) {
          data.qualitySection.imageMobile = {
            url: mapImage(data.qualitySection.imageMobileR2),
            ...mapR2Metadata(data.qualitySection.imageMobileR2),
          }
        }
        data.qualitySection.media = mapProductMedia(data.qualitySection)
      }
      if (!Array.isArray(data.values)) data.values = []
      return data
    }
  }
  await delay(SIMULATED_DELAY)
  const data = getItem<AboutPageContent>(KEYS.ABOUT_PAGE)
  if (data && !Array.isArray(data.values)) data.values = []
  return data || ({} as AboutPageContent)
}

export const getFactoryPageContent = async (): Promise<FactoryPageContent> => {
  if (useSanity && sanity) {
    try {
      const q = groq`*[_type == "factoryPage" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{
        ...,
        gallery[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 },
        media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 },
        images[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 }
      }`
      const data = await sanity.fetch(q)
      if (data) {
        const rawGallery = data.gallery ?? data.media ?? data.images
        data.gallery = Array.isArray(rawGallery) ? mapProductMedia({media: rawGallery}) : []
        return data
      }
    } catch {
      // Ignore
    }
  }
  await delay(SIMULATED_DELAY)
  return (getItem<FactoryPageContent>(KEYS.FACTORY_PAGE) || {
    title: 'FABRİKA',
    content: '',
    gallery: [],
  }) as FactoryPageContent
}

export const getContactPageContent = async (): Promise<ContactPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "contactPage"][0]{ ..., locations[]{ ..., media[]{ type, url, imageR2, videoFileR2 } } }`
    const data = await sanity.fetch(q)
    if (data?.locations) {
      data.locations = data.locations.map((loc: Record<string, unknown>) => {
        const media = loc['media']
        if (media && Array.isArray(media)) {
          const processedMedia = (media as Record<string, unknown>[])
            .map((mediaItem: Record<string, unknown>) => {
              let mediaUrl = mediaItem['url'] as string | undefined
              const type = mediaItem['type'] as string | undefined
              const imageR2 = mediaItem['imageR2']
              const videoFileR2 = mediaItem['videoFileR2'] as Record<string, unknown> | undefined

              if (type === 'image') {
                mediaUrl = mapImage(imageR2 as never) || mediaUrl
              } else if (type === 'video') {
                const videoUrl = videoFileR2?.['url'] as string | undefined
                mediaUrl = (videoUrl ? rewriteR2Url(videoUrl) : null) || mediaUrl
              }
              const metadata = imageR2 ? mapR2Metadata(imageR2) : {}
              return {...mediaItem, url: mediaUrl, ...metadata}
            })
            .filter((m: Record<string, unknown>) => typeof m['url'] === 'string')
          return {...loc, media: processedMedia}
        }
        return loc
      })
    }
    return data
  }
  await delay(SIMULATED_DELAY)
  return getItem<ContactPageContent>(KEYS.CONTACT_PAGE) || ({} as ContactPageContent)
}

export const getHomePageContent = async (): Promise<HomePageContent> => {
  if (useSanity && sanity) {
    try {
      const q = groq`*[_type == "homePage"][0]{
            ..., heroAutoPlay,
            heroMedia[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2 },
            contentBlocks[]{ ..., titleFont, contentFont, imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2, imagePanels[]{ ..., imageR2 }, panelFit, panelGap },
            interactiveShowcaseTitle,
            interactiveShowcaseBlockIndex,
            interactiveShowcase[]{
              title,
              imageR2,
              imageMobileR2,
              hotspots[]{
                x,
                y,
                label,
                product->{
                  _id,
                  "id": coalesce(slug.current, _id),
                  name,
                  mainImage,
                  mainImageR2,
                  media[]{
                    type,
                    isCover,
                    imageR2,
                    url
                  },
                  price,
                  currency,
                  "categoryName": category->name,
                  "designerName": coalesce(designers[0]->name, designer->name)
                }
              }
            }
        }`
      const data = await sanity.fetch(q)
      if (data?.heroMedia) {
        data.heroMedia = data.heroMedia
          .map((m: Record<string, unknown>) => {
            const url = mapMediaUrl(m)
            const urlMobile = mapMediaUrl(m, true, false)
            const urlDesktop = mapMediaUrl(m, false, true)
            const mainUrl = url || urlMobile || urlDesktop
            const imgObj = m['imageR2'] || m['image'] || m
            const palette = extractPalette(imgObj)
            let type = m['type'] as string | undefined
            if (!type) {
              if (mainUrl && (mainUrl.includes('youtube.com') || mainUrl.includes('youtu.be'))) {
                type = 'youtube'
              } else if (mainUrl && /\.(mp4|webm|mov|m4v)($|\?)/i.test(mainUrl)) {
                type = 'video'
              } else {
                type = 'image'
              }
            } else if (
              type === 'video' &&
              mainUrl &&
              (mainUrl.includes('youtube.com') || mainUrl.includes('youtu.be'))
            ) {
              type = 'youtube'
            }
            const result: Record<string, unknown> = {...m, url: mainUrl, type}
            if (urlMobile) result['urlMobile'] = urlMobile
            if (urlDesktop) result['urlDesktop'] = urlDesktop
            if (type === 'video') {
              const posterObj = m['imageR2'] || m['thumbnailR2'] || m['image']
              const posterMobileObj = m['imageMobileR2'] || m['imageMobile'] || posterObj
              const posterDesktopObj = m['imageDesktopR2'] || m['imageDesktop'] || posterObj
              if (posterObj && typeof posterObj === 'object' && (posterObj as {url?: string}).url) {
                result['poster'] = rewriteR2Url((posterObj as {url: string}).url)
              }
              if (
                posterMobileObj &&
                typeof posterMobileObj === 'object' &&
                (posterMobileObj as {url?: string}).url
              ) {
                result['posterMobile'] = rewriteR2Url((posterMobileObj as {url: string}).url)
              }
              if (
                posterDesktopObj &&
                typeof posterDesktopObj === 'object' &&
                (posterDesktopObj as {url?: string}).url
              ) {
                result['posterDesktop'] = rewriteR2Url((posterDesktopObj as {url: string}).url)
              }
            }
            if (palette) result['palette'] = palette
            const desktopObj =
              m['imageDesktopR2'] || m['imageDesktop'] || m['imageR2'] || m['image'] || m
            const heroMeta = mapR2Metadata(desktopObj)
            if (heroMeta.crop) {
              result['crop'] = heroMeta.crop
              result['cropDesktop'] = heroMeta.crop
            }
            if (heroMeta.hotspot) {
              result['hotspot'] = heroMeta.hotspot
              result['hotspotDesktop'] = heroMeta.hotspot
            }
            if (heroMeta.origWidth) {
              result['origWidth'] = heroMeta.origWidth
              result['origWidthDesktop'] = heroMeta.origWidth
            }
            if (heroMeta.origHeight) {
              result['origHeight'] = heroMeta.origHeight
              result['origHeightDesktop'] = heroMeta.origHeight
            }

            const heroMobileMeta =
              m['imageMobileR2'] || m['imageMobile']
                ? mapR2Metadata(m['imageMobileR2'] || m['imageMobile'])
                : m['cropMobile']
                  ? mapR2Metadata({crop: m['cropMobile']})
                  : {}
            if (heroMobileMeta.crop) result['cropMobile'] = heroMobileMeta.crop
            if (heroMobileMeta.hotspot) result['hotspotMobile'] = heroMobileMeta.hotspot
            if (heroMobileMeta.origWidth) result['origWidthMobile'] = heroMobileMeta.origWidth
            if (heroMobileMeta.origHeight) result['origHeightMobile'] = heroMobileMeta.origHeight
            return result
          })
          .filter(
            (m: Record<string, unknown>) => typeof m['url'] === 'string' && m['url'].trim() !== ''
          )
      }
      if (data?.interactiveShowcase && Array.isArray(data.interactiveShowcase)) {
        data.interactiveShowcase = data.interactiveShowcase
          .map((item: Record<string, unknown>) => {
            const imgR2 = item['imageR2']
            const imgMobileR2 = item['imageMobileR2']
            const image =
              mapImage(imgR2 as SanityImageLike) ||
              (typeof item['image'] === 'string' ? item['image'] : '')
            const imageMobile =
              mapImage(imgMobileR2 as SanityImageLike) ||
              (typeof item['imageMobile'] === 'string' ? item['imageMobile'] : undefined)
            const meta = mapR2Metadata(imgR2 || item['image'] || item)
            const metaMobile = imgMobileR2
              ? mapR2Metadata(imgMobileR2)
              : item['cropMobile']
                ? mapR2Metadata({crop: item['cropMobile']})
                : {}

            const rawHotspots = Array.isArray(item['hotspots']) ? item['hotspots'] : []
            const hotspots = rawHotspots.map((hs: Record<string, unknown>) => {
              const prod = hs['product'] as Record<string, unknown> | undefined
              let mappedProd = undefined
              if (prod) {
                const prodMedia = Array.isArray(prod['media'])
                  ? (prod['media'] as Record<string, unknown>[])
                  : []
                const coverItem = prodMedia.find(m => m['isCover']) || prodMedia[0]
                const imageR2Obj =
                  (coverItem?.['imageR2'] as Record<string, unknown> | undefined) ||
                  (prod['mainImageR2'] as Record<string, unknown> | undefined)

                const resolvedUrl =
                  (typeof imageR2Obj?.['url'] === 'string'
                    ? mapImage(imageR2Obj as SanityImageLike)
                    : '') ||
                  mapImage(coverItem?.['imageR2'] as SanityImageLike) ||
                  mapImage(prod['mainImageR2'] as SanityImageLike) ||
                  mapImage(prod['mainImage'] as SanityImageLike) ||
                  (typeof coverItem?.['url'] === 'string' ? coverItem['url'] : '') ||
                  (typeof prod['mainImage'] === 'string' ? prod['mainImage'] : '')

                mappedProd = {
                  id: (prod['id'] as string) || (prod['_id'] as string) || '',
                  name: prod['name'],
                  mainImage: resolvedUrl || undefined,
                  price: typeof prod['price'] === 'number' ? prod['price'] : undefined,
                  currency: typeof prod['currency'] === 'string' ? prod['currency'] : 'TRY',
                  categoryName: prod['categoryName'],
                  designerName: prod['designerName'],
                }
              }

              return {
                x: typeof hs['x'] === 'number' ? hs['x'] : 50,
                y: typeof hs['y'] === 'number' ? hs['y'] : 50,
                label: hs['label'],
                product: mappedProd,
              }
            })

            return {
              title: item['title'],
              image,
              imageMobile,
              crop: meta.crop,
              hotspot: meta.hotspot,
              origWidth: meta.origWidth,
              origHeight: meta.origHeight,
              cropDesktop: meta.crop,
              hotspotDesktop: meta.hotspot,
              origWidthDesktop: meta.origWidth,
              origHeightDesktop: meta.origHeight,
              cropMobile: metaMobile.crop,
              hotspotMobile: metaMobile.hotspot || meta.hotspot,
              origWidthMobile: metaMobile.origWidth || meta.origWidth,
              origHeightMobile: metaMobile.origHeight || meta.origHeight,
              hotspots,
            }
          })
          .filter((item: Record<string, unknown>) => !!item['image'])
      }

      if (!data.interactiveShowcase || data.interactiveShowcase.length === 0) {
        data.interactiveShowcase = [
          {
            title: {
              tr: 'Modern Yaşam Alanı Entegrasyonu',
              en: 'Modern Living Space Integration',
            },
            image:
              'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
            hotspots: [
              {
                x: 35,
                y: 62,
                label: {tr: 'Lüks Deri Berjer', en: 'Luxury Leather Lounge Chair'},
                product: {
                  id: 'luxe-lounge-chair',
                  name: {tr: 'Lüks Deri Berjer', en: 'Luxury Leather Lounge Chair'},
                  mainImage:
                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
                  price: 24500,
                  currency: 'TRY',
                  categoryName: {tr: 'Koltuk & Berjer', en: 'Chairs & Armchairs'},
                  designerName: {tr: 'Birim Tasarım Stüdyosu', en: 'Birim Design Studio'},
                },
              },
              {
                x: 68,
                y: 72,
                label: {tr: 'Mermer Kahve Sehpa', en: 'Marble Coffee Table'},
                product: {
                  id: 'marble-coffee-table',
                  name: {tr: 'Mermer Kahve Sehpa', en: 'Marble Coffee Table'},
                  mainImage:
                    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
                  price: 18200,
                  currency: 'TRY',
                  categoryName: {tr: 'Sehpalar', en: 'Coffee Tables'},
                  designerName: {tr: 'Mimari Çözümler', en: 'Architectural Solutions'},
                },
              },
              {
                x: 82,
                y: 45,
                label: {tr: 'Minimalist Lambader', en: 'Minimalist Floor Lamp'},
                product: {
                  id: 'minimalist-floor-lamp',
                  name: {tr: 'Minimalist Lambader', en: 'Minimalist Floor Lamp'},
                  mainImage:
                    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
                  price: 9400,
                  currency: 'TRY',
                  categoryName: {tr: 'Aydınlatma', en: 'Lighting'},
                  designerName: {tr: 'Studio Nord', en: 'Studio Nord'},
                },
              },
            ],
          },
          {
            title: {
              tr: 'Yemek ve Konferans Alanı Projesi',
              en: 'Dining & Conference Area Project',
            },
            image:
              'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2000&auto=format&fit=crop',
            hotspots: [
              {
                x: 50,
                y: 65,
                label: {tr: 'Ahşap Yemek Masası', en: 'Solid Wood Dining Table'},
                product: {
                  id: 'wood-dining-table',
                  name: {tr: 'Ahşap Yemek Masası', en: 'Solid Wood Dining Table'},
                  mainImage:
                    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=800&auto=format&fit=crop',
                  price: 36000,
                  currency: 'TRY',
                  categoryName: {tr: 'Masalar', en: 'Tables'},
                  designerName: {tr: 'Birim Arch', en: 'Birim Arch'},
                },
              },
              {
                x: 28,
                y: 58,
                label: {tr: 'Ergonomik Ahşap Sandalye', en: 'Ergonomic Wooden Chair'},
                product: {
                  id: 'ergonomic-wood-chair',
                  name: {tr: 'Ergonomik Ahşap Sandalye', en: 'Ergonomic Wooden Chair'},
                  mainImage:
                    'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
                  price: 7800,
                  currency: 'TRY',
                  categoryName: {tr: 'Sandalyeler', en: 'Chairs'},
                  designerName: {tr: 'Studio Nord', en: 'Studio Nord'},
                },
              },
            ],
          },
        ]
        if (!data.interactiveShowcaseTitle) {
          data.interactiveShowcaseTitle = {
            tr: 'Mekanlarımızda Ürünlerimiz',
            en: 'Products in Our Spaces',
          }
        }
        if (data.interactiveShowcaseBlockIndex === undefined) {
          data.interactiveShowcaseBlockIndex = 1
        }
      }
      if (data?.contentBlocks) {
        data.contentBlocks = data.contentBlocks.map((b: Record<string, unknown>) => {
          let image = undefined
          let imageMobile = undefined
          let imageDesktop = undefined
          let url = b['url'] as string | undefined
          let urlMobile = undefined
          let urlDesktop = undefined

          const mediaType = (b['mediaType'] as string) || 'image'
          const imageR2 = b['imageR2']
          const imageMobileR2 = b['imageMobileR2']
          const imageDesktopR2 = b['imageDesktopR2']

          if (mediaType === 'image') {
            image = mapImage(imageR2 as SanityImageLike) || mapImage(b['image'] as SanityImageLike)
            imageMobile =
              mapImage(imageMobileR2 as SanityImageLike) ||
              mapImage(b['imageMobile'] as SanityImageLike)
            imageDesktop =
              mapImage(imageDesktopR2 as SanityImageLike) ||
              mapImage(b['imageDesktop'] as SanityImageLike)
            url = imageDesktop || image || url
            urlMobile = imageMobile || url
            urlDesktop = imageDesktop || image || url
          } else if (mediaType === 'video') {
            const videoFileR2 = b['videoFileR2'] as Record<string, unknown> | undefined
            const videoFileMobileR2 = b['videoFileMobileR2'] as Record<string, unknown> | undefined
            const videoFileDesktopR2 = b['videoFileDesktopR2'] as
              | Record<string, unknown>
              | undefined

            const vUrl = videoFileR2?.['url'] as string | undefined
            url = vUrl ? rewriteR2Url(vUrl) : url

            const vmUrl = videoFileMobileR2?.['url'] as string | undefined
            urlMobile = vmUrl ? rewriteR2Url(vmUrl) : undefined

            const vdUrl = videoFileDesktopR2?.['url'] as string | undefined
            urlDesktop = vdUrl ? rewriteR2Url(vdUrl) : undefined
          } else if (mediaType === 'youtube') {
            url = b['url'] as string | undefined
          }

          const desktopImgObj = {
            ...(typeof b === 'object' && b !== null ? (b as Record<string, unknown>) : {}),
            ...(typeof imageR2 === 'object' && imageR2 !== null
              ? (imageR2 as Record<string, unknown>)
              : {}),
            ...(typeof imageDesktopR2 === 'object' && imageDesktopR2 !== null
              ? (imageDesktopR2 as Record<string, unknown>)
              : {}),
            crop:
              b['cropDesktop'] ||
              b['crop'] ||
              (imageR2 as Record<string, unknown> | undefined)?.['crop'],
            hotspot:
              b['hotspotDesktop'] ||
              b['hotspot'] ||
              (imageR2 as Record<string, unknown> | undefined)?.['hotspot'],
          }
          const metaDesktop = mapR2Metadata(desktopImgObj)

          const mobileImgObj = {
            ...(typeof imageMobileR2 === 'object' && imageMobileR2 !== null
              ? (imageMobileR2 as Record<string, unknown>)
              : {}),
            crop:
              b['cropMobile'] || (imageMobileR2 as Record<string, unknown> | undefined)?.['crop'],
            hotspot:
              b['hotspotMobile'] ||
              (imageMobileR2 as Record<string, unknown> | undefined)?.['hotspot'],
          }
          const metaMobile = mapR2Metadata(mobileImgObj)
          const borderColor = (b['borderColor'] as Record<string, unknown>)?.['hex']

          const crop =
            metaDesktop.crop ||
            (b['crop'] ? mapR2Metadata({crop: b['crop']}).crop : undefined) ||
            (b['image'] ? mapR2Metadata(b['image']).crop : undefined)

          const hotspot =
            metaDesktop.hotspot ||
            (b['hotspot'] ? mapR2Metadata({hotspot: b['hotspot']}).hotspot : undefined) ||
            (b['image'] ? mapR2Metadata(b['image']).hotspot : undefined)

          const origWidth = metaDesktop.origWidth || b['origWidth']
          const origHeight = metaDesktop.origHeight || b['origHeight']

          const cropDesktop =
            metaDesktop.crop ||
            (b['cropDesktop'] ? mapR2Metadata({crop: b['cropDesktop']}).crop : undefined) ||
            crop

          const hotspotDesktop =
            metaDesktop.hotspot ||
            (b['hotspotDesktop']
              ? mapR2Metadata({hotspot: b['hotspotDesktop']}).hotspot
              : undefined) ||
            hotspot

          const origWidthDesktop = metaDesktop.origWidth || b['origWidthDesktop'] || origWidth
          const origHeightDesktop = metaDesktop.origHeight || b['origHeightDesktop'] || origHeight

          const cropMobile =
            metaMobile.crop ||
            (b['cropMobile'] ? mapR2Metadata({crop: b['cropMobile']}).crop : undefined)

          const hotspotMobile =
            metaMobile.hotspot ||
            (b['hotspotMobile']
              ? mapR2Metadata({hotspot: b['hotspotMobile']}).hotspot
              : undefined) ||
            hotspotDesktop

          const origWidthMobile = metaMobile.origWidth || origWidthDesktop
          const origHeightMobile = metaMobile.origHeight || origHeightDesktop

          return {
            ...b,
            mediaType,
            image,
            imageMobile,
            imageDesktop,
            url,
            urlMobile,
            urlDesktop,
            crop,
            hotspot,
            origWidth,
            origHeight,
            cropDesktop,
            hotspotDesktop,
            origWidthDesktop,
            origHeightDesktop,
            cropMobile,
            hotspotMobile,
            origWidthMobile,
            origHeightMobile,
            borderColor,
            imagePanels: Array.isArray(b['imagePanels'])
              ? b['imagePanels']
                  .map((p: Record<string, unknown> | string) => {
                    if (typeof p === 'string') {
                      return {
                        url: p,
                        type: p.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
                          ? 'video'
                          : 'image',
                      }
                    }
                    const imgR2 = p['imageR2'] as SanityImageLike
                    const pUrl = typeof p['url'] === 'string' ? (p['url'] as string) : undefined
                    const imgR2Url =
                      typeof (imgR2 as Record<string, unknown> | undefined)?.['url'] === 'string'
                        ? ((imgR2 as Record<string, unknown>)['url'] as string)
                        : undefined
                    const panelUrl =
                      mapImage(p as SanityImageLike) ||
                      mapImage(imgR2) ||
                      rewriteR2Url(pUrl) ||
                      rewriteR2Url(imgR2Url)
                    if (!panelUrl) return null
                    const pMime =
                      typeof p['mimeType'] === 'string' ? (p['mimeType'] as string) : undefined
                    const pType = typeof p['type'] === 'string' ? (p['type'] as string) : undefined
                    const type =
                      pMime?.startsWith('video/') ||
                      pType === 'video' ||
                      panelUrl.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
                        ? 'video'
                        : 'image'
                    const pRec = p as Record<string, unknown>
                    const panelMetaDesktop = mapR2Metadata(imgR2 || pRec['image'] || p)
                    const panelMobileImgObj = pRec['imageMobileR2'] || pRec['imageMobile']
                    const panelMetaMobile = panelMobileImgObj
                      ? mapR2Metadata(panelMobileImgObj)
                      : pRec['cropMobile']
                        ? mapR2Metadata({crop: pRec['cropMobile']})
                        : {}

                    const pCrop = panelMetaDesktop.crop || pRec['crop']
                    const pHotspot = panelMetaDesktop.hotspot || pRec['hotspot']
                    const pOrigWidth = panelMetaDesktop.origWidth || pRec['origWidth']
                    const pOrigHeight = panelMetaDesktop.origHeight || pRec['origHeight']

                    const pCropMobile =
                      panelMetaMobile.crop ||
                      (pRec['cropMobile']
                        ? mapR2Metadata({crop: pRec['cropMobile']}).crop
                        : undefined)
                    const pHotspotMobile = panelMetaMobile.hotspot || pHotspot
                    const pOrigWidthMobile = panelMetaMobile.origWidth || pOrigWidth
                    const pOrigHeightMobile = panelMetaMobile.origHeight || pOrigHeight

                    const pUrlMobile =
                      mapImage(pRec['imageMobile'] as SanityImageLike) ||
                      (pRec['urlMobile'] as string | undefined)
                    const pUrlDesktop =
                      mapImage(pRec['imageDesktop'] as SanityImageLike) ||
                      (pRec['urlDesktop'] as string | undefined)

                    return {
                      url: panelUrl,
                      urlMobile: pUrlMobile,
                      urlDesktop: pUrlDesktop,
                      type,
                      crop: pCrop,
                      hotspot: pHotspot,
                      origWidth: pOrigWidth,
                      origHeight: pOrigHeight,
                      cropMobile: pCropMobile,
                      hotspotMobile: pHotspotMobile,
                      origWidthMobile: pOrigWidthMobile,
                      origHeightMobile: pOrigHeightMobile,
                    }
                  })
                  .filter(Boolean)
              : b['imagePanels'],
            panelSize: b['panelSize'],
            panelFit: b['panelFit'],
            panelGap: b['panelGap'],
          }
        })
      }
      if (data && !Array.isArray(data.featuredProductIds)) {
        data.featuredProductIds = []
      }
      return data
    } catch (e) {
      console.error('Error fetching home page content', e)
    }
  }
  await delay(SIMULATED_DELAY)
  const data = getItem<HomePageContent>(KEYS.HOME_PAGE) || ({} as HomePageContent)
  if (!Array.isArray(data.featuredProductIds)) data.featuredProductIds = []
  if (!data.interactiveShowcase || data.interactiveShowcase.length === 0) {
    data.interactiveShowcase = [
      {
        title: {
          tr: 'Modern Yaşam Alanı Entegrasyonu',
          en: 'Modern Living Space Integration',
        },
        image:
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
        hotspots: [
          {
            x: 35,
            y: 62,
            label: {tr: 'Lüks Deri Berjer', en: 'Luxury Leather Lounge Chair'},
            product: {
              id: 'luxe-lounge-chair',
              name: {tr: 'Lüks Deri Berjer', en: 'Luxury Leather Lounge Chair'},
              mainImage:
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
              price: 24500,
              currency: 'TRY',
              categoryName: {tr: 'Koltuk & Berjer', en: 'Chairs & Armchairs'},
              designerName: {tr: 'Birim Tasarım Stüdyosu', en: 'Birim Design Studio'},
            },
          },
          {
            x: 68,
            y: 72,
            label: {tr: 'Mermer Kahve Sehpa', en: 'Marble Coffee Table'},
            product: {
              id: 'marble-coffee-table',
              name: {tr: 'Mermer Kahve Sehpa', en: 'Marble Coffee Table'},
              mainImage:
                'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop',
              price: 18200,
              currency: 'TRY',
              categoryName: {tr: 'Sehpalar', en: 'Coffee Tables'},
              designerName: {tr: 'Mimari Çözümler', en: 'Architectural Solutions'},
            },
          },
          {
            x: 82,
            y: 45,
            label: {tr: 'Minimalist Lambader', en: 'Minimalist Floor Lamp'},
            product: {
              id: 'minimalist-floor-lamp',
              name: {tr: 'Minimalist Lambader', en: 'Minimalist Floor Lamp'},
              mainImage:
                'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop',
              price: 9400,
              currency: 'TRY',
              categoryName: {tr: 'Aydınlatma', en: 'Lighting'},
              designerName: {tr: 'Studio Nord', en: 'Studio Nord'},
            },
          },
        ],
      },
      {
        title: {
          tr: 'Yemek ve Konferans Alanı Projesi',
          en: 'Dining & Conference Area Project',
        },
        image:
          'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2000&auto=format&fit=crop',
        hotspots: [
          {
            x: 50,
            y: 65,
            label: {tr: 'Ahşap Yemek Masası', en: 'Solid Wood Dining Table'},
            product: {
              id: 'wood-dining-table',
              name: {tr: 'Ahşap Yemek Masası', en: 'Solid Wood Dining Table'},
              mainImage:
                'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=800&auto=format&fit=crop',
              price: 36000,
              currency: 'TRY',
              categoryName: {tr: 'Masalar', en: 'Tables'},
              designerName: {tr: 'Birim Arch', en: 'Birim Arch'},
            },
          },
          {
            x: 28,
            y: 58,
            label: {tr: 'Ergonomik Ahşap Sandalye', en: 'Ergonomic Wooden Chair'},
            product: {
              id: 'ergonomic-wood-chair',
              name: {tr: 'Ergonomik Ahşap Sandalye', en: 'Ergonomic Wooden Chair'},
              mainImage:
                'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
              price: 7800,
              currency: 'TRY',
              categoryName: {tr: 'Sandalyeler', en: 'Chairs'},
              designerName: {tr: 'Studio Nord', en: 'Studio Nord'},
            },
          },
        ],
      },
    ]
    if (!data.interactiveShowcaseTitle) {
      data.interactiveShowcaseTitle = {
        tr: 'Mekanlarımızda Ürünlerimiz',
        en: 'Products in Our Spaces',
      }
    }
    if (data.interactiveShowcaseBlockIndex === undefined) {
      data.interactiveShowcaseBlockIndex = 1
    }
  }
  return data
}

export const updateAboutPageContent = async (): Promise<void> => {}
export const updateContactPageContent = async (): Promise<void> => {}
export const updateHomePageContent = async (): Promise<void> => {}
