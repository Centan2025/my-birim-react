import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '../App';
import { useTranslation } from '../i18n';
import { getNews, addNews, updateNews, deleteNews } from '../services/cms';
import { KEYS } from '../data';
import type { NewsItem, NewsMedia, LocalizedString } from '../types';

const initialNewsItem: NewsItem = {
    id: '',
    title: { tr: '', en: '' },
    date: '',
    content: { tr: '', en: '' },
    mainImage: '',
    media: [],
};

const initialMediaItem: NewsMedia = {
    type: 'image',
    url: '',
    caption: { tr: '', en: '' }
};

const LocalizedStringInput: React.FC<{
    label: string;
    value: LocalizedString;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isTextarea?: boolean;
}> = ({ label, value, name, onChange, isTextarea = false }) => {
    const { supportedLocales } = useTranslation();
    const val = typeof value === 'string' ? { tr: value, en: value } : value || { tr: '', en: '' };

    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 space-y-2">
                {supportedLocales.slice(0, 2).map(lang => ( // Only show TR and EN for simplicity
                    <InputComponent
                        key={lang}
                        name={`${name}.${lang}`}
                        // @ts-ignore
                        value={val[lang] || ''}
                        onChange={onChange}
                        placeholder={`${label} (${lang.toUpperCase()})`}
                        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isTextarea ? 'min-h-[100px]' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}


export function AdminPage() {
    const { isLoggedIn } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
    const [formData, setFormData] = useState<NewsItem>(initialNewsItem);
    
    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const newsList = await getNews();
            setNews(newsList);
        } catch (error) {
            console.error("Failed to fetch news", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNews();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, fetchNews]);

    const handleOpenForm = (item?: NewsItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(JSON.parse(JSON.stringify(item))); // Deep copy to avoid mutation
        } else {
            setEditingItem(null);
            setFormData(initialNewsItem);
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        setFormData(initialNewsItem);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        if (keys.length > 1) { // Localized string
            const [field, lang] = keys;
            setFormData(prev => ({
                ...prev,
                [field]: { ...(typeof prev[field as keyof NewsItem] === 'object' ? prev[field as keyof NewsItem] : {}), [lang]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleMediaChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        
        const newMedia = [...formData.media];
        const itemToUpdate = { ...newMedia[index] };

        if (keys.length > 1) { // caption
            const [field, lang] = keys;
            // @ts-ignore
            itemToUpdate[field] = { ...(typeof itemToUpdate[field] === 'object' ? itemToUpdate[field] : {}), [lang]: value };
        } else {
            // @ts-ignore
            itemToUpdate[name] = value;
        }
        newMedia[index] = itemToUpdate;
        setFormData(prev => ({ ...prev, media: newMedia }));
    };

    const handleAddMedia = () => {
        setFormData(prev => ({ ...prev, media: [...prev.media, { ...initialMediaItem }] }));
    };

    const handleRemoveMedia = (index: number) => {
        setFormData(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.id) {
            alert('ID is required');
            return;
        }
        setLoading(true);
        try {
            if (editingItem) {
                await updateNews(formData);
            } else {
                await addNews(formData);
            }
            await fetchNews();
            handleCloseForm();
        } catch (error: any) {
            console.error("Failed to save news item", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item: NewsItem) => {
        if (window.confirm(t('delete_news_confirm', t(item.title)))) {
            setLoading(true);
            try {
                await deleteNews(item.id);
                await fetchNews();
            } catch (error) {
                console.error("Failed to delete news item", error);
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleResetContent = () => {
        if (window.confirm(t('reset_confirm_message'))) {
            try {
                // Clear all keys managed by the CMS
                Object.values(KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
                alert(t('reset_success_message'));
                window.location.reload();
            } catch (error) {
                console.error("Failed to reset content", error);
                alert("An error occurred while resetting content.");
            }
        }
    };

    if (loading && !isFormOpen) {
        return <div className="pt-28 text-center">{t('admin_loading')}</div>;
    }

    if (!isLoggedIn) {
        return (
            <div className="pt-28 container mx-auto text-center">
                <h1 className="text-2xl">{t('login_prompt')}</h1>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 animate-fade-in-up min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t('news_management')}</h1>
                    <button onClick={() => handleOpenForm()} className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                        {t('add_news')}
                    </button>
                </div>

                {isFormOpen ? (
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-6">{editingItem ? t('edit_news_item', t(editingItem.title)) : t('add_news')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="id" className="block text-sm font-medium text-gray-700">{t('news_id_label')}</label>
                                <input type="text" name="id" id="id" value={formData.id} onChange={handleChange} disabled={!!editingItem} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" />
                            </div>

                            <LocalizedStringInput label={t('news_title_label')} name="title" value={formData.title} onChange={handleChange} />
                            
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">{t('news_date_label')}</label>
                                <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <LocalizedStringInput label={t('news_content_label')} name="content" value={formData.content} onChange={handleChange} isTextarea />
                            
                            <div>
                                <label htmlFor="mainImage" className="block text-sm font-medium text-gray-700">{t('news_main_image_label')}</label>
                                <input type="text" name="mainImage" id="mainImage" value={formData.mainImage} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900">{t('news_media_section')}</h3>
                                <div className="space-y-4 mt-4">
                                    {formData.media.map((media, index) => (
                                        <div key={index} className="border p-4 rounded-md space-y-3 relative">
                                            <button type="button" onClick={() => handleRemoveMedia(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">&times;</button>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('media_type')}</label>
                                                <select name="type" value={media.type} onChange={(e) => handleMediaChange(index, e)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                                    <option value="image">Image</option>
                                                    <option value="video">Video</option>
                                                    <option value="youtube">YouTube</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('media_url')}</label>
                                                <input type="text" name="url" value={media.url} onChange={(e) => handleMediaChange(index, e)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                            </div>
                                             <LocalizedStringInput label={t('media_caption')} name="caption" value={media.caption as LocalizedString} onChange={(e) => handleMediaChange(index, e)} />
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={handleAddMedia} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">{t('add_media_item')}</button>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={handleCloseForm} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700">Save</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {news.map(item => (
                                <li key={item.id}>
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-medium text-gray-900 truncate">{t(item.title)}</p>
                                            <p className="text-sm text-gray-500">{item.id} - {item.date}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => handleOpenForm(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Danger Zone */}
                <div className="mt-16 p-6 border-2 border-dashed border-red-400 rounded-lg">
                    <h2 className="text-xl font-bold text-red-700">{t('danger_zone')}</h2>
                    <p className="text-gray-600 mt-2">{t('reset_content_warning')}</p>
                    <button
                        onClick={handleResetContent}
                        className="mt-4 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        {t('reset_content_to_defaults')}
                    </button>
                </div>
            </div>
        </div>
    );
}
