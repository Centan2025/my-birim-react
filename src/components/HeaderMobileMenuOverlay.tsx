import React, {useState, useEffect, useRef} from 'react'
import {NavLink} from 'react-router-dom'
import type {Category, FooterContent, SiteSettings} from '../types'
import type {MutableRefObject} from 'react'
import {
  CrossFadeText,
  DynamicIcon,
  HeaderTranslateFn,
  UserIcon,
  ChevronRightIcon,
} from './HeaderShared'

interface HeaderMobileMenuOverlayProps {
  isOverlayMobileMenu: boolean
  isMobileMenuOpen: boolean
  isMobileProductsMenuOpen: boolean
  settings: SiteSettings | null
  supportedLocales: string[]
  locale: string
  t: HeaderTranslateFn
  isLoggedIn: boolean
  iconClasses: string
  categories: Category[]
  headerHeight: number
  mobileMenuLinks: {to: string; label: string}[]
  mobileMenuCloseDelay: number
  subscribeEmail: string
  isMobileLocaleTransition: boolean
  footerContent: FooterContent | null
  onLocaleChange: (langCode: string) => void
  onToggleProductsMenu: () => void
  onCloseAll: () => void
  setIsMobileMenuOpen: (open: boolean) => void
  setIsMobileProductsMenuOpen: (open: boolean) => void
  setSubscribeEmail: (value: string) => void
  subscribeEmailService: (email: string) => Promise<void>
  mobileMenuRef: MutableRefObject<HTMLDivElement | null>
  mobileMenuFocusTrap: MutableRefObject<HTMLElement | null>
}

export const HeaderMobileMenuOverlay: React.FC<HeaderMobileMenuOverlayProps> = props => {
  const {
    isOverlayMobileMenu,
    isMobileMenuOpen,
    isMobileProductsMenuOpen,
    settings,
    supportedLocales,
    locale,
    t,
    isLoggedIn,
    iconClasses,
    categories,
    headerHeight,
    mobileMenuLinks,
    mobileMenuCloseDelay,
    subscribeEmail,
    isMobileLocaleTransition,
    footerContent,
    onLocaleChange,
    onToggleProductsMenu,
    onCloseAll,
    setIsMobileMenuOpen,
    setIsMobileProductsMenuOpen,
    setSubscribeEmail,
    subscribeEmailService,
    mobileMenuRef,
    mobileMenuFocusTrap,
  } = props

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  if (!isOverlayMobileMenu) return null

  return (
    // Overlay mobil menü - header'ın DIŞINDA, tam ekran kaplayan panel
    <div
      ref={node => {
        if (node) {
          ;(mobileMenuRef as MutableRefObject<HTMLDivElement | null>).current = node
          ;(mobileMenuFocusTrap as MutableRefObject<HTMLElement | null>).current = node
        }
      }}
      id="mobile-menu"
      className={`mobile-menu-overlay fixed left-0 right-0 bottom-0 lg:hidden z-40 flex flex-col border-t border-white/10 text-white pb-8 px-6 transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isMobileMenuOpen
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-2 opacity-0 pointer-events-none'
      }`}
      style={{
        top: `${headerHeight}px`,
        backgroundColor: '#111827', // Biraz daha koyu gri (Tailwind gray-900)
        // Kapanırken panel animasyonunu, linklerin ters sırada kaybolma animasyonundan sonra başlat
        transitionDelay: isMobileMenuOpen ? '0ms' : `${mobileMenuCloseDelay}ms`,
      }}
      role="menu"
      aria-label={t('main_menu') || 'Ana menü'}
    >
      {/* Dil ve kullanıcı alanı */}
      {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length > 1 && (
        <div
          className={`mb-6 pt-4 pb-4 transition-all duration-400 ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{transitionDelay: isMobileMenuOpen ? '50ms' : '0ms'}}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {supportedLocales.map(langCode => {
                const isActive = locale === langCode
                return (
                  <button
                    key={langCode}
                    onClick={() => {
                      onLocaleChange(langCode)
                    }}
                    aria-pressed={isActive}
                    className={`group relative px-2.5 py-1.5 text-sm uppercase tracking-[0.2em] transition-all duration-200 ${
                      isActive
                        ? 'text-white font-light'
                        : 'text-gray-400/90 hover:text-white font-light'
                    } ${isActive ? 'scale-110' : 'scale-100'}`}
                    style={{fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em'}}
                  >
                    <span className="relative inline-block transition-opacity transition-transform duration-200 ease-out">
                      {langCode.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>
            <NavLink
              to={isLoggedIn ? '/profile' : '/login'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={iconClasses}
              aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
            >
              <UserIcon />
            </NavLink>
          </div>
          {/* Tam ekran genişliğinde ayırıcı çizgi */}
          <div
            className="border-b border-white/20 mt-4 -mx-6"
            style={{width: 'calc(100% + 3rem)'}}
          ></div>
        </div>
      )}

      {/* Menü linkleri - stagger animasyon */}
      <nav className="flex flex-col justify-start gap-6">
        {/* Ürünler düğmesi - tıklanınca alt menü açılır */}
        <div>
          <button
            onClick={onToggleProductsMenu}
            style={{
              transitionDelay: `${
                isMobileMenuOpen
                  ? 0
                  : (mobileMenuLinks.length - 1) * 100
              }ms`,
              fontWeight: 300,
              letterSpacing: '0.2em',
            }}
            className={`group flex items-center justify-between w-full text-xl md:text-2xl font-light leading-tight text-white transition-all duration-400 ${
              isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
          >
            <span>
              <CrossFadeText
                text={(t('products') || '').toLocaleUpperCase('en')}
                triggerKey={locale}
                className="inline-block w-[8rem] text-left"
              />
            </span>
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${
                isMobileProductsMenuOpen ? 'rotate-180' : ''
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
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              isMobileProductsMenuOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pl-4 flex flex-col gap-3">
              {categories.map((category, index) => (
                <NavLink
                  key={category.id}
                  to={`/products/${category.id}`}
                  style={{
                    transitionDelay: isMobileProductsMenuOpen ? `${index * 50}ms` : '0ms',
                    fontWeight: 300,
                    letterSpacing: '0.15em',
                  }}
                  className={`group flex items-center justify-between text-xl md:text-2xl font-light leading-tight text-gray-300 hover:text-white transition-all duration-400 ${
                    isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                  }`}
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsMobileProductsMenuOpen(false)
                  }}
                >
                  <span>
                    <CrossFadeText text={t(category.name)} triggerKey={locale} />
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRightIcon />
                  </span>
                </NavLink>
              ))}
              <NavLink
                to="/products"
                style={{
                  transitionDelay: isMobileProductsMenuOpen ? `${categories.length * 50}ms` : '0ms',
                  fontWeight: 300,
                  letterSpacing: '0.15em',
                }}
                className={`group flex items-center justify-between text-xl md:text-2xl font-light leading-tight text-gray-300 hover:text-white transition-all duration-400 border-t border-white/20 pt-3 mt-2 ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                }`}
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsMobileProductsMenuOpen(false)
                }}
              >
                <span>
                  <CrossFadeText
                    text={(t('see_all') || '').toLocaleUpperCase('en')}
                    triggerKey={locale}
                  />
                </span>
                <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <ChevronRightIcon />
                </span>
              </NavLink>
            </div>
          </div>
        </div>
        {/* Diğer menü linkleri */}
        {mobileMenuLinks.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={{
              // Açılırken yukarı doğru (ilk eleman en geç), kapanırken tersine (ilk eleman en erken)
              transitionDelay: `${
                isMobileMenuOpen
                  ? (index + 1) * 100
                  : (mobileMenuLinks.length - 1 - index) * 100
              }ms`,
              fontWeight: 300,
              letterSpacing: '0.2em',
            }}
            className={`group flex items-center justify-between text-2xl md:text-3xl font-light leading-tight text-white transition-all duration-400 ${
              isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
            onClick={() => {
              // Ana menüde başka bir linke gidildiğinde hem ana menüyü hem ürünler alt menüsünü kapat
              onCloseAll()
              setIsMobileProductsMenuOpen(false)
            }}
          >
            <span>
              <CrossFadeText text={item.label} triggerKey={locale} />
            </span>
            <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <ChevronRightIcon />
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Alt kısım - Subscribe ve Sosyal Medya */}
      <div
        className={`mt-auto pt-8 transition-all duration-400 ${
          isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        style={{transitionDelay: isMobileMenuOpen ? '300ms' : '0ms'}}
      >
        {/* Ayırıcı çizgi - tam ekran genişliğinde */}
        <div
          className="border-t border-white/20 -mx-6 mb-6"
          style={{width: 'calc(100% + 3rem)'}}
        ></div>

        {/* Subscribe bölümü */}
        <form
          onSubmit={async e => {
            e.preventDefault()
            if (!subscribeEmail) return

            const normalizedEmail = subscribeEmail.trim().toLowerCase()

            // Aynı tarayıcıda / oturumda tekrar tekrar aynı e-postayı göndermeyi
            // engellemek ve kullanıcıya "zaten abonesiniz" demek için basit bir
            // localStorage kontrolü (footer'daki NewsletterForm ile aynı mantık)
            try {
              if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem('birim_newsletter_subscribers')
                const list: string[] = raw ? JSON.parse(raw) : []
                if (list.includes(normalizedEmail)) {
                  showToast(
                    t('newsletter_already_subscribed') ||
                      'Bu e-posta adresi zaten aboneliğe kayıtlı.',
                    'success'
                  )
                  setSubscribeEmail('')
                  return
                }
              }
            } catch {
              // localStorage erişilemezse sessizce devam et
            }

            try {
              await subscribeEmailService(subscribeEmail)
              showToast(
                t('newsletter_success') ||
                  t('subscribe_success') ||
                  'E-posta aboneliğiniz başarıyla oluşturuldu!',
                'success'
              )

              // Başarılı abonelikte e-postayı localStorage'a yaz (footer ile aynı anahtar)
              try {
                if (typeof window !== 'undefined') {
                  const raw = window.localStorage.getItem('birim_newsletter_subscribers')
                  const list: string[] = raw ? JSON.parse(raw) : []
                  if (!list.includes(normalizedEmail)) {
                    list.push(normalizedEmail)
                    window.localStorage.setItem(
                      'birim_newsletter_subscribers',
                      JSON.stringify(list)
                    )
                  }
                }
              } catch {
                // localStorage yazılamazsa sessizce devam et
              }

              setSubscribeEmail('')
            } catch (err: any) {
              const errorMessage = String(err?.message || '')

              if (errorMessage === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
                showToast(
                  t('newsletter_success_local') ||
                    t('subscribe_success') ||
                    'E-posta aboneliğiniz kaydedildi!',
                  'success'
                )
                setSubscribeEmail('')
              } else if (
                errorMessage.includes('zaten aboneliğe kayıtlı') ||
                errorMessage.includes('zaten kayıtlı') ||
                errorMessage.toLowerCase().includes('already subscribed')
              ) {
                showToast(
                  t('newsletter_already_subscribed') ||
                    'Bu e-posta adresi zaten aboneliğe kayıtlı.',
                  'success'
                )
              } else {
                showToast(
                  errorMessage ||
                    t('newsletter_error') ||
                    'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
                  'error'
                )
              }
            }
          }}
          className="flex flex-col items-center mb-6"
        >
          <p className="text-sm text-gray-300 mb-4 text-center">
            <CrossFadeText text={t('subscribe_prompt')} triggerKey={locale} />
          </p>
          <div className="flex items-center justify-center border-b border-white pb-0.5 w-full max-w-[280px]">
            <input
              type="email"
              id="header-subscribe-email"
              name="header-subscribe-email"
              value={subscribeEmail}
              onChange={e => setSubscribeEmail(e.target.value)}
              placeholder={t('email_placeholder')}
              className={`w-full py-1 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 transition-all duration-200 text-[15px] text-center ${
                isMobileLocaleTransition ? 'cross-fade-input' : ''
              }`}
              style={{outline: 'none', boxShadow: 'none'}}
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-6 py-2 border border-white/50 text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-medium uppercase tracking-wider"
          >
            <CrossFadeText text={t('subscribe')} triggerKey={locale} />
          </button>
        </form>

        {/* Sosyal medya ikonları */}
        {footerContent?.socialLinks && footerContent.socialLinks.length > 0 && (
          <div className="flex justify-center space-x-6">
            {footerContent.socialLinks
              .filter(link => link.isEnabled)
              .map(link => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-opacity duration-200 opacity-70 hover:opacity-100"
                >
                  <div className="w-5 h-5">
                    <DynamicIcon svgString={link.svgIcon} />
                  </div>
                </a>
              ))}
          </div>
        )}
      </div>

      {/* Toast mesajı - projenin koyu temasıyla uyumlu */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 shadow-lg max-w-sm mx-auto animate-fade-in border-2 border-white/60 ${
            toastType === 'error' ? 'bg-red-900/95' : 'bg-gray-900/95'
          }`}
          style={{
            borderRadius: 0, // köşeleri düz
            color: 'white',
            animation: 'fadeIn 0.3s ease-in',
          }}
        >
          <p className="text-sm text-center font-medium">{toastMessage}</p>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  )
}


