import groq from 'groq'
import type { NewsItem, Project } from '../../types'
import { sanity, useSanity, mapImage, rewriteR2Url, extractPalette, mapR2Metadata } from './client'
import { getItem } from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = { NEWS: 'birim_news' }

const mapMediaArray = (mediaArrRaw: any): any[] => {
  const mediaArr = Array.isArray(mediaArrRaw) ? mediaArrRaw : []
  return mediaArr
    .map((m: any) => {
      const type = m?.type || 'image'
      let url = ''
      let urlMobile: string | undefined = undefined
      let urlDesktop: string | undefined = undefined

      if (type === 'image') {
        url = mapImage(m.imageR2)
        urlMobile = m.imageMobileR2?.url ? mapImage(m.imageMobileR2) : undefined
        urlDesktop = m.imageDesktopR2?.url ? mapImage(m.imageDesktopR2) : undefined
      } else if (type === 'video') {
        url = mapImage(m.videoFileR2)
        urlMobile = m.videoFileMobileR2?.url ? mapImage(m.videoFileMobileR2) : undefined
        urlDesktop = m.videoFileDesktopR2?.url ? mapImage(m.videoFileDesktopR2) : undefined
      } else {
        url = m.url || ''
      }
      
      const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
      const result: any = { type, url, caption: m.caption, ...metadata }
      if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
      if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
      result.isCover = !!m.isCover
      return result
    })
    .filter((m: any) => m.url)
}

const mapNewsRow = (r: any): NewsItem => {
  const mediaArr = Array.isArray(r.media) ? r.media : []
  const coverItem = mediaArr.find((m: any) => m.isCover) || mediaArr[0]
  
  let mainImage: any = { url: '' }
  if (coverItem) {
    let url = ''
    let urlMobile: string | undefined = undefined
    let urlDesktop: string | undefined = undefined

    if (coverItem.type === 'image') {
      url = mapImage(coverItem.imageR2)
      urlMobile = coverItem.imageMobileR2?.url ? mapImage(coverItem.imageMobileR2) : undefined
      urlDesktop = coverItem.imageDesktopR2?.url ? mapImage(coverItem.imageDesktopR2) : undefined
    } else if (coverItem.type === 'video') {
      url = mapImage(coverItem.videoFileR2)
      urlMobile = coverItem.videoFileMobileR2?.url ? mapImage(coverItem.videoFileMobileR2) : undefined
      urlDesktop = coverItem.videoFileDesktopR2?.url ? mapImage(coverItem.videoFileDesktopR2) : undefined
    } else if (coverItem.type === 'youtube') {
      url = coverItem.url || ''
    }

    const metadata = coverItem.imageR2 ? mapR2Metadata(coverItem.imageR2) : {}
    mainImage = {
      url,
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) mainImage.urlMobile = urlMobile
    if (urlDesktop && urlDesktop !== url) mainImage.urlDesktop = urlDesktop
  }

  return {
    ...r,
    mainImage,
    media: mapMediaArray(r.media),
  }
}

const mapProjectRow = (r: any): Project => {
  const mediaArr = Array.isArray(r.media) ? r.media : []
  const coverItem = mediaArr.find((m: any) => m.isCover) || mediaArr[0]

  let cover: any = { url: '' }
  if (coverItem) {
    const url = mapImage(coverItem.imageR2)
    const urlMobile = coverItem.imageMobileR2?.url ? mapImage(coverItem.imageMobileR2) : undefined
    const urlDesktop = coverItem.imageDesktopR2?.url ? mapImage(coverItem.imageDesktopR2) : undefined
    const metadata = coverItem.imageR2 ? mapR2Metadata(coverItem.imageR2) : {}
    cover = {
      url,
      palette: extractPalette(coverItem.imageR2),
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) cover.urlMobile = urlMobile
    if (urlDesktop && urlDesktop !== url) cover.urlDesktop = urlDesktop
  }

  // Transform contentBlocks
  const contentBlocks = r.contentBlocks
    ? r.contentBlocks.map((b: any) => {
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
        urlDesktop = b.videoFileDesktopR2?.url ? rewriteR2Url(b.videoFileDesktopR2.url) : undefined
      } else if (b.mediaType === 'youtube') {
        url = b.url
      }

      const meta = b.imageR2 ? mapR2Metadata(b.imageR2) : {}

      return {
        ...b,
        image: image || undefined,
        imageMobile: imageMobile || undefined,
        imageDesktop: imageDesktop || undefined,
        url: url || undefined,
        urlMobile: urlMobile || undefined,
        urlDesktop: urlDesktop || undefined,
        crop: meta.crop,
        hotspot: meta.hotspot,
        origWidth: meta.origWidth,
        origHeight: meta.origHeight,
      }
    })
    : undefined

  return {
    ...r,
    cover,
    media: mapMediaArray(r.media),
    contentBlocks: contentBlocks && contentBlocks.length > 0 ? contentBlocks : undefined,
  }
}

export const getNews = async (): Promise<NewsItem[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem" && (isPublished != false) && (!defined(publishAt) || publishAt <= now())] 
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, date, _createdAt) desc){
          "id": id.current, 
          title, date, publishAt, isPublished, sortOrder, content, 
          media[]{ 
            type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
            videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
          }
        }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => mapNewsRow(r))
  }
  await delay(SIMULATED_DELAY)
  return getItem<NewsItem[]>(KEYS.NEWS) || []
}

export const getNewsById = async (id: string): Promise<NewsItem | undefined> => {
  const newsItems = await getNews()
  return newsItems.find(n => n.id === id)
}

export const getProjects = async (): Promise<Project[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && (isPublished != false) && (!defined(publishAt) || publishAt <= now())] 
      | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, _createdAt) desc){
        "id": id.current, title, date, projectCategory, publishAt, isPublished, sortOrder,
        excerpt,
        media[]{ 
          type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
          videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
        }
      }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => mapProjectRow(r))
  }
  return []
}

export const getProjectById = async (id: string): Promise<Project | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && id.current==$id][0]{ 
      "id": id.current, title, date, 
      excerpt, body, 
      media[]{ 
        type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
        videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
      },
      contentBlocks[]{ 
        ..., 
        imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2
      }
    }`
    const r = await sanity.fetch(q, { id })
    if (!r) return undefined
    return mapProjectRow(r)
  }
  return undefined
}
