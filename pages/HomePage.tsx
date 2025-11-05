import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getDesigners, getSiteSettings, getHomePageContent } from '../services/cms';
import type { Product, Designer, SiteSettings, HomePageContent } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SiteLogo } from '../components/SiteLogo';
import { useTranslation } from '../i18n';

const ArrowRight = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const YouTubeBackground: React.FC<{ url: string }> = ({ url }) => {
    const videoId = getYouTubeId(url);
    if (!videoId) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <p className="text-white">Geçersiz YouTube URL'si</p>
            </div>
        );
    }
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <iframe
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2"
                style={{ pointerEvents: 'none' }}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export function HomePage() {
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredDesigner, setFeaturedDesigner] = useState<Designer | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [draggedX, setDraggedX] = useState(0);
  const DRAG_THRESHOLD = 50; // pixels

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return;
    }
    setIsDragging(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(startX);
    setDraggedX(0);
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDraggedX(currentX - dragStartX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const slideCount = content?.heroMedia ? content.heroMedia.length : 1;
    if (draggedX < -DRAG_THRESHOLD) {
        setCurrentSlide(prev => (prev + 1) % slideCount);
    } else if (draggedX > DRAG_THRESHOLD) {
        setCurrentSlide(prev => (prev - 1 + slideCount) % slideCount);
    }
    setDraggedX(0);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [productsData, designersData, siteSettingsData, homeContent] = await Promise.all([
        getProducts(),
        getDesigners(),
        getSiteSettings(),
        getHomePageContent()
      ]);
      setContent(homeContent || null);
      setSettings(siteSettingsData || null);
      
      if (homeContent?.featuredProductIds && Array.isArray(productsData)) {
        const fProducts = productsData.filter(p => homeContent.featuredProductIds.includes(p.id));
        setFeaturedProducts(fProducts || []);
      }

      if (homeContent?.featuredDesignerId && Array.isArray(designersData)) {
        const fDesigner = designersData.find(d => d.id === homeContent.featuredDesignerId);
        setFeaturedDesigner(fDesigner || null);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!content || !content.heroMedia || content.heroMedia.length <= 1 || isDragging) return;
    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % content.heroMedia.length);
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentSlide, content, isDragging]);

  if (!content || !settings) {
    return <div className="h-screen w-full bg-gray-800" />;
  }
  
  const heroMedia = Array.isArray(content.heroMedia) ? content.heroMedia : [];
  const slideCount = heroMedia.length || 1;
  const inspiration = content.inspirationSection || { backgroundImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '/' };

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <div 
        className="relative h-screen w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div 
            className="flex h-full"
            style={{
                width: `${slideCount * 100}%`,
                transform: `translateX(calc(-${currentSlide * (100 / slideCount)}% + ${draggedX}px))`,
                transition: isDragging ? 'none' : 'transform 0.6s ease-in-out',
            }}
        >
            {heroMedia.map((media, index) => (
                <div 
                    key={index} 
                    className="relative h-full shrink-0" 
                    style={{ width: `${100 / slideCount}%`}}
                >
                    {media.type === 'video' ? (
                         <video className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline src={media.url} key={media.url} />
                    ) : media.type === 'youtube' ? (
                         <YouTubeBackground url={media.url} />
                    ) : (
                        <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${media.url}')` }}/>
                    )}
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                     <div className={`relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center ${content.isHeroTextVisible && content.isLogoVisible ? 'justify-center md:justify-start' : 'justify-center'}`}>
                        <div className={`flex flex-col md:flex-row items-center text-white gap-12 md:gap-16 ${content.isHeroTextVisible || content.isLogoVisible ? 'max-w-4xl' : ''} text-center ${content.isLogoVisible ? 'md:text-left' : 'md:text-center'}`}>
                            {content.isLogoVisible && (
                                <div className="animate-fade-in-down flex-shrink-0">
                                    <SiteLogo logoUrl={settings?.logoUrl} className="w-[360px] h-[360px]" />
                                </div>
                            )}
                            {content.isHeroTextVisible && (
                                <div className="relative w-full">
                                    <div className="animate-fade-in-up">
                                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{t(media.title)}</h1>
                                      <p className="text-lg md:text-xl mb-8" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{t(media.subtitle)}</p>
                                      {media.isButtonVisible && (
                                        <Link
                                            to={media.buttonLink || '/'}
                                            className="group inline-flex items-center gap-x-3 text-white font-semibold py-3 px-5 text-lg rounded-lg hover:bg-white/10 transition-colors duration-300"
                                        >
                                            <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t(media.buttonText)}</span>
                                            <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                                        </Link>
                                      )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
         {slideCount > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4">
                {heroMedia.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`relative rounded-full h-2 transition-all duration-500 ease-in-out group ${index === currentSlide ? 'w-12 bg-white/50' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        {index === currentSlide && (
                            <div
                                key={`${currentSlide}-${index}`}
                                className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                            ></div>
                        )}
                    </button>
                ))}
            </div>
         )}
      </div>

      {/* Featured Products Section */}
      <section id="featured" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-center mb-4">{t('featured_products')}</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">{t('featured_products_subtitle')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {(Array.isArray(featuredProducts) ? featuredProducts : []).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Designer Spotlight */}
      {featuredDesigner && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 animate-fade-in-up">
              <div className="w-full md:w-1/2">
                  <img src={featuredDesigner.image} alt={t(featuredDesigner.name)} className="shadow-xl w-full object-cover" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('designer_spotlight')}</h3>
                  <h2 className="text-4xl font-bold text-gray-900 mt-2">{t(featuredDesigner.name)}</h2>
                  <p className="mt-4 text-gray-600 leading-relaxed">{t(featuredDesigner.bio).substring(0, 200)}...</p>
                   <Link
                    to={`/designer/${featuredDesigner.id}`}
                    className="group mt-8 inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 px-5 text-lg rounded-lg hover:bg-gray-900/10 transition-colors duration-300"
                  >
                    <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t('discover_the_designer')}</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </Link>
              </div>
          </div>
        </section>
      )}

      {/* Inspiration Section */}
      <section className="relative py-32 bg-gray-800 text-white text-center" style={{ backgroundImage: `url(${inspiration.backgroundImage})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
         <div className="absolute inset-0 bg-black/50"></div>
         <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <h2 className="text-4xl font-bold">{t(inspiration.title)}</h2>
            <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">{t(inspiration.subtitle)}</p>
            <Link
                to={inspiration.buttonLink || '/'}
                className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-3 px-5 text-lg rounded-lg hover:bg-white/10 transition-colors duration-300"
            >
                <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t(inspiration.buttonText)}</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Link>
         </div>
      </section>
    </div>
  );
}