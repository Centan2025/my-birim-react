import type {
  SiteSettings,
  Category,
  Designer,
  Product,
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  FooterContent,
  NewsItem,
  ProductMaterial,
  ProductMaterialsGroup,
  Project,
  LocalizedString,
  User,
  UserType,
  CookiesPolicy,
  PrivacyPolicy,
  TermsOfService,
  KvkkPolicy,
  SanityImagePalette,
} from '../types'
import {createClient} from '@sanity/client'
import groq from 'groq'
import imageUrlBuilder from '@sanity/image-url'
import bcrypt from 'bcryptjs'

const SIMULATED_DELAY = 200

// Local storage keys (fallback için)
const KEYS = {
  SITE_SETTINGS: 'birim_site_settings',
  CATEGORIES: 'birim_categories',
  DESIGNERS: 'birim_designers',
  PRODUCTS: 'birim_products',
  USERS: 'birim_users',
  HOME_PAGE: 'birim_home_page',
  ABOUT_PAGE: 'birim_about_page',
  CONTACT_PAGE: 'birim_contact_page',
  FOOTER: 'birim_footer',
  NEWS: 'birim_news',
  LANGUAGES: 'birim_languages',
}

// Empty fallback data (artık Sanity kullanıyoruz)
const initialData: Record<string, unknown> = {
  [KEYS.SITE_SETTINGS]: {},
  [KEYS.CATEGORIES]: [],
  [KEYS.DESIGNERS]: [],
  [KEYS.PRODUCTS]: [],
  [KEYS.USERS]: [],
  [KEYS.HOME_PAGE]: {},
  [KEYS.ABOUT_PAGE]: {},
  [KEYS.CONTACT_PAGE]: {},
  [KEYS.FOOTER]: {},
  [KEYS.NEWS]: [],
  [KEYS.LANGUAGES]: ['tr', 'en'],
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// Email'leri tekilleştirmek için normalize et (trim + lowercase)
const normalizeEmail = (value: string): string => (value || '').trim().toLowerCase()

// Sanity file asset tipi (URL üretmek için ihtiyaç duyulan minimum alanlar)
interface SanityFileAsset {
  url?: string
  _id?: string
  _ref?: string
}

// Build Sanity file CDN URL from asset {_id|_ref|url}
const toFileUrl = (asset: SanityFileAsset | null | undefined): string => {
  if (!asset) return ''
  if (asset.url) return asset.url
  const raw = String(asset._id || asset._ref || '')
  if (!raw) return ''
  // file-<assetId>-<ext>
  const cleaned = raw.replace(/^file-/, '')
  const [assetId, ext] = cleaned.split('-')
  if (!assetId) return ''
  const postfix = ext ? `.${ext}` : ''
  return `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}${postfix}`
}

// --- Sanity runtime setup (auto enable if env present) ---
// Prefer env vars; if missing, fall back to known defaults
const SANITY_PROJECT_ID = import.meta.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
const SANITY_DATASET = import.meta.env['VITE_SANITY_DATASET'] || 'production'
const SANITY_API_VERSION = import.meta.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
const useSanity = Boolean(SANITY_PROJECT_ID && SANITY_DATASET)

// Prod'da varsayılan davranış: local fallback kapalı.
// İstenirse açıkça VITE_ENABLE_LOCAL_FALLBACK=true ile etkinleştirilebilir.
const defaultEnableFallback = import.meta.env.PROD ? 'false' : 'true'
const ENABLE_LOCAL_FALLBACK =
  String(
    (import.meta as any).env?.VITE_ENABLE_LOCAL_FALLBACK ?? defaultEnableFallback
  ).toLowerCase() !== 'false'

const sanity = useSanity
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: true,
    })
  : null

// Mutations için authenticated client (token varsa)
const SANITY_TOKEN = import.meta.env['VITE_SANITY_TOKEN'] || ''
const sanityMutations =
  useSanity && SANITY_TOKEN
    ? createClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        useCdn: false,
        token: SANITY_TOKEN,
        // Browser token uyarısını kapat (token sadece mutations için kullanılıyor)
        ignoreBrowserTokenWarning: true,
      })
    : null

// Not: Sanity image builder kendi tiplerini kullanıyor; burada boundary olduğu için
// parametreyi geniş bırakıyoruz.
const urlFor = (source: unknown) =>
  useSanity && sanity ? imageUrlBuilder(sanity).image(source as any) : null

// Sanity image benzeri tip - string veya url alanı olan obje
type SanityImageLike = string | {url?: string} | null | undefined

const mapImage = (
  img: SanityImageLike | undefined,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  }
): string => {
  if (!img) return ''
  if (typeof img === 'string') return img

  const hasBuilderMeta =
    (img as any)?.crop || (img as any)?.hotspot || (img as any)?.asset?._ref || (img as any)?.asset?._id

  // Eğer crop/hotspot/asset bilgisi yoksa ve doğrudan url geldiyse orijinali kullan.
  if (img.url && !hasBuilderMeta) return img.url

  const b = urlFor && urlFor(img)
  if (!b) return img.url || ''

  try {
    const {width = 1600, quality = 85, format = 'webp'} = options || {}

    return b.width(width).quality(quality).format(format).auto('format').url() || img.url || ''
  } catch {
    return img.url || ''
  }
}

const mapImages = (imgs: SanityImageLike[] | undefined): string[] =>
  Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []

// Sanity palette metadata'yı güvenli şekilde çek
const extractPalette = (
  img: SanityImageLike | {asset?: {metadata?: {palette?: SanityImagePalette}}}
): SanityImagePalette | undefined => {
  if (typeof img === 'object' && img !== null && 'asset' in img) {
    return (img as {asset?: {metadata?: {palette?: SanityImagePalette}}}).asset?.metadata?.palette
  }
  return undefined
}

// Medya satırı için Sanity modeli (sadece ihtiyaç duyulan alanlar)
interface SanityProductMediaItem {
  type?: 'image' | 'video' | 'youtube' | string
  url?: string
  image?: SanityImageLike
  imageMobile?: SanityImageLike
  imageDesktop?: SanityImageLike
  title?: LocalizedString
  description?: LocalizedString
  link?: string
  linkText?: LocalizedString
  videoFile?: {asset?: SanityFileAsset}
  videoFileMobile?: {asset?: SanityFileAsset}
  videoFileDesktop?: {asset?: SanityFileAsset}
}

// Helper: Medya URL'ini map et (mobil/desktop desteği ile)
const mapMediaUrl = (m: SanityProductMediaItem, isMobile?: boolean, isDesktop?: boolean): string => {
  const type = m?.type
  let url = ''

  if (type === 'image') {
    // Art Direction: Önce mobil/desktop'a özel görseli kontrol et
    if (isMobile && m?.imageMobile) {
      url = mapImage(m.imageMobile)
    } else if (isDesktop && m?.imageDesktop) {
      url = mapImage(m.imageDesktop)
    } else if (m?.image) {
      url = mapImage(m.image)
    }
  } else if (type === 'video') {
    // Art Direction: Önce mobil/desktop'a özel videoyu kontrol et
    if (isMobile && m?.videoFileMobile?.asset) {
      if (m.videoFileMobile.asset.url) {
        url = m.videoFileMobile.asset.url
      } else if (m.videoFileMobile.asset._id) {
        const fileId = m.videoFileMobile.asset._id.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      } else if (m.videoFileMobile.asset._ref) {
        const fileId = m.videoFileMobile.asset._ref.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      }
    } else if (isDesktop && m?.videoFileDesktop?.asset) {
      if (m.videoFileDesktop.asset.url) {
        url = m.videoFileDesktop.asset.url
      } else if (m.videoFileDesktop.asset._id) {
        const fileId = m.videoFileDesktop.asset._id.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      } else if (m.videoFileDesktop.asset._ref) {
        const fileId = m.videoFileDesktop.asset._ref.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      }
    } else if (m?.videoFile?.asset?.url) {
      url = m.videoFile.asset.url
    } else if (m?.videoFile?.asset?._id) {
      const fileId = m.videoFile.asset._id.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    } else if (m?.videoFile?.asset?._ref) {
      const fileId = m.videoFile.asset._ref.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    }
  } else {
    url = m?.url || ''
  }

  return url
}

const mapProductMedia = (
  row: {media?: SanityProductMediaItem[] | null | undefined}
): {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
  title?: LocalizedString
  description?: LocalizedString
  link?: string
  linkText?: LocalizedString
}[] => {
  const mediaArr: SanityProductMediaItem[] = Array.isArray(row?.media) ? row.media : []
  const fromMedia = mediaArr
    .map(m => {
      const rawType = m?.type
      if (rawType !== 'image' && rawType !== 'video' && rawType !== 'youtube') {
        return null
      }
      const type: 'image' | 'video' | 'youtube' = rawType
      const url = mapMediaUrl(m) // Varsayılan URL
      const urlMobile = mapMediaUrl(m, true, false) // Mobil URL (varsa)
      const urlDesktop = mapMediaUrl(m, false, true) // Desktop URL (varsa)

      const title = m?.title
      const description = m?.description
      const link = m?.link
      const linkText = m?.linkText

      // Sadece urlMobile veya urlDesktop varsa ekle
      const result: {
        type: 'image' | 'video' | 'youtube'
        url: string
        urlMobile?: string
        urlDesktop?: string
        title?: LocalizedString
        description?: LocalizedString
        link?: string
        linkText?: LocalizedString
      } = {type, url, title, description, link, linkText}
      if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
      if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop

      return result
    })
    .filter((m): m is {
      type: 'image' | 'video' | 'youtube'
      url: string
      urlMobile?: string
      urlDesktop?: string
      title?: LocalizedString
      description?: LocalizedString
      link?: string
      linkText?: LocalizedString
    } => !!m && !!m.url)
  // Fallback kaldırıldı: Eğer hiç medya eklenmemişse boş array döndür
  return fromMedia
}

const mapAlternativeMedia = (
  row: {alternativeMedia?: SanityProductMediaItem[] | null; alternativeImages?: SanityImageLike[]}
): {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
}[] => {
  const alt = Array.isArray(row?.alternativeMedia) ? row.alternativeMedia : []
  if (alt.length)
    return alt
      .map(m => {
        const rawType = m?.type
        if (rawType !== 'image' && rawType !== 'video' && rawType !== 'youtube') {
          return null
        }
        const type: 'image' | 'video' | 'youtube' = rawType
        const url = mapMediaUrl(m) // Varsayılan URL
        const urlMobile = mapMediaUrl(m, true, false) // Mobil URL (varsa)
        const urlDesktop = mapMediaUrl(m, false, true) // Desktop URL (varsa)

        // Sadece urlMobile veya urlDesktop varsa ekle
        const result: {
          type: 'image' | 'video' | 'youtube'
          url: string
          urlMobile?: string
          urlDesktop?: string
        } = {type, url}
        if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
        if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop

        return result
      })
      .filter(
        (m): m is {
          type: 'image' | 'video' | 'youtube'
          url: string
          urlMobile?: string
          urlDesktop?: string
        } => !!m && !!m.url
      )
  // fallback to legacy alternativeImages
  return mapImages(row?.alternativeImages).map((u: string) => ({type: 'image', url: u}))
}

const mapDimensionImages = (
  dimImgs:
    | {
        image?: SanityImageLike
        imageMobile?: SanityImageLike
        imageDesktop?: SanityImageLike
        title?: LocalizedString
      }[]
    | undefined
): {image: string; imageMobile?: string; imageDesktop?: string; title?: LocalizedString}[] => {
  if (!Array.isArray(dimImgs)) return []
  return dimImgs
    .map(di => {
      const image = mapImage(di?.image)
      const imageMobile = di?.imageMobile ? mapImage(di.imageMobile) : undefined
      const imageDesktop = di?.imageDesktop ? mapImage(di.imageDesktop) : undefined

      const result: {
        image: string
        imageMobile?: string
        imageDesktop?: string
        title?: LocalizedString
      } = {
        image,
        title: di?.title,
      }
      if (imageMobile && imageMobile !== image) result.imageMobile = imageMobile
      if (imageDesktop && imageDesktop !== image) result.imageDesktop = imageDesktop

      return result
    })
    .filter(di => di.image) // sadece görseli olanları tut
}

// Sanity tarafındaki materialSelections yapısı (ihtiyaç duyulan alanlar)
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

// Ortak yardımcı: Bir Sanity image objesinden asset tabanlı stabil bir key üret
const getAssetKey = (img: SanityImageLike | {asset?: {_ref?: string; _id?: string}}): string | null => {
  if (!img) return null
  const assetObj = typeof img === 'object' && img !== null && 'asset' in img ? img.asset : img
  const asset = assetObj as {_ref?: string; _id?: string} | null
  const id = asset._id || asset._ref || asset.url
  return id || null
}

// Tüm materialSelections içinden, seçili malzemeleri toplayıp
// her zaman malzeme gruplarındaki (materialGroup.books.items) güncel crop/hotspot bilgisini kullan
const mapMaterialsFromSelections = (
  selections: SanityMaterialSelection[] | undefined
): ProductMaterial[] => {
  if (!Array.isArray(selections)) return []

  const result: ProductMaterial[] = []
  const seenKeys = new Set<string>()

  for (const sel of selections || []) {
    const books = sel.group?.books || []

    // Grup tarafındaki tüm malzemeleri asset key'e göre lookup tablosuna al
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

    // Bu selection için seçili malzemeleri dolaş
    for (const m of sel.materials || []) {
      const key = getAssetKey(m.image)
      if (!key || seenKeys.has(key)) continue

      const source = groupMaterialByKey.get(key) || m
      result.push({
        name: (source.name ?? m.name ?? '') as LocalizedString,
        // Her zaman mapImage ile URL üret; crop/hotspot bilgisi varsa burada devreye girer
        image: mapImage(source.image),
      })

      seenKeys.add(key)
    }
  }

  return result
}

const mapGroupedMaterials = (materialSelections: SanityMaterialSelection[]): ProductMaterialsGroup[] => {
  if (!Array.isArray(materialSelections)) return []

  return materialSelections
    .map(sel => {
      const groupTitle = (sel.group?.title ?? '') as LocalizedString
      const books = sel.group?.books || []

      // Seçili malzemelerin asset key set'i (product tarafındaki selections)
      const selectedKeys = new Set<string>()
      for (const m of sel.materials || []) {
        const key = getAssetKey(m.image)
        if (key) selectedKeys.add(key)
      }

      // Her kitap için, sadece seçili malzemeleri, malzeme grubundaki güncel crop/hotspot ile map et
      const mappedBooks = books
        .map(book => {
          const materials: ProductMaterial[] = []

          for (const item of (book.items || [])) {
            const key = getAssetKey(item.image)
            if (!key || !selectedKeys.has(key)) continue

            materials.push({
              name: (item.name ?? '') as LocalizedString,
              image: mapImage(item.image),
            })
          }

          return {
            bookTitle: (book.title ?? '') as LocalizedString,
            materials,
          }
        })
        .filter(b => b.materials.length > 0)

      // Bu grup için, tüm kitaplardaki malzemeleri birleştir (backward compatibility için)
      const allMaterials = mappedBooks.flatMap(b => b.materials)
      if (allMaterials.length === 0) return null

      return {
        groupTitle,
        books: mappedBooks,
        materials: allMaterials,
      }
    })
    .filter((g): g is ProductMaterialsGroup => Boolean(g))
}
// Ürünlerde ölçü alanını boşlayarak normalize et
const normalizeProduct = (p: Product): Product => ({
  ...p,
  // legacy cleanups
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dimensionImages: Array.isArray((p as any).dimensionImages)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (p as any).dimensionImages.map((di: any) =>
        typeof di === 'string'
          ? {image: di} // eski string array formatı için backward compatibility
          : di
      )
    : [],
})

let storage: Storage
const memoryStore: {[key: string]: string} = {}

// Storage erişimini güvenli hâle getir:
// - SSR'de `window` olmadığı için localStorage kullanma
// - Bazı tarayıcılarda "Access to storage is not allowed from this context" hatasını
//   tetikleyebileceği için erişimi try/catch içinde ve sadece browser context'inde dene.
try {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem('__storage_test__', 'test')
    window.localStorage.removeItem('__storage_test__')
    storage = window.localStorage
  } else {
    throw new Error('localStorage not available')
  }
} catch (e) {
  storage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => {
      memoryStore[key] = value
    },
    removeItem: (key: string) => {
      delete memoryStore[key]
    },
    clear: () => {
      for (const key in memoryStore) {
        if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
          delete memoryStore[key]
        }
      }
    },
    get length() {
      return Object.keys(memoryStore).length
    },
    key: (index: number) => Object.keys(memoryStore)[index] || null,
  }
}

const initializeData = () => {
  Object.entries(initialData).forEach(([key, data]) => {
    if (!storage.getItem(key)) {
      try {
        storage.setItem(key, JSON.stringify(data))
      } catch (e) {
        // Failed to initialize
      }
    }
  })
}

initializeData()

// Generic getter/setter
const getItem = <T>(key: string): T => {
  const data = storage.getItem(key)

  if (!data) {
    initializeData() // Re-initialize if a key is missing
    const reloadedData = storage.getItem(key)
    if (!reloadedData) {
      return initialData[key as keyof typeof initialData] as T
    }
    try {
      return JSON.parse(reloadedData)
    } catch (e) {
      return initialData[key as keyof typeof initialData] as T
    }
  }

  try {
    return JSON.parse(data)
  } catch (e) {
    storage.removeItem(key)
    initializeData()
    const reloadedData = storage.getItem(key)
    if (!reloadedData) {
      return initialData[key as keyof typeof initialData] as T
    }
    try {
      return JSON.parse(reloadedData)
    } catch (parseError) {
      return initialData[key as keyof typeof initialData] as T
    }
  }
}

const setItem = <T>(key: string, data: T): void => {
  try {
    storage.setItem(key, JSON.stringify(data))
  } catch (e) {
    alert("Warning: Could not save changes. Your browser's storage might be full or disabled.")
  }
}

// Translations
export const getTranslations = async (): Promise<Record<string, Record<string, string>>> => {
  if (useSanity && sanity) {
    try {
      // Sadece published dokümanları çek (draft'ları hariç tut)
      // CDN cache'i bypass etmek için ayrı bir client kullan (useCdn: false)
      // En güncel olanı önce getir, aynı dilde birden fazla kayıt varsa en güncel olan kazansın
      const q = groq`*[_type == "uiTranslations" && !(_id in path("drafts.**"))] | order(_updatedAt desc){ language, strings }`
      // Çeviriler için CDN cache'i bypass et (anlık güncellemeler için)
      const noCacheClient = createClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        useCdn: false,
      })
      const results = await noCacheClient.fetch(q)
      const translationsMap: Record<string, Record<string, string>> = {}
      interface TranslationItem {
        language?: string
        strings?: Record<string, string>
      }
      if (Array.isArray(results)) {
        results.forEach((item: TranslationItem) => {
          if (item.language && item.strings) {
            const normalized: Record<string, string> = {...item.strings}
            // Şema alanı 'models_3d' ise, frontend anahtarı '3d_models' bekliyor -> eşle
            if (normalized['models_3d'] && !normalized['3d_models']) {
              normalized['3d_models'] = normalized['models_3d']
            }
            // Aynı dil daha önce eklenmişse atla (ilk gelen en günceldir)
            if (!translationsMap[item.language]) {
              translationsMap[item.language] = normalized
            }
          }
        })
      }
      return translationsMap
    } catch (error) {
      // Failed to fetch translations
      return {}
    }
  }
  return {}
}

// Languages
export const getLanguages = async (): Promise<string[]> => {
  if (useSanity && sanity) {
    try {
      const langs = await sanity.fetch(groq`*[_type=="siteSettings"][0].languages`)
      const base = ['tr', 'en']
      if (Array.isArray(langs)) {
        // Support both legacy [string] and new [{code, visible}]
        interface LanguageItem {
          code: string
          visible: boolean
        }
        const normalized: LanguageItem[] = langs
          .map((l: string | {code?: string; visible?: boolean}): LanguageItem | null => {
            if (typeof l === 'string') return {code: l, visible: true}
            const code = String(l?.code || '').toLowerCase()
            if (!code) return null
            const visible = l?.visible !== false
            return {code, visible}
          })
          .filter((l): l is LanguageItem => l !== null)
        const visibleCodes = normalized.filter((l) => l.visible).map((l) => l.code)
        const merged = [...base, ...visibleCodes]
        return Array.from(new Set(merged))
      }
      // if not array, fall back to base
      return base
    } catch (e) {
      // Failed to fetch languages
    }
  }
  await delay(SIMULATED_DELAY)
  const fromLocal = getItem<string[]>(KEYS.LANGUAGES)
  const base = ['tr', 'en']
  const merged = Array.isArray(fromLocal) && fromLocal.length > 0 ? [...base, ...fromLocal] : base
  return Array.from(new Set(merged))
}
export const updateLanguages = async (languages: string[]): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.LANGUAGES, languages)
}

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings> => {
  if (useSanity && sanity) {
    try {
      const q = groq`*[_type == "siteSettings" && !(_id in path("drafts.**"))] 
        | order(_updatedAt desc)[0]{
          ...,
          logo
        }`
      // Site ayarları için CDN önbelleğini atla - değişiklikler hemen yansısın
      const s = await sanity.withConfig({useCdn: false}).fetch(q)
      // Backward compatible defaults
      return {
        logoUrl: s?.logo ? mapImage(s.logo) : s?.logoUrl || '',
        topBannerText: s?.topBannerText || '',
        showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
        showRelatedProducts: s?.showRelatedProducts !== false,
        showCartButton: Boolean(s?.showCartButton ?? true),
        imageBorderStyle:
          s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square'
            ? s.imageBorderStyle
            : 'square',
        isLanguageSwitcherVisible: s?.isLanguageSwitcherVisible !== false,
        languages: Array.isArray(s?.languages) ? s.languages : undefined,
        maintenanceMode: Boolean(s?.maintenanceMode ?? false),
        mobileHeaderAnimation: s?.mobileHeaderAnimation === 'overlay' ? 'overlay' : 'default',
      }
    } catch (e) {
      // Ağ / DNS hatası vb. durumlarda Sanity yerine local fallback kullan
      // (örn. net::ERR_NAME_NOT_RESOLVED) – uygulama boş kalmasın.
      // Prod'da da tamamen patlatmak yerine local veriye düşmek daha iyi.
    }
  }
  await delay(SIMULATED_DELAY)
  const s = getItem<SiteSettings>(KEYS.SITE_SETTINGS)
  // Ensure all fields are present with defaults
  return {
    logoUrl: s?.logoUrl || '',
    topBannerText: s?.topBannerText || '',
    showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
    showRelatedProducts: s?.showRelatedProducts !== false,
    showCartButton: Boolean(s?.showCartButton ?? true),
    imageBorderStyle:
      s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square'
        ? s.imageBorderStyle
        : 'square',
    maintenanceMode: Boolean(s?.maintenanceMode ?? false),
    mobileHeaderAnimation: s?.mobileHeaderAnimation === 'overlay' ? 'overlay' : 'default',
  }
}
export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.SITE_SETTINGS, settings)
}

// Categories
export const getCategories = async (): Promise<Category[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "category"] | order(orderRank asc) { "id": id.current, name, subtitle, heroImage, menuImage }`
    const rows = await sanity.fetch(query)
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      subtitle: r.subtitle,
      heroImage: mapImage(r.heroImage),
      menuImage: mapImage(r.menuImage),
    }))
  }
  await delay(SIMULATED_DELAY)
  return getItem<Category[]>(KEYS.CATEGORIES)
}
export const addCategory = async (category: Category): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const categories = await getCategories()
  if (categories.some(c => c.id === category.id)) {
    throw new Error('Category ID already exists')
  }
  setItem(KEYS.CATEGORIES, [...categories, category])
}
export const updateCategory = async (category: Category): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const categories = await getCategories()
  const updatedCategories = categories.map(c => (c.id === category.id ? category : c))
  setItem(KEYS.CATEGORIES, updatedCategories)
}
export const deleteCategory = async (id: string): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const categories = await getCategories()
  setItem(
    KEYS.CATEGORIES,
    categories.filter(c => c.id !== id)
  )
}

// Designers
export const getDesigners = async (): Promise<Designer[]> => {
  if (useSanity && sanity) {
    // Sıralama: önce orderRank (Sanity Studio'daki drag‑drop sırası)
    const query = groq`*[_type == "designer"] | order(orderRank asc){
          "id": id.current, 
          name, 
          bio, 
          image, 
          imageMobile, 
          imageDesktop 
        }`
    const rows = await sanity.fetch(query)
    return rows.map((r: any) => {
      const image = mapImage(r.image)
      const imageMobile = r.imageMobile ? mapImage(r.imageMobile) : undefined
      const imageDesktop = r.imageDesktop ? mapImage(r.imageDesktop) : undefined
      return {
        id: r.id,
        name: r.name,
        bio: r.bio,
        image,
        imageMobile: imageMobile && imageMobile !== image ? imageMobile : undefined,
        imageDesktop: imageDesktop && imageDesktop !== image ? imageDesktop : undefined,
      }
    })
  }
  await delay(SIMULATED_DELAY)
  return getItem<Designer[]>(KEYS.DESIGNERS)
}
export const getDesignerById = async (id: string): Promise<Designer | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "designer" && id.current == $id][0]{ "id": id.current, name, bio, image, imageMobile, imageDesktop }`
    const r = await sanity.fetch(query, {id})
    if (!r) return undefined
    const image = mapImage(r.image)
    const imageMobile = r.imageMobile ? mapImage(r.imageMobile) : undefined
    const imageDesktop = r.imageDesktop ? mapImage(r.imageDesktop) : undefined
    return {
      id: r.id,
      name: r.name,
      bio: r.bio,
      image,
      imageMobile: imageMobile && imageMobile !== image ? imageMobile : undefined,
      imageDesktop: imageDesktop && imageDesktop !== image ? imageDesktop : undefined,
    }
  }
  const designers = await getDesigners()
  return designers.find(d => d.id === id)
}
export const addDesigner = async (designer: Designer): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const designers = await getDesigners()
  if (designers.some(d => d.id === designer.id)) {
    throw new Error('Designer ID already exists')
  }
  setItem(KEYS.DESIGNERS, [...designers, designer])
}
export const updateDesigner = async (designer: Designer): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const designers = await getDesigners()
  const updatedDesigners = designers.map(d => (d.id === designer.id ? designer : d))
  setItem(KEYS.DESIGNERS, updatedDesigners)
}
export const deleteDesigner = async (id: string): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const designers = await getDesigners()
  setItem(
    KEYS.DESIGNERS,
    designers.filter(d => d.id !== id)
  )
}

// Products
export const getProducts = async (): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && (!defined(isPublished) || isPublished == true)] | order(year desc){
          "id": id.current,
          name,
          year,
          isPublished,
          description,
          mainImage{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageMobile{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageDesktop{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          alternativeImages,
          alternativeMedia[]{ type, url, image, imageMobile, imageDesktop, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          media[]{ type, url, image, imageMobile, imageDesktop, title, description, link, linkText, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          mediaSectionText,
          showMediaPanels,
          buyable,
          price,
          currency,
          sku,
          stockStatus,
          materialSelections[]{
            group->{
              title,
              books[]{
                title,
                items[]{
                  name,
                  image{
                    crop,
                    hotspot,
                    asset->{url, _ref, _id}
                  }
                }
              }
            },
            materials[]{
              name,
              image{
                crop,
                hotspot,
                asset->{url, _ref, _id}
              }
            }
          },
          dimensionImages[]{ image, imageMobile, imageDesktop, title },
          exclusiveContent,
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
    const rows = await sanity.fetch(query)
    return rows.map((r: any) =>
      normalizeProduct({
        id: r.id,
        name: r.name,
        designerId: r.designer?.designerId || '',
        categoryId: r.category?.categoryId || '',
        year: r.year,
        isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
        description: r.description,
        mainImage: (() => {
          const img = mapImage(r.mainImage)
          const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
          const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
          const palette = extractPalette(r.mainImage)
          // Art Direction için object döndür
          return {
            url: img,
            urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
            urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
            palette,
          }
        })(),
        alternativeImages: mapImages(r.alternativeImages),
        alternativeMedia: mapAlternativeMedia(r),
        media: mapProductMedia(r),
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
            url: toFileUrl(d?.file?.asset),
          })),
          models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
            name: m?.name,
            url: toFileUrl(m?.file?.asset),
          })),
        },
      })
    )
  }
  await delay(SIMULATED_DELAY)
  return getItem<Product[]>(KEYS.PRODUCTS).map(normalizeProduct)
}
export const getProductById = async (id: string): Promise<Product | undefined> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && id.current == $id][0]{
          "id": id.current,
          name,
          year,
          isPublished,
          description,
          mainImage{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageMobile{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageDesktop{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          alternativeImages,
          alternativeMedia[]{ type, url, image, imageMobile, imageDesktop, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          media[]{ type, url, image, imageMobile, imageDesktop, title, description, link, linkText, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          mediaSectionText,
          showMediaPanels,
          buyable,
          price,
          currency,
          sku,
          stockStatus,
          materialSelections[]{
            group->{
              title,
              books[]{
                title,
                items[]{
                  name,
                  image{
                    crop,
                    hotspot,
                    asset->{url, _ref, _id}
                  }
                }
              }
            },
            materials[]{
              name,
              image{
                crop,
                hotspot,
                asset->{url, _ref, _id}
              }
            }
          },
          dimensionImages[]{ image, imageMobile, imageDesktop, title },
          exclusiveContent,
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
    const r = await sanity.fetch(query, {id})
    if (!r) return undefined
    return normalizeProduct({
      id: r.id,
      name: r.name,
      designerId: r.designer?.designerId || '',
      categoryId: r.category?.categoryId || '',
      year: r.year,
      isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
      description: r.description,
      mainImage: (() => {
        const img = mapImage(r.mainImage)
        const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
        const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
        const palette = extractPalette(r.mainImage)
        // Art Direction için object döndür
        return {
          url: img,
          urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
          urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
          palette,
        }
      })(),
      alternativeImages: mapImages(r.alternativeImages),
      alternativeMedia: mapAlternativeMedia(r),
      media: mapProductMedia(r),
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
          url: toFileUrl(d?.file?.asset),
        })),
        models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
          name: m?.name,
          url: toFileUrl(m?.file?.asset),
        })),
      },
    })
  }
  const products = await getProducts()
  return products.find(p => p.id === id)
}
export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && references(*[_type == "category" && id.current == $categoryId]._id) && (!defined(isPublished) || isPublished == true)]{
          "id": id.current,
          name,
          year,
          isPublished,
          description,
          mainImage{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageMobile{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageDesktop{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          alternativeImages,
          alternativeMedia[]{ type, url, image, imageMobile, imageDesktop, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          media[]{ type, url, image, imageMobile, imageDesktop, title, description, link, linkText, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          mediaSectionText,
          showMediaPanels,
          buyable,
          price,
          currency,
          materialSelections[]{ materials },
          dimensionImages[]{ image, imageMobile, imageDesktop, title },
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
    const rows = await sanity.fetch(query, {categoryId})
    return rows.map((r: any) =>
      normalizeProduct({
        id: r.id,
        name: r.name,
        designerId: r.designer?.designerId || '',
        categoryId: r.category?.categoryId || '',
        year: r.year,
        isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
        description: r.description,
        mainImage: (() => {
          const img = mapImage(r.mainImage)
          const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
          const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
          const palette = extractPalette(r.mainImage)
          // Art Direction için object döndür
          return {
            url: img,
            urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
            urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
            palette,
          }
        })(),
        alternativeImages: mapImages(r.alternativeImages),
        alternativeMedia: mapAlternativeMedia(r),
        media: mapProductMedia(r),
        showMediaPanels: Boolean(r?.showMediaPanels),
        dimensionImages: mapDimensionImages(r?.dimensionImages),
        buyable: Boolean(r.buyable),
        price: r.price,
        currency: r.currency,
        materials: mapMaterialsFromSelections(r.materialSelections),
        mediaSectionTitle: r?.mediaSectionTitle,
        mediaSectionText: r?.mediaSectionText,
        exclusiveContent: {
          images: mapImages(r?.exclusiveContent?.images),
          drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({
            name: d?.name,
            url: toFileUrl(d?.file?.asset),
          })),
          models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
            name: m?.name,
            url: toFileUrl(m?.file?.asset),
          })),
        },
      })
    )
  }
  const products = await getProducts()
  return products.filter(p => p.categoryId === categoryId)
}
export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
  if (useSanity && sanity) {
    const query = groq`*[_type == "product" && references(*[_type == "designer" && id.current == $designerId]._id) && (!defined(isPublished) || isPublished == true)]{
          "id": id.current,
          name,
          year,
          isPublished,
          description,
          mainImage{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageMobile{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          mainImageDesktop{
            ...,
            asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
          },
          alternativeImages,
          alternativeMedia[]{ type, url, image, imageMobile, imageDesktop, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          media[]{ type, url, image, imageMobile, imageDesktop, title, description, link, linkText, videoFile{asset->{url, _ref, _id}}, videoFileMobile{asset->{url, _ref, _id}}, videoFileDesktop{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          mediaSectionText,
          showMediaPanels,
          buyable,
          price,
          currency,
          materialSelections[]{ materials },
          dimensionImages[]{ image, imageMobile, imageDesktop, title },
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
    const rows = await sanity.fetch(query, {designerId})
    return rows.map((r: any) =>
      normalizeProduct({
        id: r.id,
        name: r.name,
        designerId: r.designer?.designerId || '',
        categoryId: r.category?.categoryId || '',
        year: r.year,
        isPublished: r.isPublished !== undefined ? Boolean(r.isPublished) : true,
        description: r.description,
        mainImage: (() => {
          const img = mapImage(r.mainImage)
          const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
          const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
          const palette = extractPalette(r.mainImage)
          // Art Direction için object döndür
          return {
            url: img,
            urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
            urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
            palette,
          }
        })(),
        alternativeImages: mapImages(r.alternativeImages),
        alternativeMedia: mapAlternativeMedia(r),
        media: mapProductMedia(r),
        showMediaPanels: Boolean(r?.showMediaPanels),
        dimensionImages: mapDimensionImages(r?.dimensionImages),
        buyable: Boolean(r.buyable),
        price: r.price,
        currency: r.currency,
        materials: mapMaterialsFromSelections(r.materialSelections),
        mediaSectionTitle: r?.mediaSectionTitle,
        mediaSectionText: r?.mediaSectionText,
        exclusiveContent: {
          images: mapImages(r?.exclusiveContent?.images),
          drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({
            name: d?.name,
            url: toFileUrl(d?.file?.asset),
          })),
          models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({
            name: m?.name,
            url: toFileUrl(m?.file?.asset),
          })),
        },
      })
    )
  }
  const products = await getProducts()
  return products.filter(p => p.designerId === designerId)
}
export const addProduct = async (product: Product): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const products = await getProducts()
  if (products.some(p => p.id === product.id)) {
    throw new Error('Product ID already exists')
  }
  setItem(KEYS.PRODUCTS, [...products, product])
}
export const updateProduct = async (product: Product): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const products = await getProducts()
  const updatedProducts = products.map(p => (p.id === product.id ? product : p))
  setItem(KEYS.PRODUCTS, updatedProducts)
}
export const deleteProduct = async (id: string): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const products = await getProducts()
  setItem(
    KEYS.PRODUCTS,
    products.filter(p => p.id !== id)
  )
}

// Page Content
export const getAboutPageContent = async (): Promise<AboutPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "aboutPage"][0]{
            ...,
            heroImage{
              ...,
              asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}
            }
        }`
    const data = await sanity.fetch(q)
    if (data) {
      // Normalize images
      if (data.heroImage) {
        data.heroImage = {
          url: mapImage(data.heroImage),
          palette: extractPalette(data.heroImage),
        }
      }
      // Ensure values is always an array
      if (!Array.isArray(data.values)) {
        data.values = []
      }
      return data
    }
  }
  await delay(SIMULATED_DELAY)
  const data = getItem<AboutPageContent>(KEYS.ABOUT_PAGE)
  // Ensure values is always an array
  if (data && !Array.isArray(data.values)) {
    data.values = []
  }
  // Return data or fallback to default from initialData
  if (data) {
    return data
  }
  // If no data exists, return default from initialData
  const defaultData = initialData[KEYS.ABOUT_PAGE] as AboutPageContent
  return defaultData || ({} as AboutPageContent)
}
export const updateAboutPageContent = async (content: AboutPageContent): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.ABOUT_PAGE, content)
}

export const getContactPageContent = async (): Promise<ContactPageContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "contactPage"][0]{
            ...,
            locations[]{
                ...,
                media[]{
                    type,
                    url,
                    image,
                    videoFile{
                        asset->{url, _ref, _id}
                    }
                }
            }
        }`
    const data = await sanity.fetch(q)
    if (data?.locations) {
      data.locations = data.locations.map((loc: any) => {
        if (loc.media && Array.isArray(loc.media)) {
          const processedMedia = loc.media
            .map((mediaItem: any) => {
              let mediaUrl = mediaItem.url
              if (mediaItem.type === 'image' && mediaItem.image) {
                mediaUrl = mapImage(mediaItem.image)
              } else if (mediaItem.type === 'video' && mediaItem.videoFile?.asset?.url) {
                mediaUrl = mediaItem.videoFile.asset.url
              } else if (mediaItem.type === 'video' && mediaItem.videoFile?.asset?._id) {
                const fileId = mediaItem.videoFile.asset._id.replace('file-', '')
                mediaUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
              } else if (mediaItem.type === 'video' && mediaItem.videoFile?.asset?._ref) {
                const fileId = mediaItem.videoFile.asset._ref.replace('file-', '')
                mediaUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
              }
              return {...mediaItem, url: mediaUrl}
            })
            .filter((m: any) => m.url) // URL'si olmayan medyaları filtrele
          return {...loc, media: processedMedia}
        }
        return loc
      })
    }
    return data
  }
  await delay(SIMULATED_DELAY)
  return getItem<ContactPageContent>(KEYS.CONTACT_PAGE)
}
export const updateContactPageContent = async (content: ContactPageContent): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.CONTACT_PAGE, content)
}

export const getHomePageContent = async (): Promise<HomePageContent> => {
  if (useSanity && sanity) {
    try {
      const q = groq`*[_type == "homePage"][0]{
            ...,
            heroAutoPlay,
            heroMedia[]{
                ...,
                image{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} },
                imageMobile{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} },
                imageDesktop{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} },
                videoFile{
                    asset->{url, _ref, _id}
                },
                videoFileMobile{
                    asset->{url, _ref, _id}
                },
                videoFileDesktop{
                    asset->{url, _ref, _id}
                }
            },
            contentBlocks[]{
                ...,
                titleFont,
                image,
                videoFile{
                    asset->{url, _ref, _id}
                }
            },
            inspirationSection{
                ...,
                backgroundImage{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} },
                backgroundImageMobile{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} },
                backgroundImageDesktop{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}} }
            }
        }`
      const data = await sanity.fetch(q)
      if (data?.heroMedia) {
        data.heroMedia = data.heroMedia.map((m: any) => {
          const url = mapMediaUrl(m)
          const urlMobile = mapMediaUrl(m, true, false)
          const urlDesktop = mapMediaUrl(m, false, true)
          const palette = extractPalette(m.image)

          const result: any = {...m, url}
          if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
          if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop
          if (palette) result.palette = palette

          return result
        })
      }
      if (data?.contentBlocks) {
        data.contentBlocks = data.contentBlocks.map((b: any) => {
          let url = b.url
          if (b.mediaType === 'image' && b.image) {
            return {...b, image: mapImage(b.image), url: undefined}
          } else if (b.mediaType === 'video' && b.videoFile?.asset?.url) {
            url = b.videoFile.asset.url
          } else if (b.mediaType === 'video' && b.videoFile?.asset?._id) {
            const fileId = b.videoFile.asset._id.replace('file-', '')
            url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
          } else if (b.mediaType === 'video' && b.videoFile?.asset?._ref) {
            const fileId = b.videoFile.asset._ref.replace('file-', '')
            url = `https://cdn.sanity.io.files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
          }
          return {...b, image: undefined, url}
        })
      }
      if (data?.inspirationSection) {
        const bgImg = mapImage(data.inspirationSection.backgroundImage)
        const bgImgMobile = data.inspirationSection.backgroundImageMobile
          ? mapImage(data.inspirationSection.backgroundImageMobile)
          : undefined
        const bgImgDesktop = data.inspirationSection.backgroundImageDesktop
          ? mapImage(data.inspirationSection.backgroundImageDesktop)
          : undefined
        const palette = extractPalette(data.inspirationSection.backgroundImage)
        data.inspirationSection.backgroundImage = {
          url: bgImg,
          urlMobile: bgImgMobile && bgImgMobile !== bgImg ? bgImgMobile : undefined,
          urlDesktop: bgImgDesktop && bgImgDesktop !== bgImg ? bgImgDesktop : undefined,
          palette,
        }
      }
      // Ensure featuredProductIds is always an array
      if (!Array.isArray(data?.featuredProductIds)) {
        data.featuredProductIds = []
      }
      return data
    } catch (e) {
      // Sanity veya ağ hatası durumunda (ör. net::ERR_NAME_NOT_RESOLVED)
      // local fallback verilerine düş.
    }
  }
  await delay(SIMULATED_DELAY)
  const data = getItem<HomePageContent>(KEYS.HOME_PAGE)
  // Ensure featuredProductIds is always an array
  if (data && !Array.isArray(data.featuredProductIds)) {
    data.featuredProductIds = []
  }
  return data
}
export const updateHomePageContent = async (content: HomePageContent): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.HOME_PAGE, content)
}

// Footer Content
export const getFooterContent = async (): Promise<FooterContent> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "footer"][0]{
            ...,
            partners[]{
                ...,
                logo
            },
            legalLinks[]
        }`
    const data = await sanity.fetch(q)
    if (data?.partners) {
      data.partners = data.partners.map((p: any) => ({
        ...p,
        logo: mapImage(p.logo),
      }))
    }
    // Ensure legalLinks is always an array
    if (!Array.isArray(data?.legalLinks)) {
      data.legalLinks = []
    }
    return data
  }
  await delay(SIMULATED_DELAY)
  const data = getItem<FooterContent>(KEYS.FOOTER)
  // Ensure legalLinks is always an array
  if (data && !Array.isArray(data.legalLinks)) {
    data.legalLinks = []
  }
  return data
}
export const updateFooterContent = async (content: FooterContent): Promise<void> => {
  await delay(SIMULATED_DELAY)
  setItem(KEYS.FOOTER, content)
}

// Cookies Policy
export const getCookiesPolicy = async (): Promise<CookiesPolicy | null> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "cookiesPolicy"][0]{ title, content, updatedAt }`
    const data = await sanity.fetch(q)
    return data || null
  }
  await delay(SIMULATED_DELAY)
  return null
}

// Privacy Policy
export const getPrivacyPolicy = async (): Promise<PrivacyPolicy | null> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "privacyPolicy"][0]{ title, content, updatedAt }`
    const data = await sanity.fetch(q)
    return data || null
  }
  await delay(SIMULATED_DELAY)
  return null
}

// Terms of Service
export const getTermsOfService = async (): Promise<TermsOfService | null> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "termsOfService"][0]{ title, content, updatedAt }`
    const data = await sanity.fetch(q)
    return data || null
  }
  await delay(SIMULATED_DELAY)
  return null
}

// KVKK Policy
export const getKvkkPolicy = async (): Promise<KvkkPolicy | null> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "kvkkPolicy"][0]{ title, content, updatedAt }`
    const data = await sanity.fetch(q)
    return data || null
  }
  await delay(SIMULATED_DELAY)
  return null
}
// News
export const getNews = async (): Promise<NewsItem[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem" && (isPublished != false) && (!defined(publishAt) || publishAt <= now())] 
        | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, date, _createdAt) desc){
          "id": id.current, 
          title, 
          date, 
          publishAt,
          isPublished,
          sortOrder,
          content, 
          mainImage,
          mainImageMobile,
          mainImageDesktop, 
          media[]{
            type,
            url,
            caption,
            image,
            imageMobile,
            imageDesktop,
            videoFile{asset->{url, _ref, _id}},
            videoFileMobile{asset->{url, _ref, _id}},
            videoFileDesktop{asset->{url, _ref, _id}}
          }
        }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      publishAt: r.publishAt,
      isPublished: r.isPublished,
      sortOrder: r.sortOrder,
      content: r.content,
      mainImage: (() => {
        const img = mapImage(r.mainImage)
        const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
        const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
        // Art Direction için object döndür
        return {
          url: img,
          urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
          urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
        }
      })(),
      media: (r.media || [])
        .map((m: any) => {
          const url = mapMediaUrl(m)
          const urlMobile = mapMediaUrl(m, true, false)
          const urlDesktop = mapMediaUrl(m, false, true)

          const result: any = {type: m.type, url, caption: m.caption}
          if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
          if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop

          return result
        })
        .filter((m: any) => m.url),
    }))
  }
  await delay(SIMULATED_DELAY)
  return getItem<NewsItem[]>(KEYS.NEWS)
}
export const getNewsById = async (id: string): Promise<NewsItem | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type == "newsItem" && id.current == $id][0]{ 
          "id": id.current, 
          title, 
          date, 
          content, 
          mainImage,
          mainImageMobile,
          mainImageDesktop, 
          media[]{
            type,
            url,
            caption,
            image,
            imageMobile,
            imageDesktop,
            videoFile{asset->{url, _ref, _id}},
            videoFileMobile{asset->{url, _ref, _id}},
            videoFileDesktop{asset->{url, _ref, _id}}
          }
        }`
    const r = await sanity.fetch(q, {id})
    if (!r) return undefined
    return {
      id: r.id,
      title: r.title,
      date: r.date,
      content: r.content,
      mainImage: (() => {
        const img = mapImage(r.mainImage)
        const imgMobile = r.mainImageMobile ? mapImage(r.mainImageMobile) : undefined
        const imgDesktop = r.mainImageDesktop ? mapImage(r.mainImageDesktop) : undefined
        // Art Direction için object döndür
        return {
          url: img,
          urlMobile: imgMobile && imgMobile !== img ? imgMobile : undefined,
          urlDesktop: imgDesktop && imgDesktop !== img ? imgDesktop : undefined,
        }
      })(),
      media: (r.media || [])
        .map((m: any) => {
          const url = mapMediaUrl(m)
          const urlMobile = mapMediaUrl(m, true, false)
          const urlDesktop = mapMediaUrl(m, false, true)

          const result: any = {type: m.type, url, caption: m.caption}
          if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
          if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop

          return result
        })
        .filter((m: any) => m.url),
    }
  }
  const newsItems = await getNews()
  return newsItems.find(n => n.id === id)
}
export const addNews = async (newsItem: NewsItem): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const news = await getNews()
  if (news.some(n => n.id === newsItem.id)) {
    throw new Error('News ID already exists')
  }
  setItem(KEYS.NEWS, [...news, newsItem])
}
export const updateNews = async (newsItem: NewsItem): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const news = await getNews()
  const updatedNews = news.map(n => (n.id === newsItem.id ? newsItem : n))
  setItem(KEYS.NEWS, updatedNews)
}
export const deleteNews = async (id: string): Promise<void> => {
  await delay(SIMULATED_DELAY)
  const news = await getNews()
  setItem(
    KEYS.NEWS,
    news.filter(n => n.id !== id)
  )
}

// Projects
export const getProjects = async (): Promise<Project[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && (isPublished != false) && (!defined(publishAt) || publishAt <= now())] 
      | order(coalesce(sortOrder, 999999) asc, coalesce(publishAt, _createdAt) desc){
        "id": id.current, 
        title, 
        date, 
        publishAt,
        isPublished,
        sortOrder,
        cover{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
        coverMobile{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
        coverDesktop{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
        excerpt 
      }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => {
      const cover = mapImage(r.cover)
      const coverMobile = r.coverMobile ? mapImage(r.coverMobile) : undefined
      const coverDesktop = r.coverDesktop ? mapImage(r.coverDesktop) : undefined
      const palette = extractPalette(r.cover)
      return {
        id: r.id,
        title: r.title,
        date: r.date,
        publishAt: r.publishAt,
        isPublished: r.isPublished,
        sortOrder: r.sortOrder,
        cover: {
          url: cover,
          urlMobile: coverMobile && coverMobile !== cover ? coverMobile : undefined,
          urlDesktop: coverDesktop && coverDesktop !== cover ? coverDesktop : undefined,
          palette,
        },
        excerpt: r.excerpt,
      }
    })
  }
  return []
}
export const getProjectById = async (id: string): Promise<Project | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && id.current==$id][0]{ 
      "id": id.current, 
      title, 
      date, 
      cover{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
      coverMobile{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
      coverDesktop{..., asset->{url, _ref, _id, metadata{palette{dominant{background,foreground}}}}}, 
      excerpt, 
      body, 
      media[]{
        type,
        url,
        image,
        imageMobile,
        imageDesktop,
        videoFile{asset->{url, _ref, _id}},
        videoFileMobile{asset->{url, _ref, _id}},
        videoFileDesktop{asset->{url, _ref, _id}}
      }
    }`
    const r = await sanity.fetch(q, {id})
    if (!r) return undefined

    const media = (r.media || [])
      .map((m: any) => {
        const type = m?.type || 'image'
        const url = mapMediaUrl(m)
        const urlMobile = mapMediaUrl(m, true, false)
        const urlDesktop = mapMediaUrl(m, false, true)

        const result: any = {type, url, image: type === 'image' ? url : undefined}
        if (urlMobile && urlMobile !== url) result.urlMobile = urlMobile
        if (urlDesktop && urlDesktop !== url) result.urlDesktop = urlDesktop

        return result
      })
      .filter((m: any) => m.url)

    return {
      id: r.id,
      title: r.title,
      date: r.date,
      cover: (() => {
        const cover = mapImage(r.cover)
        const coverMobile = r.coverMobile ? mapImage(r.coverMobile) : undefined
        const coverDesktop = r.coverDesktop ? mapImage(r.coverDesktop) : undefined
        const palette = extractPalette(r.cover)
        return {
          url: cover,
          urlMobile: coverMobile && coverMobile !== cover ? coverMobile : undefined,
          urlDesktop: coverDesktop && coverDesktop !== cover ? coverDesktop : undefined,
          palette,
        }
      })(),
      excerpt: r.excerpt,
      body: r.body,
      media: media.length > 0 ? media : undefined,
    }
  }
  return undefined
}

// Password hashing with bcrypt (salt automatically added)
// Note: This is a breaking change. Existing SHA-256 hashes need to be migrated.
// For new users, passwords will be hashed with bcrypt.
// For existing users, you may need to implement a migration strategy.
const hashPassword = async (password: string): Promise<string> => {
  // Use bcrypt with 10 rounds (good balance between security and performance)
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Compare password with hash (supports both bcrypt and legacy SHA-256 for migration)
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Check if hash is bcrypt format (starts with $2a$, $2b$, or $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return await bcrypt.compare(password, hash)
  }
  // Legacy SHA-256 support (for migration period)
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return sha256Hash === hash
}

// Users
// Email subscriber (password olmadan)
export const subscribeEmail = async (email: string): Promise<User> => {
  const normEmail = normalizeEmail(email)
  if (!normEmail) {
    throw new Error('Geçerli bir e-posta adresi girin')
  }
  // Eğer Sanity mutations aktif DEĞİLSE, local storage'ta tekrarı engelle
  if (!(useSanity && sanity && sanityMutations)) {
    const existingLocal = (getItem<User[]>(KEYS.USERS || 'birim_users') || []).find(
      u => normalizeEmail(u.email) === normEmail
    )
    if (existingLocal) {
      throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı')
    }
  }
  if (useSanity && sanity) {
    // Create email subscriber (password olmadan)
    // Email aboneliği için token yoksa local storage'a kaydet (daha esnek)
    if (!sanityMutations) {
      if (!ENABLE_LOCAL_FALLBACK) {
        throw new Error(
          'Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.'
        )
      }
      // Local storage'a kaydet ve devam et
      await delay(SIMULATED_DELAY)
      const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
      // Üstte kontrol edilse de yarış koşulları için tekrar kontrol
      const exists = users.find(u => normalizeEmail(u.email) === normEmail)
      if (exists) throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı')

      const newUser: User = {
        _id: `user_${Date.now()}`,
        email: normEmail,
        name: '',
        company: '',
        profession: '',
        userType: 'email_subscriber',
        isActive: true,
        createdAt: new Date().toISOString(),
      }

      setItem(KEYS.USERS || 'birim_users', [...users, newUser])
      return newUser
    }

    try {
      // Aynı e-posta için tekrar tekrar create çağrıldığında
      // yarış koşullarını engellemek için deterministik bir _id kullanıyoruz.
      const safeId =
        'email_subscriber_' +
        normEmail
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')

      const user = await sanityMutations.createIfNotExists({
        _id: safeId,
        _type: 'user',
        email: normEmail,
        password: '', // Email subscriber için password yok
        name: '',
        company: '',
        profession: '',
        userType: 'email_subscriber',
        isActive: true,
        createdAt: new Date().toISOString(),
      })

      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        userType: user.userType as UserType,
        isActive: user.isActive,
        createdAt: user.createdAt || user._createdAt,
      }
    } catch (error: unknown) {
      // Sanity hatası varsa hatayı fırlat
      let errorMessage = 'E-posta aboneliği yapılırken bir hata oluştu. Lütfen tekrar deneyin.'

      if (error.message?.includes('permission') || error.statusCode === 403) {
        errorMessage =
          'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun.'
      } else if (
        error.message?.includes('duplicate') ||
        error.message?.includes('already exists')
      ) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı.'
      } else if (error.message) {
        errorMessage = `Sanity hatası: ${error.message}`
      }

      throw new Error(errorMessage)
    }
  }

  // Local storage fallback - sadece Sanity kullanılmıyorsa
  if (!useSanity || !sanity) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw new Error(
        'Sunucuya yazma kapalı: Sanity yapılandırılmamış ve local fallback devre dışı.'
      )
    }
    await delay(SIMULATED_DELAY)
    const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
    const existingUser = users.find(u => normalizeEmail(u.email) === normEmail)
    if (existingUser) throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı')

    const newUser: User = {
      _id: `user_${Date.now()}`,
      email: normEmail,
      name: '',
      company: '',
      profession: '',
      userType: 'email_subscriber',
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    setItem(KEYS.USERS || 'birim_users', [...users, newUser])
    return newUser
  }

  // Sanity kullanılıyorsa ama buraya gelmemeli (yukarıda hata fırlatılmalı)
  throw new Error('Üye kaydı yapılamadı. Lütfen tekrar deneyin.')
}

// Full member registration (password ile)
export const registerUser = async (
  email: string,
  password: string,
  name?: string,
  company?: string,
  profession?: string,
  country?: string
): Promise<User> => {
  const normEmail = normalizeEmail(email)
  if (!normEmail) {
    throw new Error('Geçerli bir e-posta adresi girin')
  }
  if (useSanity && sanity) {
    // Check if user already exists (silinmiş kullanıcıları hariç tut)
    const existingUser = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]`,
      {
        email: normEmail,
      }
    )
    if (existingUser) {
      // Eğer email_subscriber ise, full_member'a yükselt
      if (existingUser.userType === 'email_subscriber') {
        const passwordHash = await hashPassword(password)
        // Mutations için authenticated client kullan, yoksa hata fırlat
        if (!sanityMutations) {
          if (!ENABLE_LOCAL_FALLBACK) {
            throw new Error(
              'Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.'
            )
          }
          throw new Error(
            "Sanity token yapılandırılmamış. Lütfen .env dosyasına VITE_SANITY_TOKEN ekleyin. Üye bilgileri CMS'de görünmeyecektir."
          )
        }

        try {
          const updatedUser = await sanityMutations
            .patch(existingUser._id)
            .set({
              password: passwordHash,
              name: name || '',
              company: company || '',
              profession: profession || '',
              country: country || existingUser.country || '',
              userType: 'full_member',
            })
            .commit()

          return {
            _id: updatedUser._id,
            email: updatedUser['email'],
            name: updatedUser['name'],
            company: updatedUser['company'],
            profession: updatedUser['profession'],
            country: updatedUser['country'],
            userType: updatedUser['userType'] as UserType,
            isActive: updatedUser['isActive'],
            createdAt: updatedUser['createdAt'] || updatedUser._createdAt,
          }
        } catch (error: unknown) {
          // Sanity hatası varsa hatayı fırlat (local storage'a düşme)
          let errorMessage = 'Üye kaydı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.'

          if (error.message?.includes('permission')) {
            errorMessage =
              'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun. Üye bilgileri CMS\'de görünmeyecektir.'
          } else if (error.message) {
            errorMessage = `Sanity hatası: ${error.message}`
          }

          throw new Error(errorMessage)
        }
      } else {
        throw new Error('Bu e-posta adresi zaten kayıtlı')
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create full member
    // Mutations için authenticated client kullan, yoksa hata fırlat
    if (!sanityMutations) {
      if (!ENABLE_LOCAL_FALLBACK) {
        throw new Error(
          'Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.'
        )
      }
      throw new Error(
        'Sanity token yapılandırılmamış. Lütfen proje kök dizininde .env dosyası oluşturup VITE_SANITY_TOKEN=your_token_here ekleyin. Token\'ı https://sanity.io/manage adresinden alabilirsiniz. Token\'ın "Editor" veya "Admin" yetkisi olmalıdır.'
      )
    }

    try {
      const verificationToken =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(36).slice(2)}`
      const user = await sanityMutations.create({
        _type: 'user',
        email: normEmail,
        password: passwordHash,
        name: name || '',
        company: company || '',
        profession: profession || '',
        country: country || '',
        userType: 'full_member',
        isActive: true,
        isVerified: false,
        verificationToken,
        createdAt: new Date().toISOString(),
      })

      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        country: user.country,
        userType: user.userType as UserType,
        isActive: user.isActive,
        isVerified: user.isVerified ?? false,
        verificationToken: user.verificationToken ?? null,
        createdAt: user.createdAt || user._createdAt,
      }
    } catch (error: unknown) {
      // Sanity hatası varsa hatayı fırlat (local storage'a düşme)
      let errorMessage = 'Üye kaydı yapılırken bir hata oluştu. Lütfen tekrar deneyin.'

      if (error.message?.includes('permission')) {
        errorMessage =
          'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun. Üye bilgileri CMS\'de görünmeyecektir.'
      } else if (error.message) {
        errorMessage = `Sanity hatası: ${error.message}`
      }

      throw new Error(errorMessage)
    }
  }

  // Local storage fallback - sadece Sanity kullanılmıyorsa
  if (!useSanity || !sanity) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw new Error(
        'Sunucuya yazma kapalı: Sanity yapılandırılmamış ve local fallback devre dışı.'
      )
    }
    await delay(SIMULATED_DELAY)
    const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
    const existingUser = users.find(u => normalizeEmail(u.email) === normEmail)
    if (existingUser) {
      if (existingUser.userType === 'email_subscriber') {
        // Email subscriber'ı full member'a yükselt
        const passwordHash = await hashPassword(password)
        const userPasswords = getItem<{[email: string]: string}>('birim_user_passwords') || {}
        userPasswords[normEmail] = passwordHash
        setItem('birim_user_passwords', userPasswords)

        const updatedUser: User = {
          ...existingUser,
          name: name || '',
          company: company || '',
          profession: profession || '',
          country: country || existingUser.country,
          userType: 'full_member',
        }
        setItem(
          KEYS.USERS || 'birim_users',
          users.map(u => (normalizeEmail(u.email) === normEmail ? updatedUser : u))
        )
        return updatedUser
      }
      throw new Error('Bu e-posta adresi zaten kayıtlı')
    }

    const passwordHash = await hashPassword(password)
    const verificationToken =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`

    const newUser: User = {
      _id: `user_${Date.now()}`,
      email: normEmail,
      name: name || '',
      company: company || '',
      profession: profession || '',
      country: country || '',
      userType: 'full_member',
      isActive: true,
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    }

    // Store password hash separately (in real app, don't store in localStorage)
    const userPasswords = getItem<{[email: string]: string}>('birim_user_passwords') || {}
    userPasswords[normEmail] = passwordHash
    setItem('birim_user_passwords', userPasswords)

    setItem(KEYS.USERS || 'birim_users', [...users, newUser])
    return newUser
  }

  // Sanity kullanılıyorsa ama buraya gelmemeli (yukarıda hata fırlatılmalı)
  throw new Error('Üye kaydı yapılamadı. Lütfen tekrar deneyin.')
}

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  const normEmail = normalizeEmail(email)
  if (useSanity && sanity) {
    // Fetch user by email first (silinmiş kullanıcıları hariç tut)
    const user = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email && isActive == true && !defined(_deleted)][0]{
        _id,
        email,
        name,
        company,
        profession,
        country,
        userType,
        isActive,
        createdAt,
        password
      }`,
      {email: normEmail}
    )

    if (!user || !user.password) {
      return null
    }

    // Compare password with stored hash (supports both bcrypt and legacy SHA-256)
    const passwordMatch = await comparePassword(password, user.password)
    if (!passwordMatch) {
      return null
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      country: user.country,
      userType: user.userType as UserType,
      isActive: user.isActive,
      isVerified: user.isVerified ?? false,
      verificationToken: user.verificationToken ?? null,
      createdAt: user.createdAt || user._createdAt,
    }
  }

  // Local storage fallback
  await delay(SIMULATED_DELAY)
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
  const userPasswords = getItem<{[email: string]: string}>('birim_user_passwords') || {}

  const user = users.find(u => normalizeEmail(u.email) === normEmail && u.isActive)
  if (!user) {
    return null
  }

  const storedHash = userPasswords[normEmail]
  if (!storedHash) {
    return null
  }

  // Compare password with stored hash (supports both bcrypt and legacy SHA-256)
  const passwordMatch = await comparePassword(password, storedHash)
  if (!passwordMatch) {
    return null
  }

  return user
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const normEmail = normalizeEmail(email)
  if (useSanity && sanity) {
    const user = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]{
        _id,
        email,
        name,
        company,
        profession,
        country,
        userType,
        isActive,
        createdAt
      }`,
      {email: normEmail}
    )

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      country: user.country,
      userType: user.userType as UserType,
      isActive: user.isActive,
      isVerified: user.isVerified ?? false,
      verificationToken: user.verificationToken ?? null,
      createdAt: user.createdAt || user._createdAt,
    }
  }

  await delay(SIMULATED_DELAY)
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
  const user = users.find(u => normalizeEmail(u.email) === normEmail)
  return user || null
}

export const getUserById = async (id: string): Promise<User | null> => {
  if (useSanity && sanity) {
    const user = await sanity.fetch(
      groq`*[_type == "user" && _id == $id][0]{
        _id,
        email,
        name,
        company,
        profession,
        userType,
        isActive,
        country,
        isVerified,
        verificationToken,
        createdAt
      }`,
      {id}
    )

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      userType: user.userType,
      isActive: user.isActive,
      country: user.country,
      isVerified: user.isVerified ?? false,
      verificationToken: user.verificationToken ?? null,
      createdAt: user.createdAt || user._createdAt,
    }
  }

  await delay(SIMULATED_DELAY)
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
  const user = users.find(u => u._id === id)
  return user || null
}

export const verifyUserByToken = async (token: string): Promise<User | null> => {
  if (!token) return null

  if (useSanity && sanity && sanityMutations) {
    const query = groq`*[_type == "user" && verificationToken == $vtoken && !defined(_deleted)][0]{
        _id,
        email,
        name,
        company,
        profession,
        userType,
        isActive,
        isVerified,
        verificationToken,
        createdAt
      }`
    const user = await sanity.fetch<any>(query, {vtoken: token})

    if (!user) return null

    const patched = await sanityMutations
      .patch(user._id)
      .set({
        isVerified: true,
        verificationToken: null,
      })
      .commit()

    return {
      _id: patched['_id'],
      email: patched['email'],
      name: patched['name'],
      company: patched['company'],
      profession: patched['profession'],
      userType: patched['userType'] as UserType,
      isActive: patched['isActive'],
      isVerified: (patched['isVerified'] as boolean | undefined) ?? true,
      verificationToken: (patched['verificationToken'] as string | null | undefined) ?? null,
      createdAt: (patched['createdAt'] as string | undefined) || patched['_createdAt'],
    }
  }

  // Local fallback
  await delay(SIMULATED_DELAY)
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || []
  const idx = users.findIndex(u => u.verificationToken === token)
  if (idx === -1) return null

  const baseUser = users[idx]
  if (!baseUser) return null

  const updatedUser: User = {
    ...baseUser,
    isVerified: true,
    verificationToken: null,
  }

  const nextUsers = [...users]
  nextUsers[idx] = updatedUser
  setItem(KEYS.USERS || 'birim_users', nextUsers)

  return updatedUser
}
