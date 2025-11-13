import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getDesigners, getSiteSettings, getHomePageContent } from '../services/cms';
import type { Product, Designer, SiteSettings, HomePageContent } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SiteLogo } from '../components/SiteLogo';
import { useTranslation } from '../i18n';
import { useSiteSettings } from '../App';

const ArrowRight = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const YouTubeBackground: React.FC<{ url: string; isMobile?: boolean }> = ({ url, isMobile = false }) => {
    const videoId = getYouTubeId(url);
    if (!videoId) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <p className="text-white">Geçersiz YouTube URL'si</p>
            </div>
        );
    }
    return (
        <div 
            className="absolute top-0 left-0 w-full h-full overflow-hidden"
            style={{
                width: isMobile ? '100vw' : '100%',
                maxWidth: isMobile ? '100vw' : '100%',
                left: isMobile ? 0 : undefined,
                right: isMobile ? 0 : undefined,
                margin: 0,
                padding: 0,
                position: 'absolute',
                top: 0,
                bottom: 0,
                marginLeft: isMobile ? 0 : undefined,
                marginRight: isMobile ? 0 : undefined,
            }}
        >
            <iframe
                className={isMobile ? "absolute top-0 left-0 w-full h-full" : "absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2"}
                style={{ 
                  pointerEvents: 'none',
                  ...(isMobile ? {
                    width: '100vw',
                    height: '100%',
                    maxWidth: '100vw',
                    minWidth: '100vw',
                    left: 0,
                    right: 0,
                    transform: 'none',
                  } : {})
                }}
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
  const { settings: siteSettings } = useSiteSettings();
  const imageBorderClass = siteSettings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none';

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [draggedX, setDraggedX] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      // Scrollbar genişliğini hariç tutmak için clientWidth kullan
      return document.documentElement.clientWidth || window.innerWidth;
    }
    return 0;
  });
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const DRAG_THRESHOLD = 50; // pixels
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch event'ler için non-passive listener'lar ekle
  useEffect(() => {
    const container = heroContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return;
      }
      setIsDragging(true);
      const startX = e.touches[0].clientX;
      setDragStartX(startX);
      setDraggedX(0);
      e.preventDefault(); // Non-passive listener olduğu için preventDefault çalışır
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      setDraggedX(currentX - dragStartX);
      e.preventDefault(); // Non-passive listener olduğu için preventDefault çalışır
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const slideCount = content?.heroMedia ? content.heroMedia.length : 1;
      if (slideCount <= 1) {
        setDraggedX(0);
        return;
      }

      if (draggedX < -DRAG_THRESHOLD) {
        const nextSlide = currentSlide + 1;
        if (nextSlide >= slideCount) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current);
          }
          setCurrentSlide(nextSlide);
          transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(true);
            requestAnimationFrame(() => {
              setCurrentSlide(0);
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false);
                  transitionTimeoutRef.current = null;
                  innerTimeoutRef.current = null;
                }, 16);
              });
            });
          }, 600);
        } else {
          setCurrentSlide(nextSlide);
        }
      } else if (draggedX > DRAG_THRESHOLD) {
        const prevSlide = currentSlide - 1;
        if (prevSlide < 0) {
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current);
          }
          setCurrentSlide(prevSlide);
          transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(true);
            requestAnimationFrame(() => {
              setCurrentSlide(slideCount - 1);
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false);
                  transitionTimeoutRef.current = null;
                  innerTimeoutRef.current = null;
                }, 16);
              });
            });
          }, 600);
        } else {
          setCurrentSlide(prevSlide);
        }
      }
      setDraggedX(0);
    };

    // Non-passive listener'lar ekle (passive: false)
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartX, draggedX, currentSlide, content]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      // Scrollbar genişliğini hariç tutmak için clientWidth kullan
      const vw = document.documentElement.clientWidth || window.innerWidth;
      setIsMobile(mobile);
      setViewportWidth(vw);
      // Debug için console'a yazdır
      console.log('=== MOBILE CHECK ===');
      console.log('isMobile:', mobile, 'window.innerWidth:', vw);
      
      // Mobilde video elementlerine ve parent container'lara direkt style ekle
      // Not: Element'ler henüz render edilmemiş olabilir, bu yüzden content yüklendikten sonraki useEffect'te de kontrol ediliyor
      if (mobile) {
         // Page container'ı bul ve viewport genişliğine göre ayarla
         const pageContainer = document.querySelector('.hero-page-container-mobile');
         if (pageContainer instanceof HTMLElement) {
           const beforePageWidth = window.getComputedStyle(pageContainer).width;
           pageContainer.style.setProperty('width', `${vw}px`, 'important');
           pageContainer.style.setProperty('max-width', `${vw}px`, 'important');
           pageContainer.style.setProperty('margin-left', '0', 'important');
           pageContainer.style.setProperty('margin-right', '0', 'important');
           pageContainer.style.setProperty('padding-left', '0', 'important');
           pageContainer.style.setProperty('padding-right', '0', 'important');
           pageContainer.style.setProperty('overflow-x', 'hidden', 'important');
           const afterPageWidth = window.getComputedStyle(pageContainer).width;
           console.log(`Page container - Before: ${beforePageWidth}, After: ${afterPageWidth}, Viewport: ${vw}px`);
         }
         
         // Hero container'ı bul ve viewport genişliğine göre ayarla
         const heroContainer = document.querySelector('.hero-main-container-mobile');
         if (heroContainer instanceof HTMLElement) {
           const beforeContainerWidth = window.getComputedStyle(heroContainer).width;
           heroContainer.style.setProperty('width', `${vw}px`, 'important');
           heroContainer.style.setProperty('max-width', `${vw}px`, 'important');
           heroContainer.style.setProperty('min-width', `${vw}px`, 'important');
           heroContainer.style.setProperty('margin-left', '0', 'important');
           heroContainer.style.setProperty('margin-right', '0', 'important');
           heroContainer.style.setProperty('padding-left', '0', 'important');
           heroContainer.style.setProperty('padding-right', '0', 'important');
           heroContainer.style.setProperty('left', '0', 'important');
           heroContainer.style.setProperty('right', '0', 'important');
           const afterContainerWidth = window.getComputedStyle(heroContainer).width;
           console.log(`Hero container - Before: ${beforeContainerWidth}, After: ${afterContainerWidth}, Viewport: ${vw}px`);
         }
         
         // Hero scroll container'ı bul ve genişliğini slide sayısına göre ayarla
         const heroScrollContainer = document.querySelector('.hero-scroll-container');
         if (heroScrollContainer instanceof HTMLElement) {
           const slideCount = heroScrollContainer.children.length || 1;
           const containerWidth = `${slideCount * vw}px`;
           const beforeScrollWidth = window.getComputedStyle(heroScrollContainer).width;
           heroScrollContainer.style.setProperty('width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('min-width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('max-width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('overflow-x', 'visible', 'important');
           heroScrollContainer.style.setProperty('overflow-y', 'hidden', 'important');
           const afterScrollWidth = window.getComputedStyle(heroScrollContainer).width;
           console.log(`Hero scroll container - Before: ${beforeScrollWidth}, After: ${afterScrollWidth}, Target: ${containerWidth}, Viewport: ${vw}px, SlideCount: ${slideCount}`);
         }
        
        // Parent container'ları da viewport genişliğine göre ayarla
        const slides = document.querySelectorAll('.hero-slide-mobile');
        console.log('Found slides:', slides.length);
        slides.forEach((slide, index) => {
          if (slide instanceof HTMLElement) {
            const beforeWidth = window.getComputedStyle(slide).width;
            slide.style.setProperty('width', `${vw}px`, 'important');
            slide.style.setProperty('max-width', `${vw}px`, 'important');
            slide.style.setProperty('min-width', `${vw}px`, 'important');
            slide.style.setProperty('height', '100vh', 'important');
            slide.style.setProperty('min-height', '100vh', 'important');
            const afterWidth = window.getComputedStyle(slide).width;
            console.log(`Slide ${index} - Before: ${beforeWidth}, After: ${afterWidth}, Inline: ${slide.style.width}, Viewport: ${vw}px`);
          }
        });
        
        const videos = document.querySelectorAll('.hero-slide-mobile video');
        console.log('Found videos:', videos.length);
        videos.forEach((video, index) => {
          if (video instanceof HTMLVideoElement) {
            const beforeWidth = window.getComputedStyle(video).width;
            const beforeParentWidth = video.parentElement ? window.getComputedStyle(video.parentElement).width : 'N/A';
            video.style.setProperty('width', `${viewportWidth}px`, 'important');
            video.style.setProperty('max-width', `${viewportWidth}px`, 'important');
            video.style.setProperty('min-width', `${viewportWidth}px`, 'important');
            video.style.setProperty('height', '100vh', 'important');
            video.style.setProperty('min-height', '100vh', 'important');
            video.style.setProperty('left', '0', 'important');
            video.style.setProperty('right', '0', 'important');
            video.style.setProperty('margin-left', '0', 'important');
            video.style.setProperty('margin-right', '0', 'important');
            video.style.setProperty('padding-left', '0', 'important');
            video.style.setProperty('padding-right', '0', 'important');
            video.style.setProperty('position', 'absolute', 'important');
            video.style.setProperty('object-fit', 'contain', 'important');
            video.style.setProperty('object-position', 'top', 'important');
            const afterWidth = window.getComputedStyle(video).width;
            const afterParentWidth = video.parentElement ? window.getComputedStyle(video.parentElement).width : 'N/A';
            console.log(`Video ${index}:`);
            console.log(`  - Parent width - Before: ${beforeParentWidth}, After: ${afterParentWidth}`);
            console.log(`  - Video width - Before: ${beforeWidth}, After: ${afterWidth}, Inline: ${video.style.width}, Viewport: ${viewportWidth}px`);
            console.log(`  - Video computed: width=${window.getComputedStyle(video).width}, maxWidth=${window.getComputedStyle(video).maxWidth}, minWidth=${window.getComputedStyle(video).minWidth}`);
          }
        });
        
        // Görsel elementlerine de style ekle
        const images = document.querySelectorAll('.hero-slide-mobile img');
        console.log('Found images:', images.length);
        images.forEach((img, index) => {
          if (img instanceof HTMLImageElement) {
            const beforeWidth = window.getComputedStyle(img).width;
            img.style.setProperty('width', `${viewportWidth}px`, 'important');
            img.style.setProperty('max-width', `${viewportWidth}px`, 'important');
            img.style.setProperty('min-width', `${viewportWidth}px`, 'important');
            img.style.setProperty('height', '100vh', 'important');
            img.style.setProperty('min-height', '100vh', 'important');
            img.style.setProperty('left', '0', 'important');
            img.style.setProperty('right', '0', 'important');
            img.style.setProperty('margin-left', '0', 'important');
            img.style.setProperty('margin-right', '0', 'important');
            img.style.setProperty('padding-left', '0', 'important');
            img.style.setProperty('padding-right', '0', 'important');
            img.style.setProperty('position', 'absolute', 'important');
            img.style.setProperty('object-fit', 'contain', 'important');
            img.style.setProperty('object-position', 'top', 'important');
            const afterWidth = window.getComputedStyle(img).width;
            console.log(`Image ${index} - Before: ${beforeWidth}, After: ${afterWidth}, Inline: ${img.style.width}, Viewport: ${viewportWidth}px`);
          }
        });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // Content yüklendikten sonra video elementlerine ve parent container'lara style ekle
    // Bu useEffect, content yüklendikten ve element'ler DOM'a eklendikten sonra çalışır
    if (!isMobile || !content?.heroMedia) return;
    
    console.log('=== CONTENT LOADED EFFECT ===');
    console.log('isMobile:', isMobile, 'content.heroMedia.length:', content.heroMedia.length);
     
    // Element'lerin DOM'a eklenmesini beklemek için recursive bir kontrol yap
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    
    const applyStyles = () => {
      // Tüm parent container'ları debug et
      console.log('=== DEBUG PARENT CONTAINERS ===');
        const main = document.querySelector('main');
        if (main) {
          const mainComputed = window.getComputedStyle(main);
          const mainRect = main.getBoundingClientRect();
          console.log(`Main container: width=${mainComputed.width}, left=${mainComputed.left}, margin=${mainComputed.marginLeft}/${mainComputed.marginRight}, padding=${mainComputed.paddingLeft}/${mainComputed.paddingRight}`);
          console.log(`Main bounding rect: left=${mainRect.left}, width=${mainRect.width}`);
        }
        const root = document.getElementById('root');
        if (root) {
          const rootComputed = window.getComputedStyle(root);
          const rootRect = root.getBoundingClientRect();
          console.log(`Root container: width=${rootComputed.width}, left=${rootComputed.left}, margin=${rootComputed.marginLeft}/${rootComputed.marginRight}, padding=${rootComputed.paddingLeft}/${rootComputed.paddingRight}`);
          console.log(`Root bounding rect: left=${rootRect.left}, width=${rootRect.width}`);
        }
        
        // Page container'ı bul ve viewport genişliğine göre ayarla
         const pageContainer = document.querySelector('.hero-page-container-mobile');
         if (pageContainer instanceof HTMLElement) {
           const vw = document.documentElement.clientWidth || window.innerWidth;
           const computed = window.getComputedStyle(pageContainer);
           const rect = pageContainer.getBoundingClientRect();
           const beforePageWidth = computed.width;
           console.log(`Page container BEFORE: width=${beforePageWidth}, left=${computed.left}, margin=${computed.marginLeft}/${computed.marginRight}, padding=${computed.paddingLeft}/${computed.paddingRight}`);
           console.log(`Page container bounding rect: left=${rect.left}, width=${rect.width}`);
           
           pageContainer.style.setProperty('width', `${vw}px`, 'important');
           pageContainer.style.setProperty('max-width', `${vw}px`, 'important');
           pageContainer.style.setProperty('margin-left', '0', 'important');
           pageContainer.style.setProperty('margin-right', '0', 'important');
           pageContainer.style.setProperty('padding-left', '0', 'important');
           pageContainer.style.setProperty('padding-right', '0', 'important');
           pageContainer.style.setProperty('overflow-x', 'hidden', 'important');
           pageContainer.style.setProperty('left', '0', 'important');
           pageContainer.style.setProperty('position', 'relative', 'important');
           
           // Force reflow
           pageContainer.offsetHeight;
           
           const afterComputed = window.getComputedStyle(pageContainer);
           const afterRect = pageContainer.getBoundingClientRect();
           const afterPageWidth = afterComputed.width;
           console.log(`Page container AFTER: width=${afterPageWidth}, left=${afterComputed.left}, margin=${afterComputed.marginLeft}/${afterComputed.marginRight}, padding=${afterComputed.paddingLeft}/${afterComputed.paddingRight}`);
           console.log(`Page container bounding rect: left=${afterRect.left}, width=${afterRect.width}`);
         }
         
         // Hero container'ı bul ve viewport genişliğine göre ayarla
         const heroContainer = document.querySelector('.hero-main-container-mobile');
         if (heroContainer instanceof HTMLElement) {
           const vw = document.documentElement.clientWidth || window.innerWidth;
           const computed = window.getComputedStyle(heroContainer);
           const rect = heroContainer.getBoundingClientRect();
           const beforeContainerWidth = computed.width;
           console.log(`Hero container BEFORE: width=${beforeContainerWidth}, left=${computed.left}, margin=${computed.marginLeft}/${computed.marginRight}, padding=${computed.paddingLeft}/${computed.paddingRight}`);
           console.log(`Hero container bounding rect: left=${rect.left}, width=${rect.width}`);
           
           heroContainer.style.setProperty('width', `${vw}px`, 'important');
           heroContainer.style.setProperty('max-width', `${vw}px`, 'important');
           heroContainer.style.setProperty('min-width', `${vw}px`, 'important');
           heroContainer.style.setProperty('margin-left', '0', 'important');
           heroContainer.style.setProperty('margin-right', '0', 'important');
           heroContainer.style.setProperty('padding-left', '0', 'important');
           heroContainer.style.setProperty('padding-right', '0', 'important');
           heroContainer.style.setProperty('left', '0', 'important');
           heroContainer.style.setProperty('right', '0', 'important');
           heroContainer.style.setProperty('position', 'relative', 'important');
           
           // Force reflow
           heroContainer.offsetHeight;
           
           const afterComputed = window.getComputedStyle(heroContainer);
           const afterRect = heroContainer.getBoundingClientRect();
           const afterContainerWidth = afterComputed.width;
           console.log(`Hero container AFTER: width=${afterContainerWidth}, left=${afterComputed.left}, margin=${afterComputed.marginLeft}/${afterComputed.marginRight}, padding=${afterComputed.paddingLeft}/${afterComputed.paddingRight}`);
           console.log(`Hero container bounding rect: left=${afterRect.left}, width=${afterRect.width}`);
         }
         
         // Hero scroll container'ı bul ve genişliğini slide sayısına göre ayarla
         const heroScrollContainer = document.querySelector('.hero-scroll-container');
         if (heroScrollContainer instanceof HTMLElement) {
           const slideCount = heroScrollContainer.children.length || content?.heroMedia?.length || 1;
           const vw = document.documentElement.clientWidth || window.innerWidth;
           const containerWidth = `${slideCount * vw}px`;
           const beforeScrollWidth = window.getComputedStyle(heroScrollContainer).width;
           heroScrollContainer.style.setProperty('width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('min-width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('max-width', containerWidth, 'important');
           heroScrollContainer.style.setProperty('overflow-x', 'visible', 'important');
           heroScrollContainer.style.setProperty('overflow-y', 'hidden', 'important');
           const afterScrollWidth = window.getComputedStyle(heroScrollContainer).width;
           console.log(`Content effect - Hero scroll container - Before: ${beforeScrollWidth}, After: ${afterScrollWidth}, Target: ${containerWidth}, Viewport: ${vw}px, SlideCount: ${slideCount}`);
         }
        
        // Parent container'ları da viewport genişliğine göre ayarla
        const slides = document.querySelectorAll('.hero-slide-mobile');
        console.log('Content effect - Found slides:', slides.length);
        const vw = document.documentElement.clientWidth || window.innerWidth;
        slides.forEach((slide, index) => {
          if (slide instanceof HTMLElement) {
            const computed = window.getComputedStyle(slide);
            const rect = slide.getBoundingClientRect();
            const beforeWidth = computed.width;
            const beforeLeft = computed.left;
            
            // Viewport genişliğini px olarak kullan
            slide.style.setProperty('width', `${vw}px`, 'important');
            slide.style.setProperty('max-width', `${vw}px`, 'important');
            slide.style.setProperty('min-width', `${vw}px`, 'important');
            slide.style.setProperty('height', '100vh', 'important');
            slide.style.setProperty('min-height', '100vh', 'important');
            slide.style.setProperty('left', '0', 'important');
            slide.style.setProperty('margin-left', '0', 'important');
            slide.style.setProperty('padding-left', '0', 'important');
            
            // Force reflow
            slide.offsetHeight;
            
            const afterComputed = window.getComputedStyle(slide);
            const afterRect = slide.getBoundingClientRect();
            const afterWidth = afterComputed.width;
            const afterLeft = afterComputed.left;
            
            console.log(`=== DEBUG SLIDE ${index} ===`);
            console.log(`Viewport width: ${viewportWidth}px`);
            console.log(`Slide BEFORE:`);
            console.log(`  - Computed width: ${beforeWidth}`);
            console.log(`  - Computed left: ${beforeLeft}`);
            console.log(`  - Bounding rect: left=${rect.left}, width=${rect.width}, right=${rect.right}`);
            console.log(`Slide AFTER:`);
            console.log(`  - Computed width: ${afterWidth}`);
            console.log(`  - Computed left: ${afterLeft}`);
            console.log(`  - Bounding rect: left=${afterRect.left}, width=${afterRect.width}, right=${afterRect.right}`);
            console.log(`  - Inline style width: ${slide.style.width}`);
            
            // Parent container'ın parent'ını da kontrol et
            const parent = slide.parentElement;
            if (parent) {
              const parentComputed = window.getComputedStyle(parent);
              const parentRect = parent.getBoundingClientRect();
              console.log(`  - Parent: ${parent.className || parent.tagName}`);
              console.log(`    Width: ${parentComputed.width}, Left: ${parentComputed.left}`);
              console.log(`    Bounding rect: left=${parentRect.left}, width=${parentRect.width}`);
            }
          }
        });
        
        // Video elementlerine style ekle
        const videos = document.querySelectorAll('.hero-slide-mobile video');
        console.log('Content effect - Found videos:', videos.length);
        videos.forEach((video, index) => {
          if (video instanceof HTMLVideoElement) {
            const computed = window.getComputedStyle(video);
            const rect = video.getBoundingClientRect();
            const beforeWidth = computed.width;
            const beforeParentWidth = video.parentElement ? window.getComputedStyle(video.parentElement).width : 'N/A';
            const beforeLeft = computed.left;
            const beforeTransform = computed.transform;
            
            // Video'nun gerçek genişliğini kontrol et
            const videoNaturalWidth = video.videoWidth || 0;
            const videoNaturalHeight = video.videoHeight || 0;
            console.log(`  - Video natural size: ${videoNaturalWidth}x${videoNaturalHeight}`);
            
            // Video element genişliğini viewport genişliğine eşitle
            // object-fit: cover ve object-position: left top ile sol üstten başla
            console.log(`  - Using viewport width for video: ${viewportWidth}px`);
            
            // Video element genişliğini viewport genişliğine eşitle
            video.style.setProperty('width', `${viewportWidth}px`, 'important');
            video.style.setProperty('max-width', `${viewportWidth}px`, 'important');
            video.style.setProperty('min-width', `${viewportWidth}px`, 'important');
            video.style.setProperty('height', '100vh', 'important');
            video.style.setProperty('min-height', '100vh', 'important');
            video.style.setProperty('left', '0', 'important');
            video.style.setProperty('right', '0', 'important');
            video.style.setProperty('margin-left', '0', 'important');
            video.style.setProperty('margin-right', '0', 'important');
            video.style.setProperty('padding-left', '0', 'important');
            video.style.setProperty('padding-right', '0', 'important');
            video.style.setProperty('position', 'absolute', 'important');
            video.style.setProperty('transform', 'none', 'important');
            video.style.setProperty('object-fit', 'contain', 'important');
            video.style.setProperty('object-position', 'top', 'important');
            video.style.setProperty('top', '0', 'important');
            video.style.setProperty('bottom', '0', 'important');
            
            // Force reflow
            video.offsetHeight;
            
            const afterComputed = window.getComputedStyle(video);
            const afterRect = video.getBoundingClientRect();
            const afterWidth = afterComputed.width;
            const afterLeft = afterComputed.left;
            const afterParentWidth = video.parentElement ? window.getComputedStyle(video.parentElement).width : 'N/A';
            
            console.log(`=== DEBUG VIDEO ${index} ===`);
            console.log(`Viewport width: ${viewportWidth}px`);
            console.log(`Video BEFORE:`);
            console.log(`  - Computed width: ${beforeWidth}`);
            console.log(`  - Computed left: ${beforeLeft}`);
            console.log(`  - Transform: ${beforeTransform}`);
            console.log(`  - Bounding rect: left=${rect.left}, width=${rect.width}, right=${rect.right}`);
            console.log(`  - Parent width: ${beforeParentWidth}`);
            console.log(`Video AFTER:`);
            console.log(`  - Computed width: ${afterWidth}`);
            console.log(`  - Computed left: ${afterLeft}`);
            console.log(`  - Transform: ${afterComputed.transform}`);
            console.log(`  - Bounding rect: left=${afterRect.left}, width=${afterRect.width}, right=${afterRect.right}`);
            console.log(`  - Parent width: ${afterParentWidth}`);
            console.log(`  - Inline style width: ${video.style.width}`);
            console.log(`  - Object position: ${afterComputed.objectPosition}`);
            
            // Parent chain debug
            let current = video.parentElement;
            let level = 0;
            while (current && level < 5) {
              const parentComputed = window.getComputedStyle(current);
              const parentRect = current.getBoundingClientRect();
              console.log(`  - Parent level ${level}: ${current.className || current.tagName}`);
              console.log(`    Width: ${parentComputed.width}, Left: ${parentComputed.left}, Margin: ${parentComputed.marginLeft}/${parentComputed.marginRight}, Padding: ${parentComputed.paddingLeft}/${parentComputed.paddingRight}`);
              console.log(`    Bounding rect: left=${parentRect.left}, width=${parentRect.width}`);
              current = current.parentElement;
              level++;
            }
          }
        });
        
        // Görsel elementlerine de style ekle
        const images = document.querySelectorAll('.hero-slide-mobile img');
        console.log('Content effect - Found images:', images.length);
        images.forEach((img, index) => {
          if (img instanceof HTMLImageElement) {
            const computed = window.getComputedStyle(img);
            const rect = img.getBoundingClientRect();
            const beforeWidth = computed.width;
            const beforeLeft = computed.left;
            const beforeTransform = computed.transform;
            const beforeObjectPosition = computed.objectPosition;
            
            // Image element genişliğini viewport genişliğine eşitle
            // object-fit: contain ve object-position: top ile üstten hizala
            console.log(`  - Using viewport width for image: ${viewportWidth}px`);
            
            img.style.setProperty('width', `${viewportWidth}px`, 'important');
            img.style.setProperty('max-width', `${viewportWidth}px`, 'important');
            img.style.setProperty('min-width', `${viewportWidth}px`, 'important');
            img.style.setProperty('height', '100vh', 'important');
            img.style.setProperty('min-height', '100vh', 'important');
            img.style.setProperty('left', '0', 'important');
            img.style.setProperty('right', '0', 'important');
            img.style.setProperty('margin-left', '0', 'important');
            img.style.setProperty('margin-right', '0', 'important');
            img.style.setProperty('padding-left', '0', 'important');
            img.style.setProperty('padding-right', '0', 'important');
            img.style.setProperty('position', 'absolute', 'important');
            img.style.setProperty('transform', 'none', 'important');
            img.style.setProperty('object-fit', 'contain', 'important');
            img.style.setProperty('object-position', 'top', 'important');
            
            // Force reflow
            img.offsetHeight;
            
            const afterComputed = window.getComputedStyle(img);
            const afterRect = img.getBoundingClientRect();
            const afterWidth = afterComputed.width;
            const afterLeft = afterComputed.left;
            
            console.log(`=== DEBUG IMAGE ${index} ===`);
            console.log(`Viewport width: ${viewportWidth}px`);
            console.log(`Image BEFORE:`);
            console.log(`  - Computed width: ${beforeWidth}`);
            console.log(`  - Computed left: ${beforeLeft}`);
            console.log(`  - Transform: ${beforeTransform}`);
            console.log(`  - Object position: ${beforeObjectPosition}`);
            console.log(`  - Bounding rect: left=${rect.left}, width=${rect.width}, right=${rect.right}`);
            console.log(`Image AFTER:`);
            console.log(`  - Computed width: ${afterWidth}`);
            console.log(`  - Computed left: ${afterLeft}`);
            console.log(`  - Transform: ${afterComputed.transform}`);
            console.log(`  - Object position: ${afterComputed.objectPosition}`);
            console.log(`  - Bounding rect: left=${afterRect.left}, width=${afterRect.width}, right=${afterRect.right}`);
            console.log(`  - Inline style width: ${img.style.width}`);
            
            // Parent chain debug
            let current = img.parentElement;
            let level = 0;
            while (current && level < 5) {
              const parentComputed = window.getComputedStyle(current);
              const parentRect = current.getBoundingClientRect();
              console.log(`  - Parent level ${level}: ${current.className || current.tagName}`);
              console.log(`    Width: ${parentComputed.width}, Left: ${parentComputed.left}, Margin: ${parentComputed.marginLeft}/${parentComputed.marginRight}, Padding: ${parentComputed.paddingLeft}/${parentComputed.paddingRight}`);
              console.log(`    Bounding rect: left=${parentRect.left}, width=${parentRect.width}`);
              current = current.parentElement;
              level++;
            }
          }
        });
        
        // YouTube iframe'leri için de debug
        const iframes = document.querySelectorAll('.hero-slide-mobile iframe');
        console.log('Content effect - Found iframes:', iframes.length);
        iframes.forEach((iframe, index) => {
          if (iframe instanceof HTMLIFrameElement) {
            const computed = window.getComputedStyle(iframe);
            const rect = iframe.getBoundingClientRect();
            console.log(`=== DEBUG IFRAME ${index} ===`);
            console.log(`Viewport width: ${viewportWidth}px`);
            console.log(`  - Computed width: ${computed.width}`);
            console.log(`  - Computed left: ${computed.left}`);
            console.log(`  - Transform: ${computed.transform}`);
            console.log(`  - Bounding rect: left=${rect.left}, width=${rect.width}, right=${rect.right}`);
            console.log(`  - Inline style width: ${iframe.style.width}`);
          }
        });
    };
    
    const checkAndApplyStyles = (attempts = 0) => {
      const maxAttempts = 10;
      const slides = document.querySelectorAll('.hero-slide-mobile');
      
      if (slides.length === 0 && attempts < maxAttempts) {
        // Element'ler henüz render edilmemiş, tekrar dene
        const timeoutId = setTimeout(() => checkAndApplyStyles(attempts + 1), 100);
        timeoutIds.push(timeoutId);
        return;
      }
      
      if (slides.length === 0) {
        console.warn('Hero slides not found after', maxAttempts, 'attempts');
        return;
      }
      
      console.log('Found', slides.length, 'slides, applying styles...');
      applyStyles();
    };
    
    // İlk kontrolü başlat
    checkAndApplyStyles();
    
    // Cleanup fonksiyonu
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isMobile, content, viewportWidth]); // viewportWidth'i de dependency'ye ekle

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
        return;
    }
    setIsDragging(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(startX);
    setDraggedX(0);
    // preventDefault sadece mouse event'lerde çalışır, touch event'ler için useEffect'te non-passive listener kullanıyoruz
    if (!('touches' in e)) {
      e.preventDefault();
    }
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDraggedX(currentX - dragStartX);
    // preventDefault sadece mouse event'lerde çalışır, touch event'ler için useEffect'te non-passive listener kullanıyoruz
    if (!('touches' in e)) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const slideCount = content?.heroMedia ? content.heroMedia.length : 1;
    if (slideCount <= 1) {
      setDraggedX(0);
      return;
    }

    if (draggedX < -DRAG_THRESHOLD) {
        // Sağa kaydır (sonraki slide)
        const nextSlide = currentSlide + 1;
        
        // Eğer son slide'dan sonraki klona geçiyorsak, animasyon bitene kadar bekle sonra gerçek ilk slide'a geç
        if (nextSlide >= slideCount) {
          // Önceki timeout'ları temizle
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current);
          }
          setCurrentSlide(nextSlide); // Klona geç
          // Animasyon bitene kadar bekle (600ms) sonra gerçek ilk slide'a geç
          transitionTimeoutRef.current = setTimeout(() => {
            // Transition'ı kapat
            setIsTransitioning(true);
            // Bir sonraki frame'de currentSlide'ı değiştir (transition kapalıyken)
            requestAnimationFrame(() => {
              setCurrentSlide(0);
              // Bir frame daha bekle ve transition'ı tekrar aç
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false);
                  transitionTimeoutRef.current = null;
                  innerTimeoutRef.current = null;
                }, 16); // Bir frame süresi (~16ms)
              });
            });
          }, 600);
        } else {
          setCurrentSlide(nextSlide);
        }
    } else if (draggedX > DRAG_THRESHOLD) {
        // Sola kaydır (önceki slide)
        const prevSlide = currentSlide - 1;
        
        // Eğer ilk slide'dan önceki klona geçiyorsak, animasyon bitene kadar bekle sonra gerçek son slide'a geç
        if (prevSlide < 0) {
          // Önceki timeout'ları temizle
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }
          if (innerTimeoutRef.current) {
            clearTimeout(innerTimeoutRef.current);
          }
          setCurrentSlide(prevSlide); // Klona geç
          // Animasyon bitene kadar bekle (600ms) sonra gerçek son slide'a geç
          transitionTimeoutRef.current = setTimeout(() => {
            // Transition'ı kapat
            setIsTransitioning(true);
            // Bir sonraki frame'de currentSlide'ı değiştir (transition kapalıyken)
            requestAnimationFrame(() => {
              setCurrentSlide(slideCount - 1);
              // Bir frame daha bekle ve transition'ı tekrar aç
              requestAnimationFrame(() => {
                innerTimeoutRef.current = setTimeout(() => {
                  setIsTransitioning(false);
                  transitionTimeoutRef.current = null;
                  innerTimeoutRef.current = null;
                }, 16); // Bir frame süresi (~16ms)
              });
            });
          }, 600);
        } else {
          setCurrentSlide(prevSlide);
        }
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
      
      if (homeContent?.featuredProductIds && Array.isArray(homeContent.featuredProductIds) && Array.isArray(productsData)) {
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
      // Otomatik olarak sonraki slide'a geç (klonlara geçiş yapabilir, useEffect düzeltecek)
      setCurrentSlide(prev => prev + 1);
    }, 7000);
    return () => clearTimeout(timer);
  }, [currentSlide, content, isDragging]);

  // Klonlardan gerçek slide'a geçiş kontrolü için state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cleanup timeout'ları component unmount olduğunda
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (innerTimeoutRef.current) {
        clearTimeout(innerTimeoutRef.current);
      }
    };
  }, []);

  // Klonlardan gerçek slide'a geçiş kontrolü - sadece otomatik geçiş için (drag değil)
  useEffect(() => {
    if (!content?.heroMedia) return;
    const slideCount = content.heroMedia.length || 1;
    if (slideCount <= 1 || isDragging || isTransitioning) return;
    
    // Otomatik geçiş sırasında klonlara geçildiyse düzelt
    // (handleDragEnd zaten bunu yönetiyor)
    if (currentSlide >= slideCount) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlide(0);
          setIsTransitioning(false);
        }, 10);
      }, 650);
      return () => clearTimeout(timer);
    }
    
    if (currentSlide < 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlide(slideCount - 1);
          setIsTransitioning(false);
        }, 10);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, content, isDragging, isTransitioning]);

  // Mobilde Hero container yüksekliğini medyanın gerçek boyutuna göre ayarla
  useEffect(() => {
    if (!isMobile || !content?.heroMedia) return;
    
    const updateHeroHeight = () => {
      const heroContainer = heroContainerRef.current;
      if (!heroContainer) return;
      
      // Normalize edilmiş slide index'ini bul
      const slideCount = content.heroMedia.length || 1;
      const normalizedSlide = currentSlide < 0 ? slideCount - 1 : (currentSlide >= slideCount ? 0 : currentSlide);
      
      // Klonlar dahil gerçek slide index'ini bul
      const realIndex = normalizedSlide + 1; // +1 çünkü ilk klon var
      
      // Aktif slide'ı bul
      const slides = heroContainer.querySelectorAll('.hero-slide-mobile');
      const activeSlide = slides[realIndex] as HTMLElement;
      if (!activeSlide) return;
      
      // Medya elementini bul (video veya img)
      const mediaElement = activeSlide.querySelector('video, img') as HTMLVideoElement | HTMLImageElement;
      if (!mediaElement) return;
      
      const updateHeight = () => {
        // Önce container genişliğini al
        const containerWidth = viewportWidth || window.innerWidth || heroContainer.getBoundingClientRect().width;
        
        // Medyanın aspect ratio'sunu kullanarak yüksekliği hesapla
        let calculatedHeight = 0;
        
        if (mediaElement instanceof HTMLVideoElement) {
          if (mediaElement.videoWidth > 0 && mediaElement.videoHeight > 0) {
            const aspectRatio = mediaElement.videoWidth / mediaElement.videoHeight;
            calculatedHeight = containerWidth / aspectRatio;
          }
        } else if (mediaElement instanceof HTMLImageElement) {
          if (mediaElement.naturalWidth > 0 && mediaElement.naturalHeight > 0) {
            const aspectRatio = mediaElement.naturalWidth / mediaElement.naturalHeight;
            calculatedHeight = containerWidth / aspectRatio;
          }
        }
        
        // Eğer hesaplama başarısız olduysa, render edilmiş yüksekliği ölç
        if (calculatedHeight <= 0) {
          const mediaRect = mediaElement.getBoundingClientRect();
          if (mediaRect.height > 0) {
            calculatedHeight = mediaRect.height;
          }
        }
        
        if (calculatedHeight > 0) {
          setHeroHeight(calculatedHeight);
          // Container yüksekliğini de ayarla
          if (heroContainer) {
            heroContainer.style.height = `${calculatedHeight}px`;
            heroContainer.style.minHeight = `${calculatedHeight}px`;
            heroContainer.style.maxHeight = `${calculatedHeight}px`;
          }
          // Slide container'ının yüksekliğini de ayarla
          if (activeSlide) {
            activeSlide.style.height = `${calculatedHeight}px`;
            activeSlide.style.minHeight = `${calculatedHeight}px`;
          }
        }
      };
      
      // Medya yüklenene kadar bekle
      if (mediaElement instanceof HTMLVideoElement) {
        if (mediaElement.readyState >= 2) { // HAVE_CURRENT_DATA
          setTimeout(updateHeight, 50);
        } else {
          mediaElement.addEventListener('loadedmetadata', () => {
            setTimeout(updateHeight, 50);
          }, { once: true });
          mediaElement.addEventListener('loadeddata', () => {
            setTimeout(updateHeight, 50);
          }, { once: true });
        }
      } else if (mediaElement instanceof HTMLImageElement) {
        if (mediaElement.complete && mediaElement.naturalHeight > 0) {
          setTimeout(updateHeight, 50);
        } else {
          mediaElement.addEventListener('load', () => {
            setTimeout(updateHeight, 50);
          }, { once: true });
        }
      }
    };
    
    // Slide değiştiğinde veya viewport genişliği değiştiğinde güncelle
    const timeoutId = setTimeout(updateHeroHeight, 100);
    return () => clearTimeout(timeoutId);
  }, [isMobile, content, currentSlide, viewportWidth]);

  if (!content || !settings) {
    return <div className="h-screen w-full bg-gray-800" />;
  }
  
  const heroMedia = Array.isArray(content.heroMedia) ? content.heroMedia : [];
  const slideCount = heroMedia.length || 1;
  const inspiration = content.inspirationSection || { backgroundImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '/' };
  
  // Infinite carousel için klonlanmış slide'lar
  // Son slide'ı başa, ilk slide'ı sona ekle
  const clonedMedia = slideCount > 1 ? [
    heroMedia[heroMedia.length - 1], // Son slide başa
    ...heroMedia,
    heroMedia[0] // İlk slide sona
  ] : heroMedia;
  const totalSlides = clonedMedia.length;
  
  // Transform hesaplama: klonlar dahil
  // currentSlide 0'dan slideCount-1'e kadar
  // Transform: -(currentSlide + 1) * (100 / totalSlides)%
  // +1 çünkü ilk klon var
  const getTransform = () => {
    if (slideCount <= 1) return 'translateX(0%)';
    const translateX = -(currentSlide + 1) * (100 / totalSlides);
    return `translateX(calc(${translateX}% + ${draggedX}px))`;
  };
  
  return (
    <div className={`bg-gray-100 text-gray-800 ${isMobile ? 'hero-page-container-mobile' : ''}`} style={isMobile && viewportWidth > 0 ? { width: `${viewportWidth}px`, maxWidth: `${viewportWidth}px`, overflowX: 'hidden', margin: 0, padding: 0, left: 0, right: 0 } : {}}>
      {/* Hero Section */}
      {heroMedia.length > 0 ? (
        <div 
          ref={heroContainerRef}
          className={`relative ${isMobile ? '' : 'h-screen'} md:h-screen overflow-hidden cursor-grab active:cursor-grabbing`}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{
            padding: 0,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'none',
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'auto',
            boxSizing: 'border-box',
            ...(isMobile && heroHeight ? { height: `${heroHeight}px`, minHeight: `${heroHeight}px`, maxHeight: `${heroHeight}px` } : {}),
          } as React.CSSProperties}
        >
          <style>{`
            .hero-scroll-container::-webkit-scrollbar {
              display: none;
            }
            @media (max-width: 1023px) {
              .inspiration-section-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: calc(-50vw + 50%) !important;
                margin-right: calc(-50vw + 50%) !important;
                left: 0 !important;
                right: 0 !important;
                position: relative !important;
                box-sizing: border-box !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow: hidden !important;
              }
              .inspiration-section-mobile[style*="backgroundImage"] {
                background-size: 100vw auto !important;
                background-position: left center !important;
                background-repeat: no-repeat !important;
              }
              body {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              html {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #root {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              main {
                overflow-x: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .hero-page-container-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
              }
              .hero-main-container-mobile {
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding: 0 !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-type: x mandatory !important;
                scroll-padding: 0 !important;
                scroll-behavior: auto !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                overscroll-behavior-x: contain !important;
              }
              .hero-main-container-mobile::-webkit-scrollbar {
                display: none !important;
              }
              .hero-scroll-container {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                overflow-x: visible !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
                position: relative !important;
                display: flex !important;
                flex-wrap: nowrap !important;
                scroll-snap-type: none !important;
                will-change: transform !important;
              }
              .hero-slide-mobile,
              .hero-slide-mobile[style] {
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
                height: auto !important;
                min-height: auto !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
                flex-basis: 100vw !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: hidden !important;
                position: relative !important;
                box-sizing: border-box !important;
                left: 0 !important;
                right: 0 !important;
                scroll-snap-align: start !important;
                scroll-snap-stop: always !important;
                scroll-margin: 0 !important;
              }
              .hero-slide-mobile video,
              .hero-slide-mobile video[style],
              .hero-slide-mobile video.w-full,
              .hero-slide-mobile video.h-full,
              .hero-video-mobile,
              .hero-video-mobile[style],
              video.hero-video-mobile,
              video.hero-video-mobile[style],
              video.w-full.hero-video-mobile,
              video.h-full.hero-video-mobile,
              .hero-slide-mobile > video,
              .hero-slide-mobile > video[style],
              .hero-slide-mobile video.w-full.h-full,
              .hero-slide-mobile video.object-contain,
              .hero-slide-mobile video.absolute,
              .hero-slide-mobile video.inset-0 {
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile video.w-full {
                width: 100vw !important;
              }
              .hero-slide-mobile .w-full {
                width: 100vw !important;
              }
              .hero-slide-mobile img,
              .hero-slide-mobile img[style] {
                width: 100vw !important;
                min-width: 100vw !important;
                max-width: 100vw !important;
                height: auto !important;
                min-height: auto !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                object-fit: contain !important;
                object-position: top !important;
                position: relative !important;
                top: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
              .hero-slide-mobile > div[class*="absolute"][class*="bg-black"] {
                width: 100vw !important;
                max-width: 100vw !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
              }
              .hero-slide-mobile iframe,
              .hero-slide-mobile iframe[style] {
                width: 100vw !important;
                max-width: 100vw !important;
                min-width: 100vw !important;
                height: 100vh !important;
                min-height: 100vh !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                position: absolute !important;
                top: 0 !important;
                bottom: 0 !important;
                transform: none !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>
          <div 
              className="flex h-full md:h-full hero-scroll-container"
              style={{
                  width: `${totalSlides * 100}%`,
                  minWidth: `${totalSlides * 100}%`,
                  maxWidth: `${totalSlides * 100}%`,
                  transform: getTransform(),
                  transition: (isDragging || isTransitioning) ? 'none' : 'transform 0.6s ease-in-out',
                  flexWrap: 'nowrap',
                  padding: 0,
                  margin: 0,
                  boxSizing: 'border-box',
                  position: 'relative',
                  overflowX: 'hidden',
                  overflowY: 'hidden',
              } as React.CSSProperties}
          >
              {clonedMedia.map((media, index) => {
                // Klon mu yoksa gerçek slide mı kontrol et
                const isClone = slideCount > 1 && (index === 0 || index === totalSlides - 1);
                const realIndex = index === 0 ? slideCount - 1 : (index === totalSlides - 1 ? 0 : index - 1);
                
                return (
                  <div 
                      key={`${isClone ? 'clone-' : ''}${realIndex}-${index}`}
                      className={`relative ${isMobile ? '' : 'h-full'} flex-shrink-0 ${isMobile ? 'hero-slide-mobile' : ''}`}
                      style={{
                        width: `${100 / totalSlides}%`,
                        minWidth: `${100 / totalSlides}%`,
                        maxWidth: `${100 / totalSlides}%`,
                        flexShrink: 0,
                        flexGrow: 0,
                        scrollSnapAlign: 'none',
                        scrollSnapStop: 'normal',
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        position: 'relative',
                        ...(isMobile && heroHeight ? { height: `${heroHeight}px`, minHeight: `${heroHeight}px` } : (!isMobile ? { height: '100%', minHeight: '100%' } : {})),
                      }}
                  >
                      {media.type === 'video' ? (
                           <video 
                               className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
                               autoPlay 
                               loop 
                               muted 
                               playsInline 
                               src={media.url} 
                               key={media.url}
                           />
                      ) : media.type === 'youtube' ? (
                           <YouTubeBackground url={media.url} isMobile={isMobile} />
                      ) : (
                          <img 
                              src={media.url} 
                              alt={t(media.title)} 
                              className={`${isMobile ? 'relative' : 'absolute'} top-0 left-0 w-full ${isMobile ? 'h-auto' : 'h-full'} ${isMobile ? 'object-contain object-top' : 'object-cover'}`}
                          />
                      )}
                      <div className="absolute inset-0 bg-black/50 z-10"></div>
                       <div className={`absolute z-20 ${isMobile ? 'w-full px-4' : 'container mx-auto px-4 sm:px-6 lg:px-8'} h-full flex items-center ${content.isHeroTextVisible && content.isLogoVisible ? 'justify-center md:justify-start' : 'justify-center'}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                          <div className={`flex flex-col md:flex-row items-center text-white gap-12 md:gap-16 ${content.isHeroTextVisible || content.isLogoVisible ? 'max-w-4xl' : ''} text-center ${content.isLogoVisible ? 'md:text-left' : 'md:text-center'}`}>
                              {content.isLogoVisible && (
                                  <div className="animate-fade-in-down flex-shrink-0">
                                      <SiteLogo logoUrl={settings?.logoUrl} className="w-[360px] h-[360px]" />
                                  </div>
                              )}
                              {content.isHeroTextVisible && (
                                  <div className="relative w-full">
                                      <div className="animate-fade-in-up">
                                        <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4 leading-relaxed" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{t(media.title)}</h1>
                                        <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{t(media.subtitle)}</p>
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
                );
              })}
          </div>
          {slideCount > 1 && (
              <div className={`${isMobile ? 'absolute' : 'absolute'} ${isMobile ? 'bottom-4' : 'bottom-10'} left-1/2 -translate-x-1/2 z-30 flex items-center space-x-4`} style={isMobile ? { position: 'absolute', bottom: '16px' } : {}}>
                  {heroMedia.map((_, index) => {
                    // currentSlide'ı normalize et (klonlar hariç)
                    const normalizedSlide = currentSlide < 0 ? slideCount - 1 : (currentSlide >= slideCount ? 0 : currentSlide);
                    return (
                      <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`relative rounded-full h-2 transition-all duration-500 ease-in-out group ${index === normalizedSlide ? 'w-12 bg-white/50' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                          aria-label={`Go to slide ${index + 1}`}
                      >
                          {index === normalizedSlide && (
                              <div
                                  key={`${normalizedSlide}-${index}`}
                                  className="absolute top-0 left-0 h-full rounded-full bg-white animate-fill-line"
                              ></div>
                          )}
                      </button>
                    );
                  })}
              </div>
           )}
        </div>
      ) : (
        <div className="relative h-[50vh] w-full bg-gray-800" />
      )}

      {/* Content Blocks Section */}
      {content?.contentBlocks && content.contentBlocks.length > 0 && (() => {
        const sortedBlocks = [...content.contentBlocks].sort((a, b) => (a.order || 0) - (b.order || 0));
        return (
          <>
            {sortedBlocks.map((block, index) => {
              const getMediaUrl = () => {
                if (block.mediaType === 'image' && block.image) {
                  return block.image;
                }
                return block.url || '';
              };

              const mediaUrl = getMediaUrl();
              const isFullWidth = block.position === 'full';
              const isLeft = block.position === 'left';
              const isRight = block.position === 'right';
              const isCenter = block.position === 'center';

              const backgroundColor = block.backgroundColor === 'gray' ? 'bg-gray-100' : 'bg-white';
              const textAlign = block.textAlignment || 'left';
              const textAlignClass = textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left';
              
              return (
                <section key={index} className={`${index === 0 ? 'pt-0 pb-0' : index === 1 ? 'pt-0 pb-20' : 'py-20'} ${backgroundColor}`}>
                  {isFullWidth ? (
                    <div className="w-full overflow-hidden">
                      {block.mediaType === 'youtube' ? (
                        <div className="relative w-full aspect-video overflow-hidden">
                          <YouTubeBackground url={mediaUrl} />
                        </div>
                      ) : block.mediaType === 'video' ? (
                        <video className={`w-full h-auto max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`} autoPlay loop muted playsInline src={mediaUrl} />
                      ) : (
                        <img src={mediaUrl} alt="" className={`w-full h-auto ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`} />
                      )}
                      {block.description && (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                          <div className={`prose max-w-none ${textAlignClass}`}>
                            <p className="text-lg text-gray-700 font-light leading-relaxed">{t(block.description)}</p>
                          </div>
                          {block.linkText && block.linkUrl && (
                            <div className={`mt-6 ${textAlignClass}`}>
                              <Link
                                to={block.linkUrl}
                                className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 px-5 text-lg rounded-lg hover:bg-gray-900/10 transition-colors duration-300"
                              >
                                <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t(block.linkText)}</span>
                                <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                      <div className={`flex flex-col ${isLeft ? 'md:flex-row' : isRight ? 'md:flex-row-reverse' : 'md:flex-row items-center'} gap-12`}>
                        <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'} overflow-hidden`}>
                          {block.mediaType === 'youtube' ? (
                            <div className="relative w-full aspect-video overflow-hidden">
                              <YouTubeBackground url={mediaUrl} />
                            </div>
                          ) : block.mediaType === 'video' ? (
                            <video className={`w-full h-auto ${imageBorderClass} max-w-full ${isMobile ? 'object-contain' : 'object-cover'}`} autoPlay loop muted playsInline src={mediaUrl} />
                          ) : (
                            <img src={mediaUrl} alt="" className={`w-full h-auto ${imageBorderClass} ${isMobile ? 'object-contain' : 'object-cover'} max-w-full block`} />
                          )}
                        </div>
                        {block.description && (
                          <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'}`}>
                            <div className={`prose max-w-none ${textAlignClass}`}>
                              <p className="text-lg text-gray-700 font-light leading-relaxed">{t(block.description)}</p>
                            </div>
                            {block.linkText && block.linkUrl && (
                              <div className={`mt-6 ${textAlignClass}`}>
                                <Link
                                  to={block.linkUrl}
                                  className="group inline-flex items-center gap-x-3 text-gray-900 font-semibold py-3 px-5 text-lg rounded-lg hover:bg-gray-900/10 transition-colors duration-300"
                                >
                                  <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t(block.linkText)}</span>
                                  <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </>
        );
      })()}

      {/* Featured Products Section */}
      {Array.isArray(featuredProducts) && featuredProducts.length > 0 && (
        <section id="featured" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            <h2 className="text-3xl font-light text-gray-600 text-center mb-4 leading-relaxed">{t('featured_products')}</h2>
            <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12 font-light leading-relaxed">{t('featured_products_subtitle')}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {featuredProducts.map(p => (
                <ProductCard key={p.id} product={p} variant="light" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Designer Spotlight */}
      {featuredDesigner && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 animate-fade-in-up">
              <div className="w-full md:w-1/2 overflow-hidden">
                  <img src={featuredDesigner.image} alt={t(featuredDesigner.name)} className="shadow-xl w-full object-cover max-w-full" />
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                  <h3 className="text-sm font-light uppercase tracking-widest text-gray-500">{t('designer_spotlight')}</h3>
                  <h2 className="text-4xl font-light text-gray-600 mt-2 leading-relaxed">{t(featuredDesigner.name)}</h2>
                  <p className="mt-4 text-gray-500 leading-loose font-light">{t(featuredDesigner.bio).substring(0, 200)}...</p>
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
      {inspiration && (inspiration.backgroundImage || inspiration.title || inspiration.subtitle) && (
        <section 
          className="relative py-32 bg-gray-800 text-white text-center inspiration-section-mobile"
          style={{ 
            backgroundImage: `url(${inspiration.backgroundImage})`, 
            backgroundSize: isMobile ? '100vw auto' : 'cover', 
            backgroundAttachment: 'fixed', 
            backgroundPosition: isMobile ? 'left center' : 'center center', 
            backgroundRepeat: 'no-repeat',
          }}
        >
           <div className="absolute inset-0 bg-black/50"></div>
           <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
              <h2 className="text-4xl font-light leading-relaxed">{t(inspiration.title)}</h2>
              <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">{t(inspiration.subtitle)}</p>
              {inspiration.buttonText && (
                <Link
                    to={inspiration.buttonLink || '/'}
                    className="group mt-8 inline-flex items-center gap-x-3 text-white font-semibold py-3 px-5 text-lg rounded-lg hover:bg-white/10 transition-colors duration-300"
                >
                    <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">{t(inspiration.buttonText)}</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </Link>
              )}
           </div>
        </section>
      )}
    </div>
  );
}