import groq from 'groq'
import type { NewsItem, Project } from '../../types'
import { sanity, useSanity, mapImage, mapMediaUrl, rewriteR2Url, extractPalette, mapR2Metadata } from './client'
import { getItem } from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = { NEWS: 'birim_news' }

export const getNews = async (): Promise<NewsItem[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem" && (isPublished != false) && (!defined(publishAt) || publishAt <= now())] 
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, date, _createdAt) desc){
          "id": id.current, 
          title, date, publishAt, isPublished, sortOrder, content, 
          mainImage{..., asset->{url, _ref, _id}}, mainImageR2, mainImageMobileR2, mainImageDesktopR2,
          media[]{ type, url, caption, imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2 }
        }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => ({
      ...r,
      mainImage: (() => {
        const img = mapImage(r.mainImageR2) || mapImage(r.mainImage)
        const imgMobile = r.mainImageMobileR2?.url ? mapImage(r.mainImageMobileR2) : undefined
        const imgDesktop = r.mainImageDesktopR2?.url ? mapImage(r.mainImageDesktopR2) : undefined
        const metadata = r.mainImageR2 ? mapR2Metadata(r.mainImageR2) : {}
        return {
          url: img,
          urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
          urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
          ...metadata,
        }
      })(),
      media: (r.media || [])
        .map((m: any) => {
          const url = mapMediaUrl(m)
          const urlMobile = mapMediaUrl(m, true, false)
          const urlDesktop = mapMediaUrl(m, false, true)
          const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
          const result: any = { type: m.type, url, caption: m.caption, ...metadata }
          if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
          if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
          return result
        })
        .filter((m: any) => m.url),
    }))
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
        cover{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}},
        coverR2{..., metadata{palette{dominant{background,foreground}}}},
        coverMobileR2{..., metadata{palette{dominant{background,foreground}}}},
        coverDesktopR2{..., metadata{palette{dominant{background,foreground}}}},
        excerpt 
      }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => ({
      ...r,
      cover: (() => {
        const url = mapImage(r.coverR2) || mapImage(r.cover)
        const urlMobile = r.coverMobileR2?.url ? mapImage(r.coverMobileR2) : undefined
        const urlDesktop = r.coverDesktopR2?.url ? mapImage(r.coverDesktopR2) : undefined
        const metadata = r.coverR2 ? mapR2Metadata(r.coverR2) : {}
        return {
          url,
          urlMobile: urlMobile && urlMobile !== url ? urlMobile : undefined,
          urlDesktop: urlDesktop && urlDesktop !== url ? urlDesktop : undefined,
          palette: extractPalette(r.coverR2) || extractPalette(r.cover),
          ...metadata,
        }
      })(),
    }))
  }
  return []
}

export const getProjectById = async (id: string): Promise<Project | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && id.current==$id][0]{ 
      "id": id.current, title, date, 
      cover{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, coverR2,
      coverMobile{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, coverMobileR2,
      coverDesktop{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, coverDesktopR2,
      excerpt, body, 
      media[]{ type, url, caption, image{..., asset->{url, _ref, _id}}, imageR2, imageMobile{..., asset->{url, _ref, _id}}, imageMobileR2, imageDesktop{..., asset->{url, _ref, _id}}, imageDesktopR2, videoFile{..., asset->{url, _ref, _id}}, videoFileR2, videoFileMobileR2, videoFileDesktopR2 },
      contentBlocks[]{ ..., titleFont, imageR2, videoFileR2 }
    }`
    const r = await sanity.fetch(q, { id })
    if (!r) return undefined

    const media = (r.media || [])
      .map((m: any) => {
        const type = m?.type || 'image'
        const url = mapMediaUrl(m)
        const urlMobile = mapMediaUrl(m, true, false)
        const urlDesktop = mapMediaUrl(m, false, true)
        const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
        const result: any = { type, url, image: type === 'image' ? url : undefined, ...metadata }
        if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
        if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
        return result
      })
      .filter((m: any) => m.url)

    // Transform contentBlocks exactly like homepage
    const contentBlocks = r.contentBlocks
      ? r.contentBlocks.map((b: any) => {
        let url = b.url
        if (b.mediaType === 'image') {
          const imgUrl = b.imageR2?.url ? mapImage(b.imageR2) : undefined
          const imgMeta = b.imageR2 ? mapR2Metadata(b.imageR2) : {}
          if (imgUrl) return { ...b, image: imgUrl, url: undefined, crop: imgMeta.crop, hotspot: imgMeta.hotspot }
        }
        if (b.mediaType === 'video' && b.videoFileR2?.url) {
          url = rewriteR2Url(b.videoFileR2.url)
        }
        const crop = b.imageR2 ? mapR2Metadata(b.imageR2).crop : undefined
        const hotspot = b.imageR2 ? mapR2Metadata(b.imageR2).hotspot : undefined
        return { ...b, image: undefined, url, crop, hotspot }
      })
      : undefined

    return {
      id: r.id,
      title: r.title,
      date: r.date,
      excerpt: r.excerpt,
      body: r.body,
      media: media.length > 0 ? media : undefined,
      contentBlocks: contentBlocks && contentBlocks.length > 0 ? contentBlocks : undefined,
      cover: (() => {
        const url = mapImage(r.coverR2) || mapImage(r.cover)
        const urlMobile = r.coverMobileR2?.url
          ? mapImage(r.coverMobileR2)
          : r.coverMobile
            ? mapImage(r.coverMobile)
            : undefined
        const urlDesktop = r.coverDesktopR2?.url
          ? mapImage(r.coverDesktopR2)
          : r.coverDesktop
            ? mapImage(r.coverDesktop)
            : undefined
        const metadata = r.coverR2 ? mapR2Metadata(r.coverR2) : {}
        return {
          url,
          urlMobile: urlMobile && urlMobile !== url ? urlMobile : undefined,
          urlDesktop: urlDesktop && urlDesktop !== url ? urlDesktop : undefined,
          palette: extractPalette(r.coverR2) || extractPalette(r.cover),
          ...metadata,
        }
      })(),
    }
  }
  return undefined
}
