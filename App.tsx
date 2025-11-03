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
import type { FooterContent, SiteSettings, Product } from './types';
import { SiteLogo } from './components/SiteLogo';
import { I18nProvider, useTranslation } from './i18n';

// --- CART IMPLEMENTATION ---

// Cart Types
interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartCount: number;
  totalPrice: number;
}

// Cart Context
const CartContext = createContext<CartContextType | null>(null);

// useCart Hook
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Cart Provider
const CartProvider = ({ children }: PropsWithChildren) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const localData = localStorage.getItem('birim_cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Failed to parse cart data from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('birim_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart data to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      }
      return prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = { cartItems, addToCart, removeFromCart, updateQuantity, cartCount, totalPrice };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};


const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
    const { t } = useTranslation();

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(t('locale_code') || 'tr-TR', { style: 'currency', currency: currency }).format(amount);
    }

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center animate-fade-in-up">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('shopping_cart')}</h1>
                <p className="text-gray-600 mb-8">{t('cart_empty')}</p>
                <Link to="/" className="text-white bg-gray-800 hover:bg-gray-900 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                    {t('continue_shopping')}
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 animate-fade-in-up">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('shopping_cart')}</h1>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center bg-white p-4 rounded-lg shadow-sm border">
                                <img src={item.mainImage} alt={t(item.name)} className="w-24 h-24 object-cover rounded-md" />
                                <div className="flex-grow ml-4">
                                    <h2 className="font-semibold text-gray-800">{t(item.name)}</h2>
                                    <p className="text-sm text-gray-600">{formatCurrency(item.price, item.currency)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1">{t('remove')}</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                        className="w-16 text-center border-gray-300 rounded-md"
                                        aria-label={t('quantity')}
                                    />
                                </div>
                                <div className="w-24 text-right font-semibold text-gray-800">
                                    {formatCurrency(item.price * item.quantity, item.currency)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-28">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('order_summary')}</h2>
                            <div className="flex justify-between text-gray-600 mb-2">
                                <span>{t('subtotal')}</span>
                                <span>{formatCurrency(totalPrice, cartItems[0]?.currency || 'TRY')}</span>
                            </div>
                            <div className="border-t my-4"></div>
                            <div className="flex justify-between font-bold text-lg text-gray-900 mb-6">
                                <span>{t('total')}</span>
                                <span>{formatCurrency(totalPrice, cartItems[0]?.currency || 'TRY')}</span>
                            </div>
                            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                                {t('checkout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- END OF CART IMPLEMENTATION ---

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
                    <Route path="/cart" element={<CartPage />} />
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
