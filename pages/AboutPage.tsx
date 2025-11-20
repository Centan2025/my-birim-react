import React, { useState, useEffect, PropsWithChildren } from 'react';
import { getAboutPageContent } from '../services/cms';
import type { AboutPageContent, LocalizedString } from '../types';
import { OptimizedImage } from '../components/OptimizedImage';
import { useTranslation } from '../i18n';

const ValuesIcon: React.FC<PropsWithChildren> = ({ children }) => (
    <div className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4">
        {children}
    </div>
);

const QualityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const DesignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
const CraftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 4-10 10-4-4 10-10"></path><path d="m16 6-1.5-1.5a3 3 0 0 0-4 0l-1.5 1.5"></path><path d="m3 21 4-4"></path><path d="m15 11 4 4"></path></svg>;

const ICONS: { [key: string]: React.ComponentType } = {
    "Kalite": QualityIcon,
    "Tasarım Odaklılık": DesignIcon,
    "Zanaatkarlık": CraftIcon,
    "Quality": QualityIcon,
    "Design Focus": DesignIcon,
    "Craftsmanship": CraftIcon
};

export function AboutPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchContent = async () => {
        setLoading(true);
        try {
          const pageContent = await getAboutPageContent();
          setContent(pageContent || null);
        } finally {
          setLoading(false);
        }
    };
    fetchContent();
  }, []);

  if (loading) return <div className="pt-24 text-center">{t('loading')}...</div>
  if (!content) return <div className="pt-24 text-center">{t('loading')}...</div>

  const getIconKey = (title: LocalizedString) => {
    if (typeof title === 'string') return title;
    return (title && (title as any).tr) || '';
  };

  return (
    <div className="bg-white animate-fade-in-up-subtle">
        {/* Hero Section */}
        <div className="relative h-[50vh] bg-gray-800 text-white flex items-center justify-center overflow-hidden">
            {content.heroImage && (
              <div className="absolute inset-0 w-full h-full">
                <OptimizedImage
                  src={content.heroImage}
                  alt={t(content.heroTitle)}
                  className="w-full h-full object-cover opacity-40"
                  loading="eager"
                  quality={90}
                />
              </div>
            )}
            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-light tracking-tighter">{t(content.heroTitle)}</h1>
                <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-light">{t(content.heroSubtitle)}</p>
            </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            {/* Our Story Section */}
            <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-12 items-center">
                <div className="md:col-span-3 prose prose-lg text-gray-500 max-w-none font-light">
                    <h2 className="text-3xl font-light text-gray-600">{t(content.storyTitle)}</h2>
                    <p>{t(content.storyContentP1)}</p>
                    <p>{t(content.storyContentP2)}</p>
                </div>
                <div className="md:col-span-2">
                    {content.storyImage && (
                      <OptimizedImage
                        src={content.storyImage}
                        alt="story"
                        className="w-full shadow-lg"
                        loading="lazy"
                        quality={85}
                      />
                    )}
                </div>
            </div>
            
            {content.isQuoteVisible && (
                <div className="my-24 text-center max-w-3xl mx-auto">
                    <blockquote className="text-2xl md:text-4xl font-light text-gray-600 italic border-l-4 border-gray-600 pl-6 md:pl-8">
                        "{t(content.quoteText)}"
                    </blockquote>
                    <p className="mt-6 text-lg font-light text-gray-500">{content.quoteAuthor}</p>
                </div>
            )}

            <div className="bg-gray-100 p-12 my-24">
                <h2 className="text-3xl font-light text-gray-600 text-center mb-12">{t(content.valuesTitle)}</h2>
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    {(content.values || []).map((value, index) => {
                       const iconKey = getIconKey(value.title);
                       const IconComponent = ICONS[iconKey] || QualityIcon;
                       return (
                         <div key={index}>
                            <div className="flex justify-center">
                                <ValuesIcon><IconComponent /></ValuesIcon>
                            </div>
                            <h3 className="text-xl font-light text-gray-500">{t(value.title)}</h3>
                            <p className="mt-2 text-gray-500 font-light">{t(value.description)}</p>
                         </div>
                       );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
}