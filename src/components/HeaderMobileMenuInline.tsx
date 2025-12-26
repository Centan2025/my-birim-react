import { FC, MutableRefObject } from 'react'
import { NavLink } from 'react-router-dom'
import type { Category, SiteSettings } from '../types'
import { CrossFadeText, HeaderTranslateFn, UserIcon } from './HeaderShared'

interface HeaderMobileMenuInlineProps {
  isOpen: boolean
  isMobileProductsMenuOpen: boolean
  categories: Category[]
  settings: SiteSettings | null
  supportedLocales: string[]
  locale: string
  t: HeaderTranslateFn
  isLoggedIn: boolean
  iconClasses: string
  onLocaleChange: (langCode: string) => void
  onToggleProductsMenu: () => void
  onCloseAll: () => void
  setIsMobileMenuOpen: (open: boolean) => void
  setIsMobileProductsMenuOpen: (open: boolean) => void
  mobileMenuRef: MutableRefObject<HTMLDivElement | null>
  mobileMenuFocusTrap: MutableRefObject<HTMLElement | null>
}

export const HeaderMobileMenuInline: FC<HeaderMobileMenuInlineProps> = ({
  isOpen,
  isMobileProductsMenuOpen,
  categories,
  settings,
  supportedLocales,
  locale,
  t,
  isLoggedIn,
  iconClasses,
  onLocaleChange,
  onToggleProductsMenu,
  onCloseAll,
  setIsMobileMenuOpen,
  setIsMobileProductsMenuOpen,
  mobileMenuRef,
  mobileMenuFocusTrap,
}) => {
  if (!isOpen) return null

  return (
    <div
      ref={node => {
        if (node) {
          (mobileMenuRef as MutableRefObject<HTMLDivElement | null>).current = node
            ; (mobileMenuFocusTrap as MutableRefObject<HTMLElement | null>).current = node
        }
      }}
      id="mobile-menu"
      className="lg:hidden border-t border-white/10"
      role="menu"
      aria-label={t('main_menu') || 'Ana menü'}
    >
      {/* Dil seçenekleri - Menü öğelerinin üstünde */}
      {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
        <div className="relative w-full">
          <div className="flex items-center justify-between bg-black/50 px-4 sm:px-5 lg:px-6 pt-3 pb-2 min-h-[3rem] border-b border-white/10">
            <div className="flex items-center gap-1">
              {supportedLocales.map(langCode => {
                const isActive = locale === langCode
                return (
                  <button
                    key={langCode}
                    onClick={() => {
                      onLocaleChange(langCode)
                    }}
                    aria-pressed={isActive}
                    className={`group relative px-2 py-1 text-[0.85rem] uppercase tracking-[0.2em] transition-colors duration-200 ${isActive
                      ? 'text-white font-light'
                      : 'text-gray-400/90 hover:text-white font-light'
                      }`}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.2em',
                    }}
                  >
                    <span className="relative inline-block">{langCode.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>
            {/* Mobilde dil bölümünün en sağında giriş/profile ikonu */}
            <NavLink
              to={isLoggedIn ? '/profile' : '/login'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={iconClasses}
              aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
            >
              <UserIcon />
            </NavLink>
          </div>
        </div>
      )}
      <nav className="px-4 sm:px-5 lg:px-6 pb-2 flex flex-col">
        <div className="flex flex-col">
          {/* Ürünler düğmesi - tıklanınca alt menü açılır */}
          <div className="border-b border-white/10">
            <button
              onClick={onToggleProductsMenu}
              className="mobile-menu-products-button flex items-center justify-between w-full min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300"
            >
              <CrossFadeText text={t('products')} triggerKey={locale} />
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isMobileProductsMenuOpen ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Alt menü - kategoriler ve Hepsini Gör */}
            <div
              className={`overflow-hidden transition-all duration-700 ease-in-out ${isMobileProductsMenuOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="pl-6 pb-2 flex flex-col">
                {categories.map((category, index) => (
                  <NavLink
                    key={category.id}
                    to={`/products/${category.id}`}
                    className="flex items-center min-h-[2.5rem] py-2 text-lg font-light leading-tight tracking-[0.15em] uppercase text-gray-300 hover:text-white transition-colors duration-300 border-b border-white/5 last:border-b-0"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsMobileProductsMenuOpen(false)
                    }}
                    style={{
                      transitionDelay: isMobileProductsMenuOpen ? `${index * 50}ms` : '0ms',
                    }}
                  >
                    <CrossFadeText text={t(category.name)} triggerKey={locale} />
                  </NavLink>
                ))}
                <NavLink
                  to="/products"
                  className="flex items-center min-h-[2.5rem] py-2 mt-2 text-lg font-light leading-tight tracking-[0.15em] uppercase text-gray-300 hover:text-white transition-colors duration-300 border-t border-white/10 pt-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsMobileProductsMenuOpen(false)
                  }}
                  style={{
                    transitionDelay: isMobileProductsMenuOpen ? `${categories.length * 50}ms` : '0ms',
                  }}
                >
                  <CrossFadeText text={t('see_all')} triggerKey={locale} />
                </NavLink>
              </div>
            </div>
          </div>
          <NavLink
            to="/designers"
            className={`flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10 transition-transform ${isMobileProductsMenuOpen ? 'translate-y-0' : 'translate-y-0'
              }`}
            onClick={onCloseAll}
          >
            <CrossFadeText text={t('designers')} triggerKey={locale} />
          </NavLink>
          <NavLink
            to="/projects"
            className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
            onClick={onCloseAll}
          >
            <CrossFadeText text={t('projects') || 'Projeler'} triggerKey={locale} />
          </NavLink>
          <NavLink
            to="/news"
            className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
            onClick={onCloseAll}
          >
            <CrossFadeText text={t('news')} triggerKey={locale} />
          </NavLink>
          <NavLink
            to="/about"
            className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300 border-b border-white/10"
            onClick={onCloseAll}
          >
            <CrossFadeText text={t('about')} triggerKey={locale} />
          </NavLink>
          <NavLink
            to="/contact"
            className="flex items-center min-h-[3rem] py-3 text-xl font-light leading-tight tracking-[0.2em] uppercase text-gray-200 hover:text-white transition-colors duration-300"
            onClick={onCloseAll}
          >
            <CrossFadeText text={t('contact')} triggerKey={locale} />
          </NavLink>
        </div>
      </nav>
    </div>
  )
}


