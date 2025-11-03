import React, { useState, useContext, createContext, PropsWithChildren, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';

import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
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
            <div className="container mx-auto px-0 py-16">
                <div className="flex flex-wrap justify-between gap-8">
                    <div className="w-full lg:w-1/3">
                        <div className="text-white">
                            <SiteLogo logoUrl={settings.logoUrl} className="h-4 w-auto" />
                        </div>
                        <div className="mt-4 flex items-center space-x-6">
                            {content.partnerNames.map(name => (
                                <span key={name} className="font-semibold text-gray-300 opacity-70">{name}</span>
                            ))}
                        </div>
                    </div>
                    {content.linkColumns.map(column => (
                        <div key={t(column.title)} className="w-full sm:w-auto text-sm">
                            <h4 className="font-semibold text-white uppercase tracking-wider mb-4">{t(column.title)}</h4>
                            <ul>
                                {column.links.map(link => (
                                    <li key={t(link.text)} className="mt-2">
                                        <Link to={link.url} className="hover:text-white hover:underline transition-colors">{t(link.text)}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="w-full sm:w-auto text-sm">
                        <h4 className="font-semibold text-white uppercase tracking-wider mb-4">{t('follow_us')}</h4>
                        <div className="flex space-x-4">
                            {content.socialLinks.filter(link => link.isEnabled).map(link => (
                                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-transform duration-200 transform hover:scale-125">
                                    <DynamicIcon svgString={link.svgIcon} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center text-xs">
                    <p>{t(content.copyrightText)}</p>
                    <div className="flex flex-wrap justify-start gap-x-4 gap-y-2 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white hover:underline transition-colors">Company Data</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors">Cookie Policy</a>
                        <a href="#" className="hover:text-white hover:underline transition-colors">Legals</a>
                        <Link to="/admin" className="hover:text-white hover:underline transition-colors">{t('admin_panel')}</Link>
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
                    <Route path="/products/:categoryId" element={<ProductsPage />} />
                    <Route path="/product/:productId" element={<ProductDetailPage />} />
                    <Route path="/designers" element={<DesignersPage />} />
                    <Route path="/designer/:designerId" element={<DesignerDetailPage />} />
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
