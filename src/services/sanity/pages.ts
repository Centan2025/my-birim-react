import groq from 'groq'
import type { AboutPageContent, ContactPageContent, HomePageContent } from '../../types'
import { sanity, useSanity, mapImage, mapMediaUrl, rewriteR2Url, extractPalette, mapR2Metadata } from './client'
import { getItem } from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
  HOME_PAGE: 'birim_home_page',
  ABOUT_PAGE: 'birim_about_page',
  CONTACT_PAGE: 'birim_contact_page',
}

const mapProductMedia = (row: any): any[] => {
  const mediaArr = Array.isArray(row?.media) ? row.media : []
  return mediaArr
    .map((m: any) => {
      const type = m?.type
      if (type !== 'image' && type !== 'video' && type !== 'youtube') return null
      const url = mapMediaUrl(m)
      const urlMobile = mapMediaUrl(m, true, false)
      const urlDesktop = mapMediaUrl(m, false, true)
      const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : (m?.image ? mapR2Metadata(m.image) : {})
      const result: any = {
        type,
        url,
        title: m?.title,
        description: m?.description,
        link: m?.link,
        linkText: m?.linkText,
        ...metadata,
      }
      if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
      if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
      return result
    })
    .filter((m: any) => !!m && !!m.url)
}

export const getAboutPageContent = async (): Promise<AboutPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "aboutPage"][0]{
            ...,
            heroImage{ ..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}, dimensions}} },
            heroImageR2,
            historySection{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, media[]{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, imageMobile{ ..., asset->{url, _ref, _id} }, imageMobileR2, imageDesktop{ ..., asset->{url, _ref, _id} }, imageDesktopR2, videoFile{ ..., asset->{url, _ref, _id} }, videoFileR2 } },
            identitySection{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, media[]{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, imageMobile{ ..., asset->{url, _ref, _id} }, imageMobileR2, imageDesktop{ ..., asset->{url, _ref, _id} }, imageDesktopR2, videoFile{ ..., asset->{url, _ref, _id} }, videoFileR2 } },
            qualitySection{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, media[]{ ..., image{ ..., asset->{url, _ref, _id, metadata{dimensions}} }, imageR2, imageMobile{ ..., asset->{url, _ref, _id} }, imageMobileR2, imageDesktop{ ..., asset->{url, _ref, _id} }, imageDesktopR2, videoFile{ ..., asset->{url, _ref, _id} }, videoFileR2 } }
        }`
    const data = await sanity.withConfig({ useCdn: false }).fetch(q)
    if (data) {
      if (data.heroImageR2?.url) {
        data.heroImage = {
          url: mapImage(data.heroImageR2),
          palette: extractPalette(data.heroImageR2),
          ...mapR2Metadata(data.heroImageR2),
        }
      } else if (data.heroImage?.asset) {
        data.heroImage = {
          url: mapImage(data.heroImage),
          palette: extractPalette(data.heroImage),
          ...mapR2Metadata(data.heroImage)
        }
      }
      if (data.historySection) {
        const hsMeta = data.historySection.imageR2 ? mapR2Metadata(data.historySection.imageR2) : mapR2Metadata(data.historySection.image)
        data.historySection.image = {
          url: mapImage(data.historySection.imageR2) || mapImage(data.historySection.image),
          ...hsMeta,
        }
        data.historySection.media = mapProductMedia(data.historySection)
      }
      if (data.identitySection) {
        const idMeta = data.identitySection.imageR2 ? mapR2Metadata(data.identitySection.imageR2) : mapR2Metadata(data.identitySection.image)
        data.identitySection.image = {
          url: mapImage(data.identitySection.imageR2) || mapImage(data.identitySection.image),
          ...idMeta,
        }
        data.identitySection.media = mapProductMedia(data.identitySection)
      }
      if (data.qualitySection) {
        const qsMeta = data.qualitySection.imageR2 ? mapR2Metadata(data.qualitySection.imageR2) : mapR2Metadata(data.qualitySection.image)
        data.qualitySection.image = {
          url: mapImage(data.qualitySection.imageR2) || mapImage(data.qualitySection.image),
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

export const getContactPageContent = async (): Promise<ContactPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "contactPage"][0]{ ..., locations[]{ ..., media[]{ type, url, image{..., asset->{url, _ref, _id}}, imageR2, videoFile{..., asset->{url, _ref, _id}}, videoFileR2 } } }`
    const data = await sanity.fetch(q)
    if (data?.locations) {
      data.locations = data.locations.map((loc: any) => {
        if (loc.media && Array.isArray(loc.media)) {
          const processedMedia = loc.media
            .map((mediaItem: any) => {
              let mediaUrl = mediaItem.url
              if (mediaItem.type === 'image') {
                mediaUrl = mapImage(mediaItem.imageR2) || mapImage(mediaItem.image) || mediaItem.url
              } else if (mediaItem.type === 'video') {
                mediaUrl =
                  (mediaItem.videoFileR2?.url ? rewriteR2Url(mediaItem.videoFileR2.url) : null) ||
                  mediaItem.videoFile?.asset?.url ||
                  mediaItem.url
              }
              const metadata = mediaItem.imageR2 ? mapR2Metadata(mediaItem.imageR2) : {}
              return { ...mediaItem, url: mediaUrl, ...metadata }
            })
            .filter((m: any) => m.url)
          return { ...loc, media: processedMedia }
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
            heroMedia[]{ ..., image{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, imageR2{..., metadata{palette{dominant{background,foreground}}} }, imageMobileR2{..., metadata{palette{dominant{background,foreground}}} }, imageDesktopR2{..., metadata{palette{dominant{background,foreground}}} }, videoFileR2, videoFileMobileR2, videoFileDesktopR2 },
            contentBlocks[]{ ..., image{..., asset->{url, _ref, _id}}, titleFont, contentFont, imageR2, videoFileR2 }
        }`
      const data = await sanity.withConfig({ useCdn: false }).fetch(q)
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
            const result: any = { ...m, url, type }
            if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
            if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
            if (palette) result.palette = palette
            const heroMeta = m.imageR2 ? mapR2Metadata(m.imageR2) : (m.image ? mapR2Metadata(m.image) : {})
            if (heroMeta.crop) result.crop = heroMeta.crop
            if (heroMeta.hotspot) result.hotspot = heroMeta.hotspot
            return result
          })
          .filter((m: any) => m.url && m.url.trim() !== '')
      }
      if (data?.contentBlocks) {
        data.contentBlocks = data.contentBlocks.map((b: any) => {
          let url = b.url
          if (b.mediaType === 'image') {
            const imgUrl = b.imageR2?.url ? mapImage(b.imageR2) : (b.image ? mapImage(b.image) : undefined)
            const imgMeta = b.imageR2 ? mapR2Metadata(b.imageR2) : (b.image ? mapR2Metadata(b.image) : {})
            if (imgUrl) return { ...b, image: imgUrl, url: undefined, crop: imgMeta.crop, hotspot: imgMeta.hotspot, origWidth: imgMeta.origWidth, origHeight: imgMeta.origHeight }
          }
          if (b.mediaType === 'video' && b.videoFileR2?.url) {
            url = rewriteR2Url(b.videoFileR2.url)
          }
          const meta = b.imageR2 ? mapR2Metadata(b.imageR2) : (b.image ? mapR2Metadata(b.image) : {})
          return { ...b, image: undefined, url, crop: meta.crop, hotspot: meta.hotspot, origWidth: meta.origWidth, origHeight: meta.origHeight }
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

export const updateAboutPageContent = async (): Promise<void> => { }
export const updateContactPageContent = async (): Promise<void> => { }
export const updateHomePageContent = async (): Promise<void> => { }
