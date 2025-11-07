import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNewsById } from '../services/cms';
import type { NewsItem, NewsMedia } from '../types';
import { useTranslation } from '../i18n';

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const MediaComponent: React.FC<{ media: NewsMedia }> = ({ media }) => {
    const { t } = useTranslation();

    const renderMedia = () => {
        if (media.type === 'image') {
            return (
                <img 
                    src={media.url} 
                    alt={t(media.caption) || ''} 
                    className="w-full h-auto object-cover"
                />
            );
        }
        if (media.type === 'video') {
            // Video dosyası mı yoksa URL mi kontrol et
            const isVideoFile = media.url && (media.url.includes('.mp4') || media.url.includes('.webm') || media.url.includes('.mov') || media.url.includes('cdn.sanity.io/files'))
            if (isVideoFile) {
                return (
                    <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                        <video 
                            src={media.url} 
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            controls
                            playsInline
                        />
                    </div>
                );
            }
            // URL ise iframe kullan (harici video servisleri için)
            return (
                <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                    <iframe 
                        src={media.url} 
                        title={t(media.caption) || 'News video'} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                    ></iframe>
                </div>
            );
        }
        if (media.type === 'youtube') {
            const videoId = getYouTubeId(media.url);
            if (!videoId) return <p className="text-red-500 text-center">Geçersiz YouTube URL'si</p>;
            return (
                 <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={t(media.caption) || 'YouTube video player'}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                    ></iframe>
                </div>
            )
        }
        return null;
    };
    
    return (
        <figure className="my-8">
            {renderMedia()}
            {media.caption && <figcaption className="mt-2 text-center text-sm text-gray-500">{t(media.caption)}</figcaption>}
        </figure>
    );
};

export function NewsDetailPage() {
    const { newsId } = useParams<{ newsId: string }>();
    const [item, setItem] = useState<NewsItem | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchNews = async () => {
            // Reset state before fetching to prevent showing stale data
            setItem(undefined);
            setLoading(true);
            if (newsId) {
                const newsItem = await getNewsById(newsId);
                setItem(newsItem);
            }
            setLoading(false);
        };
        fetchNews();
    }, [newsId]);

    if (loading) {
        return <div className="pt-28 text-center">{t('loading')}...</div>;
    }
    
    if (!item) {
        return <div className="pt-28 text-center">{t('news_not_found')}</div>;
    }

    // By adding a `key` prop here, we ensure that React treats navigations
    // between different news items as distinct components, automatically resetting state.
    return (
        <div key={newsId} className="bg-white animate-fade-in-up">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-0">
                <div className="max-w-4xl mx-auto">
                    <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex items-center">
                            <li><Link to="/" className="hover:text-gray-800">{t('homepage')}</Link></li>
                            <li className="mx-2 font-light text-gray-400">|</li>
                            <li><Link to="/news" className="hover:text-gray-800">{t('news')}</Link></li>
                        </ol>
                    </nav>

                    <article>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-3 font-light">{formatDate(item.date)}</p>
                            <div className="h-px bg-gray-300"></div>
                        </div>
                        
                        <img 
                            src={item.mainImage} 
                            alt={t(item.title)}
                            className="w-full h-auto object-cover mb-6"
                        />
                    </article>
                </div>
            </div>
            
            <div className="bg-gray-100 w-full pt-6 pb-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-600 mb-4">{t(item.title)}</h1>
                        <div className="flex items-center min-h-[200px]">
                            <div className="prose prose-lg lg:prose-xl text-gray-700 max-w-none w-full [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                                <p className="font-light">{t(item.content)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="max-w-4xl mx-auto">
                    <article>

                        <div className="mt-12">
                            {item.media.map((media, index) => (
                                <MediaComponent key={index} media={media} />
                            ))}
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}