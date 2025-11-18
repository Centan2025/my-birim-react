/**
 * ÖRNEK: services/cms.ts dosyasına eklenecek kod
 * Statik dosyalardan ürün okuma desteği
 */

// services/cms.ts dosyasının başına ekleyin:
import { loadProductsFromFiles, loadProductById } from './productsLoader';
// VEYA tek dosya yaklaşımı için:
// import allProducts, { getProductById as getProductByIdFromFiles } from '../data/products';

// getProducts fonksiyonunu şu şekilde güncelleyin:
export const getProducts = async (): Promise<Product[]> => {
    // ÖNCE statik dosyalardan dene (CMS yerine)
    const USE_STATIC_FILES = import.meta.env.VITE_USE_STATIC_PRODUCTS === 'true';
    
    if (USE_STATIC_FILES) {
        try {
            const products = await loadProductsFromFiles();
            if (products.length > 0) {
                return products;
            }
        } catch (error) {
            console.warn('Statik dosyalardan ürünler yüklenemedi, CMS\'e dönülüyor...', error);
        }
    }

    // Fallback: Mevcut CMS kodu
    if (useSanity && sanity) {
        const query = groq`*[_type == "product"] | order(year desc){
          // ... mevcut query
        }`
        const rows = await sanity.fetch(query)
        return rows.map((r: any) => normalizeProduct({ /* ... */ }))
    }
    
    await delay(SIMULATED_DELAY);
    return getItem<Product[]>(KEYS.PRODUCTS).map(normalizeProduct);
};

// getProductById fonksiyonunu şu şekilde güncelleyin:
export const getProductById = async (id: string): Promise<Product | undefined> => {
    const USE_STATIC_FILES = import.meta.env.VITE_USE_STATIC_PRODUCTS === 'true';
    
    if (USE_STATIC_FILES) {
        try {
            const product = await loadProductById(id);
            if (product) {
                return product;
            }
        } catch (error) {
            console.warn(`Ürün ${id} statik dosyalardan yüklenemedi, CMS'e dönülüyor...`, error);
        }
    }

    // Fallback: Mevcut CMS kodu
    if (useSanity && sanity) {
        // ... mevcut query
    }
    
    const products = await getProducts();
    return products.find(p => p.id === id);
};

// getProductsByCategoryId fonksiyonunu şu şekilde güncelleyin:
export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
    const USE_STATIC_FILES = import.meta.env.VITE_USE_STATIC_PRODUCTS === 'true';
    
    if (USE_STATIC_FILES) {
        try {
            const products = await loadProductsByCategory(categoryId);
            if (products.length > 0) {
                return products;
            }
        } catch (error) {
            console.warn('Statik dosyalardan kategori ürünleri yüklenemedi, CMS\'e dönülüyor...', error);
        }
    }

    // Fallback: Mevcut CMS kodu
    // ...
};


