import groq from 'groq'
import type {
  Product,
  ProductMaterial,
  ProductMaterialsGroup,
  R2ImageMetadata,
  LocalizedString,
} from '../../types'
import {
  sanity,
  useSanity,
  mapImage,
  mapR2Metadata,
  mapImages,
  extractPalette,
  SanityProductMediaItem,
  SanityImageLike,
} from './client'
import {getItem} from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
const KEYS = {PRODUCTS: 'birim_products'}

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
    const group = (sel as any).group
    const books = group?.books || []
    const groupMaterialByKey = new Map<string, {name?: LocalizedString; image?: any}>()

    for (const book of books) {
      for (const item of book.items || []) {
        const key = getAssetKey(item.image)
        if (!key) continue
        if (!groupMaterialByKey.has(key)) {
          groupMaterialByKey.set(key, {name: item.name, image: item.image})
        }
      }
    }

    for (const m of sel.materials || []) {
      const key = getAssetKey(m.image)
      if (!key || seenKeys.has(key)) continue
      const source = groupMaterialByKey.get(key) || m
      result.push({
        name: (source.name ?? m.name ?? '') as LocalizedString,
        image: mapImage(source.image),
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
      const group = (sel as any).group
      const groupTitle = (group?.title ?? '') as LocalizedString
      const books = group?.books || []
      const selectedKeys = new Set<string>()
      for (const m of sel.materials || []) {
        const key = getAssetKey(m.image)
        if (key) selectedKeys.add(key)
      }

      const mappedBooks = books
        .map((book: any) => {
          const materials: ProductMaterial[] = []
          for (const item of book.items || []) {
            const key = getAssetKey(item.image)
            if (!key || !selectedKeys.has(key)) continue
            materials.push({
              name: (item.name ?? '') as LocalizedString,
              image: mapImage(item.image),
            })
          }
          return {bookTitle: (book.title ?? '') as LocalizedString, materials}
        })
        .filter((b: any) => b.materials.length > 0)

      const allMaterials = mappedBooks.flatMap((b: any) => b.materials)
      if (allMaterials.length === 0) return null

      return {groupTitle, books: mappedBooks, materials: allMaterials}
    })
    .filter((g): g is ProductMaterialsGroup => Boolean(g))
}

const mapProductMedia = (mediaArrRaw: any): any[] => {
  const mediaArr = Array.isArray(mediaArrRaw) ? mediaArrRaw : []
  return mediaArr
    .map(m => {
      const type = m?.type || 'image'
      let url = ''
      let urlMobile: string | undefined = undefined
      let urlDesktop: string | undefined = undefined

      if (type === 'image') {
        url = mapImage(m?.imageR2)
        urlMobile = m?.imageMobileR2?.url ? mapImage(m?.imageMobileR2) : undefined
        urlDesktop = m?.imageDesktopR2?.url ? mapImage(m?.imageDesktopR2) : undefined
      } else if (type === 'video') {
        url = mapImage(m?.videoFileR2)
        urlMobile = m?.videoFileMobileR2?.url ? mapImage(m?.videoFileMobileR2) : undefined
        urlDesktop = m?.videoFileDesktopR2?.url ? mapImage(m?.videoFileDesktopR2) : undefined
      } else {
        url = m?.url || ''
      }

      const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
      const result: any = {
        type,
        url,
        title: m?.title,
        description: m?.description,
        link: m?.link,
        linkText: m?.linkText,
        ...metadata
      }
      if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
      if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
      result.isCover = !!m.isCover
      return result
    })
    .filter(m => !!m.url)
}

const mapDimensionImages = (dimImgs: any[] | undefined): any[] => {
  if (!Array.isArray(dimImgs)) return []
  return dimImgs
    .map(di => {
      const image = mapImage(di?.imageR2)
      const imgMobile = di?.imageMobileR2?.url ? mapImage(di?.imageMobileR2) : undefined
      const imgDesktop = di?.imageDesktopR2?.url ? mapImage(di?.imageDesktopR2) : undefined
      const result: any = {image, title: di?.title}
      if (imgMobile && imgMobile !== image) result.imageMobile = imgMobile
      if (imgDesktop && imgDesktop !== image) result.imageDesktop = imgDesktop
      return result
    })
    .filter(di => !!di.image)
}

const mapProductRow = (r: any): Product => {
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
      palette: extractPalette(coverItem.imageR2),
      ...metadata,
    }
    if (urlMobile && urlMobile !== url) mainImage.urlMobile = urlMobile
    if (urlDesktop && urlDesktop !== url) mainImage.urlDesktop = urlDesktop
  }

  return {
    id: r.id,
    name: r.name,
    designerId: r.designer?.designerId || '',
    categoryId: r.category?.categoryId || '',
    year: r.year,
    isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
    description: r.description,
    mainImage,
    media: mapProductMedia(r.media),
    showMediaPanels: Boolean(r?.showMediaPanels),
    dimensionImages: mapDimensionImages(r?.dimensionImages),
    buyable: Boolean(r.buyable),
    price: r.price,
    currency: r.currency,
    sku: r.sku,
    stockStatus: r.stockStatus,
    materials: mapMaterialsFromSelections(r.materialSelections),
    groupedMaterials: mapGroupedMaterials(r.materialSelections),
    mediaSectionTitle: r?.mediaSectionTitle,
    mediaSectionText: r?.mediaSectionText,
    exclusiveContent: {
      images: mapImages(r?.exclusiveContent?.images),
      drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({
        name: d?.name,
        url: d?.fileR2?.url || '',
      })),
      models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
        name: m?.name,
        url: m?.fileR2?.url || '',
      })),
    },
  }
}

const productQueryString = `
  "id": id.current, name, year, isPublished, description, 
  media[]{ 
    type, url, imageR2, imageMobileR2, imageDesktopR2, title, description, link, linkText, 
    videoFileR2, videoFileMobileR2, videoFileDesktopR2, isCover 
  },
  mediaSectionTitle, mediaSectionText, showMediaPanels, buyable, price, currency, sku, stockStatus,
  materialSelections[]{ "group": group->{title,books[]{title,items[]{name,imageR2}}}, materials[]{name,imageR2} },
  dimensionImages[]{ imageR2, imageMobileR2, imageDesktopR2, title },
  exclusiveContent, designer->{ "designerId": id.current }, category->{ "categoryId": id.current }
`

export const getProducts = async (): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && (!defined(isPublished) || isPublished == true)] | order(year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query)
    return rows.map((r: any) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return getItem<Product[]>(KEYS.PRODUCTS) || []
}

export const getProductById = async (id: string): Promise<Product | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && id.current == $id && (!defined(isPublished) || isPublished == true)][0]{ ${productQueryString} }`
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
    return rows.map((r: any) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.categoryId === categoryId)
}

export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && designer->id.current == $designerId && (!defined(isPublished) || isPublished == true)] | order(year desc){ ${productQueryString} }`
    const rows = await sanity.fetch(query, {designerId})
    return rows.map((r: any) => mapProductRow(r))
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Product[]>(KEYS.PRODUCTS) || []).filter(p => p.designerId === designerId)
}
