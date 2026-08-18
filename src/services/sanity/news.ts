import groq from 'groq'
import type {NewsItem, Project, LocalizedString} from '../../types'
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

      if (type === 'image' || !type) {
        const imgSource = m['imageR2'] || m['image'] || m
        url = mapImage(imgSource as SanityImageLike)
        urlMobile =
          mapImage((m['imageMobileR2'] || m['imageMobile']) as SanityImageLike) || undefined
        urlDesktop =
          mapImage((m['imageDesktopR2'] || m['imageDesktop']) as SanityImageLike) || undefined
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

      const metadata = mapR2Metadata(m['imageR2'] || m['image'] || m)
      const mobMetadata = m['imageMobileR2'] ? mapR2Metadata(m['imageMobileR2']) : {}
      const deskMetadata = m['imageDesktopR2'] ? mapR2Metadata(m['imageDesktopR2']) : {}

      const result: Record<string, unknown> = {
        type,
        url,
        caption: m['caption'],
        ...metadata,
        cropMobile: mobMetadata.crop || metadata.cropMobile || metadata.crop,
        hotspotMobile: mobMetadata.hotspot || metadata.hotspotMobile || metadata.hotspot,
        origWidthMobile:
          mobMetadata.origWidth || metadata.origWidthMobile || metadata.origWidth,
        origHeightMobile:
          mobMetadata.origHeight || metadata.origHeightMobile || metadata.origHeight,
        cropDesktop: deskMetadata.crop || metadata.cropDesktop || metadata.crop,
        hotspotDesktop: deskMetadata.hotspot || metadata.hotspotDesktop || metadata.hotspot,
        origWidthDesktop:
          deskMetadata.origWidth || metadata.origWidthDesktop || metadata.origWidth,
        origHeightDesktop:
          deskMetadata.origHeight || metadata.origHeightDesktop || metadata.origHeight,
      }
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

    if (coverItem['type'] === 'image' || !coverItem['type']) {
      const imgSource = coverItem['imageR2'] || coverItem['image'] || coverItem
      url = mapImage(imgSource as SanityImageLike)
      urlMobile =
        mapImage((coverItem['imageMobileR2'] || coverItem['imageMobile']) as SanityImageLike) ||
        undefined
      urlDesktop =
        mapImage((coverItem['imageDesktopR2'] || coverItem['imageDesktop']) as SanityImageLike) ||
        undefined
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

    const metadata = mapR2Metadata(coverItem['imageR2'] || coverItem['image'] || coverItem)
    const mobMetadata = coverItem['imageMobileR2'] ? mapR2Metadata(coverItem['imageMobileR2']) : {}
    const deskMetadata = coverItem['imageDesktopR2'] ? mapR2Metadata(coverItem['imageDesktopR2']) : {}

    mainImage = {
      url,
      ...metadata,
      cropMobile: mobMetadata.crop || metadata.cropMobile || metadata.crop,
      hotspotMobile: mobMetadata.hotspot || metadata.hotspotMobile || metadata.hotspot,
      origWidthMobile:
        mobMetadata.origWidth || metadata.origWidthMobile || metadata.origWidth,
      origHeightMobile:
        mobMetadata.origHeight || metadata.origHeightMobile || metadata.origHeight,
      cropDesktop: deskMetadata.crop || metadata.cropDesktop || metadata.crop,
      hotspotDesktop: deskMetadata.hotspot || metadata.hotspotDesktop || metadata.hotspot,
      origWidthDesktop:
        deskMetadata.origWidth || metadata.origWidthDesktop || metadata.origWidth,
      origHeightDesktop:
        deskMetadata.origHeight || metadata.origHeightDesktop || metadata.origHeight,
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
    const imgSource = coverItem['imageR2'] || coverItem['image'] || coverItem
    const url = mapImage(imgSource as SanityImageLike)
    const urlMobile =
      mapImage((coverItem['imageMobileR2'] || coverItem['imageMobile']) as SanityImageLike) ||
      undefined
    const urlDesktop =
      mapImage((coverItem['imageDesktopR2'] || coverItem['imageDesktop']) as SanityImageLike) ||
      undefined
    const metadata = mapR2Metadata(coverItem)
    cover = {
      url,
      palette: extractPalette(imgSource),
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
                  const panelUrl =
                    mapImage(p as SanityImageLike) || mapImage(imgR2) || pUrl || imgR2Url
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
    : undefined

  let interactiveShowcaseMapped: Project['interactiveShowcase'] = undefined
  if (r?.['interactiveShowcase'] && Array.isArray(r['interactiveShowcase'])) {
    interactiveShowcaseMapped = (r['interactiveShowcase'] as Record<string, unknown>[]).map(
      item => {
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
              name: prod['name'] as LocalizedString,
              mainImage: resolvedUrl || undefined,
              price: typeof prod['price'] === 'number' ? prod['price'] : undefined,
              currency: typeof prod['currency'] === 'string' ? prod['currency'] : 'TRY',
              categoryName: prod['categoryName'] as LocalizedString,
              designerName: prod['designerName'] as string,
            }
          }

          return {
            x: typeof hs['x'] === 'number' ? hs['x'] : 50,
            y: typeof hs['y'] === 'number' ? hs['y'] : 50,
            label: hs['label'] as LocalizedString,
            product: mappedProd,
          }
        })

        return {
          title: item['title'] as LocalizedString,
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
          hotspotMobile: metaMobile.hotspot,
          origWidthMobile: metaMobile.origWidth,
          origHeightMobile: metaMobile.origHeight,
          hotspots,
        }
      }
    )
  }

  return {
    ...r,
    cover: cover as Project['cover'],
    media: mapMediaArray(r['media']),
    contentBlocks: contentBlocks as Project['contentBlocks'],
    interactiveShowcaseTitle: r['interactiveShowcaseTitle'] as Project['interactiveShowcaseTitle'],
    interactiveShowcase: interactiveShowcaseMapped,
  } as Project
}

export const getNews = async (): Promise<NewsItem[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem"] 
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, date, _createdAt) desc){
          "id": id.current, 
          title, date, publishAt, isPublished, sortOrder, content, category, readTime, featured, featuredBadgeTitle, pressKitUrl,
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
          title, date, publishAt, isPublished, sortOrder, content, category, readTime, featured, featuredBadgeTitle, pressKitUrl,
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
          type, url, caption, image, imageR2, imageMobileR2, imageDesktopR2, 
          videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover,
          crop, hotspot, cropDesktop, hotspotDesktop, cropMobile, hotspotMobile
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
        type, url, caption, image, imageR2, imageMobileR2, imageDesktopR2, 
        videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover,
        crop, hotspot, cropDesktop, hotspotDesktop, cropMobile, hotspotMobile
      },
      contentBlocks[]{ 
        ..., 
        titleFont, contentFont,
        image{ asset->{url} },
        imageR2, imageMobileR2, imageDesktopR2, 
        videoFileR2, videoFileMobileR2, videoFileDesktopR2,
        imagePanels[]{ ..., imageR2, image{ asset->{url} } }
      },
      interactiveShowcaseTitle,
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
    const r = await sanity.fetch(q, {id})
    if (!r) return undefined
    return mapProjectRow(r)
  }
  return undefined
}
