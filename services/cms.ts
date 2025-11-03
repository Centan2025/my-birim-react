import { initialData, KEYS } from '../data';
import type { SiteSettings, Category, Designer, Product, AboutPageContent, ContactPageContent, HomePageContent, FooterContent, NewsItem } from '../types';

const SIMULATED_DELAY = 200;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
    await delay(SIMULATED_DELAY);
    return getItem<SiteSettings>(KEYS.SITE_SETTINGS);
};
export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.SITE_SETTINGS, settings);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
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
    await delay(SIMULATED_DELAY);
    return getItem<Designer[]>(KEYS.DESIGNERS);
};
export const getDesignerById = async (id: string): Promise<Designer | undefined> => {
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
    await delay(SIMULATED_DELAY);
    return getItem<Product[]>(KEYS.PRODUCTS);
};
export const getProductById = async (id: string): Promise<Product | undefined> => {
    const products = await getProducts();
    return products.find(p => p.id === id);
}
export const getProductsByCategoryId = async (categoryId: string): Promise<Product[]> => {
    const products = await getProducts();
    return products.filter(p => p.categoryId === categoryId);
}
export const getProductsByDesignerId = async (designerId: string): Promise<Product[]> => {
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
    await delay(SIMULATED_DELAY);
    return getItem<AboutPageContent>(KEYS.ABOUT_PAGE);
};
export const updateAboutPageContent = async (content: AboutPageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.ABOUT_PAGE, content);
};

export const getContactPageContent = async (): Promise<ContactPageContent> => {
    await delay(SIMULATED_DELAY);
    return getItem<ContactPageContent>(KEYS.CONTACT_PAGE);
};
export const updateContactPageContent = async (content: ContactPageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.CONTACT_PAGE, content);
};

export const getHomePageContent = async (): Promise<HomePageContent> => {
    await delay(SIMULATED_DELAY);
    return getItem<HomePageContent>(KEYS.HOME_PAGE);
};
export const updateHomePageContent = async (content: HomePageContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.HOME_PAGE, content);
};

// Footer Content
export const getFooterContent = async (): Promise<FooterContent> => {
    await delay(SIMULATED_DELAY);
    return getItem<FooterContent>(KEYS.FOOTER);
};
export const updateFooterContent = async (content: FooterContent): Promise<void> => {
    await delay(SIMULATED_DELAY);
    setItem(KEYS.FOOTER, content);
};

// News
export const getNews = async (): Promise<NewsItem[]> => {
    await delay(SIMULATED_DELAY);
    return getItem<NewsItem[]>(KEYS.NEWS);
};
export const getNewsById = async (id: string): Promise<NewsItem | undefined> => {
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
