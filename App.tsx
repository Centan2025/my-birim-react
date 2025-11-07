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
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { AdminPage } from './pages/AdminPage';
import { getFooterContent, getSiteSettings } from './services/cms';
import type { FooterContent, SiteSettings } from './types';
import { SiteLogo } from './components/SiteLogo';
import { I18nProvider, useTranslation } from './i18n';
import { CartProvider } from './context/CartContext';
import { CartSidebar } from './components/CartSidebar';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

// Helper component to render SVG strings safely
const DynamicIcon: React.FC<{ svgString: string }> = ({ svgString }) => (
    <div dangerouslySetInnerHTML={{ __html: svgString }} />
);

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
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

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  const value = { isLoggedIn, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Footer = () => {
    const [content, setContent] = useState<FooterContent | null>(null);
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [email, setEmail] = useState('');
    const { t } = useTranslation();

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
                <div className="flex flex-wrap items-start gap-8 lg:gap-16">
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
                        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm uppercase tracking-wider text-gray-300 items-center justify-end">
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
                <div className="mt-8 flex flex-wrap items-start gap-8 lg:gap-16">
                    {/* Sosyal medya linkleri */}
                    <div className="w-full lg:w-auto flex space-x-6">
                        {(content.socialLinks || []).filter(link => link.isEnabled).map(link => (
                            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-opacity duration-200 opacity-70 hover:opacity-100">
                                <div className="w-3 h-3">
                                    <DynamicIcon svgString={link.svgIcon} />
                                </div>
                            </a>
                        ))}
                    </div>
                    {/* Email abonelik formu - sağa yaslı, menü düğmeleri ile aynı sağ hizada */}
                    <div className="flex-1 flex justify-end">
                        <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            // Email gönderme işlemi burada yapılacak
                            console.log('Email:', email);
                            setEmail('');
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-posta adresiniz"
                            className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-gray-700 transition-all duration-200 text-sm min-w-[200px]"
                        />
                        <button
                            type="submit"
                            className="px-5 py-2 bg-transparent border border-white/30 text-white rounded-sm hover:bg-white/10 hover:border-white/50 transition-all duration-200 text-xs font-light uppercase tracking-wider"
                        >
                            Abone Ol
                        </button>
                    </form>
                    </div>
                </div>
                <div className="mt-16 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs">
                    <p>{t(content.copyrightText)}</p>
                    <div className="flex flex-wrap justify-start gap-x-4 gap-y-2">
                        <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Company Data</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Cookie Policy</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors duration-200">Legals</a>
                        <Link to="/admin" className="hover:text-white hover:underline transition-colors duration-200">{t('admin_panel')}</Link>
                    </div>
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
            <HashRouter>
            <div className="flex flex-col min-h-screen">
                <ScrollToTop />
                <Header />
                <CartSidebar />
                <main className="flex-grow">
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
                    <Route path="/profile" element={<LoginPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:newsId" element={<NewsDetailPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
                </main>
                <Footer />
            </div>
            </HashRouter>
        </CartProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
