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
} from './client'
import {getItem} from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
  HOME_PAGE: 'birim_home_page',
  ABOUT_PAGE: 'birim_about_page',
  CONTACT_PAGE: 'birim_contact_page',
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
    const q = groq`*[_type == "aboutPage"][0]{
            ...,
            heroImageR2,
            historySection{ ..., imageR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } },
            identitySection{ ..., imageR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } },
            qualitySection{ ..., imageR2, media[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 } }
        }`
    const data = await sanity.withConfig({useCdn: false}).fetch(q)
    if (data) {
      if (data.heroImageR2?.url) {
        data.heroImage = {
          url: mapImage(data.heroImageR2),
          palette: extractPalette(data.heroImageR2),
          ...mapR2Metadata(data.heroImageR2),
        }
      }
      if (data.historySection) {
        const hsMeta = mapR2Metadata(data.historySection.imageR2)
        data.historySection.image = {
          url: mapImage(data.historySection.imageR2),
          ...hsMeta,
        }
        data.historySection.media = mapProductMedia(data.historySection)
      }
      if (data.identitySection) {
        const idMeta = mapR2Metadata(data.identitySection.imageR2)
        data.identitySection.image = {
          url: mapImage(data.identitySection.imageR2),
          ...idMeta,
        }
        data.identitySection.media = mapProductMedia(data.identitySection)
      }
      if (data.qualitySection) {
        const qsMeta = mapR2Metadata(data.qualitySection.imageR2)
        data.qualitySection.image = {
          url: mapImage(data.qualitySection.imageR2),
          ...qsMeta,
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
    const q = groq`*[_type == "factoryPage"][0]{
            ...,
            gallery[]{ ..., imageR2, imageMobileR2, imageDesktopR2, videoFileR2 }
        }`
    const data = await sanity.withConfig({useCdn: false}).fetch(q)
    if (data) {
      if (data.gallery) {
        data.gallery = mapProductMedia({media: data.gallery})
      }
      return data
    }
  }
  await delay(SIMULATED_DELAY)
  return {} as FactoryPageContent
}

export const getContactPageContent = async (): Promise<ContactPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "contactPage"][0]{ ..., locations[]{ ..., media[]{ type, url, imageR2, videoFileR2 } } }`
    const data = await sanity.fetch(q)
    if (data?.locations) {
      data.locations = data.locations.map((loc: any) => {
        if (loc.media && Array.isArray(loc.media)) {
          const processedMedia = loc.media
            .map((mediaItem: any) => {
              let mediaUrl = mediaItem.url
              if (mediaItem.type === 'image') {
                mediaUrl = mapImage(mediaItem.imageR2) || mediaItem.url
              } else if (mediaItem.type === 'video') {
                mediaUrl =
                  (mediaItem.videoFileR2?.url ? rewriteR2Url(mediaItem.videoFileR2.url) : null) ||
                  mediaItem.url
              }
              const metadata = mediaItem.imageR2 ? mapR2Metadata(mediaItem.imageR2) : {}
              return {...mediaItem, url: mediaUrl, ...metadata}
            })
            .filter((m: any) => m.url)
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
            contentBlocks[]{ ..., titleFont, contentFont, imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2 }
        }`
      const data = await sanity.withConfig({useCdn: false}).fetch(q)
      if (data?.heroMedia) {
        data.heroMedia = data.heroMedia
          .map((m: any) => {
            const url = mapMediaUrl(m)
            const urlMobile = mapMediaUrl(m, true, false)
            const urlDesktop = mapMediaUrl(m, false, true)
            const palette = extractPalette(m.imageR2)
            let type = m.type
            if (
              type === 'video' &&
              url &&
              (url.includes('youtube.com') || url.includes('youtu.be'))
            )
              type = 'youtube'
            const result: any = {...m, url, type}
            if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
            if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
            if (palette) result.palette = palette
            const heroMeta = m.imageR2 ? mapR2Metadata(m.imageR2) : {}
            if (heroMeta.crop) result.crop = heroMeta.crop
            if (heroMeta.hotspot) result.hotspot = heroMeta.hotspot
            return result
          })
          .filter((m: any) => m.url && m.url.trim() !== '')
      }
      if (data?.contentBlocks) {
        data.contentBlocks = data.contentBlocks.map((b: any) => {
          let image = undefined
          let imageMobile = undefined
          let imageDesktop = undefined
          let url = b.url
          let urlMobile = undefined
          let urlDesktop = undefined

          if (b.mediaType === 'image' || !b.mediaType) {
            image = mapImage(b.imageR2)
            imageMobile = mapImage(b.imageMobileR2)
            imageDesktop = mapImage(b.imageDesktopR2)
          } else if (b.mediaType === 'video') {
            url = b.videoFileR2?.url ? rewriteR2Url(b.videoFileR2.url) : b.url
            urlMobile = b.videoFileMobileR2?.url ? rewriteR2Url(b.videoFileMobileR2.url) : undefined
            urlDesktop = b.videoFileDesktopR2?.url
              ? rewriteR2Url(b.videoFileDesktopR2.url)
              : undefined
          } else if (b.mediaType === 'youtube') {
            url = b.url
          } else if (b.mediaType === 'panels') {
            // imagePanels dizisini tip ve URL içeren bir yapıya dönüştür
            if (Array.isArray(b.imagePanels)) {
              b.imagePanels = b.imagePanels
                .map((p: any) => {
                  const url = mapImage(p)
                  if (!url) return null
                  const mime = p.mimeType || ''
                  const type =
                    mime.startsWith('video/') ||
                    url.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
                      ? 'video'
                      : 'image'
                  return {url, type}
                })
                .filter(Boolean)
            }
          }

          const meta = b.imageR2 ? mapR2Metadata(b.imageR2) : {}
          const borderColor = b.borderColor?.hex

          return {
            ...b,
            image,
            imageMobile,
            imageDesktop,
            url,
            urlMobile,
            urlDesktop,
            imagePanels: b.imagePanels,
            panelSize: b.panelSize,
            crop: meta.crop,
            hotspot: meta.hotspot,
            origWidth: meta.origWidth,
            origHeight: meta.origHeight,
            borderColor,
          }
        })
      }
      if (!Array.isArray(data?.featuredProductIds)) data.featuredProductIds = []
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
