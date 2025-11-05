import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
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

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ShoppingBagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

export function Header() {
  const { t, setLocale, locale, supportedLocales } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const productsTimeoutRef = useRef<number | null>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const { isLoggedIn } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

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

  useEffect(() => {
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsHeaderVisible(false); // Scrolling down
        } else {
            setIsHeaderVisible(true); // Scrolling up
        }
        setLastScrollY(currentScrollY);

        // Close any open menus on scroll
        if (isLangOpen) setIsLangOpen(false);
        if (isProductsOpen) setIsProductsOpen(false);
        if (isSearchOpen) closeSearch();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isLangOpen, isProductsOpen, isSearchOpen, closeSearch]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Fetch all data for search when the search modal is opened for the first time.
  useEffect(() => {
    if (isSearchOpen && !allData) {
      setIsSearching(true);
      Promise.all([getProducts(), getDesigners(), getCategories()]).then(([products, designers, categories]) => {
        setAllData({ products, designers, categories });
        setIsSearching(false);
      }).catch(err => {
        console.error("Failed to load search data", err);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchOpen &&
        searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node) &&
        searchButtonRef.current && !searchButtonRef.current.contains(event.target as Node)
      ) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, closeSearch]);


  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
    }
    setIsProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimeoutRef.current = window.setTimeout(() => {
      setIsProductsOpen(false);
    }, 200);
  };
  
  const navLinkClasses = 'text-sm font-medium tracking-wider text-gray-200 hover:text-white transition-colors duration-300';
  const activeLinkClasses = { color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.5)', opacity: 1 };
  const iconClasses = 'text-white hover:text-gray-200 transition-all duration-300 transform hover:scale-125';
  
  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
        'tr': 'Türkçe',
        'en': 'English',
        'de': 'Deutsch',
        'fr': 'Français',
        'es': 'Español',
        'it': 'Italiano'
    };
    return names[code] || code.toUpperCase();
  };

  const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <NavLink to={to} className={`relative group py-2 ${navLinkClasses}`} style={({ isActive }) => (isActive ? activeLinkClasses : undefined)}>
      <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
          {children}
      </span>
      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
    </NavLink>
  );

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="transition-all duration-300 border-b bg-black/60 backdrop-blur-lg border-white/10">
          <nav className="px-2 sm:px-4 lg:px-6">
            <div className="relative flex h-24 items-center justify-between">
              <div className="flex items-center gap-x-12">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center gap-3 text-white transition-colors">
                    <SiteLogo logoUrl={settings?.logoUrl} className="w-48 h-7" />
                    {settings?.isHeaderTextVisible && (
                      <span className="text-2xl font-bold tracking-wider">{settings.headerText}</span>
                    )}
                  </Link>
                </div>

                <div className="hidden lg:flex lg:items-center lg:space-x-8">
                  <div
                    className="relative"
                    onMouseEnter={handleProductsEnter}
                    onMouseLeave={handleProductsLeave}
                  >
                    <button className={`group flex items-center space-x-1 py-2 ${navLinkClasses}`}>
                        <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
                            {t('collection')}
                            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-center"></span>
                        </span>
                        <ChevronDownIcon />
                    </button>
                    <div className={`absolute top-full left-0 mt-2 w-56 rounded-md shadow-lg bg-black/60 backdrop-blur-lg ring-1 ring-white/10 py-1 transition-all duration-300 ease-out ${isProductsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                        {categories.map((category) => (
                          <NavLink
                            key={category.id}
                            to={`/products/${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => setIsProductsOpen(false)}
                          >
                            {t(category.name)}
                          </NavLink>
                        ))}
                      </div>
                  </div>
                  <NavItem to="/designers">{t('designers')}</NavItem>
                  <NavItem to="/projects">{t('projects') || 'Projeler'}</NavItem>
                  <NavItem to="/news">{t('news')}</NavItem>
                  <NavItem to="/about">{t('about')}</NavItem>
                  <NavItem to="/contact">{t('contact')}</NavItem>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button ref={searchButtonRef} onClick={() => isSearchOpen ? closeSearch() : setIsSearchOpen(true)} className={iconClasses}>
                    {isSearchOpen ? <CloseIcon /> : <SearchIcon />}
                </button>
                <div className="relative">
                   <button onClick={() => setIsLangOpen(!isLangOpen)} className={iconClasses}>
                      <GlobeIcon />
                  </button>
                  <div className={`absolute top-full right-0 mt-2 w-40 rounded-md shadow-lg bg-black/60 backdrop-blur-lg ring-1 ring-white/10 py-1 transition-all duration-300 ease-out ${isLangOpen ? 'opacity-100 translate-y-0 animate-fade-in-down' : 'opacity-0 -translate-y-2 pointer-events-none'}`} style={{ animationDuration: '0.2s' }}>
                      {supportedLocales.map((langCode) => (
                        <a
                          key={langCode}
                          href="#"
                          className={`block px-4 py-2 text-sm ${locale === langCode ? 'font-bold text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                          onClick={(e) => { e.preventDefault(); setLocale(langCode); setIsLangOpen(false); }}
                        >
                          {getLanguageName(langCode)}
                        </a>
                      ))}
                    </div>
                </div>
                <NavLink to={isLoggedIn ? "/profile" : "/login"} className={iconClasses}>
                  <UserIcon />
                </NavLink>
                <button onClick={toggleCart} className={`relative ${iconClasses}`}>
                  <ShoppingBagIcon />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="lg:hidden">
                  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={iconClasses}>
                    <MenuIcon />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md container mx-auto px-10 py-4 rounded-b-lg shadow-lg">
            <nav className="flex flex-col space-y-4">
              <NavLink to="/products/kanepeler" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('collection')}</NavLink>
              <NavLink to="/designers" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('designers')}</NavLink>
              <NavLink to="/projects" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('projects') || 'Projeler'}</NavLink>
              <NavLink to="/news" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('news')}</NavLink>
              <NavLink to="/about" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('about')}</NavLink>
              <NavLink to="/contact" className="text-sm font-medium tracking-wider text-gray-600 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>{t('contact')}</NavLink>
            </nav>
          </div>
        )}
      </header>
      
      <div
        ref={searchPanelRef}
        className={`fixed top-24 left-0 right-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-2xl transition-all duration-300 ease-out ${isSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="container mx-auto px-6 py-8">
            <div className="w-full max-w-3xl mx-auto">
                <input
                    type="search"
                    placeholder={t('search_placeholder')}
                    className="w-full bg-transparent text-white text-2xl placeholder-gray-400 border-b border-gray-500 focus:border-white outline-none transition-colors duration-300 pb-3"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

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
                                  <img src={product.mainImage} alt={t(product.name)} className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0" />
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
                              <img src={designer.image} alt={t(designer.name)} className="w-12 h-12 object-cover rounded-full mr-4 flex-shrink-0" />
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
            </div>
        </div>
      </div>
    </>
  );
}