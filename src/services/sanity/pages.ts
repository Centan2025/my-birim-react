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
      }
      if (data.heroImageMobileR2?.url) {
        data.heroImageMobile = {
          url: mapImage(data.heroImageMobileR2),
          palette: extractPalette(data.heroImageMobileR2),
          ...mapR2Metadata(data.heroImageMobileR2),
        }
      }
      if (Array.isArray(data.eras)) {
        data.eras = data.eras.map((era: Record<string, unknown>) => ({
          ...era,
          image: era['imageR2'] ? mapImage(era['imageR2'] as never) : era['image'],
          imageMobile: era['imageMobileR2']
            ? mapImage(era['imageMobileR2'] as never)
            : era['imageMobile'],
        }))
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
            contentBlocks[]{ ..., titleFont, contentFont, imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2, imagePanels[]{ ..., imageR2 }, panelFit, panelGap }
        }`
      const data = await sanity.fetch(q)
      if (data?.heroMedia) {
        data.heroMedia = data.heroMedia
          .map((m: Record<string, unknown>) => {
            const url = mapMediaUrl(m)
            const urlMobile = mapMediaUrl(m, true, false)
            const urlDesktop = mapMediaUrl(m, false, true)
            const imageR2 = m['imageR2']
            const palette = extractPalette(imageR2)
            let type = m['type'] as string | undefined
            if (
              type === 'video' &&
              url &&
              (url.includes('youtube.com') || url.includes('youtu.be'))
            )
              type = 'youtube'
            const result: Record<string, unknown> = {...m, url, type}
            if (urlMobile && urlMobile !== url) result['urlMobile'] = urlMobile
            if (urlDesktop && urlDesktop !== url) result['urlDesktop'] = urlDesktop
            if (palette) result['palette'] = palette
            const heroMeta = imageR2 ? mapR2Metadata(imageR2) : {}
            if (heroMeta.crop) result['crop'] = heroMeta.crop
            if (heroMeta.hotspot) result['hotspot'] = heroMeta.hotspot
            return result
          })
          .filter(
            (m: Record<string, unknown>) => typeof m['url'] === 'string' && m['url'].trim() !== ''
          )
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
            image = mapImage(imageR2 as SanityImageLike)
            imageMobile = mapImage(imageMobileR2 as SanityImageLike)
            imageDesktop = mapImage(imageDesktopR2 as SanityImageLike)
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

          const meta = imageR2 ? mapR2Metadata(imageR2) : {}
          const borderColor = (b['borderColor'] as Record<string, unknown>)?.['hex']

          return {
            ...b,
            mediaType,
            image,
            imageMobile,
            imageDesktop,
            url,
            urlMobile,
            urlDesktop,
            imagePanels: Array.isArray(b['imagePanels'])
              ? b['imagePanels']
                  .map((p: Record<string, unknown> | string) => {
                    if (typeof p === 'string') {
                      return {
                        url: p,
                        type: p.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/) ? 'video' : 'image',
                      }
                    }
                    const imgR2 = p['imageR2'] as SanityImageLike
                    const pUrl = typeof p['url'] === 'string' ? (p['url'] as string) : undefined
                    const imgR2Url =
                      typeof (imgR2 as Record<string, unknown> | undefined)?.['url'] === 'string'
                        ? ((imgR2 as Record<string, unknown>)['url'] as string)
                        : undefined
                    const panelUrl = mapImage(p as SanityImageLike) || mapImage(imgR2) || pUrl || imgR2Url
                    if (!panelUrl) return null
                    const pMime = typeof p['mimeType'] === 'string' ? (p['mimeType'] as string) : undefined
                    const pType = typeof p['type'] === 'string' ? (p['type'] as string) : undefined
                    const type =
                      pMime?.startsWith('video/') ||
                      pType === 'video' ||
                      panelUrl.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
                        ? 'video'
                        : 'image'
                    const meta = mapR2Metadata(imgR2 || p)
                    return {
                      url: panelUrl,
                      type,
                      crop: meta.crop,
                      hotspot: meta.hotspot,
                      origWidth: meta.origWidth,
                      origHeight: meta.origHeight,
                    }
                  })
                  .filter(Boolean)
              : b['imagePanels'],
            panelSize: b['panelSize'],
            panelFit: b['panelFit'],
            panelGap: b['panelGap'],
            crop: meta.crop,
            hotspot: meta.hotspot,
            origWidth: meta.origWidth,
            origHeight: meta.origHeight,
            borderColor,
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
  const data = getItem<HomePageContent>(KEYS.HOME_PAGE)
  if (data && !Array.isArray(data.featuredProductIds)) data.featuredProductIds = []
  return data || ({} as HomePageContent)
}

export const updateAboutPageContent = async (): Promise<void> => {}
export const updateContactPageContent = async (): Promise<void> => {}
export const updateHomePageContent = async (): Promise<void> => {}
