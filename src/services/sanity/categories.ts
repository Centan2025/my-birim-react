import groq from 'groq'
import type { Category, Designer } from '../../types'
import { sanity, useSanity, mapImage, mapR2Metadata } from './client'
import { getItem } from './settings'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
  CATEGORIES: 'birim_categories',
  DESIGNERS: 'birim_designers',
}

export const getCategories = async (): Promise<Category[]> => {
  if (useSanity && sanity) {
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
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      subtitle: r.subtitle,
      heroImage: r.heroImageR2?.url ? { url: mapImage(r.heroImageR2), ...mapR2Metadata(r.heroImageR2) } : mapImage(r.heroImage),
      menuImage: r.menuImageR2?.url ? { url: mapImage(r.menuImageR2), ...mapR2Metadata(r.menuImageR2) } : mapImage(r.menuImage),
    }))
  }
  await delay(SIMULATED_DELAY)
  return getItem<Category[]>(KEYS.CATEGORIES) || []
}

export const getDesigners = async (): Promise<Designer[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer"] | order(orderRank asc){
          "id": id.current, 
          name, 
          bio, 
          image,
          imageR2,
          imageMobileR2,
          imageDesktopR2
        }`
    const rows = await sanity.fetch(query)
    return rows.map((r: any) => {
      const imageFinal = mapImage(r.imageR2) || mapImage(r.image)
      const imageMobile = r.imageMobileR2?.url ? mapImage(r.imageMobileR2) : undefined
      const imageDesktop = r.imageDesktopR2?.url ? mapImage(r.imageDesktopR2) : undefined
      const metadata = r.imageR2 ? mapR2Metadata(r.imageR2) : {}
      return {
        id: r.id,
        name: r.name,
        bio: r.bio,
        image: {
          url: imageFinal,
          urlMobile: imageMobile && imageMobile !== imageFinal ? imageMobile : undefined,
          urlDesktop: imageDesktop && imageDesktop !== imageFinal ? imageDesktop : undefined,
          ...metadata,
        },
        imageMobile: imageMobile && imageMobile !== imageFinal ? imageMobile : undefined,
        imageDesktop: imageDesktop && imageDesktop !== imageFinal ? imageDesktop : undefined,
      }
    })
  }
  await delay(SIMULATED_DELAY)
  return getItem<Designer[]>(KEYS.DESIGNERS) || []
}

export const getDesignerById = async (id: string): Promise<Designer | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer" && id.current == $id][0]{ 
      "id": id.current, name, bio, image, imageR2, imageMobileR2, imageDesktopR2
    }`
    const r = await sanity.fetch(query, { id })
    if (!r) return undefined
    const image = mapImage(r.imageR2) || mapImage(r.image) || ''
    const imageMobile = r.imageMobileR2?.url || undefined
    const imageDesktop = r.imageDesktopR2?.url || undefined
    const metadata = r.imageR2 ? mapR2Metadata(r.imageR2) : {}
    return {
      id: r.id,
      name: r.name,
      bio: r.bio,
      image: {
        url: image,
        urlMobile: imageMobile && imageMobile !== image ? imageMobile : undefined,
        urlDesktop: imageDesktop && imageDesktop !== image ? imageDesktop : undefined,
        ...metadata,
      },
      imageMobile: imageMobile && imageMobile !== image ? imageMobile : undefined,
      imageDesktop: imageDesktop && imageDesktop !== image ? imageDesktop : undefined,
    }
  }
  const designers = await getDesigners()
  return designers.find(d => d.id === id)
}
