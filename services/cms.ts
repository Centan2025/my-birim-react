import { initialData, KEYS, aboutPageContentData } from '../data';
import type { SiteSettings, Category, Designer, Product, AboutPageContent, ContactPageContent, HomePageContent, FooterContent, NewsItem, ProductMaterial, ProductVariant, Project, LocalizedString, User, UserType, CookiesPolicy } from '../types';
import { createClient } from '@sanity/client'
import groq from 'groq'
import imageUrlBuilder from '@sanity/image-url'

const SIMULATED_DELAY = 200;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Email'leri tekilleştirmek için normalize et (trim + lowercase)
const normalizeEmail = (value: string): string => (value || '').trim().toLowerCase();

// Build Sanity file CDN URL from asset {_id|_ref|url}
const toFileUrl = (asset: any): string => {
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
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || 'production'
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || '2025-01-01'
const useSanity = Boolean(SANITY_PROJECT_ID && SANITY_DATASET)

// Prod'da varsayılan davranış: local fallback kapalı.
// İstenirse açıkça VITE_ENABLE_LOCAL_FALLBACK=true ile etkinleştirilebilir.
const defaultEnableFallback = import.meta.env.PROD ? 'false' : 'true'
const ENABLE_LOCAL_FALLBACK = String(
  (import.meta as any).env?.VITE_ENABLE_LOCAL_FALLBACK ?? defaultEnableFallback
).toLowerCase() !== 'false'

const sanity = useSanity
  ? createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, useCdn: true })
  : null

// Mutations için authenticated client (token varsa)
const SANITY_TOKEN = import.meta.env.VITE_SANITY_TOKEN || ''
const sanityMutations = useSanity && SANITY_TOKEN
  ? createClient({ 
      projectId: SANITY_PROJECT_ID, 
      dataset: SANITY_DATASET, 
      apiVersion: SANITY_API_VERSION, 
      useCdn: false,
      token: SANITY_TOKEN
    })
  : null

const urlFor = (source: any) => (useSanity && sanity ? imageUrlBuilder(sanity).image(source) : null)

// --- DEBUG: Print env + toggle once on startup ---
// @ts-ignore
if (typeof window !== 'undefined') {
  const envToken = import.meta.env.VITE_SANITY_TOKEN;
  const hasToken = Boolean(SANITY_TOKEN && SANITY_TOKEN.trim().length > 0);
  console.info('SANITY env', {
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
    dataset: import.meta.env.VITE_SANITY_DATASET,
    apiVersion: import.meta.env.VITE_SANITY_API_VERSION,
    useSanity,
    envTokenExists: Boolean(envToken),
    envTokenLength: envToken ? envToken.length : 0,
    envTokenPreview: envToken ? envToken.substring(0, 20) + '...' : 'yok',
    hasToken: hasToken,
    tokenLength: SANITY_TOKEN ? SANITY_TOKEN.length : 0,
    mutationsEnabled: Boolean(sanityMutations),
    enableLocalFallback: ENABLE_LOCAL_FALLBACK,
    envMode: import.meta.env.PROD ? 'production' : 'development',
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
  });
  
  if (useSanity && !hasToken && ENABLE_LOCAL_FALLBACK) {
    console.warn('⚠️ Sanity token yapılandırılmamış! Local fallback AÇIK. Abonelikler geçici olarak localStorage\'a kaydedilecek.');
    console.warn('Token kontrolü:', {
      envToken: envToken ? 'var' : 'yok',
      SANITY_TOKEN: SANITY_TOKEN ? 'var' : 'yok',
      sanityMutations: sanityMutations ? 'var' : 'yok'
    });
  } else if (useSanity && !hasToken && !ENABLE_LOCAL_FALLBACK) {
    console.error('❌ Sanity token yok ve local fallback DEVRE DIŞI. Yazma işlemleri hata verecek.');
  } else if (useSanity && hasToken && !sanityMutations) {
    console.error('❌ Sanity token mevcut ama mutations client oluşturulamadı!');
  } else if (useSanity && sanityMutations) {
    console.info('✅ Sanity mutations aktif - üye kayıtları CMS\'ye kaydedilecek');
  }
}

const mapImage = (img: any | undefined): string => {
  if (!img) return ''
  const b = urlFor && urlFor(img)
  try { return b ? b.width(1600).url() : '' } catch { return '' }
}

const mapImages = (imgs: any[] | undefined): string[] => Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []
const mapProductMedia = (row: any): { type: 'image'|'video'|'youtube'; url: string; title?: any }[] => {
  const mediaArr = Array.isArray(row?.media) ? row.media : []
  const fromMedia = mediaArr.map((m: any) => {
    const type = m?.type
    let url = ''
    if (type === 'image' && m?.image) {
      url = mapImage(m.image)
    } else if (type === 'video' && m?.videoFile?.asset?.url) {
      // Video dosyası yüklendiyse asset URL'ini kullan
      url = m.videoFile.asset.url
    } else if (type === 'video' && m?.videoFile?.asset?._id) {
      // Asset ID varsa URL'yi oluştur
      const fileId = m.videoFile.asset._id.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    } else if (type === 'video' && m?.videoFile?.asset?._ref) {
      // Asset referansı varsa URL'yi oluştur
      const fileId = m.videoFile.asset._ref.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    } else {
      url = m?.url || ''
    }
    const title = m?.title
    return { type, url, title }
  }).filter((m: any) => m.type && m.url)
  if (fromMedia.length > 0) return fromMedia
  const imgs = mapImages([row?.mainImage, ...(row?.alternativeImages || [])])
  return imgs.map((u: string) => ({ type: 'image', url: u }))
}

const mapAlternativeMedia = (row: any): { type: 'image'|'video'|'youtube'; url: string }[] => {
  const alt = Array.isArray(row?.alternativeMedia) ? row.alternativeMedia : []
  if (alt.length) return alt.map((m: any) => {
    const type = m?.type
    let url = ''
    if (type === 'image' && m?.image) {
      url = mapImage(m.image)
    } else if (type === 'video' && m?.videoFile?.asset?.url) {
      // Video dosyası yüklendiyse asset URL'ini kullan
      url = m.videoFile.asset.url
    } else if (type === 'video' && m?.videoFile?.asset?._id) {
      // Asset ID varsa URL'yi oluştur
      const fileId = m.videoFile.asset._id.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    } else if (type === 'video' && m?.videoFile?.asset?._ref) {
      // Asset referansı varsa URL'yi oluştur
      const fileId = m.videoFile.asset._ref.replace('file-', '')
      url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
    } else {
      url = m?.url || ''
    }
    return { type, url }
  }).filter((m: any) => m.type && m.url)
  // fallback to legacy alternativeImages
  return mapImages(row?.alternativeImages).map((u: string) => ({ type: 'image', url: u }))
}
const mapMaterials = (materials: any[] | undefined): ProductMaterial[] => Array.isArray(materials) ? materials.map(m => ({ name: m?.name, image: mapImage(m?.image) })) : []
const mapDimensionImages = (dimImgs: any[] | undefined): { image: string; title?: LocalizedString }[] => {
  if (!Array.isArray(dimImgs)) return []
  return dimImgs.map((di: any) => ({
    image: mapImage(di?.image),
    title: di?.title,
  })).filter((di: any) => di.image) // sadece görseli olanları tut
}
const mapGroupedMaterials = (materialSelections: any[]): any[] => {
  return (materialSelections || [])
    .map((s: any) => {
      const selectedMaterials = mapMaterials(s?.materials || [])
      // Create a set of selected material keys for faster lookup
      const selectedKeys = new Set(selectedMaterials.map((sm: any) => `${sm.image}|${JSON.stringify(sm.name)}`))
      
      const groupBooks = (s?.group?.books || []).map((book: any) => {
        const bookMaterials = mapMaterials(book?.items || [])
        // Filter to only show materials that are selected for this product
        const selectedBookMaterials = bookMaterials.filter((bm: any) => 
          selectedKeys.has(`${bm.image}|${JSON.stringify(bm.name)}`)
        )
        return {
          bookTitle: book?.title,
          materials: selectedBookMaterials
        }
      }).filter((b: any) => b.materials.length > 0)
      
      return {
        groupTitle: s?.group?.title,
        books: groupBooks,
        materials: selectedMaterials
      }
    })
    .filter((g: any) => g.materials.length > 0)
}
// Ürünlerde ölçü alanını boşlayarak normalize et
const normalizeProduct = (p: Product): Product => ({
  ...p,
  // legacy cleanups
  dimensionImages: Array.isArray((p as any).dimensionImages) 
    ? (p as any).dimensionImages.map((di: any) => 
        typeof di === 'string' 
          ? { image: di } // eski string array formatı için backward compatibility
          : di
      )
    : [],
})
const mapVariants = (variants: any[] | undefined): ProductVariant[] => Array.isArray(variants) ? variants.map(v => ({ name: v?.name, sku: v?.sku, price: v?.price, images: mapImages(v?.images) })) : []

let storage: Storage;
const memoryStore: { [key: string]: string } = {};

try {
  // Check if localStorage is available and writable
  localStorage.setItem('__storage_test__', 'test');
  localStorage.removeItem('__storage_test__');
  storage = localStorage;
} catch (e) {
  console.warn("LocalStorage is not available. Using in-memory store. Changes will not be persisted across sessions.");
  storage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => { memoryStore[key] = value; },
    removeItem: (key: string) => { delete memoryStore[key]; },
    clear: () => {
      for (const key in memoryStore) {
        if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
          delete memoryStore[key];
        }
      }
    },
    get length() {
      return Object.keys(memoryStore).length;
    },
    key: (index: number) => Object.keys(memoryStore)[index],
  };
}


const initializeData = () => {
    Object.entries(initialData).forEach(([key, data]) => {
        if (!storage.getItem(key)) {
            try {
                storage.setItem(key, JSON.stringify(data));
            } catch(e) {
                console.error(`Failed to initialize data for key "${key}" in storage.`, e);
            }
        }
    });
};

initializeData();

// Generic getter/setter
const getItem = <T>(key: string): T => {
    const data = storage.getItem(key);

    if (!data) {
        initializeData(); // Re-initialize if a key is missing
        const reloadedData = storage.getItem(key);
        if (!reloadedData) {
            console.error(`No data found for key ${key} even after re-initialization. Falling back to initialData from code.`);
            return initialData[key as keyof typeof initialData] as T;
        }
         try {
            return JSON.parse(reloadedData);
        } catch (e) {
            console.error(`Failed to parse reloaded data for key ${key}. Falling back to initialData from code.`, e);
            return initialData[key as keyof typeof initialData] as T;
        }
    }

    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn(`Corrupted data found for key ${key}. Resetting to default.`, e);
        storage.removeItem(key);
        initializeData();
        const reloadedData = storage.getItem(key);
         if (!reloadedData) {
            console.error(`No data found for key ${key} after reset. Falling back to initialData from code.`);
            return initialData[key as keyof typeof initialData] as T;
        }
        try {
            return JSON.parse(reloadedData);
        } catch (parseError) {
             console.error(`Failed to parse reloaded data for key ${key} after reset. Falling back to initialData from code.`, parseError);
            return initialData[key as keyof typeof initialData] as T;
        }
    }
};

const setItem = <T>(key: string, data: T): void => {
    try {
        storage.setItem(key, JSON.stringify(data));
    } catch(e) {
        console.error(`Failed to set item in storage for key: ${key}. Changes may not be saved.`, e);
        alert("Warning: Could not save changes. Your browser's storage might be full or disabled.");
    }
};

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
                useCdn: false 
            })
            const results = await noCacheClient.fetch(q)
            const translationsMap: Record<string, Record<string, string>> = {}
            if (Array.isArray(results)) {
                results.forEach((item: any) => {
                    if (item.language && item.strings) {
                        const normalized: Record<string, string> = { ...item.strings }
                        // Şema alanı 'models_3d' ise, frontend anahtarı '3d_models' bekliyor -> eşle
                        if (normalized.models_3d && !normalized['3d_models']) {
                            normalized['3d_models'] = normalized.models_3d
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
            console.error('Failed to fetch translations from Sanity', error)
            return {}
        }
    }
    return {}
}

// Languages
export const getLanguages = async (): Promise<string[]> => {
    if (useSanity && sanity) {
        try {
            const langs = await sanity.fetch(groq`*[_type=="siteSettings"][0].languages`);
            const base = ['tr', 'en'];
            if (Array.isArray(langs)) {
                // Support both legacy [string] and new [{code, visible}]
                const normalized = langs.map((l: any) => {
                    if (typeof l === 'string') return { code: l, visible: true };
                    const code = String(l?.code || '').toLowerCase();
                    const visible = l?.visible !== false;
                    return { code, visible };
                }).filter((l: any) => l.code);
                const visibleCodes = normalized.filter((l: any) => l.visible).map((l: any) => l.code);
                const merged = [...base, ...visibleCodes];
                return Array.from(new Set(merged));
            }
            // if not array, fall back to base
            return base;
        } catch (e) {
            console.warn('Failed to fetch languages from Sanity, falling back to local storage.', e);
        }
    }
    await delay(SIMULATED_DELAY);
    const fromLocal = getItem<string[]>(KEYS.LANGUAGES);
    const base = ['tr', 'en'];
    const merged = Array.isArray(fromLocal) && fromLocal.length > 0 ? [...base, ...fromLocal] : base;
    return Array.from(new Set(merged));
};
export const updateLanguages = async (languages: string[]): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.LANGUAGES, languages);
};

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "siteSettings"][0]{
            ...,
            logo
        }`
        const s = await sanity.fetch(q)
        // Backward compatible defaults
        return {
            logoUrl: s?.logo ? mapImage(s.logo) : (s?.logoUrl || ''),
            topBannerText: s?.topBannerText || '',
            showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
            showCartButton: Boolean(s?.showCartButton ?? true),
            imageBorderStyle: (s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square') ? s.imageBorderStyle : 'square',
            isLanguageSwitcherVisible: s?.isLanguageSwitcherVisible !== false,
            languages: Array.isArray(s?.languages) ? s.languages : undefined,
        }
    }
    await delay(SIMULATED_DELAY);
    const s = getItem<SiteSettings>(KEYS.SITE_SETTINGS);
    // Ensure all fields are present with defaults
    return {
        logoUrl: s?.logoUrl || '',
        topBannerText: s?.topBannerText || '',
        showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
        showCartButton: Boolean(s?.showCartButton ?? true),
        imageBorderStyle: (s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square') ? s.imageBorderStyle : 'square',
    };
};
export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.SITE_SETTINGS, settings);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "category"]{ "id": id.current, name, subtitle, heroImage }`
        const rows = await sanity.fetch(query)
        return rows.map((r: any) => ({ id: r.id, name: r.name, subtitle: r.subtitle, heroImage: mapImage(r.heroImage) }))
    }
    await delay(SIMULATED_DELAY);
    return getItem<Category[]>(KEYS.CATEGORIES);
};
export const addCategory = async (category: Category): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const categories = await getCategories();
    if (categories.some(c => c.id === category.id)) {
        throw new Error('Category ID already exists');
    }
    setItem(KEYS.CATEGORIES, [...categories, category]);
};
export const updateCategory = async (category: Category): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let categories = await getCategories();
    categories = categories.map(c => (c.id === category.id ? category : c));
    setItem(KEYS.CATEGORIES, categories);
};
export const deleteCategory = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let categories = await getCategories();
    setItem(KEYS.CATEGORIES, categories.filter(c => c.id !== id));
};

// Designers
export const getDesigners = async (): Promise<Designer[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "designer"]{ "id": id.current, name, bio, image } | order(name.tr asc)`
        const rows = await sanity.fetch(query)
        return rows.map((r: any) => ({ id: r.id, name: r.name, bio: r.bio, image: mapImage(r.image) }))
    }
    await delay(SIMULATED_DELAY);
    return getItem<Designer[]>(KEYS.DESIGNERS);
};
export const getDesignerById = async (id: string): Promise<Designer | undefined> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "designer" && id.current == $id][0]{ "id": id.current, name, bio, image }`
        const r = await sanity.fetch(query, { id })
        return r ? { id: r.id, name: r.name, bio: r.bio, image: mapImage(r.image) } : undefined
    }
    const designers = await getDesigners();
    return designers.find(d => d.id === id);
}
export const addDesigner = async (designer: Designer): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const designers = await getDesigners();
     if (designers.some(d => d.id === designer.id)) {
        throw new Error('Designer ID already exists');
    }
    setItem(KEYS.DESIGNERS, [...designers, designer]);
};
export const updateDesigner = async (designer: Designer): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let designers = await getDesigners();
    designers = designers.map(d => (d.id === designer.id ? designer : d));
    setItem(KEYS.DESIGNERS, designers);
};
export const deleteDesigner = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let designers = await getDesigners();
    setItem(KEYS.DESIGNERS, designers.filter(d => d.id !== id));
};

// Products
export const getProducts = async (): Promise<Product[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "product"] | order(year desc){
          "id": id.current,
          name,
          year,
          description,
          mainImage,
          alternativeImages,
          alternativeMedia[]{ type, url, image, videoFile{asset->{url, _ref, _id}} },
          media[]{ type, url, image, title, videoFile{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          showMediaPanels,
          buyable,
          price,
          currency,
          sku,
          stockStatus,
          variants,
          materialSelections[]{ group->{title, books[]{title, items[]{name, image}}}, materials },
          dimensionImages[]{ image, title },
          exclusiveContent,
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
        const rows = await sanity.fetch(query)
        return rows.map((r: any) => normalizeProduct({
          id: r.id,
          name: r.name,
          designerId: r.designer?.designerId || '',
          categoryId: r.category?.categoryId || '',
          year: r.year,
          description: r.description,
          mainImage: mapImage(r.mainImage),
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
          variants: mapVariants(r.variants),
          materials: mapMaterials((r.materialSelections || []).flatMap((s: any) => s?.materials || [])),
          groupedMaterials: mapGroupedMaterials(r.materialSelections),
          mediaSectionTitle: r?.mediaSectionTitle,
          exclusiveContent: {
            images: mapImages(r?.exclusiveContent?.images),
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: toFileUrl(d?.file?.asset) })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: toFileUrl(m?.file?.asset) })),
          },
        }))
    }
    await delay(SIMULATED_DELAY);
    return getItem<Product[]>(KEYS.PRODUCTS).map(normalizeProduct);
};
export const getProductById = async (id: string): Promise<Product | undefined> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "product" && id.current == $id][0]{
          "id": id.current,
          name,
          year,
          description,
          mainImage,
          alternativeImages,
          alternativeMedia[]{ type, url, image, videoFile{asset->{url, _ref, _id}} },
          media[]{ type, url, image, title, videoFile{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          showMediaPanels,
          buyable,
          price,
          currency,
          sku,
          stockStatus,
          variants,
          materialSelections[]{ group->{title, books[]{title, items[]{name, image}}}, materials },
          dimensionImages[]{ image, title },
          exclusiveContent,
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
        const r = await sanity.fetch(query, { id })
        if (!r) return undefined
        return normalizeProduct({
          id: r.id,
          name: r.name,
          designerId: r.designer?.designerId || '',
          categoryId: r.category?.categoryId || '',
          year: r.year,
          description: r.description,
          mainImage: mapImage(r.mainImage),
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
          variants: mapVariants(r.variants),
          materials: mapMaterials((r.materialSelections || []).flatMap((s: any) => s?.materials || [])),
          groupedMaterials: mapGroupedMaterials(r.materialSelections),
          mediaSectionTitle: r?.mediaSectionTitle,
          exclusiveContent: {
            images: mapImages(r?.exclusiveContent?.images),
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: toFileUrl(d?.file?.asset) })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: toFileUrl(m?.file?.asset) })),
          },
        })
    }
    const products = await getProducts();
    return products.find(p => p.id === id);
}
export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "product" && references(*[_type == "category" && id.current == $categoryId]._id)]{
          "id": id.current,
          name,
          year,
          description,
          mainImage,
          alternativeImages,
          alternativeMedia[]{ type, url, image, videoFile{asset->{url, _ref, _id}} },
          media[]{ type, url, image, title, videoFile{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          showMediaPanels,
          buyable,
          price,
          currency,
          materialSelections[]{ materials },
          dimensionImages[]{ image, title },
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
        const rows = await sanity.fetch(query, { categoryId })
        return rows.map((r: any) => normalizeProduct({
          id: r.id,
          name: r.name,
          designerId: r.designer?.designerId || '',
          categoryId: r.category?.categoryId || '',
          year: r.year,
          description: r.description,
          mainImage: mapImage(r.mainImage),
          alternativeImages: mapImages(r.alternativeImages),
          alternativeMedia: mapAlternativeMedia(r),
          media: mapProductMedia(r),
          showMediaPanels: Boolean(r?.showMediaPanels),
          dimensionImages: mapDimensionImages(r?.dimensionImages),
          buyable: Boolean(r.buyable),
          price: r.price,
          currency: r.currency,
          materials: mapMaterials((r.materialSelections || []).flatMap((s: any) => s?.materials || [])),
          exclusiveContent: {
            images: mapImages(r?.exclusiveContent?.images),
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: toFileUrl(d?.file?.asset) })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: toFileUrl(m?.file?.asset) })),
          },
        }))
    }
    const products = await getProducts();
    return products.filter(p => p.categoryId === categoryId);
}
export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
    if (useSanity && sanity) {
        const query = groq`*[_type == "product" && references(*[_type == "designer" && id.current == $designerId]._id)]{
          "id": id.current,
          name,
          year,
          description,
          mainImage,
          alternativeImages,
          alternativeMedia[]{ type, url, image, videoFile{asset->{url, _ref, _id}} },
          media[]{ type, url, image, title, videoFile{asset->{url, _ref, _id}} },
          mediaSectionTitle,
          showMediaPanels,
          buyable,
          price,
          currency,
          materialSelections[]{ materials },
          dimensionImages[]{ image, title },
          designer->{ "designerId": id.current },
          category->{ "categoryId": id.current },
        }`
        const rows = await sanity.fetch(query, { designerId })
        return rows.map((r: any) => normalizeProduct({
          id: r.id,
          name: r.name,
          designerId: r.designer?.designerId || '',
          categoryId: r.category?.categoryId || '',
          year: r.year,
          description: r.description,
          mainImage: mapImage(r.mainImage),
          alternativeImages: mapImages(r.alternativeImages),
          alternativeMedia: mapAlternativeMedia(r),
          media: mapProductMedia(r),
          showMediaPanels: Boolean(r?.showMediaPanels),
          dimensionImages: mapDimensionImages(r?.dimensionImages),
          buyable: Boolean(r.buyable),
          price: r.price,
          currency: r.currency,
          materials: mapMaterials((r.materialSelections || []).flatMap((s: any) => s?.materials || [])),
          exclusiveContent: {
            images: mapImages(r?.exclusiveContent?.images),
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: toFileUrl(d?.file?.asset) })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: toFileUrl(m?.file?.asset) })),
          },
        }))
    }
    const products = await getProducts();
    return products.filter(p => p.designerId === designerId);
}
export const addProduct = async (product: Product): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const products = await getProducts();
    if (products.some(p => p.id === product.id)) {
        throw new Error('Product ID already exists');
    }
    setItem(KEYS.PRODUCTS, [...products, product]);
};
export const updateProduct = async (product: Product): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let products = await getProducts();
    products = products.map(p => (p.id === product.id ? product : p));
    setItem(KEYS.PRODUCTS, products);
};
export const deleteProduct = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let products = await getProducts();
    setItem(KEYS.PRODUCTS, products.filter(p => p.id !== id));
};

// Page Content
export const getAboutPageContent = async (): Promise<AboutPageContent> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "aboutPage"][0]{
            ...,
            heroImage,
            storyImage
        }`
        const data = await sanity.fetch(q);
        if (data) {
            // Normalize images
            if (data.heroImage) {
                data.heroImage = mapImage(data.heroImage);
            }
            if (data.storyImage) {
                data.storyImage = mapImage(data.storyImage);
            }
            // Ensure values is always an array
            if (!Array.isArray(data.values)) {
                data.values = [];
            }
            return data;
        }
    }
    await delay(SIMULATED_DELAY);
    const data = getItem<AboutPageContent>(KEYS.ABOUT_PAGE);
    // Ensure values is always an array
    if (data && !Array.isArray(data.values)) {
        data.values = [];
    }
    // Return data or fallback to default from initialData
    if (data) {
        return data;
    }
    // If no data exists, return default from initialData
    const defaultData = initialData[KEYS.ABOUT_PAGE] as AboutPageContent;
    return defaultData || aboutPageContentData;
};
export const updateAboutPageContent = async (content: AboutPageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.ABOUT_PAGE, content);
};

export const getContactPageContent = async (): Promise<ContactPageContent> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "contactPage"][0]`
        return await sanity.fetch(q)
    }
    await delay(SIMULATED_DELAY);
    return getItem<ContactPageContent>(KEYS.CONTACT_PAGE);
};
export const updateContactPageContent = async (content: ContactPageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.CONTACT_PAGE, content);
};

export const getHomePageContent = async (): Promise<HomePageContent> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "homePage"][0]{
            ...,
            heroMedia[]{
                ...,
                image{
                    asset->{url}
                },
                videoFile{
                    asset->{url, _ref, _id}
                }
            },
            contentBlocks[]{
                ...,
                image{
                    asset->{url}
                },
                videoFile{
                    asset->{url, _ref, _id}
                }
            },
            inspirationSection{
                ...,
                backgroundImage
            }
        }`
        const data = await sanity.fetch(q);
        if (data?.heroMedia) {
            data.heroMedia = data.heroMedia.map((m: any) => {
                let url = m.url
                if (m.type === 'image' && m.image?.asset?.url) {
                    url = m.image.asset.url
                } else if (m.type === 'video' && m.videoFile?.asset?.url) {
                    url = m.videoFile.asset.url
                } else if (m.type === 'video' && m.videoFile?.asset?._id) {
                    const fileId = m.videoFile.asset._id.replace('file-', '')
                    url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
                } else if (m.type === 'video' && m.videoFile?.asset?._ref) {
                    const fileId = m.videoFile.asset._ref.replace('file-', '')
                    url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
                }
                return { ...m, url }
            });
        }
        if (data?.contentBlocks) {
            data.contentBlocks = data.contentBlocks.map((b: any) => {
                let url = b.url
                if (b.mediaType === 'image' && b.image?.asset?.url) {
                    return { ...b, image: b.image.asset.url, url: undefined }
                } else if (b.mediaType === 'video' && b.videoFile?.asset?.url) {
                    url = b.videoFile.asset.url
                } else if (b.mediaType === 'video' && b.videoFile?.asset?._id) {
                    const fileId = b.videoFile.asset._id.replace('file-', '')
                    url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
                } else if (b.mediaType === 'video' && b.videoFile?.asset?._ref) {
                    const fileId = b.videoFile.asset._ref.replace('file-', '')
                    url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
                }
                return { ...b, image: undefined, url }
            });
        }
        if (data?.inspirationSection) {
            data.inspirationSection.backgroundImage = mapImage(data.inspirationSection.backgroundImage);
        }
        // Ensure featuredProductIds is always an array
        if (!Array.isArray(data?.featuredProductIds)) {
            data.featuredProductIds = [];
        }
        return data;
    }
    await delay(SIMULATED_DELAY);
    const data = getItem<HomePageContent>(KEYS.HOME_PAGE);
    // Ensure featuredProductIds is always an array
    if (data && !Array.isArray(data.featuredProductIds)) {
        data.featuredProductIds = [];
    }
    return data;
};
export const updateHomePageContent = async (content: HomePageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.HOME_PAGE, content);
};

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
        const data = await sanity.fetch(q);
        if (data?.partners) {
            data.partners = data.partners.map((p: any) => ({
                ...p,
                logo: mapImage(p.logo)
            }));
        }
        // Ensure legalLinks is always an array
        if (!Array.isArray(data?.legalLinks)) {
            data.legalLinks = [];
        }
        return data;
    }
    await delay(SIMULATED_DELAY);
    const data = getItem<FooterContent>(KEYS.FOOTER);
    // Ensure legalLinks is always an array
    if (data && !Array.isArray(data.legalLinks)) {
        data.legalLinks = [];
    }
    return data;
};
export const updateFooterContent = async (content: FooterContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.FOOTER, content);
};

// Cookies Policy
export const getCookiesPolicy = async (): Promise<CookiesPolicy | null> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "cookiesPolicy"][0]{ title, content, updatedAt }`;
        const data = await sanity.fetch(q);
        return data || null;
    }
    await delay(SIMULATED_DELAY);
    return null;
};
// News
export const getNews = async (): Promise<NewsItem[]> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "newsItem"] | order(date desc){ 
          "id": id.current, 
          title, 
          date, 
          content, 
          mainImage, 
          media[]{
            type,
            url,
            caption,
            image{asset->{url}},
            videoFile{asset->{url, _ref, _id}}
          }
        }`
        const rows = await sanity.fetch(q)
        return rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          date: r.date,
          content: r.content,
          mainImage: mapImage(r.mainImage),
          media: (r.media || []).map((m: any) => {
            let url = m.url
            if (m.type === 'image' && m.image?.asset?.url) {
              url = m.image.asset.url
            } else if (m.type === 'video' && m.videoFile?.asset?.url) {
              url = m.videoFile.asset.url
            } else if (m.type === 'video' && m.videoFile?.asset?._id) {
              const fileId = m.videoFile.asset._id.replace('file-', '')
              url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
            } else if (m.type === 'video' && m.videoFile?.asset?._ref) {
              const fileId = m.videoFile.asset._ref.replace('file-', '')
              url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
            }
            return { type: m.type, url, caption: m.caption }
          }).filter((m: any) => m.url),
        }))
    }
    await delay(SIMULATED_DELAY);
    return getItem<NewsItem[]>(KEYS.NEWS);
};
export const getNewsById = async (id: string): Promise<NewsItem | undefined> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "newsItem" && id.current == $id][0]{ 
          "id": id.current, 
          title, 
          date, 
          content, 
          mainImage, 
          media[]{
            type,
            url,
            caption,
            image{asset->{url}},
            videoFile{asset->{url, _ref, _id}}
          }
        }`
        const r = await sanity.fetch(q, { id })
        if (!r) return undefined
        return {
          id: r.id,
          title: r.title,
          date: r.date,
          content: r.content,
          mainImage: mapImage(r.mainImage),
          media: (r.media || []).map((m: any) => {
            let url = m.url
            if (m.type === 'image' && m.image?.asset?.url) {
              url = m.image.asset.url
            } else if (m.type === 'video' && m.videoFile?.asset?.url) {
              url = m.videoFile.asset.url
            } else if (m.type === 'video' && m.videoFile?.asset?._id) {
              const fileId = m.videoFile.asset._id.replace('file-', '')
              url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
            } else if (m.type === 'video' && m.videoFile?.asset?._ref) {
              const fileId = m.videoFile.asset._ref.replace('file-', '')
              url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
            }
            return { type: m.type, url, caption: m.caption }
          }).filter((m: any) => m.url),
        }
    }
    const newsItems = await getNews();
    return newsItems.find(n => n.id === id);
}
export const addNews = async (newsItem: NewsItem): Promise<void> => {
    await delay(SIMULATED_DELAY);
    const news = await getNews();
    if (news.some(n => n.id === newsItem.id)) {
        throw new Error('News ID already exists');
    }
    setItem(KEYS.NEWS, [...news, newsItem]);
};
export const updateNews = async (newsItem: NewsItem): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let news = await getNews();
    news = news.map(n => (n.id === newsItem.id ? newsItem : n));
    setItem(KEYS.NEWS, news);
};
export const deleteNews = async (id: string): Promise<void> => {
    await delay(SIMULATED_DELAY);
    let news = await getNews();
    setItem(KEYS.NEWS, news.filter(n => n.id !== id));
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project"] | order(_createdAt desc){ "id": id.current, title, date, cover, excerpt }`
    const rows = await sanity.fetch(q)
    return rows.map((r: any) => ({ id: r.id, title: r.title, date: r.date, cover: mapImage(r.cover), excerpt: r.excerpt }))
  }
  return []
}
export const getProjectById = async (id: string): Promise<Project | undefined> => {
  if (useSanity && sanity) {
    const q = groq`*[_type=="project" && id.current==$id][0]{ 
      "id": id.current, 
      title, 
      date, 
      cover, 
      excerpt, 
      body, 
      media[]{
        type,
        url,
        image,
        videoFile{asset->{url, _ref, _id}}
      }
    }`
    const r = await sanity.fetch(q, { id })
    if (!r) return undefined
    
    const media = (r.media || []).map((m: any) => {
      const type = m?.type || 'image'
      let url = ''
      if (type === 'image' && m?.image) {
        url = mapImage(m.image)
      } else if (type === 'video' && m?.videoFile?.asset?.url) {
        url = m.videoFile.asset.url
      } else if (type === 'video' && m?.videoFile?.asset?._id) {
        const fileId = m.videoFile.asset._id.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      } else if (type === 'video' && m?.videoFile?.asset?._ref) {
        const fileId = m.videoFile.asset._ref.replace('file-', '')
        url = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${fileId}`
      } else {
        url = m?.url || ''
      }
      return { type, url, image: type === 'image' ? url : undefined }
    }).filter((m: any) => m.url)
    
    return { 
      id: r.id, 
      title: r.title, 
      date: r.date, 
      cover: mapImage(r.cover), 
      excerpt: r.excerpt, 
      body: r.body, 
      media: media.length > 0 ? media : undefined
    }
  }
  return undefined
}

// Simple hash function (for production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Users
// Email subscriber (password olmadan)
export const subscribeEmail = async (email: string): Promise<User> => {
  const normEmail = normalizeEmail(email);
  if (!normEmail) {
    throw new Error('Geçerli bir e-posta adresi girin');
  }
  // Eğer Sanity mutations aktif DEĞİLSE, local storage'ta tekrarı engelle
  if (!(useSanity && sanity && sanityMutations)) {
    const existingLocal = (getItem<User[]>(KEYS.USERS || 'birim_users') || [])
      .find(u => normalizeEmail(u.email) === normEmail);
    if (existingLocal) {
      throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı');
    }
  }
  if (useSanity && sanity) {
    // Check if user already exists
    const existingUser = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email][0]`,
      { email: normEmail }
    );
    if (existingUser) {
      // Sanity'de zaten varsa abonelik tekrarı olmasın
      throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı');
    }
    
    // Create email subscriber (password olmadan)
    // Email aboneliği için token yoksa local storage'a kaydet (daha esnek)
    if (!sanityMutations) {
      if (!ENABLE_LOCAL_FALLBACK) {
        throw new Error('Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.');
      }
      console.warn('Sanity token yapılandırılmamış. Email aboneliği local storage\'a kaydediliyor. CMS\'de görünmesi için .env dosyasına VITE_SANITY_TOKEN ekleyin.');
      // Local storage'a kaydet ve devam et
      await delay(SIMULATED_DELAY);
      const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
      // Üstte kontrol edilse de yarış koşulları için tekrar kontrol
      const exists = users.find(u => normalizeEmail(u.email) === normEmail);
      if (exists) throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı');
      
      const newUser: User = {
        _id: `user_${Date.now()}`,
        email: normEmail,
        name: '',
        company: '',
        profession: '',
        userType: 'email_subscriber',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      
      setItem(KEYS.USERS || 'birim_users', [...users, newUser]);
      return newUser;
    }
    
    try {
      console.log('Sanity\'ye email subscriber oluşturuluyor...', email);
      console.log('Token kontrolü:', sanityMutations ? 'Token mevcut' : 'Token yok');
      
      const user = await sanityMutations.create({
        _type: 'user',
        email: normEmail,
        password: '', // Email subscriber için password yok
        name: '',
        company: '',
        profession: '',
        userType: 'email_subscriber',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      
      console.log('Sanity\'de email subscriber başarıyla oluşturuldu:', user._id);
      console.log('Oluşturulan kullanıcı:', user);
      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        userType: user.userType as UserType,
        isActive: user.isActive,
        createdAt: user.createdAt || user._createdAt,
      };
    } catch (error: any) {
      // Sanity hatası varsa hatayı fırlat
      console.error('Sanity mutation hatası:', error);
      console.error('Hata detayları:', {
        message: error.message,
        statusCode: error.statusCode,
        responseBody: error.responseBody,
      });
      
      let errorMessage = 'E-posta aboneliği yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message?.includes('permission') || error.statusCode === 403) {
        errorMessage = 'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun.';
      } else if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı.';
      } else if (error.message) {
        errorMessage = `Sanity hatası: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Local storage fallback - sadece Sanity kullanılmıyorsa
  if (!useSanity || !sanity) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw new Error('Sunucuya yazma kapalı: Sanity yapılandırılmamış ve local fallback devre dışı.');
    }
    await delay(SIMULATED_DELAY);
    const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
    const existingUser = users.find(u => normalizeEmail(u.email) === normEmail);
    if (existingUser) throw new Error('Bu e-posta adresi zaten aboneliğe kayıtlı');
    
    const newUser: User = {
      _id: `user_${Date.now()}`,
      email: normEmail,
      name: '',
      company: '',
      profession: '',
      userType: 'email_subscriber',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    setItem(KEYS.USERS || 'birim_users', [...users, newUser]);
    return newUser;
  }
  
  // Sanity kullanılıyorsa ama buraya gelmemeli (yukarıda hata fırlatılmalı)
  throw new Error('Üye kaydı yapılamadı. Lütfen tekrar deneyin.');
};

// Full member registration (password ile)
export const registerUser = async (email: string, password: string, name?: string, company?: string, profession?: string): Promise<User> => {
  const normEmail = normalizeEmail(email);
  if (!normEmail) {
    throw new Error('Geçerli bir e-posta adresi girin');
  }
  if (useSanity && sanity) {
    // Check if user already exists
    const existingUser = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email][0]`,
      { email: normEmail }
    );
    if (existingUser) {
      // Eğer email_subscriber ise, full_member'a yükselt
      if (existingUser.userType === 'email_subscriber') {
        const passwordHash = await hashPassword(password);
        // Mutations için authenticated client kullan, yoksa hata fırlat
        if (!sanityMutations) {
          if (!ENABLE_LOCAL_FALLBACK) {
            throw new Error('Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.');
          }
          throw new Error('Sanity token yapılandırılmamış. Lütfen .env dosyasına VITE_SANITY_TOKEN ekleyin. Üye bilgileri CMS\'de görünmeyecektir.');
        }
        
        try {
          console.log('Sanity\'de email subscriber full_member\'a yükseltiliyor...', existingUser._id);
          const updatedUser = await sanityMutations.patch(existingUser._id).set({
            password: passwordHash,
            name: name || '',
            company: company || '',
            profession: profession || '',
            userType: 'full_member',
          }).commit();
          
          console.log('Sanity\'de kullanıcı başarıyla güncellendi:', updatedUser._id);
          return {
            _id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            company: updatedUser.company,
            profession: updatedUser.profession,
            userType: updatedUser.userType as UserType,
            isActive: updatedUser.isActive,
            createdAt: updatedUser.createdAt || updatedUser._createdAt,
          };
        } catch (error: any) {
          // Sanity hatası varsa hatayı fırlat (local storage'a düşme)
          console.error('Sanity mutation hatası:', error);
          let errorMessage = 'Üye kaydı güncellenirken bir hata oluştu. Lütfen tekrar deneyin.';
          
          if (error.message?.includes('permission')) {
            errorMessage = 'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun. Üye bilgileri CMS\'de görünmeyecektir.';
          } else if (error.message) {
            errorMessage = `Sanity hatası: ${error.message}`;
          }
          
          throw new Error(errorMessage);
        }
      } else {
        throw new Error('Bu e-posta adresi zaten kayıtlı');
      }
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create full member
    // Mutations için authenticated client kullan, yoksa hata fırlat
    if (!sanityMutations) {
      if (!ENABLE_LOCAL_FALLBACK) {
        throw new Error('Sunucuya yazma kapalı: Sanity token yok ve local fallback devre dışı. Lütfen VITE_SANITY_TOKEN ekleyin.');
      }
      throw new Error('Sanity token yapılandırılmamış. Lütfen proje kök dizininde .env dosyası oluşturup VITE_SANITY_TOKEN=your_token_here ekleyin. Token\'ı https://sanity.io/manage adresinden alabilirsiniz. Token\'ın "Editor" veya "Admin" yetkisi olmalıdır.');
    }
    
    try {
      console.log('Sanity\'ye full member oluşturuluyor...', email);
      const user = await sanityMutations.create({
        _type: 'user',
        email: normEmail,
        password: passwordHash,
        name: name || '',
        company: company || '',
        profession: profession || '',
        userType: 'full_member',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      
      console.log('Sanity\'de full member başarıyla oluşturuldu:', user._id);
      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        profession: user.profession,
        userType: user.userType as UserType,
        isActive: user.isActive,
        createdAt: user.createdAt || user._createdAt,
      };
    } catch (error: any) {
      // Sanity hatası varsa hatayı fırlat (local storage'a düşme)
      console.error('Sanity mutation hatası:', error);
      let errorMessage = 'Üye kaydı yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message?.includes('permission')) {
        errorMessage = 'İZİN HATASI: Sanity token\'ınızın "Editor" veya "Admin" yetkisi olduğundan emin olun. Üye bilgileri CMS\'de görünmeyecektir.';
      } else if (error.message) {
        errorMessage = `Sanity hatası: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Local storage fallback - sadece Sanity kullanılmıyorsa
  if (!useSanity || !sanity) {
    if (!ENABLE_LOCAL_FALLBACK) {
      throw new Error('Sunucuya yazma kapalı: Sanity yapılandırılmamış ve local fallback devre dışı.');
    }
    await delay(SIMULATED_DELAY);
    const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
    const existingUser = users.find(u => normalizeEmail(u.email) === normEmail);
    if (existingUser) {
      if (existingUser.userType === 'email_subscriber') {
        // Email subscriber'ı full member'a yükselt
        const passwordHash = await hashPassword(password);
        const userPasswords = getItem<{ [email: string]: string }>('birim_user_passwords') || {};
        userPasswords[normEmail] = passwordHash;
        setItem('birim_user_passwords', userPasswords);
        
        const updatedUser: User = {
          ...existingUser,
          name: name || '',
          company: company || '',
          profession: profession || '',
          userType: 'full_member',
        };
        setItem(KEYS.USERS || 'birim_users', users.map(u => normalizeEmail(u.email) === normEmail ? updatedUser : u));
        return updatedUser;
      }
      throw new Error('Bu e-posta adresi zaten kayıtlı');
    }
    
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      _id: `user_${Date.now()}`,
      email: normEmail,
      name: name || '',
      company: company || '',
      profession: profession || '',
      userType: 'full_member',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // Store password hash separately (in real app, don't store in localStorage)
    const userPasswords = getItem<{ [email: string]: string }>('birim_user_passwords') || {};
    userPasswords[normEmail] = passwordHash;
    setItem('birim_user_passwords', userPasswords);
    
    setItem(KEYS.USERS || 'birim_users', [...users, newUser]);
    return newUser;
  }
  
  // Sanity kullanılıyorsa ama buraya gelmemeli (yukarıda hata fırlatılmalı)
  throw new Error('Üye kaydı yapılamadı. Lütfen tekrar deneyin.');
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  const normEmail = normalizeEmail(email);
  if (useSanity && sanity) {
    const passwordHash = await hashPassword(password);
    const user = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email && password == $passwordHash && isActive == true][0]{
        _id,
        email,
        name,
        company,
        profession,
        userType,
        isActive,
        createdAt
      }`,
      { email: normEmail, passwordHash }
    );
    
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      userType: user.userType as UserType,
      isActive: user.isActive,
      createdAt: user.createdAt || user._createdAt,
    };
  }
  
  // Local storage fallback
  await delay(SIMULATED_DELAY);
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
  const userPasswords = getItem<{ [email: string]: string }>('birim_user_passwords') || {};
  const passwordHash = await hashPassword(password);
  
  const user = users.find(u => normalizeEmail(u.email) === normEmail && u.isActive);
  if (!user || userPasswords[normEmail] !== passwordHash) {
    return null;
  }
  
  return user;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const normEmail = normalizeEmail(email);
  if (useSanity && sanity) {
    const user = await sanity.fetch(
      groq`*[_type == "user" && lower(email) == $email][0]{
        _id,
        email,
        name,
        company,
        profession,
        userType,
        isActive,
        createdAt
      }`,
      { email: normEmail }
    );
    
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      userType: user.userType as UserType,
      isActive: user.isActive,
      createdAt: user.createdAt || user._createdAt,
    };
  }
  
  await delay(SIMULATED_DELAY);
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
  const user = users.find(u => normalizeEmail(u.email) === normEmail);
  return user || null;
};

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
        createdAt
      }`,
      { id }
    );
    
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      userType: user.userType,
      isActive: user.isActive,
      createdAt: user.createdAt || user._createdAt,
    };
  }
  
  await delay(SIMULATED_DELAY);
  const users = getItem<User[]>(KEYS.USERS || 'birim_users') || [];
  const user = users.find(u => u._id === id);
  return user || null;
};

