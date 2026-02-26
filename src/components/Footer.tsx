import {Link} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {getFooterContent} from '../services/cms'
import {useSiteSettings} from '../context/SiteSettingsContext'
import {SiteLogo} from './SiteLogo'
import {useTranslation} from '../i18n'
import {analytics} from '../lib/analytics'
import ScrollReveal from './ScrollReveal'
import {resolveLegalLinkText} from '../lib/legalLinks'
import {NewsletterForm} from './NewsletterForm'
import {SocialIcon} from './SocialIcon'

export const Footer = () => {
  const {settings, isLoading: isSettingsLoading} = useSiteSettings()
  const {t, setLocale, locale, supportedLocales} = useTranslation()

  const {data: content, isLoading: isFooterLoading} = useQuery({
    queryKey: ['footerContent', locale],
    queryFn: getFooterContent,
    staleTime: 1000 * 60 * 30, // 30 dakika cache
  })

  if (isSettingsLoading || isFooterLoading || !settings || !content) {
    return <footer className="bg-gray-800 h-20" /> // Minimal placeholder to avoid collapse
  }

  return (
    <>
      <footer
        className="bg-gray-800 text-gray-400 py-12 lg:py-16"
        style={{position: 'relative', zIndex: 5}}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo and navigation */}
          <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:items-start gap-10 lg:gap-16 mb-12">
            {/* Logo Column */}
            <ScrollReveal delay={0} threshold={0.1}>
              <div className="flex flex-col items-center lg:items-start">
                <Link to="/" className="text-white mb-4">
                  <SiteLogo logoUrl={settings.logoUrl} className="h-6 lg:h-5 w-auto" />
                </Link>
                {/* Language Selector (Desktop remains here, Mobile moves below for better flow) */}
                <div className="hidden lg:flex items-center gap-3 mt-4">
                  {supportedLocales.map(langCode => {
                    const isActive = locale === langCode
                    return (
                      <button
                        key={langCode}
                        onClick={() => setLocale(langCode)}
                        className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                          isActive
                            ? 'text-white font-medium border-b border-white'
                            : 'text-gray-500 hover:text-white font-light'
                        }`}
                      >
                        {langCode.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Navigation Links */}
            <nav className="flex flex-col lg:flex-row flex-wrap items-center lg:justify-end gap-x-8 gap-y-4 lg:gap-y-0 text-sm font-semibold uppercase tracking-wider text-gray-300 text-center lg:text-right">
              {[
                {to: '/products', label: t('view_all')},
                {to: '/designers', label: t('designers')},
                {to: '/projects', label: t('projects') || 'Projeler'},
                {to: '/news', label: t('news')},
                {to: '/about', label: t('about')},
                {to: '/contact', label: t('contact')},
              ].map((link, idx) => (
                <ScrollReveal key={link.to} delay={15 + idx * 15} threshold={0.1}>
                  <Link
                    to={link.to}
                    className="group relative hover:text-white transition-colors duration-300"
                  >
                    <span className="relative inline-block py-1">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </nav>
          </div>

          {/* Middle Row: Partners, Socials and Newsletter */}
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-16 border-t border-gray-700/50 pt-12 pb-8">
            {/* Partners - Left on Desktop, Centered on Mobile */}
            <ScrollReveal delay={120} threshold={0.1} className="w-full lg:w-auto">
              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 lg:gap-10">
                  {(content.partners || []).map((partner, index) => {
                    const partnerName = typeof partner === 'string' ? partner : t(partner.name)
                    const partnerLogo = typeof partner === 'object' ? partner.logo : undefined
                    const partnerUrl = typeof partner === 'object' ? partner.url : undefined

                    const partnerContent = partnerLogo ? (
                      <img
                        src={partnerLogo}
                        alt={partnerName}
                        className="h-7 lg:h-6 w-auto object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                      />
                    ) : (
                      <span className="font-light text-xs tracking-widest text-gray-400 uppercase opacity-70 hover:opacity-100 transition-opacity duration-300">
                        {partnerName}
                      </span>
                    )

                    return partnerUrl ? (
                      <a
                        key={`partner-${index}`}
                        href={partnerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        {partnerContent}
                      </a>
                    ) : (
                      <span key={`partner-${index}`}>{partnerContent}</span>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Social Icons & Newsletter */}
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full lg:w-auto">
              {/* Social Icons */}
              <div className="flex justify-center space-x-1">
                {(content.socialLinks || [])
                  .filter(link => link.isEnabled)
                  .map((link, index) => (
                    <ScrollReveal key={link.name} delay={135 + index * 15} threshold={0.1}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group text-gray-400 hover:text-white transition-all duration-300"
                        onClick={() =>
                          analytics.event({
                            action: 'outbound_click',
                            category: 'Social',
                            label: link.name,
                          })
                        }
                      >
                        <div className="w-10 h-10 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110">
                          <SocialIcon
                            name={link.name}
                            svgString={link.svgIcon}
                            className="w-5 h-5"
                          />
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
              </div>

              {/* Newsletter Form */}
              <ScrollReveal delay={180} threshold={0.1} className="w-full lg:w-auto">
                <NewsletterForm
                  variant={window.innerWidth < 1024 ? 'mobile' : 'desktop'}
                  className="flex w-full lg:w-auto justify-center lg:justify-end"
                />
              </ScrollReveal>
            </div>
          </div>

          {/* Bottom Row: Language Selector (Mobile), Copyright and Legal */}
          <div className="mt-8 pt-8 border-t border-gray-700/30">
            {/* Mobile Language Selector */}
            <div className="lg:hidden flex items-center justify-center gap-4 mb-8">
              {supportedLocales.map(langCode => {
                const isActive = locale === langCode
                return (
                  <button
                    key={langCode}
                    onClick={() => setLocale(langCode)}
                    className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                      isActive
                        ? 'text-white font-medium border-b border-white'
                        : 'text-gray-500 hover:text-white font-light'
                    }`}
                  >
                    {langCode.toUpperCase()}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-6 text-[10px] uppercase tracking-[0.1em] text-gray-500">
              {/* Copyright */}
              <ScrollReveal delay={200} threshold={0} className="order-2 lg:order-1">
                <div className="text-center lg:text-left font-light">
                  <p>{t(content.copyrightText)}</p>
                </div>
              </ScrollReveal>

              {/* Legal Links */}
              {content.legalLinks && content.legalLinks.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-end gap-x-6 gap-y-3 order-1 lg:order-2">
                  {content.legalLinks
                    .filter(link => link?.isVisible)
                    .map((link, index) => {
                      const url = typeof link?.url === 'string' ? link.url : ''
                      const linkText = resolveLegalLinkText(link, locale, t)
                      const isHttp = /^https?:\/\//.test(url)
                      const isInternalLink = url.startsWith('/') && !url.startsWith('//') && !isHttp
                      const commonClasses =
                        'hover:text-white transition-colors duration-300 font-light'

                      return (
                        <ScrollReveal key={`legal-${index}`} delay={215 + index * 15} threshold={0}>
                          {isInternalLink ? (
                            <Link to={url} className={commonClasses}>
                              {linkText}
                            </Link>
                          ) : (
                            <a
                              href={url}
                              className={commonClasses}
                              target={isHttp ? '_blank' : undefined}
                              rel={isHttp ? 'noopener noreferrer' : undefined}
                            >
                              {linkText}
                            </a>
                          )}
                        </ScrollReveal>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
      {/* Mobilde footer'dan sonra ekstra padding - scroll bounce beyaz alanını önler */}
      <div className="lg:hidden h-2 bg-gray-800" aria-hidden="true"></div>
    </>
  )
}
