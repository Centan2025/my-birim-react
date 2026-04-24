import groq from 'groq'
import type {NewsItem, Project} from '../../types'
import {
  sanity,
  useSanity,
  mapImage,
  rewriteR2Url,
  extractPalette,
  mapR2Metadata,
  type SanityImageLike,
} from './client'
import {getItem} from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {NEWS: 'birim_news'}

const mapMediaArray = (mediaArrRaw: unknown): unknown[] => {
  const mediaArr = Array.isArray(mediaArrRaw) ? (mediaArrRaw as Record<string, unknown>[]) : []
  return mediaArr
    .map((m: Record<string, unknown>) => {
      const type = (m?.['type'] as string) || 'image'
      let url = ''
      let urlMobile: string | undefined = undefined
      let urlDesktop: string | undefined = undefined

      if (type === 'image') {
        url = mapImage(m['imageR2'] as SanityImageLike)
        urlMobile = (m['imageMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m['imageMobileR2'] as SanityImageLike)
          : undefined
        urlDesktop = (m['imageDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m['imageDesktopR2'] as SanityImageLike)
          : undefined
      } else if (type === 'video') {
        url = mapImage(m['videoFileR2'] as SanityImageLike)
        urlMobile = (m['videoFileMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m['videoFileMobileR2'] as SanityImageLike)
          : undefined
        urlDesktop = (m['videoFileDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m['videoFileDesktopR2'] as SanityImageLike)
          : undefined
      } else {
        url = (m['url'] as string) || ''
      }

      const metadata = m?.['imageR2'] ? mapR2Metadata(m['imageR2']) : {}
      const result: Record<string, unknown> = {type, url, caption: m['caption'], ...metadata}
      if (urlMobile && urlMobile !== url) result['urlMobile'] = urlMobile
      if (urlDesktop && urlDesktop !== url) result['urlDesktop'] = urlDesktop
      result['isCover'] = !!m['isCover']
      return result
    })
    .filter((m: Record<string, unknown>) => m['url'])
}

const mapNewsRow = (r: Record<string, unknown>): NewsItem => {
  const mediaArr = Array.isArray(r['media']) ? (r['media'] as Record<string, unknown>[]) : []
  const coverItem = mediaArr.find((m: Record<string, unknown>) => m['isCover']) || mediaArr[0]

  let mainImage: Record<string, unknown> = {url: ''}
  if (coverItem) {
    let url = ''
    let urlMobile: string | undefined = undefined
    let urlDesktop: string | undefined = undefined

    if (coverItem['type'] === 'image') {
      url = mapImage(coverItem['imageR2'] as SanityImageLike)
      urlMobile = (coverItem['imageMobileR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['imageMobileR2'] as SanityImageLike)
        : undefined
      urlDesktop = (coverItem['imageDesktopR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['imageDesktopR2'] as SanityImageLike)
        : undefined
    } else if (coverItem['type'] === 'video') {
      url = mapImage(coverItem['videoFileR2'] as SanityImageLike)
      urlMobile = (coverItem['videoFileMobileR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['videoFileMobileR2'] as SanityImageLike)
        : undefined
      urlDesktop = (coverItem['videoFileDesktopR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['videoFileDesktopR2'] as SanityImageLike)
        : undefined
    } else if (coverItem['type'] === 'youtube') {
      url = (coverItem['url'] as string) || ''
    }

    const metadata = coverItem['imageR2'] ? mapR2Metadata(coverItem['imageR2']) : {}
    mainImage = {
      url,
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) mainImage['urlMobile'] = urlMobile
    if (urlDesktop && urlDesktop !== url) mainImage['urlDesktop'] = urlDesktop
  }

  return {
    ...r,
    mainImage: mainImage as NewsItem['mainImage'],
    media: mapMediaArray(r['media']),
  } as NewsItem
}

const mapProjectRow = (r: Record<string, unknown>): Project => {
  const mediaArr = Array.isArray(r['media']) ? (r['media'] as Record<string, unknown>[]) : []
  const coverItem = mediaArr.find((m: Record<string, unknown>) => m['isCover']) || mediaArr[0]

  let cover: Record<string, unknown> = {url: ''}
  if (coverItem) {
    const url = mapImage(coverItem['imageR2'] as SanityImageLike)
    const urlMobile = (coverItem['imageMobileR2'] as Record<string, string>)?.['url']
      ? mapImage(coverItem['imageMobileR2'] as SanityImageLike)
      : undefined
    const urlDesktop = (coverItem['imageDesktopR2'] as Record<string, string>)?.['url']
      ? mapImage(coverItem['imageDesktopR2'] as SanityImageLike)
      : undefined
    const metadata = coverItem['imageR2'] ? mapR2Metadata(coverItem['imageR2']) : {}
    cover = {
      url,
      palette: extractPalette(coverItem['imageR2']),
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) cover['urlMobile'] = urlMobile
    if (urlDesktop && urlDesktop !== url) cover['urlDesktop'] = urlDesktop
  }

  // Transform contentBlocks - Ana sayfa (sanity/pages.ts) ile senkronize edildi
  const contentBlocks = r['contentBlocks']
    ? (r['contentBlocks'] as Record<string, unknown>[]).map((b: Record<string, unknown>) => {
        let image = undefined
        let imageMobile = undefined
        let imageDesktop = undefined
        let url = b['url'] as string | undefined
        let urlMobile = undefined
        let urlDesktop = undefined

        const mediaType = (b['mediaType'] as string) || 'image'
        const imageR2 = b['imageR2'] || b['image'] || b['cover']
        const imageMobileR2 = b['imageMobileR2'] || b['imageMobile']
        const imageDesktopR2 = b['imageDesktopR2'] || b['imageDesktop']

        // Try both 'position' and 'imagePosition' (Sanity schema may vary)
        const position = (b['imagePosition'] || b['position'] || 'left') as string

        if (mediaType === 'image') {
          // Use mapImage which is very flexible for any Sanity image object/string
          image = mapImage(imageR2 as SanityImageLike)
          imageMobile = mapImage(imageMobileR2 as SanityImageLike)
          imageDesktop = mapImage(imageDesktopR2 as SanityImageLike)
        } else if (mediaType === 'video') {
          const videoFileR2 = b['videoFileR2'] as Record<string, unknown> | undefined
          const videoFileMobileR2 = b['videoFileMobileR2'] as Record<string, unknown> | undefined
          const videoFileDesktopR2 = b['videoFileDesktopR2'] as Record<string, unknown> | undefined

          const vUrl = videoFileR2?.['url'] || b['url']
          url = vUrl ? rewriteR2Url(String(vUrl)) : undefined

          const vmUrl = videoFileMobileR2?.['url']
          urlMobile = vmUrl ? rewriteR2Url(String(vmUrl)) : undefined

          const vdUrl = videoFileDesktopR2?.['url']
          urlDesktop = vdUrl ? rewriteR2Url(String(vdUrl)) : undefined
        } else if (mediaType === 'youtube') {
          url = b['url'] as string | undefined
        } else if (mediaType === 'panels') {
          const imagePanels = b['imagePanels']
          if (Array.isArray(imagePanels)) {
            b['imagePanels'] = (imagePanels as Record<string, unknown>[])
              .map((p: Record<string, unknown>) => {
                const url = mapImage(p as SanityImageLike)
                if (!url) return null
                const mime = (p['mimeType'] as string) || ''
                const type =
                  mime.startsWith('video/') || url.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
                    ? 'video'
                    : 'image'
                return {url, type}
              })
              .filter(Boolean)
          }
        }

        const meta = imageR2 ? mapR2Metadata(imageR2) : {}
        const borderColor = (b['borderColor'] as Record<string, unknown>)?.['hex']

        // Final fallback: If image is empty but mobile/desktop has a value, use it as base
        if (!image) {
          image = imageMobile || imageDesktop
        }

        return {
          ...b,
          mediaType,
          position,
          image,
          imageMobile,
          imageDesktop,
          url,
          urlMobile,
          urlDesktop,
          imagePanels: b['imagePanels'],
          panelSize: b['panelSize'],
          crop: meta.crop,
          hotspot: meta.hotspot,
          origWidth: meta.origWidth,
          origHeight: meta.origHeight,
          borderColor,
        }
      })
    : undefined

  return {
    ...r,
    cover: cover as Project['cover'],
    media: mapMediaArray(r['media']),
    contentBlocks: contentBlocks as Project['contentBlocks'],
  } as Project
}

export const getNews = async (): Promise<NewsItem[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem"] 
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, date, _createdAt) desc){
          "id": id.current, 
          title, date, publishAt, isPublished, sortOrder, content, 
          media[]{ 
            type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
            videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
          }
        }`
    const rows = await sanity.fetch(q)
    return rows.map((r: Record<string, unknown>) => mapNewsRow(r))
  }
  await delay(SIMULATED_DELAY)
  return getItem<NewsItem[]>(KEYS.NEWS) || []
}

export const getNewsById = async (id: string): Promise<NewsItem | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem" && (_id == $id || _id == "drafts." + $id || id.current == $id)][0]{
          "id": id.current, 
          title, date, publishAt, isPublished, sortOrder, content, 
          media[]{ 
            type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
            videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
          }
    }`
    const r = await sanity.fetch(q, {id})
    if (!r) return undefined
    return mapNewsRow(r)
  }
  await delay(SIMULATED_DELAY)
  return (getItem<NewsItem[]>(KEYS.NEWS) || []).find(n => n.id === id)
}

export const getProjects = async (): Promise<Project[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project"] 
      | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, _createdAt) desc){
        "id": id.current, title, date, projectCategory, publishAt, isPublished, sortOrder,
        excerpt,
        media[]{ 
          type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
          videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
        }
      }`
    const rows = await sanity.fetch(q)
    return rows.map((r: Record<string, unknown>) => mapProjectRow(r))
  }
  return []
}

export const getProjectById = async (id: string): Promise<Project | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && (_id == $id || _id == "drafts." + $id || id.current == $id)][0]{ 
      "id": id.current, title, date, 
      excerpt, body, 
      media[]{ 
        type, url, caption, imageR2, imageMobileR2, imageDesktopR2, 
        videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
      },
      contentBlocks[]{ 
        ..., 
        titleFont, contentFont,
        image{ asset->{url} },
        imageR2, imageMobileR2, imageDesktopR2, 
        videoFileR2, videoFileMobileR2, videoFileDesktopR2,
        imagePanels[]{ ..., imageR2, image{ asset->{url} } }
      }
    }`
    const r = await sanity.fetch(q, {id})
    if (!r) return undefined
    return mapProjectRow(r)
  }
  return undefined
}
