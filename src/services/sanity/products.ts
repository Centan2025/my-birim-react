import groq from 'groq'
import type { Product, ProductMaterial, ProductMaterialsGroup, R2ImageMetadata, LocalizedString } from '../../types'
import { sanity, useSanity, mapImage, mapR2Metadata, mapImages, extractPalette, toFileUrl, mapMediaUrl, SanityProductMediaItem, SanityImageLike } from './client'
import { getItem } from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
const KEYS = { PRODUCTS: 'birim_products' }

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
    }
    materials?: {
        _key?: string
        name?: LocalizedString
        image?: SanityImageLike
    }[]
}

const getAssetKey = (img: SanityImageLike | { asset?: { _ref?: string; _id?: string } }): string | null => {
    if (!img) return null
    const assetObj = typeof img === 'object' && img !== null && 'asset' in img ? img.asset : img
    const asset = assetObj as { _ref?: string; _id?: string } | null
    if (!asset) return null
    return asset._id || asset._ref || null
}

const mapMaterialsFromSelections = (selections: SanityMaterialSelection[] | undefined): ProductMaterial[] => {
    if (!Array.isArray(selections)) return []
    const result: ProductMaterial[] = []
    const seenKeys = new Set<string>()

    for (const sel of selections || []) {
        const books = sel.group?.books || []
        const groupMaterialByKey = new Map<string, { name?: LocalizedString; image?: any }>()

        for (const book of books) {
            for (const item of book.items || []) {
                const key = getAssetKey(item.image)
                if (!key) continue
                if (!groupMaterialByKey.has(key)) {
                    groupMaterialByKey.set(key, { name: item.name, image: item.image })
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

const mapGroupedMaterials = (materialSelections: SanityMaterialSelection[]): ProductMaterialsGroup[] => {
    if (!Array.isArray(materialSelections)) return []

    return materialSelections.map(sel => {
        const groupTitle = (sel.group?.title ?? '') as LocalizedString
        const books = sel.group?.books || []
        const selectedKeys = new Set<string>()
        for (const m of sel.materials || []) {
            const key = getAssetKey(m.image)
            if (key) selectedKeys.add(key)
        }

        const mappedBooks = books.map(book => {
            const materials: ProductMaterial[] = []
            for (const item of book.items || []) {
                const key = getAssetKey(item.image)
                if (!key || !selectedKeys.has(key)) continue
                materials.push({ name: (item.name ?? '') as LocalizedString, image: mapImage(item.image) })
            }
            return { bookTitle: (book.title ?? '') as LocalizedString, materials }
        }).filter(b => b.materials.length > 0)

        const allMaterials = mappedBooks.flatMap(b => b.materials)
        if (allMaterials.length === 0) return null

        return { groupTitle, books: mappedBooks, materials: allMaterials }
    }).filter((g): g is ProductMaterialsGroup => Boolean(g))
}

const normalizeProduct = (p: Product): Product => ({
    ...p,
    dimensionImages: Array.isArray((p as any).dimensionImages)
        ? (p as any).dimensionImages.map((di: any) => typeof di === 'string' ? { image: di } : di)
        : [],
})

const mapAlternativeMedia = (row: {
    alternativeMedia?: SanityProductMediaItem[] | null
    alternativeImages?: SanityImageLike[]
}): {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string
    urlDesktop?: string
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
}[] => {
    const alt = Array.isArray(row?.alternativeMedia) ? row.alternativeMedia : []
    if (alt.length)
        return alt
            .map(m => {
                const rawType = m?.type
                if (rawType !== 'image' && rawType !== 'video' && rawType !== 'youtube') return null
                const type: 'image' | 'video' | 'youtube' = rawType
                const url = mapMediaUrl(m)
                const urlMobile = mapMediaUrl(m, true, false)
                const urlDesktop = mapMediaUrl(m, false, true)
                const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
                const result: {
                    type: 'image' | 'video' | 'youtube'; url: string; urlMobile?: string; urlDesktop?: string
                    crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']
                } = { type, url, ...metadata }
                if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
                if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
                return result
            })
            .filter((m): m is NonNullable<typeof m> => !!m && !!m.url)
    // fallback to legacy alternativeImages
    return mapImages(row?.alternativeImages).map((u: string) => ({ type: 'image' as const, url: u }))
}

const mapProductMedia = (row: {
    media?: SanityProductMediaItem[] | null | undefined
}): {
    type: 'image' | 'video' | 'youtube'; url: string; urlMobile?: string; urlDesktop?: string
    title?: LocalizedString; description?: LocalizedString; link?: string; linkText?: LocalizedString
    crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']
}[] => {
    const mediaArr: SanityProductMediaItem[] = Array.isArray(row?.media) ? row.media : []
    return mediaArr
        .map(m => {
            const rawType = m?.type
            if (rawType !== 'image' && rawType !== 'video' && rawType !== 'youtube') return null
            const type: 'image' | 'video' | 'youtube' = rawType
            const url = mapMediaUrl(m)
            const urlMobile = mapMediaUrl(m, true, false)
            const urlDesktop = mapMediaUrl(m, false, true)
            const metadata = m?.imageR2 ? mapR2Metadata(m.imageR2) : {}
            const title = m?.title
            const description = m?.description
            const link = m?.link
            const linkText = m?.linkText
            const result: {
                type: 'image' | 'video' | 'youtube'; url: string; urlMobile?: string; urlDesktop?: string
                title?: LocalizedString; description?: LocalizedString; link?: string; linkText?: LocalizedString
                crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']
            } = { type, url, title, description, link, linkText, ...metadata }
            if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
            if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
            return result
        })
        .filter((m): m is NonNullable<typeof m> => !!m && !!m.url)
}

const mapDimensionImages = (
    dimImgs: { imageR2?: { url?: string }; imageMobileR2?: { url?: string }; imageDesktopR2?: { url?: string }; title?: LocalizedString }[] | undefined
): { image: string; imageMobile?: string; imageDesktop?: string; title?: LocalizedString }[] => {
    if (!Array.isArray(dimImgs)) return []
    return dimImgs
        .map(di => {
            const image = mapImage(di?.imageR2)
            const imgMobile = di?.imageMobileR2?.url ? mapImage(di?.imageMobileR2) : undefined
            const imgDesktop = di?.imageDesktopR2?.url ? mapImage(di?.imageDesktopR2) : undefined
            const result: { image: string; imageMobile?: string; imageDesktop?: string; title?: LocalizedString } = { image, title: di?.title }
            if (imgMobile && imgMobile !== image) result.imageMobile = imgMobile
            if (imgDesktop && imgDesktop !== image) result.imageDesktop = imgDesktop
            return result
        })
        .filter(di => !!di.image)
}

const productQueryString = `
  "id": id.current, name, year, isPublished, description, 
  mainImage{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
  mainImageR2, mainImageMobileR2, mainImageDesktopR2, alternativeImages, 
  alternativeMedia[]{ type, url, imageR2, imageMobileR2, imageDesktopR2, videoFileR2, videoFileMobileR2, videoFileDesktopR2 },
  media[]{ type, url, imageR2, imageMobileR2, imageDesktopR2, title, description, link, linkText, videoFileR2, videoFileMobileR2, videoFileDesktopR2 },
  mediaSectionTitle, mediaSectionText, showMediaPanels, buyable, price, currency, sku, stockStatus,
  materialSelections[]{ group->{title,books[]{title,items[]{name,image{crop,hotspot,asset->{url,_ref,_id}}}}}, materials[]{name,image{crop,hotspot,asset->{url,_ref,_id}}} },
  dimensionImages[]{ imageR2, imageMobileR2, imageDesktopR2, title },
  exclusiveContent, designer->{ "designerId": id.current }, category->{ "categoryId": id.current }
`

export const getProducts = async (): Promise<Product[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "product" && (!defined(isPublished) || isPublished == true)] | order(year desc){ ${productQueryString} }`
        const rows = await sanity.fetch(query)
        return rows.map((r: any) => normalizeProduct({
            id: r.id, name: r.name, designerId: r.designer?.designerId || '', categoryId: r.category?.categoryId || '',
            year: r.year, isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
            description: r.description,
            mainImage: {
                url: mapImage(r.mainImageR2),
                palette: extractPalette(r.mainImageR2),
                ...mapR2Metadata(r.mainImageR2)
            },
            alternativeMedia: mapAlternativeMedia(r),
            media: mapProductMedia(r),
            showMediaPanels: Boolean(r?.showMediaPanels),
            dimensionImages: mapDimensionImages(r?.dimensionImages),
            buyable: Boolean(r.buyable), price: r.price, currency: r.currency, sku: r.sku, stockStatus: r.stockStatus,
            materials: mapMaterialsFromSelections(r.materialSelections),
            groupedMaterials: mapGroupedMaterials(r.materialSelections),
            mediaSectionTitle: r?.mediaSectionTitle, mediaSectionText: r?.mediaSectionText,
            exclusiveContent: {
                images: mapImages(r?.exclusiveContent?.images),
                drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({
                    name: d?.name,
                    url: d?.fileR2?.url || toFileUrl(d?.file?.asset),
                })),
                models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
                    name: m?.name,
                    url: m?.fileR2?.url || toFileUrl(m?.file?.asset),
                })),
            },
        }))
    }
    await delay(SIMULATED_DELAY)
    return (getItem<Product[]>(KEYS.PRODUCTS) || []).map(normalizeProduct)
}

export const getProductById = async (id: string): Promise<Product | undefined> => {
    const products = await getProducts()
    return products.find(p => p.id === id)
}

export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
    const products = await getProducts()
    return products.filter(p => p.categoryId === categoryId)
}

export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
    const products = await getProducts()
    return products.filter(p => p.designerId === designerId)
}
