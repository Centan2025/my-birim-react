import groq from 'groq'
import type {Product, ProductMaterial, ProductMaterialsGroup, LocalizedString} from '../../types'
import {
  sanity,
  useSanity,
  mapImage,
  rewriteR2Url,
  mapR2Metadata,
  mapImages,
  extractPalette,
  SanityImageLike,
} from './client'

import {getItem} from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
const KEYS = {PRODUCTS: 'birim_products'}

function getIsMirrored(obj: unknown): boolean | undefined {
  if (obj && typeof obj === 'object' && 'isMirrored' in obj) {
    const val = (obj as Record<string, unknown>)['isMirrored']
    return typeof val === 'boolean' ? val : undefined
  }
  return undefined
}

interface SanityMaterialSelection {
  group?: {
    title?: LocalizedString
    books?: {
      title?: LocalizedString
      items?: {
        _key?: string
        name?: LocalizedString
        image?: SanityImageLike
      }[]
    }[]
  }[]
  materials?: {
    _key?: string
    name?: LocalizedString
    image?: SanityImageLike
  }[]
}

const getAssetKey = (img: unknown): string | null => {
  if (!img) return null
  if (typeof img === 'string') return img
  const obj = img as Record<string, unknown>
  if (typeof obj['url'] === 'string' && obj['url']) return obj['url'] as string
  if (typeof obj['path'] === 'string' && obj['path']) return obj['path'] as string
  if (typeof obj['_key'] === 'string' && obj['_key']) return obj['_key'] as string
  const assetObj = (obj['asset'] as Record<string, unknown>) || obj
  const asset = assetObj as {_ref?: string; _id?: string; url?: string} | null
  if (!asset) return null
  return asset.url || asset._id || asset._ref || null
}

const cleanNameKey = (str: string): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/^[0-9]+/, '')
    .replace(/[^a-z0-9]/g, '')
}

const getMaterialKey = (item: Record<string, unknown>): string | null => {
  if (!item) return null
  const imgObj = item['imageR2'] || item['image']
  const assetKey = getAssetKey(imgObj)
  if (assetKey) return assetKey
  const nameObj = item['name'] as LocalizedString & {tr?: string; en?: string}
  const nameTr =
    nameObj?.tr || nameObj?.en || (typeof item['name'] === 'string' ? item['name'] : '')
  if (nameTr) return nameTr.trim().toLowerCase()
  if (typeof item['_key'] === 'string' && item['_key']) return item['_key'] as string
  return null
}

const mapMaterialsFromSelections = (
  selections: SanityMaterialSelection[] | undefined
): ProductMaterial[] => {
  if (!Array.isArray(selections)) return []
  const result: ProductMaterial[] = []
  const seenKeys = new Set<string>()

  for (const sel of selections || []) {
    const group = (sel as Record<string, unknown>)['group'] as Record<string, unknown>
    const books = (group?.['books'] as Record<string, unknown>[]) || []
    const groupMaterialByKey = new Map<string, Record<string, unknown>>()
    const groupMaterialByName = new Map<string, Record<string, unknown>>()

    for (const book of books) {
      const items = (book?.['items'] as Record<string, unknown>[]) || []
      for (const item of items) {
        const key = getMaterialKey(item)
        if (key && !groupMaterialByKey.has(key)) {
          groupMaterialByKey.set(key, item)
        }
        const nameObj = item['name'] as LocalizedString & {tr?: string; en?: string}
        const nameStr =
          nameObj?.tr || nameObj?.en || (typeof item['name'] === 'string' ? item['name'] : '')
        if (nameStr) {
          const lowerName = nameStr.trim().toLowerCase()
          const cleanKey = cleanNameKey(nameStr)
          if (!groupMaterialByName.has(lowerName)) groupMaterialByName.set(lowerName, item)
          if (cleanKey && !groupMaterialByName.has(cleanKey))
            groupMaterialByName.set(cleanKey, item)
        }
      }
    }

    for (const m of (sel['materials'] as Record<string, unknown>[]) || []) {
      const key = getMaterialKey(m)
      const nameObj = m['name'] as LocalizedString & {tr?: string; en?: string}
      const nameStr = nameObj?.tr || nameObj?.en || (typeof m['name'] === 'string' ? m['name'] : '')
      const lowerName = nameStr ? nameStr.trim().toLowerCase() : ''
      const cleanKey = cleanNameKey(nameStr)

      const master =
        (key ? groupMaterialByKey.get(key) : null) ||
        (lowerName ? groupMaterialByName.get(lowerName) : null) ||
        (cleanKey ? groupMaterialByName.get(cleanKey) : null) ||
        m

      const dedupKey = key || lowerName || cleanKey || String(m['_key'] || '')
      if (!dedupKey || seenKeys.has(dedupKey)) continue

      const imgObj = master['imageR2'] || master['image'] || m['imageR2'] || m['image'] || master
      const finalName = (master['name'] ?? m['name'] ?? '') as LocalizedString

      result.push({
        name: finalName,
        image: mapImage(imgObj as SanityImageLike),
      })
      seenKeys.add(dedupKey)
    }
  }
  return result
}

const mapGroupedMaterials = (
  materialSelections: SanityMaterialSelection[]
): ProductMaterialsGroup[] => {
  if (!Array.isArray(materialSelections)) return []

  return materialSelections
    .map(sel => {
      const group = (sel as Record<string, unknown>)['group'] as Record<string, unknown>
      const groupTitle = (group?.['title'] ?? '') as LocalizedString
      const books = (group?.['books'] as Record<string, unknown>[]) || []
      const selectedKeys = new Set<string>()
      const selectedMats = (sel['materials'] as Record<string, unknown>[]) || []
      for (const m of selectedMats) {
        const key = getMaterialKey(m)
        if (key) selectedKeys.add(key)
        const nameObj = m['name'] as LocalizedString & {tr?: string; en?: string}
        const nameStr =
          nameObj?.tr || nameObj?.en || (typeof m['name'] === 'string' ? m['name'] : '')
        if (nameStr) {
          selectedKeys.add(nameStr.trim().toLowerCase())
          const cleanKey = cleanNameKey(nameStr)
          if (cleanKey) selectedKeys.add(cleanKey)
        }
      }

      const groupMaterialByKey = new Map<string, Record<string, unknown>>()
      const groupMaterialByName = new Map<string, Record<string, unknown>>()

      for (const book of books) {
        const items = (book?.['items'] as Record<string, unknown>[]) || []
        for (const item of items) {
          const key = getMaterialKey(item)
          if (key && !groupMaterialByKey.has(key)) {
            groupMaterialByKey.set(key, item)
          }
          const nameObj = item['name'] as LocalizedString & {tr?: string; en?: string}
          const nameStr =
            nameObj?.tr || nameObj?.en || (typeof item['name'] === 'string' ? item['name'] : '')
          if (nameStr) {
            const lowerName = nameStr.trim().toLowerCase()
            const cleanKey = cleanNameKey(nameStr)
            if (!groupMaterialByName.has(lowerName)) groupMaterialByName.set(lowerName, item)
            if (cleanKey && !groupMaterialByName.has(cleanKey))
              groupMaterialByName.set(cleanKey, item)
          }
        }
      }

      let mappedBooks = books
        .map((book: Record<string, unknown>) => {
          const materials: ProductMaterial[] = []
          const items = (book?.['items'] as Record<string, unknown>[]) || []
          for (const item of items) {
            const key = getMaterialKey(item)
            const nameObj = item['name'] as LocalizedString & {tr?: string; en?: string}
            const nameStr =
              nameObj?.tr || nameObj?.en || (typeof item['name'] === 'string' ? item['name'] : '')
            const lowerName = nameStr ? nameStr.trim().toLowerCase() : ''
            const cleanKey = cleanNameKey(nameStr)

            const isSelected =
              selectedKeys.size === 0 ||
              (key && selectedKeys.has(key)) ||
              (lowerName && selectedKeys.has(lowerName)) ||
              (cleanKey && selectedKeys.has(cleanKey))

            if (!isSelected) continue

            const imgObj = item['imageR2'] || item['image'] || item
            materials.push({
              name: ((item['name'] as LocalizedString) ?? '') as LocalizedString,
              image: mapImage(imgObj as SanityImageLike),
            })
          }
          return {
            bookTitle: ((book['title'] as LocalizedString) ?? '') as LocalizedString,
            materials,
          }
        })
        .filter((b: Record<string, unknown>) => (b['materials'] as unknown[])?.length > 0)

      let allMaterials = mappedBooks.flatMap(
        (b: Record<string, unknown>) => b['materials'] as ProductMaterial[]
      )

      if (allMaterials.length === 0 && selectedMats.length > 0) {
        const directMats: ProductMaterial[] = selectedMats
          .map(m => {
            const key = getMaterialKey(m)
            const nameObj = m['name'] as LocalizedString & {tr?: string; en?: string}
            const nameStr =
              nameObj?.tr || nameObj?.en || (typeof m['name'] === 'string' ? m['name'] : '')
            const lowerName = nameStr ? nameStr.trim().toLowerCase() : ''
            const cleanKey = cleanNameKey(nameStr)

            const masterItem =
              (key ? groupMaterialByKey.get(key) : null) ||
              (lowerName ? groupMaterialByName.get(lowerName) : null) ||
              (cleanKey ? groupMaterialByName.get(cleanKey) : null) ||
              m

            const imgObj =
              masterItem['imageR2'] ||
              masterItem['image'] ||
              m['imageR2'] ||
              m['image'] ||
              masterItem
            const finalName = (masterItem['name'] ?? m['name'] ?? '') as LocalizedString

            return {
              name: finalName,
              image: mapImage(imgObj as SanityImageLike),
            }
          })
          .filter(m => Boolean(m.image || m.name))

        if (directMats.length > 0) {
          mappedBooks = [{bookTitle: groupTitle, materials: directMats}]
          allMaterials = directMats
        }
      }

      if (allMaterials.length === 0) return null

      return {groupTitle, books: mappedBooks, materials: allMaterials}
    })
    .filter((g): g is ProductMaterialsGroup => Boolean(g))
}

const extractMediaMetadata = (item: Record<string, unknown>): Record<string, unknown> => {
  const baseMeta = mapR2Metadata(item)
  const r2Meta = item?.['imageR2'] ? mapR2Metadata(item['imageR2'] as SanityImageLike) : {}
  const desktopMeta = item?.['imageDesktopR2']
    ? mapR2Metadata(item['imageDesktopR2'] as SanityImageLike)
    : {}
  const mobileMeta = item?.['imageMobileR2']
    ? mapR2Metadata(item['imageMobileR2'] as SanityImageLike)
    : {}

  const crop = r2Meta.crop || (item?.['imageR2'] ? undefined : baseMeta.crop)
  const cropDesktop = desktopMeta.crop || r2Meta.crop
  const cropMobile = mobileMeta.crop || baseMeta.cropMobile

  const result: Record<string, unknown> = {
    origWidth: desktopMeta.origWidth || r2Meta.origWidth || baseMeta.origWidth,
    origHeight: desktopMeta.origHeight || r2Meta.origHeight || baseMeta.origHeight,
    hotspot: desktopMeta.hotspot || r2Meta.hotspot || baseMeta.hotspot,
  }

  if (crop) result['crop'] = crop
  if (cropDesktop) result['cropDesktop'] = cropDesktop
  if (cropMobile) result['cropMobile'] = cropMobile

  if (mobileMeta.crop || baseMeta.cropMobile) {
    result['cropMobile'] = mobileMeta.crop || baseMeta.cropMobile
  }
  if (mobileMeta.hotspot || baseMeta.hotspotMobile) {
    result['hotspotMobile'] = mobileMeta.hotspot || baseMeta.hotspotMobile
  }
  if (mobileMeta.origWidth || baseMeta.origWidthMobile) {
    result['origWidthMobile'] = mobileMeta.origWidth || baseMeta.origWidthMobile
  }
  if (mobileMeta.origHeight || baseMeta.origHeightMobile) {
    result['origHeightMobile'] = mobileMeta.origHeight || baseMeta.origHeightMobile
  }

  return result
}

const mapProductMedia = (mediaArrRaw: unknown): unknown[] => {
  const mediaArr = Array.isArray(mediaArrRaw) ? mediaArrRaw : []
  return mediaArr
    .map((m: Record<string, unknown>) => {
      const type = (m?.['type'] as string) || 'image'
      let url = ''
      let urlMobile: string | undefined = undefined
      let urlDesktop: string | undefined = undefined

      if (type === 'image') {
        const desktopUrl =
          mapImage(m?.['imageR2'] as SanityImageLike) ||
          mapImage(m?.['image'] as SanityImageLike) ||
          rewriteR2Url(m?.['url'] as string)
        urlMobile = (m?.['imageMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['imageMobileR2'] as SanityImageLike)
          : (m?.['imageMobile'] as Record<string, string>)?.['url']
            ? mapImage(m?.['imageMobile'] as SanityImageLike)
            : undefined
        urlDesktop = (m?.['imageDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['imageDesktopR2'] as SanityImageLike)
          : undefined
        url = desktopUrl || urlMobile || urlDesktop || ''
      } else if (type === 'video') {
        url = mapImage(m?.['videoFileR2'] as SanityImageLike) || rewriteR2Url(m?.['url'] as string)
        urlMobile = (m?.['videoFileMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['videoFileMobileR2'] as SanityImageLike)
          : undefined
        urlDesktop = (m?.['videoFileDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['videoFileDesktopR2'] as SanityImageLike)
          : undefined
      } else {
        url = rewriteR2Url((m?.['url'] as string) || '')
      }

      const metadata = extractMediaMetadata(m)

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
      result['isCover'] = !!m['isCover']
      result['isMirrored'] = getIsMirrored(m['imageR2']) ?? getIsMirrored(m)
      result['isMirroredMobile'] = getIsMirrored(m['imageMobileR2'])
      result['isMirroredDesktop'] = getIsMirrored(m['imageDesktopR2'])
      return result
    })
    .filter((m: Record<string, unknown>) => !!m['url'])
}

const mapDimensionImages = (dimImgs: unknown[] | undefined): unknown[] => {
  if (!Array.isArray(dimImgs)) return []
  return dimImgs
    .map((di: unknown) => {
      const row = di as Record<string, unknown>
      const image =
        mapImage(row?.['imageR2'] as SanityImageLike) || rewriteR2Url(row?.['image'] as string)
      const imgMobile = (row?.['imageMobileR2'] as Record<string, string>)?.['url']
        ? mapImage(row?.['imageMobileR2'] as SanityImageLike)
        : undefined
      const imgDesktop = (row?.['imageDesktopR2'] as Record<string, string>)?.['url']
        ? mapImage(row?.['imageDesktopR2'] as SanityImageLike)
        : undefined
      const result: Record<string, unknown> = {image, title: row?.['title']}

      if (imgMobile && imgMobile !== image) result['imageMobile'] = imgMobile
      if (imgDesktop && imgDesktop !== image) result['imageDesktop'] = imgDesktop
      return result
    })
    .filter((di: Record<string, unknown>) => !!di['image'])
}

const mapProductRow = (r: Record<string, unknown>): Product => {
  const mediaArr = Array.isArray(r['media']) ? (r['media'] as Record<string, unknown>[]) : []
  const coverItem = mediaArr.find((m: Record<string, unknown>) => m['isCover']) || mediaArr[0]

  let mainImage: Record<string, unknown> = {url: ''}
  if (coverItem) {
    let url = ''
    let urlMobile: string | undefined = undefined
    let urlDesktop: string | undefined = undefined

    if (coverItem['type'] === 'image' || !coverItem['type']) {
      url =
        mapImage(coverItem['imageR2'] as SanityImageLike) ||
        mapImage(coverItem['image'] as SanityImageLike) ||
        rewriteR2Url(coverItem['url'] as string)
      urlMobile = (coverItem['imageMobileR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['imageMobileR2'] as SanityImageLike)
        : undefined
      urlDesktop = (coverItem['imageDesktopR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['imageDesktopR2'] as SanityImageLike)
        : undefined
    } else if (coverItem['type'] === 'video') {
      url =
        mapImage(coverItem['videoFileR2'] as SanityImageLike) ||
        rewriteR2Url(coverItem['url'] as string)
      urlMobile = (coverItem['videoFileMobileR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['videoFileMobileR2'] as SanityImageLike)
        : undefined
      urlDesktop = (coverItem['videoFileDesktopR2'] as Record<string, string>)?.['url']
        ? mapImage(coverItem['videoFileDesktopR2'] as SanityImageLike)
        : undefined
    } else if (coverItem['type'] === 'youtube') {
      url = (coverItem['url'] as string) || ''
    }

    const metadata = extractMediaMetadata(coverItem)
    mainImage = {
      url,
      palette: extractPalette(coverItem['imageR2']),
      isMirrored: getIsMirrored(coverItem['imageR2']) ?? getIsMirrored(coverItem),
      isMirroredMobile: getIsMirrored(coverItem['imageMobileR2']),
      isMirroredDesktop: getIsMirrored(coverItem['imageDesktopR2']),
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) mainImage['urlMobile'] = urlMobile
    if (urlDesktop && urlDesktop !== url) mainImage['urlDesktop'] = urlDesktop
  }

  return {
    id: r['id'] as string,
    name: r['name'] as LocalizedString,
    designerId:
      ((r['designers'] as Record<string, unknown>[])?.[0]?.['designerId'] as string) ||
      ((r['designer'] as Record<string, unknown>)?.['designerId'] as string) ||
      '',
    designerIds:
      (r['designers'] as Record<string, unknown>[])?.map(
        (d: Record<string, unknown>) => d['designerId'] as string
      ) ||
      ([(r['designer'] as Record<string, unknown>)?.['designerId'] as string].filter(
        Boolean
      ) as string[]),
    categoryId: ((r['category'] as Record<string, unknown>)?.['categoryId'] as string) || '',
    year: r['year'] as number,
    sortOrder: typeof r['sortOrder'] === 'number' ? r['sortOrder'] : undefined,
    isPublished: r['isPublished'] !== undefined ? Boolean(r['isPublished']) : true,
    description: r['description'] as LocalizedString,
    mainImage: mainImage as Product['mainImage'],
    media: mapProductMedia(r['media']),
    showMediaPanels: Boolean(r?.['showMediaPanels']),
    showHeroNavigation: Boolean(r?.['showHeroNavigation']),
    dimensionImages: mapDimensionImages(r?.['dimensionImages'] as unknown[]),
    buyable: Boolean(r['buyable']),
    price: r['price'] as number,
    currency: r['currency'] as string,
    sku: r['sku'] as string,
    stockStatus: r['stockStatus'] as string,
    showMaterials: r['showMaterials'] !== false,
    materials: mapMaterialsFromSelections(r['materialSelections'] as SanityMaterialSelection[]),
    groupedMaterials: mapGroupedMaterials(r['materialSelections'] as SanityMaterialSelection[]),
    mediaSectionTitle: r?.['mediaSectionTitle'] as LocalizedString,
    mediaSectionText: r?.['mediaSectionText'] as LocalizedString,
    exclusiveContent: {
      images: mapImages(
        (r?.['exclusiveContent'] as Record<string, unknown>)?.['images'] as SanityImageLike[]
      ),
      drawings: (
        ((r?.['exclusiveContent'] as Record<string, unknown>)?.['drawings'] as Record<
          string,
          unknown
        >[]) || []
      ).map((d: Record<string, unknown>) => ({
        name: d?.['name'] as LocalizedString,
        url: (d?.['fileR2'] as Record<string, string>)?.['url'] || '',
      })),
      models3d: (
        ((r?.['exclusiveContent'] as Record<string, unknown>)?.['models3d'] as Record<
          string,
          unknown
        >[]) || []
      ).map((m: Record<string, unknown>) => ({
        name: m?.['name'] as LocalizedString,
        url: (m?.['fileR2'] as Record<string, string>)?.['url'] || '',
      })),
    },
  } as Product
}

const productQueryString = `
  "id": id.current, name, year, sortOrder, isPublished, description, 
  media[]{ 
    type, url, image, imageMobile, imageR2, imageMobileR2, imageDesktopR2, cropMobile, hotspotMobile, title, description, link, linkText, 
    videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover, isMirrored 
  },
  mediaSectionTitle, mediaSectionText, showMediaPanels, showHeroNavigation, buyable, price, currency, sku, stockStatus, showMaterials,
  materialSelections[]{ "group": group->{title,books[]{title,items[]{name,imageR2,image}}}, materials[]{name,imageR2,image} },
  dimensionImages[]{ imageR2, imageMobileR2, imageDesktopR2, title },
  exclusiveContent, designer->{ "designerId": id.current }, designers[]->{ "designerId": id.current }, category->{ "categoryId": id.current }
`

export const getProducts = async (): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product"] | order(coalesce(sortOrder, 999999) asc, year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query)
    return (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return getItem<Product[]>(KEYS.PRODUCTS) || []
}

export const getProductById = async (id: string): Promise<Product | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && (_id == $id || _id == "drafts." + $id || id.current == $id)][0]{ ${productQueryString} }`
    const r = await sanity.fetch(query, {id})
    if (!r) return undefined
    return mapProductRow(r)
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).find(p => p.id === id)
}

export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && category->id.current == $categoryId && (!defined(isPublished) || isPublished == true)] | order(coalesce(sortOrder, 999999) asc, year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query, {categoryId})
    return (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.categoryId === categoryId)
}

export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && (designer->id.current == $designerId || $designerId in designers[]->id.current) && (!defined(isPublished) || isPublished == true)] | order(coalesce(sortOrder, 999999) asc, year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query, {designerId})
    return (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.designerId === designerId)
}
