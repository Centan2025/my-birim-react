import groq from 'groq'
import type { NewsItem, Project } from '../../types'
import { sanity, useSanity, mapImage, mapMediaUrl, rewriteR2Url, extractPalette, mapR2Metadata, R2_DOMAIN } from './client'
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
      cover{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
      coverR2, coverMobileR2, coverDesktopR2,
      excerpt, body, 
      media[]{ 
        ..., 
        image{..., asset->{url, _ref, _id}}, 
        videoFile{..., asset->{url, _ref, _id}} 
      },
      contentBlocks[]{ 
        ..., 
        image{..., asset->{url, _ref, _id}}, 
        videoFile{..., asset->{url, _ref, _id}}
      }
    }`
    const r = await sanity.fetch(q, { id })

    if (!r) return undefined

    const media = (r.media || [])
      .map((m: any) => {
        const type = m?.type || 'image'
        const url = mapMediaUrl(m)
        const urlMobile = mapMediaUrl(m, true, false)
        const urlDesktop = mapMediaUrl(m, false, true)
        const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : (m?.image ? mapR2Metadata(m.image) : {})
        const result: any = { type, url, image: type === 'image' ? url : undefined, ...metadata }
        if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
        if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
        return result
      })
      .filter((m: any) => m.url)

    // ... (rest of media mapping remains same)

    // Helper: Derinlemesine URL taraması (Recursive)
    const findDeepUrl = (obj: any, depth = 0): string | undefined => {
      if (!obj || depth > 3) return undefined
      if (typeof obj === 'string' && (obj.startsWith('http') || obj.startsWith('migration/'))) return obj
      if (obj.url && typeof obj.url === 'string') return obj.url
      if (obj.asset?.url) return obj.asset.url
      if (obj.r2Asset?.url) return obj.r2Asset.url
      if (obj.path && !obj.url && R2_DOMAIN) return `${R2_DOMAIN}/${obj.path.startsWith('/') ? obj.path.substring(1) : obj.path}`
      
      // Obje ise içindeki tüm alanları tara
      if (typeof obj === 'object') {
        for (const k in obj) {
          if (k === '_type') continue
          const res = findDeepUrl(obj[k], depth + 1)
          if (res) return res
        }
      }
      return undefined
    }

    // Transform contentBlocks exactly like homepage
    const contentBlocks = r.contentBlocks
      ? r.contentBlocks.map((b: any) => {
        let image = undefined
        let url = b.url

        // Find ANY valid image URL in the block object
        const discoveredImage = findDeepUrl(b)
        
        if (b.mediaType === 'image' || !b.mediaType) {
          image = mapImage(b.imageR2) || mapImage(b.image) || mapImage(b.imageDesktopR2) || mapImage(b.imageMobileR2) || discoveredImage
        } else if (b.mediaType === 'video') {
          url = rewriteR2Url(findDeepUrl(b.videoFileR2) || findDeepUrl(b.videoFile) || findDeepUrl(b.videoFileDesktopR2) || findDeepUrl(b.videoFileMobileR2) || discoveredImage || b.url)
        } else if (b.mediaType === 'youtube') {
          url = b.url
        }

        const meta = b.imageR2 ? mapR2Metadata(b.imageR2) : (b.image ? mapR2Metadata(b.image) : {})

        return {
          ...b,
          image: image || undefined,
          url: url || undefined,
          crop: meta.crop,
          hotspot: meta.hotspot,
          origWidth: meta.origWidth,
          origHeight: meta.origHeight,
        }
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
