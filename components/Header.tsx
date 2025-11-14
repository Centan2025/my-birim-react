import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { Category, SiteSettings, Product, Designer } from '../types';
import { getCategories, getSiteSettings, getProducts, getDesigners } from '../services/cms';
import { useAuth } from '../App';
import { SiteLogo } from './SiteLogo';
import { useTranslation } from '../i18n';
import { useCart } from '../context/CartContext';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);


const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ShoppingBagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

export function Header() {
  const { t, setLocale, locale, supportedLocales } = useTranslation();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const productsTimeoutRef = useRef<number | null>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const productsButtonRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [submenuOffset, setSubmenuOffset] = useState(0);

  const { isLoggedIn } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56); // 3.5rem = 56px (mobil için varsayılan)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heroBrightness, setHeroBrightness] = useState<number | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const currentRouteRef = useRef<string>(location.pathname);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[], designers: Designer[], categories: Category[] }>({ products: [], designers: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [allData, setAllData] = useState<{ products: Product[], designers: Designer[], categories: Category[] } | null>(null);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults({ products: [], designers: [], categories: [] });
  }, []);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  // Route değiştiğinde brightness'i sıfırla ve header opacity'yi ayarla (sayfa geçişlerinde hemen güncelle)
  useEffect(() => {
    // Route değiştiğini ref'e kaydet
    currentRouteRef.current = location.pathname;
    
    // Sayfa değiştiğinde brightness'i hemen sıfırla
    setHeroBrightness(null);
    // Scroll pozisyonunu sıfırla (ScrollToTop component'i bunu yapıyor ama biz de garantilemek için)
    setLastScrollY(0);
    // Header opacity'yi hemen 0 yap (route değiştiğinde)
    if (isMobile) {
      setHeaderOpacity(0);
    }
    
    // Sayfa geçişlerinde scroll pozisyonunu kontrol et
    // ScrollToTop component'i scroll'u 0'a ayarlıyor ama biraz gecikme olabilir
    // Bu yüzden kısa bir gecikme ile kontrol ediyoruz
    const checkScroll = () => {
      // Route değiştiyse işlemi durdur
      if (currentRouteRef.current !== location.pathname) {
        return;
      }
      
      const currentScrollY = window.scrollY;
      if (isMobile && currentScrollY === 0) {
        // Sayfa en üstteyse ve brightness henüz hesaplanmadıysa, header'ı şeffaf yap
        setHeaderOpacity(0);
      }
    };
    // Hemen kontrol et
    checkScroll();
    // ScrollToTop'un çalışması için kısa bir gecikme ile tekrar kontrol et
    const timeoutId = setTimeout(checkScroll, 50);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, isMobile]);

  // Sayfanın üst kısmındaki görselin parlaklığını kontrol et (mobilde, tüm sayfalarda)
  useEffect(() => {
    if (!isMobile || window.scrollY > 0) {
      setHeroBrightness(null);
      return;
    }

    // Route değiştiğinde brightness'i sıfırla ve hesaplamayı durdur
    const currentPath = location.pathname;
    let isCancelled = false;

    const checkTopImageBrightness = () => {
      // Route değiştiyse hesaplamayı durdur
      if (location.pathname !== currentPath) {
        isCancelled = true;
        return;
      }
      
      // Scroll pozisyonu değiştiyse (artık 0 değilse) durdur
      if (window.scrollY > 0) {
        setHeroBrightness(null);
        return;
      }
      // Sayfanın en üst kısmındaki görseli bul (viewport'un üst kısmı)
      // Önce hero section'ı kontrol et
      let activeMedia: HTMLImageElement | HTMLVideoElement | null = null;
      
      // 1. Hero section'daki görseli kontrol et
      const heroContainer = document.querySelector('.hero-scroll-container');
      if (heroContainer) {
        const slides = heroContainer.querySelectorAll('.hero-slide-mobile, [class*="hero-slide"]');
        for (const slide of Array.from(slides)) {
          const img = slide.querySelector('img') as HTMLImageElement;
          const video = slide.querySelector('video') as HTMLVideoElement;
          
          if (img && img.complete) {
            activeMedia = img;
            break;
          } else if (video && video.readyState >= 2) {
            activeMedia = video;
            break;
          }
        }
      }

      // 2. Hero section yoksa, main element'in ilk görselini bul
      if (!activeMedia) {
        const main = document.querySelector('main');
        if (main) {
          // Main'in ilk section veya div'ini bul
          const firstSection = main.querySelector('section, div, img, video') as HTMLElement;
          if (firstSection) {
            // İlk img veya video'yu bul
            const img = firstSection.querySelector('img') as HTMLImageElement;
            const video = firstSection.querySelector('video') as HTMLVideoElement;
            
            if (img && img.complete && img.offsetTop < 500) { // Viewport'un üst kısmında
              activeMedia = img;
            } else if (video && video.readyState >= 2 && video.offsetTop < 500) {
              activeMedia = video;
            }
          }
        }
      }

      // 3. Hala bulamadıysak, viewport'un üst kısmındaki tüm img/video'ları kontrol et
      if (!activeMedia) {
        const allImages = document.querySelectorAll('img, video');
        for (const media of Array.from(allImages)) {
          const rect = media.getBoundingClientRect();
          // Viewport'un üst 500px'inde olan ve yüklenmiş görseli bul
          if (rect.top >= 0 && rect.top < 500 && rect.left >= 0 && rect.left < window.innerWidth) {
            if (media instanceof HTMLImageElement && media.complete) {
              activeMedia = media;
              break;
            } else if (media instanceof HTMLVideoElement && media.readyState >= 2) {
              activeMedia = media;
              break;
            }
          }
        }
      }

      if (!activeMedia) {
        if (!isCancelled) {
          setHeroBrightness(null);
        }
        return;
      }

      // Route değiştiyse hesaplamayı durdur
      if (location.pathname !== currentPath || isCancelled) {
        return;
      }

      // Canvas kullanarak görselin parlaklığını hesapla
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.min(activeMedia.width || activeMedia.offsetWidth || 100, 200);
      canvas.height = Math.min(activeMedia.height || activeMedia.offsetHeight || 100, 200);

      try {
        ctx.drawImage(activeMedia, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Route değiştiyse hesaplamayı durdur (async işlem sırasında)
        if (location.pathname !== currentPath || isCancelled) {
          return;
        }

        // Ortalama parlaklığı hesapla
        let totalBrightness = 0;
        let pixelCount = 0;

        // Her 10. pikseli örnekle (performans için)
        const sampleRate = 10;
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          // Route değiştiyse hesaplamayı durdur
          if (location.pathname !== currentPath || isCancelled) {
            return;
          }
          
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance formülü: 0.299*R + 0.587*G + 0.114*B
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalBrightness += brightness;
          pixelCount++;
        }

        // Route değiştiyse sonucu kaydetme
        if (location.pathname !== currentPath || isCancelled) {
          return;
        }

        if (pixelCount > 0) {
          const avgBrightness = totalBrightness / pixelCount;
          setHeroBrightness(avgBrightness);
        } else {
          setHeroBrightness(null);
        }
      } catch (e) {
        // Route değiştiyse hata işleme yapma
        if (location.pathname !== currentPath || isCancelled) {
          return;
        }
        
        // CORS hatası veya başka bir hata - sessizce handle et
        // Cross-origin görseller için brightness hesaplanamaz, bu normal
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (e instanceof DOMException || errorMessage.includes('tainted') || errorMessage.includes('SecurityError') || errorMessage.includes('cross-origin')) {
          setHeroBrightness(null);
        } else {
          setHeroBrightness(null);
        }
      }
    };

    // Görsel yüklendikten sonra kontrol et - sayfa geçişlerinde daha hızlı
    // Route değiştiğinde hemen kontrol et (sayfa geçişlerinde)
    const immediateTimeoutId = setTimeout(checkTopImageBrightness, 100);
    const timeoutId = setTimeout(checkTopImageBrightness, 500);
    const intervalId = setInterval(checkTopImageBrightness, 2000); // Her 2 saniyede bir kontrol et

    return () => {
      clearTimeout(immediateTimeoutId);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isMobile, location.pathname]);

  // Mobil kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const currentPath = currentRouteRef.current;

        // Route değiştiyse işlemi durdur
        if (currentPath !== location.pathname) {
          return;
        }

        // Mobilde: Özel davranış
        if (isMobile) {
          // Mobil menü açıksa opacity'yi artır
          if (isMobileMenuOpen) {
            setHeaderOpacity(0.9);
            setIsHeaderVisible(true);
          } else if (isSearchOpen) {
            // Arama açıldığında arama paneli ile aynı opacity (0.8) - scroll'da değişmesin
            setHeaderOpacity(0.8);
            setIsHeaderVisible(true);
          } else {
            // Mobilde: Sayfa en üstteyken (scrollY = 0) şeffaflığı ayarla
            if (currentScrollY === 0) {
              // Route değiştiyse brightness kullanma
              if (currentPath !== location.pathname) {
                setHeaderOpacity(0);
                setIsHeaderVisible(true);
              } else if (heroBrightness !== null) {
                // Route değiştiyse brightness kullanma (double check)
                if (currentPath !== location.pathname) {
                  setHeaderOpacity(0);
                  setIsHeaderVisible(true);
                } else if (heroBrightness > 0.4) {
                  // Görsel beyaza yakın, header'ı daha görünür yap
                  // Brightness 0.4'ten fazlaysa opacity artır, max 0.9
                  // Daha agresif: 0.4'ten başlayarak opacity artır
                  const adjustedOpacity = Math.min(0.9, 0.3 + (heroBrightness - 0.4) * 1.5);
                  setHeaderOpacity(adjustedOpacity);
                } else {
                  // Görsel koyu, header tamamen şeffaf
                  setHeaderOpacity(0);
                }
              } else {
                // Brightness hesaplanamadı (CORS vb.) veya henüz hesaplanmadı (route değişti)
                // Varsayılan olarak şeffaf bırak - brightness hesaplanınca güncellenecek
                setHeaderOpacity(0);
              }
              setIsHeaderVisible(true); // Sayfa en üstteyken menü görünür
            } else {
              // Scroll yapıldıkça opacity artıyor
              const maxScroll = 200;
              const opacity = Math.min(0.9, (currentScrollY / maxScroll) * 0.9);
              setHeaderOpacity(opacity);

              // Yukarı kaydırırken (scroll down) menüyü gizle
              if (currentScrollY > lastScrollY && currentScrollY > 30) {
                setIsHeaderVisible(false); // Scrolling down - menüyü gizle
              } else if (currentScrollY < lastScrollY) {
                setIsHeaderVisible(true); // Scrolling up - menüyü göster
              }
            }
          }
          setLastScrollY(currentScrollY);
        } else {
          // Desktop: Scroll yapınca menüyü gizle/göster
          // Arama açıkken header'ı gizleme
          if (!isSearchOpen) {
            // Sayfa en üstteyken header görünür
            if (currentScrollY <= 0) {
              setIsHeaderVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
              setIsHeaderVisible(false); // Scrolling down - menüyü gizle
            } else if (currentScrollY < lastScrollY) {
              setIsHeaderVisible(true); // Scrolling up - menüyü göster
            }
            // currentScrollY === lastScrollY durumunda değişiklik yok
          } else {
            // Arama açıkken header görünür kalmalı
            setIsHeaderVisible(true);
          }
          
          setLastScrollY(currentScrollY);

          const maxScroll = 200;
          let opacity = 0.2;
          
          if (currentScrollY > 0) {
            opacity = Math.min(0.9, 0.2 + (currentScrollY / maxScroll) * 0.7);
          }
          
          setHeaderOpacity(opacity);
        }

        // Close any open menus on scroll
        const scrollDelta = Math.abs(currentScrollY - lastScrollY);
        if (scrollDelta > 3) { // En az 3px scroll yapıldıysa
          if (isMobile) {
            // Mobilde: Scroll timeout'u temizle ve yeni bir tane başlat
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            
            // Hemen kapat (gecikme yok)
            if (isLangOpen) setIsLangOpen(false);
            if (isProductsOpen) setIsProductsOpen(false);
            if (isSearchOpen) closeSearch();
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
          } else {
            // Desktop'ta: Arama açıksa kapat
            if (isSearchOpen) closeSearch();
            if (isLangOpen) setIsLangOpen(false);
            if (isProductsOpen) setIsProductsOpen(false);
          }
        }
    };

    // İlk yüklemede şeffaflığı ayarla
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile, lastScrollY, isLangOpen, isProductsOpen, isSearchOpen, closeSearch, isMobileMenuOpen, heroBrightness, isHeaderVisible, location.pathname]);

  // Mobil menü açıldığında/kapandığında opacity'yi güncelle
  useEffect(() => {
    if (isMobile) {
      if (isMobileMenuOpen) {
        setHeaderOpacity(0.9);
        setIsHeaderVisible(true);
      } else if (isSearchOpen) {
        // Arama açıldığında arama paneli ile aynı opacity (0.8)
        setHeaderOpacity(0.8);
        setIsHeaderVisible(true);
      } else {
        // Menü ve arama kapalıysa, scroll handler opacity'yi ayarlayacak
        // Bu effect sadece menü/arama açıkken opacity'yi override eder
        // Scroll handler zaten route değiştiğinde opacity'yi 0 yapıyor
      }
    }
  }, [isMobile, isMobileMenuOpen, isSearchOpen, location.pathname]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Header yüksekliğini güncelle
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerContainerRef.current) {
        const height = headerContainerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };
    
    updateHeaderHeight();
    
    // Header yüksekliği değiştiğinde güncelle (menü açıldığında/kapandığında)
    const observer = new ResizeObserver(updateHeaderHeight);
    if (headerContainerRef.current) {
      observer.observe(headerContainerRef.current);
    }
    
    return () => {
      if (headerContainerRef.current) {
        observer.unobserve(headerContainerRef.current);
      }
    };
  }, [isMobileMenuOpen, isProductsOpen]);

  // Keep submenu aligned under the PRODUCTS button
  const updateSubmenuOffset = useCallback(() => {
    const btn = productsButtonRef.current;
    const headerEl = headerContainerRef.current;
    if (!btn || !headerEl) return;
    const btnRect = btn.getBoundingClientRect();
    const headerRect = headerEl.getBoundingClientRect();
    const offset = Math.max(0, Math.round(btnRect.left - headerRect.left));
    setSubmenuOffset(offset);
  }, []);

  useEffect(() => {
    if (isProductsOpen) {
      updateSubmenuOffset();
    }
  }, [isProductsOpen, updateSubmenuOffset, locale]);

  useEffect(() => {
    const onResize = () => updateSubmenuOffset();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [updateSubmenuOffset]);

  // Focus search input when search panel opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      // Small delay to ensure the panel is visible
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Fetch all data for search when the search modal is opened for the first time.
  useEffect(() => {
    if (isSearchOpen && !allData) {
      setIsSearching(true);
      Promise.all([getProducts(), getDesigners(), getCategories()]).then(([products, designers, categories]) => {
        setAllData({ products, designers, categories });
        setIsSearching(false);
      }).catch(() => {
        setIsSearching(false);
      });
    }
  }, [isSearchOpen, allData]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ products: [], designers: [], categories: [] });
      return;
    }
    
    if (!allData) return;

    setIsSearching(true);
    const handler = setTimeout(() => {
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        if (!lowercasedQuery) {
            setSearchResults({ products: [], designers: [], categories: [] });
            setIsSearching(false);
            return;
        }

        const filteredProducts = allData.products.filter(p =>
            t(p.name).toLowerCase().includes(lowercasedQuery)
        );
        const filteredDesigners = allData.designers.filter(d =>
            t(d.name).toLowerCase().includes(lowercasedQuery)
        );
        const filteredCategories = allData.categories.filter(c =>
            t(c.name).toLowerCase().includes(lowercasedQuery)
        );
        setSearchResults({ products: filteredProducts, designers: filteredDesigners, categories: filteredCategories });
        setIsSearching(false);
    }, 300); // 300ms debounce

    return () => {
        clearTimeout(handler);
    };
  }, [searchQuery, allData, t]);
  
    useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Search panel için - sadece mouse event'lerde çalış (touch'da sorun yaratıyor)
      if (event.type === 'mousedown' && isSearchOpen) {
        if (
          searchPanelRef.current && !searchPanelRef.current.contains(target) &&
          searchButtonRef.current && !searchButtonRef.current.contains(target)
        ) {
          closeSearch();
        }
      }
      
      // Mobil menü için
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current && !mobileMenuRef.current.contains(target) &&
        mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Touch event'i kaldırdık - arama paneli için sorun yaratıyordu
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, isMobileMenuOpen, closeSearch]);


  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
      productsTimeoutRef.current = null;
    }
    setIsProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimeoutRef.current = window.setTimeout(() => {
      setIsProductsOpen(false);
      productsTimeoutRef.current = null;
    }, 200);
  };

  const handleCloseProducts = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
      productsTimeoutRef.current = null;
    }
    setIsProductsOpen(false);
  };
  
  const navLinkClasses = 'text-sm font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300';
  const activeLinkClasses = { color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.5)', opacity: 1 };
  const iconClasses = 'text-white hover:text-gray-200 transition-all duration-300 transform hover:scale-125';
  
  

  const NavItem: React.FC<{ to: string; children: React.ReactNode; onMouseEnter?: () => void; onClick?: () => void }> = ({ to, children, onMouseEnter, onClick }) => (
    <NavLink to={to} onMouseEnter={onMouseEnter} onClick={onClick} className={`relative group py-2 ${navLinkClasses}`} style={({ isActive }) => (isActive ? activeLinkClasses : undefined)}>
      <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
          {children}
      </span>
      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
    </NavLink>
  );

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div
          className={`overflow-hidden transition-all duration-700 ease-in-out ${isProductsOpen ? 'max-h-[20rem]' : isMobileMenuOpen ? 'max-h-[40rem]' : isMobile ? 'max-h-[3.5rem]' : 'max-h-[6rem]'} ${isMobile && headerOpacity <= 0 ? '' : 'backdrop-blur-lg border-b border-white/10'}`}
          style={{
            backgroundColor: isMobile && headerOpacity <= 0 ? 'transparent' : `rgba(0, 0, 0, ${headerOpacity})`,
            transition: 'background-color 0.2s ease-out, max-height 0.7s ease-in-out',
            backdropFilter: isMobile && headerOpacity <= 0 ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: isMobile && headerOpacity <= 0 ? 'none' : 'blur(16px)',
            borderBottom: isMobile && headerOpacity <= 0 ? 'none' : undefined,
            pointerEvents: 'auto',
          }}
          ref={headerContainerRef}
        >
          <nav className="px-2 sm:px-4 lg:px-6" ref={navRef}>
            <div className="relative flex h-14 lg:h-24 items-center lg:grid lg:grid-cols-[1fr_auto_1fr]">
              {/* Sol taraf - Menü düğmeleri (desktop) ve Logo (mobil) */}
              <div className="flex flex-1 items-center lg:justify-start">
                {/* Mobil Logo - Solda */}
                <div className="lg:hidden flex items-center">
                  <Link to="/" className="flex items-center gap-1.5 text-white transition-colors">
                    <SiteLogo logoUrl={settings?.logoUrl} className="w-32 h-5" />
                  </Link>
                </div>
                {/* Desktop Menü */}
                <div className="hidden lg:flex lg:items-center lg:space-x-8">
                  <div 
                    ref={productsButtonRef}
                    className="relative"
                    onMouseEnter={handleProductsEnter}
                    onMouseLeave={handleProductsLeave}
                  >
                    <Link 
                      to="/products"
                      className={`group flex items-center space-x-1 py-2 ${navLinkClasses}`}
                      onClick={() => setIsProductsOpen(false)}
                    >
                        <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase">
                            {t('products')}
                            <span className={`absolute -bottom-2 left-0 w-full h-[3px] bg-white transition-transform duration-300 ease-out origin-center ${isProductsOpen ? 'scale-x-0 opacity-0' : 'transform scale-x-0 group-hover:scale-x-100'}`}></span>
                        </span>
                        <ChevronDownIcon />
                    </Link>
                  </div>
                  <NavItem to="/designers" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>{t('designers')}</NavItem>
                  <NavItem to="/projects" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>{t('projects') || 'Projeler'}</NavItem>
                  <NavItem to="/news" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>{t('news')}</NavItem>
                  <NavItem to="/about" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>{t('about')}</NavItem>
                  <NavItem to="/contact" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>{t('contact')}</NavItem>
                </div>
              </div>

              {/* Orta - Logo (Desktop) */}
              <div className="hidden lg:flex items-center justify-center">
                <Link to="/" className="flex items-center gap-3 text-white transition-colors">
                  <SiteLogo logoUrl={settings?.logoUrl} className="w-32 md:w-72 h-6 md:h-10" />
                </Link>
              </div>

              {/* Sağ taraf - İkonlar */}
              <div className="flex flex-1 items-center justify-end space-x-4 lg:justify-end">
                <button ref={searchButtonRef} onClick={() => isSearchOpen ? closeSearch() : setIsSearchOpen(true)} className={iconClasses}>
                    {isSearchOpen ? <CloseIcon /> : <SearchIcon />}
                </button>
                {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
                <div className="hidden md:flex items-center gap-0">
                  {supportedLocales.map((langCode) => {
                    const isActive = locale === langCode;
                    return (
                      <button
                        key={langCode}
                        onClick={() => setLocale(langCode)}
                        aria-pressed={isActive}
                        className={`group relative px-1 py-1 text-[0.8rem] uppercase tracking-[0.25em] transition-colors duration-200 ${
                          isActive
                            ? 'text-white font-extralight'
                            : 'text-gray-400/90 hover:text-white font-extralight'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.25em' }}
                      >
                        <span className="relative inline-block">
                          {langCode.toUpperCase()}
                          <span className={`absolute -bottom-1 left-0 w-full h-[3px] bg-white transition-transform duration-300 ease-out origin-center ${
                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`}></span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                )}
                <NavLink to={isLoggedIn ? "/profile" : "/login"} className={iconClasses}>
                  <UserIcon />
                </NavLink>
                {settings?.showCartButton !== false && (
                  <button onClick={toggleCart} className={`relative ${iconClasses}`}>
                    <ShoppingBagIcon />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}
                <div className="lg:hidden flex items-center">
                  <button ref={mobileMenuButtonRef} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`${iconClasses} flex items-center justify-center`}>
                    <MenuIcon />
                  </button>
                </div>
              </div>
            </div>
          </nav>
          {/* Ürün kategorileri paneli - header içinde genişleyip daralır */}
          <div 
            className={`hidden lg:block transition-all duration-500 ease-in-out ${isProductsOpen ? 'opacity-100 translate-y-0 max-h-[20rem]' : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'}`}
            onMouseEnter={handleProductsEnter}
            onMouseLeave={handleProductsLeave}
          > 
            <div className="pt-1 pb-3" style={{ paddingLeft: submenuOffset }}>
              <div className="flex flex-wrap gap-4">
                {categories.map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/products/${category.id}`}
                    className="group relative px-1 py-1 text-sm font-semibold uppercase text-gray-200 hover:text-white transition-colors duration-300"
                    onClick={() => setIsProductsOpen(false)}
                  >
                    <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
                      {t(category.name)}
                      <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          {/* Mobil menü - header içinde açılır */}
          {isMobileMenuOpen && (
            <div ref={mobileMenuRef} className="lg:hidden border-t border-white/10">
              {/* Dil seçenekleri - Menü öğelerinin üstünde */}
              {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
                <div className="relative w-full">
                  <div className="flex items-center justify-start gap-1 bg-black/50 px-4 sm:px-5 lg:px-6 py-3 min-h-[3rem] border-b border-white/10">
                    {supportedLocales.map((langCode) => {
                      const isActive = locale === langCode;
                      return (
                        <button
                          key={langCode}
                          onClick={() => {
                            setLocale(langCode);
                            setIsMobileMenuOpen(false);
                          }}
                          aria-pressed={isActive}
                          className={`group relative px-1.5 py-0.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${
                            isActive
                              ? 'text-white font-extralight'
                              : 'text-gray-400/90 hover:text-white font-extralight'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em' }}
                        >
                          <span className="relative inline-block">
                            {langCode.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
               <nav className="px-4 sm:px-5 lg:px-6 pt-2 pb-2 flex flex-col">
                 <div className="flex flex-col">
                   <NavLink to="/products" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10" onClick={() => setIsMobileMenuOpen(false)}>{t('products')}</NavLink>
                   <NavLink to="/designers" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10" onClick={() => setIsMobileMenuOpen(false)}>{t('designers')}</NavLink>
                   <NavLink to="/projects" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10" onClick={() => setIsMobileMenuOpen(false)}>{t('projects') || 'Projeler'}</NavLink>
                   <NavLink to="/news" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10" onClick={() => setIsMobileMenuOpen(false)}>{t('news')}</NavLink>
                   <NavLink to="/about" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10" onClick={() => setIsMobileMenuOpen(false)}>{t('about')}</NavLink>
                   <NavLink to="/contact" className="flex items-center min-h-[3rem] py-3 text-base font-semibold tracking-wider uppercase text-gray-200 hover:text-white transition-colors duration-300" onClick={() => setIsMobileMenuOpen(false)}>{t('contact')}</NavLink>
                 </div>
               </nav>
            </div>
          )}
        </div>
        {/* Desktop genişleyen ürün paneli kaldırıldı; içerik header içinde render ediliyor */}
      </header>
      
      <div
        ref={searchPanelRef}
        className={`fixed left-0 right-0 z-[100] bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-all duration-300 ease-out ${isSearchOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
        style={{
          top: isHeaderVisible ? `${headerHeight}px` : '0px',
        }}
      >
        <div className="container mx-auto px-6 py-8">
            <div className="w-full max-w-3xl mx-auto">
                <input
                    ref={searchInputRef}
                    type="search"
                    placeholder=""
                    className="w-full bg-transparent text-white text-2xl border-b border-gray-500 focus:border-white outline-none transition-colors duration-300 pb-3"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery.length > 0 && (
                <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2">
                  {isSearching && <p className="text-center text-gray-300">{t('searching')}</p>}
                  
                  {!isSearching && searchQuery.length > 1 && searchResults.products.length === 0 && searchResults.designers.length === 0 && searchResults.categories.length === 0 && (
                    <p className="text-center text-gray-300">{t('search_no_results', searchQuery)}</p>
                  )}

                  {searchResults.products.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">{t('products')}</h3>
                      <div className="space-y-2">
                        {searchResults.products.map(product => {
                            const designerName = t(allData?.designers.find(d => d.id === product.designerId)?.name);
                            return (
                               <Link key={product.id} to={`/product/${product.id}`} onClick={closeSearch} className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200">
                                  <img src={typeof product.mainImage === 'string' ? product.mainImage : product.mainImage?.url || ''} alt={t(product.name)} className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-white">{t(product.name)}</p>
                                    {designerName && <p className="text-sm text-gray-400">{designerName}</p>}
                                  </div>
                                </Link>
                            );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {searchResults.categories.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">{t('categories')}</h3>
                      <div className="space-y-2">
                        {searchResults.categories.map(category => (
                           <Link key={category.id} to={`/products/${category.id}`} onClick={closeSearch} className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200">
                              <img src={category.heroImage} alt={t(category.name)} className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-white">{t(category.name)}</p>
                                <p className="text-sm text-gray-400">{t('category')}</p>
                              </div>
                            </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.designers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 pl-3">{t('designers')}</h3>
                      <div className="space-y-2">
                        {searchResults.designers.map(designer => (
                           <Link key={designer.id} to={`/designer/${designer.id}`} onClick={closeSearch} className="flex items-center p-3 hover:bg-white/10 rounded-md transition-colors duration-200">
                              <img src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''} alt={t(designer.name)} className="w-12 h-12 object-cover rounded-full mr-4 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-white">{t(designer.name)}</p>
                                <p className="text-sm text-gray-400">{t('designer')}</p>
                              </div>
                            </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
}