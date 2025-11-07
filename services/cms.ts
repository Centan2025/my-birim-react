import { initialData, KEYS } from '../data';
import type { SiteSettings, Category, Designer, Product, AboutPageContent, ContactPageContent, HomePageContent, FooterContent, NewsItem, ProductMaterial, ProductVariant, Project, LocalizedString } from '../types';
import { createClient } from '@sanity/client'
import groq from 'groq'
import imageUrlBuilder from '@sanity/image-url'

const SIMULATED_DELAY = 200;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Sanity runtime setup (auto enable if env present) ---
// Prefer env vars; if missing, fall back to known defaults
const SANITY_PROJECT_ID = (import.meta as any)?.env?.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const SANITY_DATASET = (import.meta as any)?.env?.VITE_SANITY_DATASET || 'production'
const SANITY_API_VERSION = (import.meta as any)?.env?.VITE_SANITY_API_VERSION || '2025-01-01'
const useSanity = Boolean(SANITY_PROJECT_ID && SANITY_DATASET)

const sanity = useSanity
  ? createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, useCdn: true })
  : null

const urlFor = (source: any) => (useSanity && sanity ? imageUrlBuilder(sanity).image(source) : null)

// --- DEBUG: Print env + toggle once on startup ---
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  console.info('SANITY env', {
    projectId: (import.meta as any)?.env?.VITE_SANITY_PROJECT_ID,
    dataset: (import.meta as any)?.env?.VITE_SANITY_DATASET,
    apiVersion: (import.meta as any)?.env?.VITE_SANITY_API_VERSION,
    useSanity,
  })
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

// Languages
export const getLanguages = async (): Promise<string[]> => {
    await delay(SIMULATED_DELAY);
    return getItem<string[]>(KEYS.LANGUAGES);
};
export const updateLanguages = async (languages: string[]): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.LANGUAGES, languages);
};

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings> => {
    if (useSanity && sanity) {
        const q = groq`*[_type == "siteSettings"][0]`
        return await sanity.fetch(q)
    }
    await delay(SIMULATED_DELAY);
    return getItem<SiteSettings>(KEYS.SITE_SETTINGS);
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
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: d?.file?.asset?._ref || d?.file?.asset?._id || '' })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: m?.file?.asset?._ref || m?.file?.asset?._id || '' })),
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
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: d?.file?.asset?._ref || d?.file?.asset?._id || '' })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: m?.file?.asset?._ref || m?.file?.asset?._id || '' })),
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
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: d?.file?.asset?._ref || d?.file?.asset?._id || '' })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: m?.file?.asset?._ref || m?.file?.asset?._id || '' })),
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
            drawings: (r?.exclusiveContent?.drawings || []).map((d: any) => ({ name: d?.name, url: d?.file?.asset?._ref || d?.file?.asset?._id || '' })),
            models3d: (r?.exclusiveContent?.models3d || []).map((m: any) => ({ name: m?.name, url: m?.file?.asset?._ref || m?.file?.asset?._id || '' })),
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
        const q = groq`*[_type == "aboutPage"][0]`
        return await sanity.fetch(q)
    }
    await delay(SIMULATED_DELAY);
    return getItem<AboutPageContent>(KEYS.ABOUT_PAGE);
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
        return data;
    }
    await delay(SIMULATED_DELAY);
    return getItem<HomePageContent>(KEYS.HOME_PAGE);
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
            }
        }`
        const data = await sanity.fetch(q);
        if (data?.partners) {
            data.partners = data.partners.map((p: any) => ({
                ...p,
                logo: mapImage(p.logo)
            }));
        }
        return data;
    }
    await delay(SIMULATED_DELAY);
    return getItem<FooterContent>(KEYS.FOOTER);
};
export const updateFooterContent = async (content: FooterContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.FOOTER, content);
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

