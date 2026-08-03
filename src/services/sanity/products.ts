import groq from 'groq'
import type {Product, ProductMaterial, ProductMaterialsGroup, LocalizedString} from '../../types'
import {
  sanity,
  useSanity,
  mapImage,
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

const getAssetKey = (
  img: SanityImageLike | {asset?: {_ref?: string; _id?: string}}
): string | null => {
  if (!img) return null
  const assetObj = typeof img === 'object' && img !== null && 'asset' in img ? img.asset : img
  const asset = assetObj as {_ref?: string; _id?: string} | null
  if (!asset) return null
  return asset._id || asset._ref || null
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
    const groupMaterialByKey = new Map<string, {name?: LocalizedString; image?: unknown}>()

    for (const book of books) {
      const items = (book?.['items'] as Record<string, unknown>[]) || []
      for (const item of items) {
        const key = getAssetKey(item['image'] as SanityImageLike)
        if (!key) continue
        if (!groupMaterialByKey.has(key)) {
          groupMaterialByKey.set(key, {name: item['name'] as LocalizedString, image: item['image']})
        }
      }
    }

    for (const m of (sel['materials'] as Record<string, unknown>[]) || []) {
      const key = getAssetKey(m['image'] as SanityImageLike)
      if (!key || seenKeys.has(key)) continue
      const source = groupMaterialByKey.get(key) || m
      result.push({
        name: ((source['name'] as LocalizedString) ??
          (m['name'] as LocalizedString) ??
          '') as LocalizedString,
        image: mapImage(source['image'] as SanityImageLike),
      })
      seenKeys.add(key)
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
      for (const m of (sel['materials'] as Record<string, unknown>[]) || []) {
        const key = getAssetKey(m['image'] as SanityImageLike)
        if (key) selectedKeys.add(key)
      }

      const mappedBooks = books
        .map((book: Record<string, unknown>) => {
          const materials: ProductMaterial[] = []
          const items = (book?.['items'] as Record<string, unknown>[]) || []
          for (const item of items) {
            const key = getAssetKey(item['image'] as SanityImageLike)
            if (!key || !selectedKeys.has(key)) continue
            materials.push({
              name: ((item['name'] as LocalizedString) ?? '') as LocalizedString,
              image: mapImage(item['image'] as SanityImageLike),
            })
          }
          return {
            bookTitle: ((book['title'] as LocalizedString) ?? '') as LocalizedString,
            materials,
          }
        })
        .filter((b: Record<string, unknown>) => (b['materials'] as unknown[])?.length > 0)

      const allMaterials = mappedBooks.flatMap(
        (b: Record<string, unknown>) => b['materials'] as ProductMaterial[]
      )

      if (allMaterials.length === 0) return null

      return {groupTitle, books: mappedBooks, materials: allMaterials}
    })
    .filter((g): g is ProductMaterialsGroup => Boolean(g))
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
        url = mapImage(m?.['imageR2'] as SanityImageLike)
        urlMobile = (m?.['imageMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['imageMobileR2'] as SanityImageLike)
          : undefined
        urlDesktop = (m?.['imageDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['imageDesktopR2'] as SanityImageLike)
          : undefined
      } else if (type === 'video') {
        url = mapImage(m?.['videoFileR2'] as SanityImageLike)
        urlMobile = (m?.['videoFileMobileR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['videoFileMobileR2'] as SanityImageLike)
          : undefined
        urlDesktop = (m?.['videoFileDesktopR2'] as Record<string, string>)?.['url']
          ? mapImage(m?.['videoFileDesktopR2'] as SanityImageLike)
          : undefined
      } else {
        url = (m?.['url'] as string) || ''
      }

      const metadata = {
        ...mapR2Metadata(m),
        ...(m?.['imageR2'] ? mapR2Metadata(m['imageR2'] as SanityImageLike) : {}),
      }
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
      const image = mapImage(row?.['imageR2'] as SanityImageLike)
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

    const metadata = {
      ...mapR2Metadata(coverItem),
      ...(coverItem?.['imageR2'] ? mapR2Metadata(coverItem['imageR2']) : {}),
    }
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
  "id": id.current, name, year, isPublished, description, 
  media[]{ 
    type, url, imageR2, imageMobileR2, imageDesktopR2, title, description, link, linkText, 
    videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover, isMirrored 
  },
  mediaSectionTitle, mediaSectionText, showMediaPanels, showHeroNavigation, buyable, price, currency, sku, stockStatus,
  materialSelections[]{ "group": group->{title,books[]{title,items[]{name,imageR2}}}, materials[]{name,imageR2} },
  dimensionImages[]{ imageR2, imageMobileR2, imageDesktopR2, title },
  exclusiveContent, designer->{ "designerId": id.current }, designers[]->{ "designerId": id.current }, category->{ "categoryId": id.current }
`

export const getProducts = async (): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product"] | order(year desc){ ${productQueryString} }`
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
    const query = groq`*[_type == "product" && category->id.current == $categoryId && (!defined(isPublished) || isPublished == true)] | order(year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query, {categoryId})
    return (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.categoryId === categoryId)
}

export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && (designer->id.current == $designerId || $designerId in designers[]->id.current) && (!defined(isPublished) || isPublished == true)] | order(year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query, {designerId})
    return (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.designerId === designerId)
}
