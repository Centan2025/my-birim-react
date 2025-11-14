import React, { useState, useContext, createContext, PropsWithChildren, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';

import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DesignersPage } from './pages/DesignersPage';
import { DesignerDetailPage } from './pages/DesignerDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import CookiesPage from './pages/CookiesPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import KvkkPage from './pages/KvkkPage';
import { getFooterContent, getSiteSettings, subscribeEmail } from './services/cms';
import type { FooterContent, SiteSettings, User } from './types';
import { SiteLogo } from './components/SiteLogo';
import { I18nProvider, useTranslation } from './i18n';
import { CartProvider } from './context/CartContext';
import { CartSidebar } from './components/CartSidebar';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import CookieBanner from './components/CookieBanner';

// Helper component to render SVG strings safely
const DynamicIcon: React.FC<{ svgString: string }> = ({ svgString }) => (
    <div dangerouslySetInnerHTML={{ __html: svgString }} />
);

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

const SiteSettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    // Update browser tab title if provided from settings; fallback to current title
    if (settings?.topBannerText && typeof settings.topBannerText === 'string' && settings.topBannerText.trim()) {
      document.title = settings.topBannerText.trim();
    }
  }, [settings?.topBannerText]);

  return <SiteSettingsContext.Provider value={{ settings }}>{children}</SiteSettingsContext.Provider>;
};

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('birim_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('birim_user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('birim_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('birim_user');
  };

  const value = { 
    isLoggedIn: !!user, 
    user,
    login, 
    logout 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const TopBanner = () => {
  const { settings } = useSiteSettings();
  const text = settings?.topBannerText?.trim();
  if (!text) return null;
  return (
    <div className="hidden md:block bg-gray-900 text-gray-200 text-xs md:text-sm px-4 sm:px-6 lg:px-8 py-2 border-b border-white/10">
      <div className="container mx-auto">{text}</div>
    </div>
  );
};

const Footer = () => {
    const [content, setContent] = useState<FooterContent | null>(null);
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [email, setEmail] = useState('');
    const { t, setLocale, locale, supportedLocales } = useTranslation();

    useEffect(() => {
        Promise.all([getFooterContent(), getSiteSettings()]).then(([footerData, settingsData]) => {
            setContent(footerData);
            setSettings(settingsData);
        });
    }, []);

    if (!content || !settings) return null;

    return (
        <footer className="bg-gray-800 text-gray-400">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Mobil düzen */}
                <div className="lg:hidden flex flex-col items-center space-y-6">
                    {/* Logo - ortada üstte */}
                    <Link to="/" className="text-white -mt-4">
                        <SiteLogo logoUrl={settings.logoUrl} className="h-6 w-auto mx-auto" />
                    </Link>
                    
                    {/* Menü düğmeleri - alt alta ortada */}
                    <nav className="flex flex-col items-center space-y-3">
                        <Link to="/products" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('products')}
                        </Link>
                        <Link to="/designers" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('designers')}
                        </Link>
                        <Link to="/projects" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('projects') || 'Projeler'}
                        </Link>
                        <Link to="/news" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('news')}
                        </Link>
                        <Link to="/about" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('about')}
                        </Link>
                        <Link to="/contact" className="text-sm font-semibold uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200">
                            {t('contact')}
                        </Link>
                    </nav>
                    
                    {/* İnce çizgi */}
                    <div className="w-full border-t border-gray-700"></div>
                    
                    {/* Dil seçenekleri */}
                    <div className="flex items-center gap-3">
                        {supportedLocales.map((langCode) => {
                            const isActive = locale === langCode;
                            return (
                                <button
                                    key={langCode}
                                    onClick={() => setLocale(langCode)}
                                    className={`text-xs uppercase tracking-wider transition-colors duration-200 ${
                                        isActive
                                            ? 'text-white font-bold'
                                            : 'text-gray-400 hover:text-white font-thin'
                                    }`}
                                >
                                    {langCode.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* İnce çizgi */}
                    <div className="w-full border-t border-gray-700"></div>
                    
                    {/* Partnerler */}
                    <div className="flex items-center justify-center flex-wrap gap-6 mb-0">
                        {(content.partners || content.partnerNames || []).map((partner, index) => {
                            const partnerName = typeof partner === 'string' ? partner : t(partner.name);
                            const partnerLogo = typeof partner === 'object' ? partner.logo : undefined;
                            const partnerUrl = typeof partner === 'object' ? partner.url : undefined;
                            
                            const partnerContent = partnerLogo ? (
                                <img src={partnerLogo} alt={partnerName} className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200" />
                            ) : (
                                <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">{partnerName}</span>
                            );
                            
                            return partnerUrl ? (
                                <a key={index} href={partnerUrl} target="_blank" rel="noopener noreferrer" className="group">
                                    {partnerContent}
                                </a>
                            ) : (
                                <span key={index}>{partnerContent}</span>
                            );
                        })}
                    </div>
                    
                    {/* Email abonelik formu - mobilde en altta ortalanmış */}
                    <div className="w-full flex justify-center !mt-16 lg:!mt-8">
                        <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (email) {
                                try {
                                    await subscribeEmail(email);
                                    alert('E-posta aboneliğiniz başarıyla oluşturuldu!');
                                    setEmail('');
                                } catch (err: any) {
                                    // Özel durum: Local storage'a kaydedildi ama CMS'de görünmüyor
                                    if (err.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                                        alert('E-posta aboneliğiniz kaydedildi!\n\nNot: CMS\'de görünmesi için .env dosyasına VITE_SANITY_TOKEN ekleyin. Detaylar: README.md');
                                        setEmail('');
                                    } else {
                                        alert(err.message || 'Bir hata oluştu. Lütfen console\'u kontrol edin.');
                                    }
                                }
                            }
                        }}
                        className="flex flex-col items-center justify-center w-full"
                    >
                        <p className="text-sm text-gray-300 mb-4 text-center">{t('subscribe_prompt')}</p>
                        <div className="flex items-center justify-center border-b border-white pb-0.5 w-full max-w-[280px] mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('email_placeholder')}
                                className="w-full py-0.5 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[11px] text-center"
                                style={{ outline: 'none', boxShadow: 'none' }}
                                onFocus={(e) => e.target.style.outline = 'none'}
                                onBlur={(e) => e.target.style.outline = 'none'}
                            />
                        </div>
                        <div className="w-full flex justify-center mt-6">
                            <button
                                type="submit"
                                className="px-0 py-1 bg-transparent border-0 text-gray-400 hover:text-white transition-colors duration-200 text-xs font-light uppercase tracking-wider"
                            >
                                {t('subscribe')}
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
                
                {/* Desktop düzen */}
                <div className="hidden lg:flex flex-wrap items-start gap-8 lg:gap-16">
                    {/* Sol taraf: Logo ve partner yazıları (sola hizalı) */}
                    <div className="w-full lg:w-auto">
                        <div className="text-white mb-4">
                            <SiteLogo logoUrl={settings.logoUrl} className="h-4 w-auto" />
                        </div>
                        <div className="flex items-center flex-wrap gap-6 mb-4">
                            {(content.partners || content.partnerNames || []).map((partner, index) => {
                                const partnerName = typeof partner === 'string' ? partner : t(partner.name);
                                const partnerLogo = typeof partner === 'object' ? partner.logo : undefined;
                                const partnerUrl = typeof partner === 'object' ? partner.url : undefined;
                                
                                const partnerContent = partnerLogo ? (
                                    <img src={partnerLogo} alt={partnerName} className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200" />
                                ) : (
                                    <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">{partnerName}</span>
                                );
                                
                                return partnerUrl ? (
                                    <a key={index} href={partnerUrl} target="_blank" rel="noopener noreferrer" className="group">
                                        {partnerContent}
                                    </a>
                                ) : (
                                    <span key={index}>{partnerContent}</span>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Orta: Menü düğmeleri (sağa hizalı üstte) */}
                    <div className="flex-1 flex justify-end">
                        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold uppercase tracking-wider text-gray-300 items-center justify-end">
                            <Link to="/products" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('products')}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                            <Link to="/designers" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('designers')}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                            <Link to="/projects" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('projects') || 'Projeler'}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                            <Link to="/news" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('news')}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                            <Link to="/about" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('about')}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                            <Link to="/contact" className="group relative hover:text-white">
                                <span className="relative inline-block">
                                    {t('contact')}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                                </span>
                            </Link>
                        </nav>
                    </div>
                </div>
                {/* Sosyal medya linkleri ve email formu - aynı üst hizasında */}
                <div className="mt-8 flex flex-col lg:flex-row flex-wrap items-center lg:items-start justify-center lg:justify-start gap-8 lg:gap-16">
                    {/* Sosyal medya linkleri */}
                    <div className="w-full lg:w-auto flex justify-center lg:justify-start space-x-6">
                        {(content.socialLinks || []).filter(link => link.isEnabled).map(link => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-opacity duration-200 opacity-70 hover:opacity-100">
                                <div className="w-3 h-3">
                                    <DynamicIcon svgString={link.svgIcon} />
                                </div>
                            </a>
                        ))}
                    </div>
                    {/* Email abonelik formu - sadece desktop'ta */}
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (email) {
                                try {
                                    await subscribeEmail(email);
                                    alert('E-posta aboneliğiniz başarıyla oluşturuldu!');
                                    setEmail('');
                                } catch (err: any) {
                                    // Özel durum: Local storage'a kaydedildi ama CMS'de görünmüyor
                                    if (err.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                                        alert('E-posta aboneliğiniz kaydedildi!\n\nNot: CMS\'de görünmesi için .env dosyasına VITE_SANITY_TOKEN ekleyin. Detaylar: README.md');
                                        setEmail('');
                                    } else {
                                        alert(err.message || 'Bir hata oluştu. Lütfen console\'u kontrol edin.');
                                    }
                                }
                            }
                        }}
                        className="lg:flex lg:flex-row lg:items-end lg:justify-end lg:gap-2 lg:w-full lg:max-w-none flex-col items-center justify-center w-full"
                    >
                        <div className="flex flex-col w-full max-w-[280px] mx-auto lg:max-w-none lg:mx-0 lg:w-auto lg:items-end lg:flex-1 lg:relative">
                            <div className="flex items-center w-full lg:w-1/4 lg:ml-auto lg:relative lg:pb-0.5">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('email_placeholder')}
                                    className="w-full py-0.5 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[11px] text-center lg:text-left"
                                    style={{ outline: 'none', boxShadow: 'none' }}
                                    onFocus={(e) => {
                                        e.target.style.outline = 'none';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.outline = 'none';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                {/* Çizgi - input'un sol başından button'ın sağ sonuna kadar */}
                                <div className="hidden lg:block absolute bottom-0 left-0 border-b border-white" style={{width: 'calc(100% + 0.5rem + 4.8rem)'}}></div>
                            </div>
                        </div>
                        <div className="w-full flex justify-center mt-2 lg:mt-0 lg:w-auto lg:flex-shrink-0 lg:ml-2 lg:relative">
                            <button
                                type="submit"
                                className="px-0 py-1 bg-transparent border-0 text-gray-400 hover:text-white transition-colors duration-200 text-xs font-light uppercase tracking-wider"
                            >
                                {t('subscribe')}
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
                <div className="mt-8 lg:mt-16 border-t border-gray-700 pt-8 flex flex-col md:flex-row md:justify-between md:items-start gap-6 text-xs">
                    <p className="md:flex-shrink-0 text-center md:text-left">{t(content.copyrightText)}</p>
                    {(content.legalLinks && content.legalLinks.length > 0) && (
                        <div className="flex flex-col md:flex-row md:items-center md:gap-x-4 items-center gap-2">
                            {content.legalLinks.filter(link => link?.isVisible).map((link, index) => {
                                const url = typeof link?.url === 'string' ? link.url : '';
                                if (!url) {
                                    return (
                                        <span key={index} className="opacity-80 select-none">{t(link.text)}</span>
                                    );
                                }
                                const isHttp = /^https?:\/\//.test(url);
                                const isInternalLink = url.startsWith('/') && !url.startsWith('//') && !isHttp;
                                return isInternalLink ? (
                                    <Link
                                        key={index}
                                        to={url}
                                        className="text-gray-500 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm"
                                    >
                                        {t(link.text)}
                                    </Link>
                                ) : (
                                    <a
                                        key={index}
                                        href={url}
                                        className="text-gray-500 hover:text-gray-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm"
                                        target={isHttp ? '_blank' : undefined}
                                        rel={isHttp ? 'noopener noreferrer' : undefined}
                                    >
                                        {t(link.text)}
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <CartProvider>
          <SiteSettingsProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="flex flex-col min-h-screen">
                <ScrollToTop />
                <Header />
                <CartSidebar />
                <main className="flex-grow" style={{ overflowX: 'hidden' }}>
                <TopBanner />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<CategoriesPage />} />
                    <Route path="/products/:categoryId" element={<ProductsPage />} />
                    <Route path="/product/:productId" element={<ProductDetailPage />} />
                    <Route path="/designers" element={<DesignersPage />} />
                    <Route path="/designer/:designerId" element={<DesignerDetailPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:newsId" element={<NewsDetailPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/kvkk" element={<KvkkPage />} />
                </Routes>
                </main>
                <CookieBanner />
                <Footer />
            </div>
            </HashRouter>
          </SiteSettingsProvider>
        </CartProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
