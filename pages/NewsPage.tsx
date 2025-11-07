import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { NewsItem } from '../types';
import { getNews } from '../services/cms';
import { useTranslation } from '../i18n';

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => {
  const { t } = useTranslation();
  
  return (
    <Link to={`/news/${item.id}`} className="group block relative overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl aspect-[4/5]">
      <img 
        src={item.mainImage} 
        alt={t(item.title)} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 text-white">
        <p className="text-sm opacity-80">{formatDate(item.date)}</p>
        <h2 className="text-2xl font-light mt-1 group-hover:underline">{t(item.title)}</h2>
      </div>
    </Link>
  );
};

export function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const newsList = await getNews();
      setNews(newsList);
      setLoading(false);
    };

    fetchNews();
  }, []);
  
  if (loading) {
    return <div className="pt-20 text-center">{t('loading')}...</div>;
  }
  
  return (
    <div className="bg-gray-100 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-gray-600 uppercase">{t('news_title')}</h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {news.length > 0 ? (
            news.map((item, index) => (
              <div key={item.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                  <NewsCard item={item} />
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center col-span-full">{t('no_news')}</p>
          )}
        </div>
      </div>
    </div>
  );
}