import groq from 'groq'
import type {Category, Designer, LocalizedString} from '../../types'
import {sanity, useSanity, mapImage, mapR2Metadata, type SanityImageLike} from './client'
import {getItem} from './settings'
import {isBirimDesignStudio} from '../../utils/designerUtils'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
  CATEGORIES: 'birim_categories',
  DESIGNERS: 'birim_designers',
}
interface SanityCategoryRow {
  id: string
  name: LocalizedString
  subtitle: LocalizedString
  heroImage: SanityImageLike
  heroImageR2: SanityImageLike
  menuImage: SanityImageLike
  menuImageR2: SanityImageLike
}

interface SanityDesignerRow {
  id: string
  name: LocalizedString
  role: LocalizedString
  bio: LocalizedString
  image: SanityImageLike
  imageR2: SanityImageLike
  imageMobileR2: SanityImageLike
  imageDesktopR2: SanityImageLike
}

export const getCategories = async (): Promise<Category[]> => {
  if (useSanity && sanity) {
    try {
      const query = groq`*[_type == "category"] | order(orderRank asc) { 
        "id": id.current, 
        name, 
        subtitle, 
        heroImage, 
        heroImageR2,
        menuImage,
        menuImageR2
      }`
      const rows = await sanity.fetch(query)
      if (Array.isArray(rows)) {
        return rows.map((r: SanityCategoryRow) => ({
          id: r.id,
          name: r.name,
          subtitle: r.subtitle,
          heroImage: r.heroImageR2
            ? {url: mapImage(r.heroImageR2), ...mapR2Metadata(r.heroImageR2)}
            : r.heroImage
              ? {url: mapImage(r.heroImage), ...mapR2Metadata(r.heroImage)}
              : '',
          menuImage: r.menuImageR2
            ? {url: mapImage(r.menuImageR2), ...mapR2Metadata(r.menuImageR2)}
            : r.menuImage
              ? {url: mapImage(r.menuImage), ...mapR2Metadata(r.menuImage)}
              : '',
        }))
      }
    } catch (err) {
      console.warn('getCategories fetch failed, using local fallback:', err)
    }
  }
  await delay(SIMULATED_DELAY)
  return getItem<Category[]>(KEYS.CATEGORIES) || []
}

function formatDesigner(r: SanityDesignerRow): Designer {
  const imageFinal = mapImage(r.imageR2) || mapImage(r.image)
  const imageMobile = (r.imageMobileR2 as Record<string, unknown>)?.['url']
    ? mapImage(r.imageMobileR2)
    : undefined
  const imageDesktop = (r.imageDesktopR2 as Record<string, unknown>)?.['url']
    ? mapImage(r.imageDesktopR2)
    : undefined
  const metadata = r.imageR2 ? mapR2Metadata(r.imageR2) : r.image ? mapR2Metadata(r.image) : {}
  const mobMetadata = r.imageMobileR2 ? mapR2Metadata(r.imageMobileR2) : {}
  const deskMetadata = r.imageDesktopR2 ? mapR2Metadata(r.imageDesktopR2) : {}

  const isStudio = isBirimDesignStudio({id: r.id, name: r.name})
  const defaultStudioLogo = '/img/logo.png'
  // Stüdyo için firma logosu önceliklidir veya görsel yoksa varsayılan firma logosudur
  const finalUrl =
    isStudio && (!imageFinal || imageFinal.includes('logo'))
      ? defaultStudioLogo
      : imageFinal || (isStudio ? defaultStudioLogo : '')

  return {
    id: r.id,
    name: r.name,
    role: r.role || (isStudio ? {tr: 'Tasarım Stüdyosu', en: 'Design Studio'} : undefined),
    bio:
      r.bio ||
      (isStudio
        ? {
            tr: "Birim'in yenilikçi ve zamansız tasarım vizyonunu yansıtan iç tasarım stüdyosu.",
            en: "Birim's in-house design studio reflecting innovative and timeless design philosophy.",
          }
        : ''),
    isCompanyLogo: isStudio,
    image: {
      url: finalUrl,
      urlMobile: imageMobile && imageMobile !== finalUrl ? imageMobile : undefined,
      urlDesktop: imageDesktop && imageDesktop !== finalUrl ? imageDesktop : undefined,
      ...metadata,
      cropMobile: mobMetadata.crop || metadata.cropMobile || metadata.crop,
      hotspotMobile: mobMetadata.hotspot || metadata.hotspotMobile || metadata.hotspot,
      origWidthMobile: mobMetadata.origWidth || metadata.origWidthMobile || metadata.origWidth,
      origHeightMobile: mobMetadata.origHeight || metadata.origHeightMobile || metadata.origHeight,
      cropDesktop: deskMetadata.crop || metadata.cropDesktop || metadata.crop,
      hotspotDesktop: deskMetadata.hotspot || metadata.hotspotDesktop || metadata.hotspot,
      origWidthDesktop: deskMetadata.origWidth || metadata.origWidthDesktop || metadata.origWidth,
      origHeightDesktop:
        deskMetadata.origHeight || metadata.origHeightDesktop || metadata.origHeight,
    },
    imageMobile: imageMobile && imageMobile !== finalUrl ? imageMobile : undefined,
    imageDesktop: imageDesktop && imageDesktop !== finalUrl ? imageDesktop : undefined,
  }
}

export const getDesigners = async (): Promise<Designer[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer"] | order(orderRank asc){
          "id": id.current, 
          name, 
          role,
          bio, 
          image,
          imageR2,
          imageMobileR2,
          imageDesktopR2
        }`
    const rows = await sanity.fetch(query)
    return rows.map(formatDesigner)
  }
  await delay(SIMULATED_DELAY)
  return (getItem<Designer[]>(KEYS.DESIGNERS) || []).map(d => {
    if (isBirimDesignStudio(d)) {
      return {
        ...d,
        isCompanyLogo: true,
        role: d.role || {tr: 'Tasarım Stüdyosu', en: 'Design Studio'},
      }
    }
    return d
  })
}

export const getDesignerById = async (id: string): Promise<Designer | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer" && (_id == $id || _id == "drafts." + $id || id.current == $id)][0]{ 
      "id": id.current, name, role, bio, image, imageR2, imageMobileR2, imageDesktopR2
    }`
    const r = await sanity.fetch(query, {id})
    if (!r) return undefined
    return formatDesigner(r)
  }
  const designers = await getDesigners()
  return designers.find(d => d.id === id)
}

export const getDesignersByIds = async (ids: string[]): Promise<Designer[]> => {
  if (!ids || ids.length === 0) return []
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer" && id.current in $ids] | order(orderRank asc){
          "id": id.current, 
          name, 
          role, 
          bio, 
          image,
          imageR2,
          imageMobileR2,
          imageDesktopR2
        }`
    const rows = await sanity.fetch(query, {ids})
    return rows.map(formatDesigner)
  }
  const all = await getDesigners()
  return all.filter(d => ids.includes(d.id))
}
