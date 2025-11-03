import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  getSiteSettings, updateSiteSettings,
  getCategories, addCategory, updateCategory, deleteCategory,
  getDesigners, addDesigner, updateDesigner, deleteDesigner,
  getProducts, addProduct, updateProduct, deleteProduct,
  getAboutPageContent, updateAboutPageContent,
  getContactPageContent, updateContactPageContent,
  getHomePageContent, updateHomePageContent,
  getFooterContent, updateFooterContent,
  getLanguages, updateLanguages,
  getNews, addNews, updateNews, deleteNews,
} from '../services/cms';
import type { SiteSettings, Category, Designer, Product, AboutPageContent, ContactPageContent, ContactLocation, HomePageContent, HeroMediaItem, FooterContent, SocialLink, LocalizedString, NewsItem, NewsMedia, ProductDimensionSet, ProductMaterial, ProductDimensionDetail } from '../types';
import { useTranslation } from '../i18n';

type AdminTab = 'site' | 'home' | 'categories' | 'designers' | 'products' | 'about' | 'contact' | 'footer' | 'languages' | 'news';

// Helper component for form rows
const FormRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1">{children}</div>
    </div>
);

// Helper component for input fields
const Input = (props: React.ComponentProps<'input'>) => (
    <input {...props} className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100 ${props.className}`} />
);

// Helper component for textareas
const Textarea = (props: React.ComponentProps<'textarea'>) => (
    <textarea {...props} rows={4} className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${props.className}`} />
);

// Helper component for selects
const Select = (props: React.ComponentProps<'select'>) => (
    <select {...props} className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 ${props.className}`} />
);

const createBlankProduct = (): Product => ({
  id: '', name: {}, designerId: '', categoryId: '', year: new Date().getFullYear(),
  description: {}, mainImage: '', alternativeImages: [],
  dimensions: [{ name: {}, details: [{ label: {}, value: '' }] }],
  buyable: false, price: 0, currency: 'TRY', materials: [], exclusiveContent: { images: [], drawings: [], models3d: [] }
});
const createBlankNews = (): NewsItem => ({ id: '', title: {}, date: '', content: {}, mainImage: '', media: [] });

const LocalizedInputComponent: React.FC<{
    label: string;
    value: LocalizedString;
    onChange: (value: LocalizedString) => void;
    languages: string[];
    Component?: React.ElementType;
}> = ({ label, value, onChange, languages, Component = Input }) => {

    const handleInputChange = (lang: string, text: string) => {
        const baseValue = typeof value === 'string' ? { [languages[0] || 'tr']: value } : (value || {});
        onChange({
            ...baseValue,
            [lang]: text,
        });
    };

    if (languages.length === 0) return null;

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 space-y-2">
                {languages.map(lang => (
                    <div key={lang} className="flex items-center gap-2">
                        <span className="w-12 text-xs font-semibold text-gray-500 uppercase bg-gray-100 text-center py-2.5 rounded-l-md border border-r-0 border-gray-300">{lang}</span>
                        <Component
                            value={(typeof value === 'object' && value?.[lang]) || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange(lang, e.target.value)}
                            className="flex-1 rounded-l-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};


export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('site');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const { t } = useTranslation();

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  // Form states
  const [siteSettingsForm, setSiteSettingsForm] = useState<SiteSettings>({ logoUrl: '', heroMediaUrl: '', heroMediaType: 'image', headerText: 'BİRİM', isHeaderTextVisible: true });
  const [logoGenPrompt, setLogoGenPrompt] = useState('');
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Category>({ id: '', name: {}, subtitle: {}, heroImage: '' });
  
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [designerForm, setDesignerForm] = useState<Designer>({ id: '', name: {}, bio: {}, image: '' });
  const [productToAssign, setProductToAssign] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Product>(createBlankProduct());
  const [aboutPageForm, setAboutPageForm] = useState<AboutPageContent | null>(null);
  const [contactPageForm, setContactPageForm] = useState<ContactPageContent | null>(null);
  const [homePageForm, setHomePageForm] = useState<HomePageContent | null>(null);
  const [footerForm, setFooterForm] = useState<FooterContent | null>(null);
  const [newLang, setNewLang] = useState('');
  const [languageVisibility, setLanguageVisibility] = useState<Record<string, boolean>>({});
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState<NewsItem>(createBlankNews());
  const [featuredProductsCategoryFilter, setFeaturedProductsCategoryFilter] = useState('all');

  const visibleLanguages = useMemo(() => languages.filter(lang => languageVisibility[lang]), [languages, languageVisibility]);


  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
        const [settingsData, categoriesData, designersData, productsData, aboutData, contactData, homeData, footerData, languagesData, newsData] = await Promise.all([
            getSiteSettings(),
            getCategories(),
            getDesigners(),
            getProducts(),
            getAboutPageContent(),
            getContactPageContent(),
            getHomePageContent(),
            getFooterContent(),
            getLanguages(),
            getNews(),
        ]);
        setSiteSettingsForm(settingsData);
        setCategories(categoriesData);
        setDesigners(designersData);
        setProducts(productsData);
        setAboutPageForm(aboutData);
        setContactPageForm(contactData);
        setHomePageForm(homeData);
        setFooterForm(footerData);
        setLanguages(languagesData);
        setNews(newsData);
    } catch (error) {
        console.error("Failed to fetch admin data", error);
        setMessage({ text: 'Error fetching data.', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (languages.length > 0) {
        setLanguageVisibility(prev => {
            const newVisibility = { ...prev };
            languages.forEach(lang => {
                if (!(lang in newVisibility)) {
                    newVisibility[lang] = true; // Default new languages to visible
                }
            });
            return newVisibility;
        });
    }
  }, [languages]);

  const handleDesignerSelect = (designer: Designer) => { setSelectedDesigner(designer); setDesignerForm(JSON.parse(JSON.stringify(designer))); };
  const clearDesignerForm = () => { setSelectedDesigner(null); setDesignerForm({ id: '', name: {}, bio: {}, image: '' }); };
  
  const handleCategorySelect = (category: Category) => { setSelectedCategory(category); setCategoryForm(JSON.parse(JSON.stringify(category))); };
  const clearCategoryForm = () => { setSelectedCategory(null); setCategoryForm({ id: '', name: {}, subtitle: {}, heroImage: '' }); };

  const handleProductSelect = (product: Product) => { setSelectedProduct(product); setProductForm(JSON.parse(JSON.stringify(product))); };
  const clearProductForm = () => { setSelectedProduct(null); setProductForm(createBlankProduct()); };

  const handleNewsSelect = (item: NewsItem) => { setSelectedNews(item); setNewsForm(JSON.parse(JSON.stringify(item))); };
  const clearNewsForm = () => { setSelectedNews(null); setNewsForm(createBlankNews()); };

  
  const handleDesignerSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (selectedDesigner) {
              await updateDesigner(designerForm);
              setDesigners(prev => prev.map(d => d.id === designerForm.id ? designerForm : d));
              setMessage({ text: 'Tasarımcı başarıyla güncellendi.', type: 'success' });
          } else {
              await addDesigner(designerForm);
              setDesigners(prev => [...prev, designerForm]);
              setMessage({ text: 'Tasarımcı başarıyla eklendi.', type: 'success' });
          }
          clearDesignerForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
  };
  
  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (selectedCategory) {
              await updateCategory(categoryForm);
              setCategories(prev => prev.map(c => c.id === categoryForm.id ? categoryForm : c));
              setMessage({ text: 'Kategori başarıyla güncellendi.', type: 'success' });
          } else {
              await addCategory(categoryForm);
              setCategories(prev => [...prev, categoryForm]);
              setMessage({ text: 'Kategori başarıyla eklendi.', type: 'success' });
          }
          clearCategoryForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (selectedProduct) {
              await updateProduct(productForm);
              setProducts(prev => prev.map(p => p.id === productForm.id ? productForm : p));
              setMessage({ text: 'Ürün başarıyla güncellendi.', type: 'success' });
          } else {
              await addProduct(productForm);
              setProducts(prev => [...prev, productForm]);
              setMessage({ text: 'Ürün başarıyla eklendi.', type: 'success' });
          }
          clearProductForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (selectedNews) {
              await updateNews(newsForm);
              setNews(prev => prev.map(n => n.id === newsForm.id ? newsForm : n));
              setMessage({ text: 'Haber başarıyla güncellendi.', type: 'success' });
          } else {
              await addNews(newsForm);
              setNews(prev => [...prev, newsForm]);
              setMessage({ text: 'Haber başarıyla eklendi.', type: 'success' });
          }
          clearNewsForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    if (window.confirm(`'${t(selectedCategory.name)}' kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteCategory(selectedCategory.id);
        setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
        setMessage({ text: 'Kategori silindi.', type: 'success' });
        clearCategoryForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
    }
  };
  
  const handleDeleteDesigner = async () => {
    if (!selectedDesigner) return;
    if (window.confirm(`'${t(selectedDesigner.name)}' tasarımcısını silmek istediğinizden emin misiniz?`)) {
        try {
            await deleteDesigner(selectedDesigner.id);
            setDesigners(prev => prev.filter(d => d.id !== selectedDesigner.id));
            setMessage({ text: 'Tasarımcı silindi.', type: 'success' });
            clearDesignerForm();
        } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    if (window.confirm(`'${t(selectedProduct.name)}' ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteProduct(selectedProduct.id);
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        setMessage({ text: 'Ürün silindi.', type: 'success' });
        clearProductForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
    }
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;
    if (window.confirm(t('delete_news_confirm', t(selectedNews.title)))) {
      try {
        await deleteNews(selectedNews.id);
        setNews(prev => prev.filter(n => n.id !== selectedNews.id));
        setMessage({ text: 'Haber silindi.', type: 'success' });
        clearNewsForm();
      } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
    }
  };

  
  const handleAssignProduct = async () => {
    if (!productToAssign || !selectedDesigner) return;
    try {
        const product = products.find(p => p.id === productToAssign);
        if (!product) throw new Error("Product not found");
        const updatedProduct = { ...product, designerId: selectedDesigner.id };
        await updateProduct(updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setMessage({ text: `'${t(product.name)}' ürünü ${t(selectedDesigner.name)} tasarımcısına atandı.`, type: 'success' });
        setProductToAssign('');
    } catch (error: any) { setMessage({ text: error.message, type: 'error' }); }
  };


  const handleSiteSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage({ text: '', type: 'success' });
    try {
      await updateSiteSettings(siteSettingsForm);
      setSiteSettingsForm(siteSettingsForm);
      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (error) { setMessage({ text: 'Failed to save settings.', type: 'error' }); }
  };
  
  const handleAboutPageSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aboutPageForm) return;
      setMessage({ text: '', type: 'success' });
      try {
          await updateAboutPageContent(aboutPageForm);
          setAboutPageForm(aboutPageForm);
          setMessage({ text: 'Hakkımızda sayfası başarıyla güncellendi.', type: 'success' });
      } catch (error) {
          setMessage({ text: 'Hakkımızda sayfası kaydedilemedi.', type: 'error' });
      }
  };
  
  const handleContactPageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPageForm) return;
    setMessage({ text: '', type: 'success' });
    try {
        await updateContactPageContent(contactPageForm);
        setContactPageForm(contactPageForm);
        setMessage({ text: 'İletişim sayfası başarıyla güncellendi.', type: 'success' });
    } catch (error) {
        setMessage({ text: 'İletişim sayfası kaydedilemedi.', type: 'error' });
    }
  };

  const handleHomePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homePageForm) return;
    try {
        await updateHomePageContent(homePageForm);
        setHomePageForm(homePageForm);
        setMessage({ text: 'Anasayfa başarıyla güncellendi.', type: 'success' });
    } catch (error) {
        setMessage({ text: 'Anasayfa kaydedilemedi.', type: 'error' });
    }
  };
  
  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerForm) return;
    try {
        await updateFooterContent(footerForm);
        setFooterForm(footerForm);
        setMessage({ text: 'Footer başarıyla güncellendi.', type: 'success' });
    } catch (error) {
        setMessage({ text: 'Footer kaydedilemedi.', type: 'error' });
    }
  };

  const handleAddLanguage = async () => {
    if (newLang && !languages.includes(newLang)) {
        const newLangs = [...languages, newLang];
        try {
            await updateLanguages(newLangs);
            setLanguages(newLangs);
            setNewLang('');
            setMessage({ text: `Dil '${newLang}' başarıyla eklendi.`, type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        }
    } else {
        setMessage({ text: 'Geçersiz veya mevcut bir dil kodu.', type: 'error' });
    }
  };


  const generateLogo = async () => {
    if (!logoGenPrompt) { setMessage({text: 'Please enter a prompt to generate a logo.', type: 'error'}); return; }
    setGenerating(true); setGeneratedLogoUrl(''); setMessage({ text: '', type: 'success' });
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `a minimalist, modern, vector logo for a high-end furniture company. Prompt: "${logoGenPrompt}". The logo should be on a transparent background.`,
            config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image?.imageBytes;
            if (base64ImageBytes) {
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setGeneratedLogoUrl(imageUrl);
                setSiteSettingsForm(prev => ({ ...prev, logoUrl: imageUrl }));
            } else {
                setMessage({text: 'Generated image data is missing. Please try again.', type: 'error'});
            }
        } else { setMessage({text: 'Could not generate logo. Please try again.', type: 'error'}); }
    } catch (error) { setMessage({text: 'An error occurred while generating the logo.', type: 'error'}); }
    setGenerating(false);
  };
  
  useEffect(() => {
    if (message.text) { const timer = setTimeout(() => setMessage({ text: '', type: 'success' }), 5000); return () => clearTimeout(timer); }
  }, [message]);

  const designerProducts = useMemo(() => {
    if (!selectedDesigner) return [];
    return products.filter(p => p.designerId === selectedDesigner.id);
  }, [selectedDesigner, products]);

  const otherProducts = useMemo(() => {
    if (!selectedDesigner) return [];
    return products.filter(p => p.designerId !== selectedDesigner.id);
  }, [selectedDesigner, products]);
  
  const filteredFeaturedProducts = useMemo(() => {
      if (featuredProductsCategoryFilter === 'all') {
          return products;
      }
      return products.filter(p => p.categoryId === featuredProductsCategoryFilter);
  }, [products, featuredProductsCategoryFilter]);

  // IMMUTABLE FORM HANDLERS
    const handleProductFormChange = (field: keyof Product, value: any) => {
        setProductForm(prev => ({ ...prev, [field]: value }));
    };
    const handleNewsFormChange = (field: keyof NewsItem, value: any) => {
        setNewsForm(prev => ({ ...prev, [field]: value }));
    };

    const handleHomePageMediaChange = (index: number, field: keyof HeroMediaItem, value: any) => {
        setHomePageForm(prev => {
            if (!prev) return prev;
            const newHeroMedia = prev.heroMedia.map((item, i) => i === index ? { ...item, [field]: value } : item);
            return { ...prev, heroMedia: newHeroMedia };
        });
    };
    const handleContactLocationChange = (index: number, field: keyof ContactLocation, value: any) => {
        setContactPageForm(prev => {
            if (!prev) return prev;
            const newLocations = prev.locations.map((item, i) => i === index ? { ...item, [field]: value } : item);
            return { ...prev, locations: newLocations };
        });
    };
    const handleFooterSocialLinkChange = (index: number, field: keyof SocialLink, value: any) => {
        setFooterForm(prev => {
            if (!prev) return prev;
            const newLinks = prev.socialLinks.map((item, i) => i === index ? { ...item, [field]: value } : item);
            return { ...prev, socialLinks: newLinks };
        });
    };
    const handleAboutValueChange = (index: number, field: 'title' | 'description', value: LocalizedString) => {
        setAboutPageForm(prev => {
            if (!prev) return prev;
            const newValues = prev.values.map((item, i) => i === index ? { ...item, [field]: value } : item);
            return { ...prev, values: newValues };
        });
    };
    const handleNewsMediaChange = (index: number, field: keyof NewsMedia, value: any) => {
        setNewsForm(prev => {
            const newMedia = prev.media.map((item, i) => i === index ? { ...item, [field]: value } : item);
            return { ...prev, media: newMedia };
        });
    };
    const handleProductArrayItemChange = <T, K extends keyof Product, F extends keyof T>(arrayField: K, index: number, itemField: F, value: T[F]) => {
        setProductForm(prev => {
            const newArray = (prev[arrayField] as T[]).map((item, i) => i === index ? { ...item, [itemField]: value } : item);
            return { ...prev, [arrayField]: newArray };
        });
    };
    const addProductArrayItem = <T, K extends keyof Product>(arrayField: K, newItem: T) => {
        setProductForm(prev => ({ ...prev, [arrayField]: [...(prev[arrayField] as T[]), newItem] }));
    };
    const removeProductArrayItem = <K extends keyof Product>(arrayField: K, index: number) => {
        setProductForm(prev => ({ ...prev, [arrayField]: (prev[arrayField] as any[]).filter((_, i) => i !== index) }));
    };
    const handleDimensionDetailChange = (dimIndex: number, detailIndex: number, field: keyof ProductDimensionDetail, value: any) => {
        setProductForm(prev => {
            const newDimensions = prev.dimensions.map((dim, dIdx) => {
                if (dIdx !== dimIndex) return dim;
                const newDetails = dim.details.map((detail, detailIdx) => {
                    if (detailIdx !== detailIndex) return detail;
                    return { ...detail, [field]: value };
                });
                return { ...dim, details: newDetails };
            });
            return { ...prev, dimensions: newDimensions };
        });
    };
    const addDimensionDetail = (dimIndex: number) => {
        setProductForm(prev => {
            const newDimensions = prev.dimensions.map((dim, i) => {
                if (i !== dimIndex) return dim;
                return { ...dim, details: [...dim.details, { label: {}, value: '' }] };
            });
            return { ...prev, dimensions: newDimensions };
        });
    };
    const removeDimensionDetail = (dimIndex: number, detailIndex: number) => {
        setProductForm(prev => {
            const newDimensions = prev.dimensions.map((dim, i) => {
                if (i !== dimIndex) return dim;
                const newDetails = dim.details.filter((_, dIdx) => dIdx !== detailIndex);
                return { ...dim, details: newDetails };
            });
            return { ...prev, dimensions: newDimensions };
        });
    };

  const handleResetContent = () => {
    if (window.confirm(t('reset_confirm_message'))) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('birim_')) {
          localStorage.removeItem(key);
        }
      });
      alert(t('reset_success_message'));
      window.location.reload();
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'news': return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">{t('news')}</h3>
                  <button onClick={clearNewsForm} className="text-sm text-gray-800 hover:text-black font-semibold">+ {t('add_news')}</button>
                </div>
                <div className="bg-white border rounded-lg max-h-[80vh] overflow-y-auto">
                    <ul className="divide-y">
                        {news.map(item => (
                            <li key={item.id} onClick={() => handleNewsSelect(item)} className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedNews?.id === item.id ? 'bg-gray-200' : ''}`}>{t(item.title)}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-4">{selectedNews ? t('edit_news_item', t(selectedNews.title)) : t('add_news')}</h3>
                <form onSubmit={handleNewsSubmit} className="space-y-6 bg-white p-6 border rounded-lg max-h-[80vh] overflow-y-auto">
                    <FormRow label="ID"><Input type="text" placeholder={t('news_id_label')} value={newsForm.id} onChange={e => handleNewsFormChange('id', e.target.value)} required disabled={!!selectedNews} /></FormRow>
                    <LocalizedInputComponent label={t('news_title_label')} value={newsForm.title} onChange={val => handleNewsFormChange('title', val)} languages={visibleLanguages} />
                    <FormRow label={t('news_date_label')}><Input type="text" value={newsForm.date} onChange={e => handleNewsFormChange('date', e.target.value)} required /></FormRow>
                    <LocalizedInputComponent label={t('news_content_label')} value={newsForm.content} onChange={val => handleNewsFormChange('content', val)} languages={visibleLanguages} Component={Textarea} />
                    <FormRow label={t('news_main_image_label')}><Input type="text" value={newsForm.mainImage} onChange={e => handleNewsFormChange('mainImage', e.target.value)} required /></FormRow>
                    
                    <div className="space-y-2 border-t pt-4">
                      <h4 className="font-semibold text-gray-800">{t('news_media_section')}</h4>
                      {newsForm.media.map((media, index) => (
                          <div key={index} className="p-3 border rounded-md space-y-2 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-600">Medya Öğesi {index+1}</p>
                              <button type="button" onClick={() => handleNewsFormChange('media', newsForm.media.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 p-1">Sil</button>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormRow label={t('media_type')}>
                                    <Select value={media.type} onChange={e => handleNewsMediaChange(index, 'type', e.target.value as 'image'|'video'|'youtube')}>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="youtube">YouTube</option>
                                    </Select>
                                </FormRow>
                                <FormRow label={t('media_url')}><Input value={media.url} onChange={e => handleNewsMediaChange(index, 'url', e.target.value)} /></FormRow>
                            </div>
                             <LocalizedInputComponent label={t('media_caption')} value={media.caption || {}} onChange={val => handleNewsMediaChange(index, 'caption', val)} languages={visibleLanguages} />
                          </div>
                      ))}
                      <button type="button" onClick={() => handleNewsFormChange('media', [...newsForm.media, {type: 'image', url: '', caption: {}}])} className="text-sm font-medium text-gray-800 hover:text-black">+ {t('add_media_item')}</button>
                    </div>

                    <div className="flex gap-4">
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">{selectedNews ? 'Güncelle' : 'Ekle'}</button>
                        <button type="button" onClick={clearNewsForm} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Temizle</button>
                        {selectedNews && <button type="button" onClick={handleDeleteNews} className="px-6 py-2 border border-red-500 text-red-500 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50">Sil</button>}
                    </div>
                </form>
            </div>
        </div>
      );
      case 'languages': return (
        <div>
            <h3 className="text-xl font-semibold mb-4">İçerik Dilleri Yönetimi</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="font-medium text-gray-700 mb-2">Formlarda Gösterilecek Diller</h4>
                    <div className="space-y-1 p-4 border rounded-md bg-gray-50/50">
                        {languages.map(lang => (
                            <label key={lang} className="flex items-center gap-2">
                                <input type="checkbox" checked={!!languageVisibility[lang]} onChange={e => setLanguageVisibility(prev => ({...prev, [lang]: e.target.checked}))} className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" />
                                <span className="uppercase font-medium text-gray-700">{lang}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="pt-6 border-t">
                     <h4 className="font-medium text-gray-700">Yeni Dil Ekle</h4>
                     <p className="text-sm text-gray-500 mb-2">2 harfli dil kodunu girin (örn: de, fr, es).</p>
                     <div className="flex gap-2">
                        <Input value={newLang} onChange={e => setNewLang(e.target.value.toLowerCase().trim())} placeholder="örn: de" />
                        <button onClick={handleAddLanguage} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700">Ekle</button>
                     </div>
                </div>
            </div>
        </div>
      );
      case 'site': return (
        <form onSubmit={handleSiteSettingsSave} className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Generate Logo with AI</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="text" value={logoGenPrompt} onChange={(e) => setLogoGenPrompt(e.target.value)} placeholder="e.g., a stylized letter 'B' with a chair silhouette" disabled={generating} />
            <button type="button" onClick={generateLogo} disabled={generating} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400">
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {generatedLogoUrl && (
            <div className="mt-4 p-4 border rounded-md bg-gray-100 flex flex-col items-center">
              <p className="text-sm font-medium text-gray-700 mb-2">Generated Logo:</p>
              <img src={generatedLogoUrl} alt="Generated Logo" className="w-24 h-24 object-contain bg-gray-300 rounded" />
            </div>
          )}
          <FormRow label="Logo URL">
              <Input type="text" value={siteSettingsForm.logoUrl} onChange={(e) => setSiteSettingsForm({...siteSettingsForm, logoUrl: e.target.value})} placeholder="https://example.com/logo.png or data:image/..."/>
          </FormRow>
          
          <div className="pt-6 border-t">
             <h3 className="text-lg font-medium text-gray-700 mb-2">Header Ayarları</h3>
             <FormRow label="Header Yanındaki Yazı">
                <Input type="text" value={siteSettingsForm.headerText || ''} onChange={(e) => setSiteSettingsForm({...siteSettingsForm, headerText: e.target.value})} placeholder="BİRİM" />
            </FormRow>
             <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="showHeadertext"
                  checked={!!siteSettingsForm.isHeaderTextVisible}
                  onChange={(e) => setSiteSettingsForm({...siteSettingsForm, isHeaderTextVisible: e.target.checked})}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <label htmlFor="showHeadertext" className="ml-2 block text-sm text-gray-700">
                  Header yanındaki yazıyı göster
                </label>
              </div>
          </div>
          
          <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">Save Settings</button>
        
            <div className="pt-8 mt-8 border-t border-red-300">
                <h3 className="text-lg font-medium text-red-700">{t('danger_zone')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                    {t('reset_content_warning')}
                </p>
                <button 
                    type="button" 
                    onClick={handleResetContent}
                    className="mt-4 px-4 py-2 border border-red-500 text-red-500 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50"
                >
                    {t('reset_content_to_defaults')}
                </button>
            </div>
        </form>
      );
      case 'home':
        if (!homePageForm) return <div>{t('loading')}...</div>;
        return (
            <form onSubmit={handleHomePageSubmit} className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Ana Bölüm Medyaları (Slider)</h3>
                    <div className="space-y-4">
                        {homePageForm.heroMedia.map((media, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Medya {index + 1}</h4>
                                    <button type="button" onClick={() => setHomePageForm(prev => ({...prev!, heroMedia: prev!.heroMedia.filter((_, i) => i !== index)}))} className="text-red-500 hover:text-red-700 p-1">Sil</button>
                                </div>
                                <FormRow label="URL"><Input value={media.url} onChange={e => handleHomePageMediaChange(index, 'url', e.target.value)} /></FormRow>
                                <FormRow label="Tip">
                                    <Select value={media.type} onChange={e => handleHomePageMediaChange(index, 'type', e.target.value as 'image'|'video'|'youtube')}>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="youtube">YouTube</option>
                                    </Select>
                                </FormRow>
                                <LocalizedInputComponent label="Başlık" value={media.title} onChange={val => handleHomePageMediaChange(index, 'title', val)} languages={visibleLanguages} />
                                <LocalizedInputComponent label="Alt Başlık" value={media.subtitle} onChange={val => handleHomePageMediaChange(index, 'subtitle', val)} languages={visibleLanguages} Component={Textarea} />
                                <LocalizedInputComponent label="Buton Metni" value={media.buttonText} onChange={val => handleHomePageMediaChange(index, 'buttonText', val)} languages={visibleLanguages} />
                                <FormRow label="Buton Linki"><Input value={media.buttonLink} onChange={e => handleHomePageMediaChange(index, 'buttonLink', e.target.value)} /></FormRow>
                                <label className="flex items-center space-x-2 mt-2">
                                    <input type="checkbox" checked={!!media.isButtonVisible} onChange={e => handleHomePageMediaChange(index, 'isButtonVisible', e.target.checked)} />
                                    <span className="text-gray-700">Buton Görünür</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setHomePageForm(prev => ({...prev!, heroMedia: [...prev!.heroMedia, {type: 'image', url: '', title: {}, subtitle: {}, buttonText: {}, buttonLink: '', isButtonVisible: true}]}))} className="mt-4 text-sm font-medium text-gray-800 hover:text-black">+ Medya Ekle</button>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Ana Bölüm Genel Ayarları</h3>
                    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={!!homePageForm.isLogoVisible}
                                onChange={e => setHomePageForm(prev => ({ ...prev!, isLogoVisible: e.target.checked }))}
                            />
                            <span className="text-gray-700">Bannerdaki logoyu göster</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={!!homePageForm.isHeroTextVisible}
                                onChange={e => setHomePageForm(prev => ({ ...prev!, isHeroTextVisible: e.target.checked }))}
                            />
                            <span className="text-gray-700">Tanıtım yazısını göster</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Öne Çıkan Ürünler</h3>
                     <FormRow label="Kategoriye Göre Filtrele">
                        <Select value={featuredProductsCategoryFilter} onChange={e => setFeaturedProductsCategoryFilter(e.target.value)}>
                            <option value="all">Tüm Kategoriler</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{t(c.name)}</option>)}
                        </Select>
                    </FormRow>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto border p-4 rounded-md">
                        {filteredFeaturedProducts.map(p => (
                            <label key={p.id} className="flex items-center space-x-2">
                                <input type="checkbox" checked={homePageForm.featuredProductIds.includes(p.id)} onChange={e => {
                                    const newIds = e.target.checked ? [...homePageForm.featuredProductIds, p.id] : homePageForm.featuredProductIds.filter(id => id !== p.id);
                                    setHomePageForm(prev => ({...prev!, featuredProductIds: newIds}));
                                }} />
                                <span className="text-gray-700">{t(p.name)}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Tasarımcı Odağı</h3>
                    <Select value={homePageForm.featuredDesignerId} onChange={e => setHomePageForm(prev => ({...prev!, featuredDesignerId: e.target.value}))}>
                        {designers.map(d => <option key={d.id} value={d.id}>{t(d.name)}</option>)}
                    </Select>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">İlham Bölümü</h3>
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                        <FormRow label="Arkaplan Görsel URL"><Input value={homePageForm.inspirationSection.backgroundImage} onChange={e => setHomePageForm(prev => ({...prev!, inspirationSection: {...prev!.inspirationSection, backgroundImage: e.target.value}}))} /></FormRow>
                        <LocalizedInputComponent label="Başlık" value={homePageForm.inspirationSection.title} onChange={val => setHomePageForm(prev => ({...prev!, inspirationSection: {...prev!.inspirationSection, title: val}}))} languages={visibleLanguages} />
                        <LocalizedInputComponent label="Alt Başlık" value={homePageForm.inspirationSection.subtitle} onChange={val => setHomePageForm(prev => ({...prev!, inspirationSection: {...prev!.inspirationSection, subtitle: val}}))} languages={visibleLanguages} />
                        <LocalizedInputComponent label="Buton Metni" value={homePageForm.inspirationSection.buttonText} onChange={val => setHomePageForm(prev => ({...prev!, inspirationSection: {...prev!.inspirationSection, buttonText: val}}))} languages={visibleLanguages} />
                        <FormRow label="Buton Linki"><Input value={homePageForm.inspirationSection.buttonLink} onChange={e => setHomePageForm(prev => ({...prev!, inspirationSection: {...prev!.inspirationSection, buttonLink: e.target.value}}))} /></FormRow>
                    </div>
                </div>
                <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">Anasayfayı Kaydet</button>
            </form>
        );
      case 'about':
        if (!aboutPageForm) return <div>{t('loading')}...</div>;
        return (
            <form onSubmit={handleAboutPageSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Ana Bölüm (Hero)</h3>
                        <FormRow label="Ana Görsel URL"><Input type="text" value={aboutPageForm.heroImage} onChange={e => setAboutPageForm(prev => ({...prev!, heroImage: e.target.value}))} /></FormRow>
                        <LocalizedInputComponent label="Ana Başlık" value={aboutPageForm.heroTitle} onChange={val => setAboutPageForm(prev => ({...prev!, heroTitle: val}))} languages={visibleLanguages} />
                        <LocalizedInputComponent label="Alt Başlık" value={aboutPageForm.heroSubtitle} onChange={val => setAboutPageForm(prev => ({...prev!, heroSubtitle: val}))} languages={visibleLanguages} Component={Textarea} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Hikaye Bölümü</h3>
                        <LocalizedInputComponent label="Hikaye Başlığı" value={aboutPageForm.storyTitle} onChange={val => setAboutPageForm(prev => ({...prev!, storyTitle: val}))} languages={visibleLanguages} />
                        <LocalizedInputComponent label="Hikaye İçeriği (Paragraf 1)" value={aboutPageForm.storyContentP1} onChange={val => setAboutPageForm(prev => ({...prev!, storyContentP1: val}))} languages={visibleLanguages} Component={Textarea} />
                        <LocalizedInputComponent label="Hikaye İçeriği (Paragraf 2)" value={aboutPageForm.storyContentP2} onChange={val => setAboutPageForm(prev => ({...prev!, storyContentP2: val}))} languages={visibleLanguages} Component={Textarea} />
                        <FormRow label="Hikaye Görseli URL"><Input type="text" value={aboutPageForm.storyImage} onChange={e => setAboutPageForm(prev => ({...prev!, storyImage: e.target.value}))} /></FormRow>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Alıntı Bölümü</h3>
                        <div className="space-y-2">
                           <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={!!aboutPageForm.isQuoteVisible}
                                    onChange={e => setAboutPageForm(prev => ({ ...prev!, isQuoteVisible: e.target.checked }))}
                                />
                                <span className="text-gray-700">Alıntı Bölümünü Göster</span>
                            </label>
                            {aboutPageForm.isQuoteVisible && (
                                <>
                                    <LocalizedInputComponent label="Alıntı Metni" value={aboutPageForm.quoteText} onChange={val => setAboutPageForm(prev => ({...prev!, quoteText: val}))} languages={visibleLanguages} Component={Textarea} />
                                    <FormRow label="Alıntı Sahibi"><Input type="text" value={aboutPageForm.quoteAuthor} onChange={e => setAboutPageForm(prev => ({...prev!, quoteAuthor: e.target.value}))} /></FormRow>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Değerler Bölümü</h3>
                      <LocalizedInputComponent label="Değerler Başlığı" value={aboutPageForm.valuesTitle} onChange={val => setAboutPageForm(prev => ({...prev!, valuesTitle: val}))} languages={visibleLanguages} />
                      <div className="space-y-2 mt-4">
                        {aboutPageForm.values.map((value, index) => (
                           <div key={index} className="flex flex-col gap-2 p-2 border rounded bg-gray-50/50">
                              <LocalizedInputComponent label={`Değer ${index+1} Başlığı`} value={value.title} onChange={val => handleAboutValueChange(index, 'title', val)} languages={visibleLanguages} />
                              <LocalizedInputComponent label={`Değer ${index+1} Açıklaması`} value={value.description} onChange={val => handleAboutValueChange(index, 'description', val)} languages={visibleLanguages} />
                              <button type="button" onClick={() => setAboutPageForm(prev => ({...prev!, values: prev!.values.filter((_, i) => i !== index)}))} className="text-red-500 hover:text-red-700 p-1 self-start text-sm">Değeri Sil</button>
                           </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setAboutPageForm(prev => ({...prev!, values: [...prev!.values, { title: {}, description: {} }]}))} className="mt-2 text-sm font-medium text-gray-800 hover:text-black">+ Değer Ekle</button>
                    </div>
                </div>
                <button type="submit" className="mt-6 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">Hakkımızda Sayfasını Kaydet</button>
            </form>
        );
      case 'contact':
        if (!contactPageForm) return <div>{t('loading')}...</div>;
        return (
            <form onSubmit={handleContactPageSubmit} className="space-y-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Sayfa Başlıkları</h3>
                <LocalizedInputComponent label="Ana Başlık" value={contactPageForm.title} onChange={val => setContactPageForm(prev => ({...prev!, title: val}))} languages={visibleLanguages} />
                <LocalizedInputComponent label="Alt Başlık" value={contactPageForm.subtitle} onChange={val => setContactPageForm(prev => ({...prev!, subtitle: val}))} languages={visibleLanguages} Component={Textarea} />

                <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Lokasyonlar</h3>
                    <div className="space-y-4">
                    {contactPageForm.locations.map((loc, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded bg-gray-50/50">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">Lokasyon {index + 1}</h4>
                                <button type="button" onClick={() => setContactPageForm(prev => ({...prev!, locations: prev!.locations.filter((_, i) => i !== index)}))} className="text-red-500 hover:text-red-700 p-1 self-center">Sil</button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <LocalizedInputComponent label="Başlık" value={loc.title} onChange={val => handleContactLocationChange(index, 'title', val)} languages={visibleLanguages} />
                                <LocalizedInputComponent label="Tip (örn: Mağaza, Fabrika)" value={loc.type} onChange={val => handleContactLocationChange(index, 'type', val)} languages={visibleLanguages} />
                                <FormRow label="Adres" className="md:col-span-2"><Input value={loc.address} onChange={e => handleContactLocationChange(index, 'address', e.target.value)} /></FormRow>
                                <FormRow label="Telefon"><Input value={loc.phone} onChange={e => handleContactLocationChange(index, 'phone', e.target.value)} /></FormRow>
                                <FormRow label="E-posta (opsiyonel)"><Input value={loc.email || ''} onChange={e => handleContactLocationChange(index, 'email', e.target.value)} /></FormRow>
                                 <FormRow label="Google Maps Gömme URL'si (opsiyonel)" className="md:col-span-2">
                                    <Input value={loc.mapEmbedUrl || ''} onChange={e => handleContactLocationChange(index, 'mapEmbedUrl', e.target.value)} />
                                </FormRow>
                            </div>
                        </div>
                    ))}
                    </div>
                    <button type="button" onClick={() => setContactPageForm(prev => ({...prev!, locations: [...prev!.locations, { type: {}, title: {}, address: '', phone: '', mapEmbedUrl: '' }] }))} className="mt-4 text-sm font-medium text-gray-800 hover:text-black">+ Lokasyon Ekle</button>
                </div>
                <button type="submit" className="mt-6 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">İletişim Sayfasını Kaydet</button>
            </form>
        );
      case 'designers': return (
          <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Tasarımcılar</h3>
                    <button onClick={clearDesignerForm} className="text-sm text-gray-800 hover:text-black font-semibold">+ Yeni Ekle</button>
                  </div>
                  <div className="bg-white border rounded-lg max-h-96 overflow-y-auto">
                      <ul className="divide-y">
                          {designers.map(d => (
                              <li key={d.id} onClick={() => handleDesignerSelect(d)} className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedDesigner?.id === d.id ? 'bg-gray-200' : ''}`}>
                                  {t(d.name)}
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
              <div className="md:col-span-2">
                  <h3 className="text-xl font-semibold mb-4">{selectedDesigner ? `Düzenle: ${t(selectedDesigner.name)}` : 'Yeni Tasarımcı Ekle'}</h3>
                  <form onSubmit={handleDesignerSubmit} className="space-y-4 bg-white p-6 border rounded-lg">
                    <FormRow label="ID (benzersiz, küçük harf, tireli, ör: 'jean-marie-massaud')">
                        <Input type="text" value={designerForm.id} onChange={e => setDesignerForm({...designerForm, id: e.target.value})} required disabled={!!selectedDesigner} />
                    </FormRow>
                    <LocalizedInputComponent label="İsim" value={designerForm.name} onChange={val => setDesignerForm({...designerForm, name: val})} languages={visibleLanguages} />
                    <LocalizedInputComponent label="Biyografi" value={designerForm.bio} onChange={val => setDesignerForm({...designerForm, bio: val})} languages={visibleLanguages} Component={Textarea} />
                    <FormRow label="Görsel URL"><Input type="text" value={designerForm.image} onChange={e => setDesignerForm({...designerForm, image: e.target.value})} required /></FormRow>
                      <div className="flex gap-4">
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">{selectedDesigner ? 'Güncelle' : 'Ekle'}</button>
                        <button type="button" onClick={clearDesignerForm} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Temizle</button>
                        {selectedDesigner && <button type="button" onClick={handleDeleteDesigner} className="px-6 py-2 border border-red-500 text-red-500 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50">Sil</button>}
                      </div>
                  </form>
                  {selectedDesigner && (
                    <div className="mt-8 bg-white p-6 border rounded-lg">
                        <h4 className="text-lg font-semibold mb-4">Tasarımcının Ürünleri</h4>
                        {designerProducts.length > 0 ? ( <ul className="list-disc pl-5 space-y-1 mb-6">{designerProducts.map(p => <li key={p.id}>{t(p.name)}</li>)}</ul> ) : ( <p className="text-gray-500 mb-6">Bu tasarımcıya atanmış ürün yok.</p> )}
                        <h4 className="text-lg font-semibold mb-4">Başka Bir Ürünü Bu Tasarımcıya Ata</h4>
                        <div className="flex gap-2">
                          <Select value={productToAssign} onChange={e => setProductToAssign(e.target.value)} className="flex-grow">
                              <option value="">Bir ürün seçin...</option>
                              {otherProducts.map(p => <option key={p.id} value={p.id}>{t(p.name)}</option>)}
                          </Select>
                          <button type="button" onClick={handleAssignProduct} disabled={!productToAssign} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400">Ata</button>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      );
      case 'products': return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Ürünler</h3>
                  <button onClick={clearProductForm} className="text-sm text-gray-800 hover:text-black font-semibold">+ Yeni Ekle</button>
                </div>
                <div className="bg-white border rounded-lg max-h-[80vh] overflow-y-auto">
                    <ul className="divide-y">
                        {products.map(p => (
                            <li key={p.id} onClick={() => handleProductSelect(p)} className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedProduct?.id === p.id ? 'bg-gray-200' : ''}`}>{t(p.name)}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-4">{selectedProduct ? `Düzenle: ${t(selectedProduct.name)}` : 'Yeni Ürün Ekle'}</h3>
                <form onSubmit={handleProductSubmit} className="space-y-6 bg-white p-6 border rounded-lg max-h-[80vh] overflow-y-auto">
                    <FormRow label="ID"><Input type="text" value={productForm.id} onChange={e => handleProductFormChange('id', e.target.value)} required disabled={!!selectedProduct} /></FormRow>
                    <LocalizedInputComponent label="İsim" value={productForm.name} onChange={val => handleProductFormChange('name', val)} languages={visibleLanguages} />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormRow label="Tasarımcı"><Select value={productForm.designerId} onChange={e => handleProductFormChange('designerId', e.target.value)} required>{designers.map(d => <option key={d.id} value={d.id}>{t(d.name)}</option>)}</Select></FormRow>
                        <FormRow label="Kategori"><Select value={productForm.categoryId} onChange={e => handleProductFormChange('categoryId', e.target.value)} required>{categories.map(c => <option key={c.id} value={c.id}>{t(c.name)}</option>)}</Select></FormRow>
                    </div>
                     <div className="grid sm:grid-cols-3 gap-4">
                        <FormRow label="Yıl"><Input type="number" value={productForm.year} onChange={e => handleProductFormChange('year', parseInt(e.target.value))} required /></FormRow>
                        <FormRow label="Fiyat"><Input type="number" value={productForm.price || 0} onChange={e => handleProductFormChange('price', parseFloat(e.target.value))} required /></FormRow>
                        <FormRow label="Para Birimi"><Input value={productForm.currency || 'TRY'} onChange={e => handleProductFormChange('currency', e.target.value)} required /></FormRow>
                    </div>
                    <LocalizedInputComponent label="Açıklama" value={productForm.description} onChange={val => handleProductFormChange('description', val)} languages={visibleLanguages} Component={Textarea} />
                    <FormRow label="Ana Görsel URL"><Input type="text" value={productForm.mainImage} onChange={e => handleProductFormChange('mainImage', e.target.value)} required /></FormRow>
                    <FormRow label="Alternatif Görsel URL'leri (virgülle ayırın)"><Textarea value={productForm.alternativeImages.join(', ')} onChange={e => handleProductFormChange('alternativeImages', e.target.value.split(',').map(s => s.trim()))} /></FormRow>
                    
                    <div className="space-y-2 border-t pt-4">
                      <h4 className="font-semibold text-gray-800">Ölçüler</h4>
                      {productForm.dimensions.map((dim, dimIndex) => (
                          <div key={dimIndex} className="p-3 border rounded-md space-y-2 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <LocalizedInputComponent label="Ölçü Seti Adı (örn: 3 Kişilik)" value={dim.name} onChange={val => handleProductArrayItemChange<ProductDimensionSet, 'dimensions', 'name'>('dimensions', dimIndex, 'name', val)} languages={visibleLanguages} />
                              <button type="button" onClick={() => removeProductArrayItem('dimensions', dimIndex)} className="text-red-500 hover:text-red-700 ml-2 p-1">Seti Sil</button>
                            </div>
                            {dim.details.map((detail, detailIndex) => (
                              <div key={detailIndex} className="flex gap-2 items-end pl-4">
                                <LocalizedInputComponent label="Etiket (örn: Genişlik)" value={detail.label} onChange={val => handleDimensionDetailChange(dimIndex, detailIndex, 'label', val)} languages={visibleLanguages} />
                                <FormRow label="Değer (örn: 240cm)"><Input value={detail.value} onChange={e => handleDimensionDetailChange(dimIndex, detailIndex, 'value', e.target.value)} /></FormRow>
                                <button type="button" onClick={() => removeDimensionDetail(dimIndex, detailIndex)} className="text-red-500 hover:text-red-700 p-1 mb-2">x</button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addDimensionDetail(dimIndex)} className="text-sm text-gray-600 hover:text-gray-900 pl-4">+ Detay Ekle</button>
                          </div>
                      ))}
                      <button type="button" onClick={() => addProductArrayItem<ProductDimensionSet, 'dimensions'>('dimensions', { name: {}, details: [{ label: {}, value: ''}]})} className="text-sm font-medium text-gray-800 hover:text-black">+ Ölçü Seti Ekle</button>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <h4 className="font-semibold text-gray-800">Malzemeler</h4>
                        {productForm.materials?.map((material, index) => (
                            <div key={index} className="flex gap-2 items-end p-2 border rounded-md bg-gray-50/50">
                                <LocalizedInputComponent label="Malzeme Adı" value={material.name} onChange={val => handleProductArrayItemChange<ProductMaterial, 'materials', 'name'>('materials', index, 'name', val)} languages={visibleLanguages} />
                                <FormRow label="Görsel URL"><Input value={material.image} onChange={e => handleProductArrayItemChange<ProductMaterial, 'materials', 'image'>('materials', index, 'image', e.target.value)} /></FormRow>
                                <button type="button" onClick={() => removeProductArrayItem('materials', index)} className="text-red-500 hover:text-red-700 p-1 mb-2">Sil</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addProductArrayItem<ProductMaterial, 'materials'>('materials', { name: {}, image: '' })} className="text-sm font-medium text-gray-800 hover:text-black">+ Malzeme Ekle</button>
                    </div>

                    <FormRow label="Satın Alınabilir mi?"><input type="checkbox" checked={productForm.buyable} onChange={e => handleProductFormChange('buyable', e.target.checked)} className="h-4 w-4" /></FormRow>
                    
                    <div className="flex gap-4">
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">{selectedProduct ? 'Güncelle' : 'Ekle'}</button>
                        <button type="button" onClick={clearProductForm} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Temizle</button>
                        {selectedProduct && <button type="button" onClick={handleDeleteProduct} className="px-6 py-2 border border-red-500 text-red-500 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50">Sil</button>}
                    </div>
                </form>
            </div>
        </div>
      );
      case 'categories': return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Kategoriler</h3>
                  <button onClick={clearCategoryForm} className="text-sm text-gray-800 hover:text-black font-semibold">+ Yeni Ekle</button>
                </div>
                <div className="bg-white border rounded-lg max-h-96 overflow-y-auto">
                    <ul className="divide-y">
                        {categories.map(c => (
                            <li key={c.id} onClick={() => handleCategorySelect(c)} className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedCategory?.id === c.id ? 'bg-gray-200' : ''}`}>{t(c.name)}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-4">{selectedCategory ? `Düzenle: ${t(selectedCategory.name)}` : 'Yeni Kategori Ekle'}</h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4 bg-white p-6 border rounded-lg">
                    <FormRow label="ID (benzersiz, küçük harf, ör: 'kanepeler')"><Input type="text" value={categoryForm.id} onChange={e => setCategoryForm({...categoryForm, id: e.target.value})} required disabled={!!selectedCategory} /></FormRow>
                    <LocalizedInputComponent label="İsim" value={categoryForm.name} onChange={val => setCategoryForm({...categoryForm, name: val})} languages={visibleLanguages} />
                    <LocalizedInputComponent label="Alt Başlık" value={categoryForm.subtitle} onChange={val => setCategoryForm({...categoryForm, subtitle: val})} languages={visibleLanguages} Component={Textarea} />
                    <FormRow label="Kapak Görseli URL"><Input type="text" value={categoryForm.heroImage} onChange={e => setCategoryForm({...categoryForm, heroImage: e.target.value})} required /></FormRow>
                    <div className="flex gap-4">
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">{selectedCategory ? 'Güncelle' : 'Ekle'}</button>
                        <button type="button" onClick={clearCategoryForm} className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Temizle</button>
                        {selectedCategory && <button type="button" onClick={handleDeleteCategory} className="px-6 py-2 border border-red-500 text-red-500 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-red-50">Sil</button>}
                    </div>
                </form>
            </div>
        </div>
      );
      case 'footer':
        if (!footerForm) return <div>{t('loading')}...</div>;
        return (
            <form onSubmit={handleFooterSubmit} className="space-y-8">
                <LocalizedInputComponent label="Telif Hakkı Metni" value={footerForm.copyrightText} onChange={val => setFooterForm(prev => ({...prev!, copyrightText: val}))} languages={visibleLanguages} />
                <FormRow label="Partner Marka İsimleri (virgülle ayırın)">
                    <Input value={footerForm.partnerNames.join(', ')} onChange={e => setFooterForm(prev => ({...prev!, partnerNames: e.target.value.split(',').map(s => s.trim())}))} />
                </FormRow>

                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Sosyal Medya Linkleri</h3>
                    <div className="space-y-4">
                        {footerForm.socialLinks.map((link, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{link.name || `Link ${index + 1}`}</h4>
                                    <button type="button" onClick={() => setFooterForm(prev => ({...prev!, socialLinks: prev!.socialLinks.filter((_, i) => i !== index)}))} className="text-red-500 hover:text-red-700 p-1">Sil</button>
                                </div>
                                <FormRow label="İsim"><Input value={link.name} onChange={e => handleFooterSocialLinkChange(index, 'name', e.target.value)} /></FormRow>
                                <FormRow label="URL"><Input value={link.url} onChange={e => handleFooterSocialLinkChange(index, 'url', e.target.value)} /></FormRow>
                                <FormRow label="SVG İkon Kodu"><Textarea value={link.svgIcon} onChange={e => handleFooterSocialLinkChange(index, 'svgIcon', e.target.value)} rows={2} /></FormRow>
                                <label className="flex items-center text-gray-700"><input type="checkbox" checked={link.isEnabled} onChange={e => handleFooterSocialLinkChange(index, 'isEnabled', e.target.checked)} className="mr-2" /> Aktif</label>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => setFooterForm(prev => ({...prev!, socialLinks: [...prev!.socialLinks, {name: '', url: '', svgIcon: '', isEnabled: true}]}))} className="mt-4 text-sm font-medium text-gray-800 hover:text-black">+ Sosyal Medya Linki Ekle</button>
                </div>

                <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700">Footer'ı Kaydet</button>
            </form>
        );
      default: return null;
    }
  };


  const TabButton: React.FC<{ tabId: AdminTab; children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabId
          ? 'bg-gray-800 text-white'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );

  if (loading) return <div className="pt-28 container mx-auto px-4">{t('admin_loading')}</div>;

  return (
    <div className="bg-gray-50 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Paneli</h1>
        
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b pb-4">
          <TabButton tabId="site">Site Ayarları</TabButton>
          <TabButton tabId="home">Anasayfa</TabButton>
          <TabButton tabId="products">Ürünler</TabButton>
          <TabButton tabId="designers">Tasarımcılar</TabButton>
          <TabButton tabId="categories">Kategoriler</TabButton>
          <TabButton tabId="news">Haberler</TabButton>
          <TabButton tabId="about">Hakkımızda</TabButton>
          <TabButton tabId="contact">İletişim</TabButton>
          <TabButton tabId="footer">Footer</TabButton>
          <TabButton tabId="languages">Diller</TabButton>
        </div>

        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md border">
          {message.text && (
             <div className={`p-4 mb-6 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
             </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}