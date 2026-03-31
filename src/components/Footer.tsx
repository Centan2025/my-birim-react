import {Link} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {getFooterContent} from '../services/cms'
import {useSiteSettings} from '../context/SiteSettingsContext'
import {SiteLogo} from './SiteLogo'
import {useTranslation} from '../i18n'
import {analytics} from '../lib/analytics'
import ScrollReveal from './ScrollReveal'
import {resolveLegalLinkText} from '../lib/legalLinks'
import {SocialIcon} from './SocialIcon'
import {HomeNewsletter} from './HomeNewsletter'

export const Footer = () => {
  const {settings, isLoading: isSettingsLoading} = useSiteSettings()
  const {t, setLocale, locale, supportedLocales} = useTranslation()

  const {data: content, isLoading: isFooterLoading} = useQuery({
    queryKey: ['footerContent', locale],
    queryFn: getFooterContent,
    staleTime: 1000 * 60 * 30, // 30 dakika cache
  })

  if (isSettingsLoading || isFooterLoading || !settings || !content) {
    return <footer className="bg-[#2f3332] h-20" /> // Minimal placeholder to avoid collapse
  }

  return (
    <>
      <HomeNewsletter />
      <footer className="bg-[#2f3332] text-gray-400" style={{position: 'relative', zIndex: 5}}>
        <div
          className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-10 pb-6 lg:py-12"
          style={{overflow: 'visible'}}
        >
          {/* Mobil düzen */}
          <div
            className="lg:hidden flex flex-col items-center justify-center space-y-6 w-full"
            style={{maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto'}}
          >
            {/* Logo - ortada üstte */}
            <ScrollReveal delay={0} threshold={0.1} width="w-full" className="h-auto">
              <Link to="/" className="text-white flex justify-center w-full">
                <SiteLogo logoUrl={settings.logoUrl} className="h-6 w-auto mx-auto" />
              </Link>
            </ScrollReveal>

            {/* Menü düğmeleri - alt alta ortada */}
            <nav className="flex flex-col items-center space-y-3 w-full">
              {[
                {to: '/products', label: t('view_all')},
                {to: '/designers', label: t('designers')},
                {to: '/projects', label: t('projects') || 'Projeler'},
                {to: '/news', label: t('news')},
                {to: '/about', label: t('about')},
                {to: '/contact', label: t('contact')},
              ].map((link, idx) => (
                <ScrollReveal
                  key={link.to}
                  delay={15 + idx * 15}
                  threshold={0.1}
                  width="w-full"
                  className="h-auto"
                >
                  <Link
                    to={link.to}
                    className="flex justify-center items-center text-lg font-semibold font-inter uppercase tracking-wider text-gray-300 hover:text-white transition-colors duration-200 w-full"
                  >
                    {link.label}
                  </Link>
                </ScrollReveal>
              ))}
            </nav>

            {/* İnce çizgi */}
            <ScrollReveal delay={105} threshold={0.1} width="w-full" className="h-auto">
              <div className="w-full border-t border-gray-700"></div>
            </ScrollReveal>

            {/* Dil seçenekleri */}
            <ScrollReveal delay={120} threshold={0.1} width="w-full" className="h-auto">
              <div className="flex items-center justify-center gap-3 w-full">
                {supportedLocales.map(langCode => {
                  const isActive = locale === langCode
                  return (
                    <button
                      key={langCode}
                      onClick={() => setLocale(langCode)}
                      className={`text-xs font-inter tracking-wider transition-colors duration-200 ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-gray-400 hover:text-white font-thin'
                      }`}
                    >
                      {langCode.toLowerCase()}
                    </button>
                  )
                })}
              </div>
            </ScrollReveal>

            {/* İnce çizgi */}
            <ScrollReveal delay={135} threshold={0.1} width="w-full" className="h-auto">
              <div className="w-full border-t border-gray-700"></div>
            </ScrollReveal>
          </div>

          {/* Desktop düzen */}
          <div className="hidden lg:flex flex-wrap items-start gap-8 lg:gap-16">
            {/* Sol taraf: Logo ve partner yazıları (sola hizalı) */}
            <div className="w-full lg:w-auto">
              <ScrollReveal delay={0} threshold={0.1} width="w-auto" className="h-auto">
                <div className="text-white mb-4">
                  <SiteLogo logoUrl={settings.logoUrl} className="h-4 w-auto" />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={15} threshold={0.1} width="w-full" className="h-auto">
                <div className="flex items-center flex-wrap gap-6 mb-4">
                  {(content.partners || []).map((partner, index) => {
                    const partnerName = typeof partner === 'string' ? partner : t(partner.name)
                    const partnerLogo = typeof partner === 'object' ? partner.logo : undefined
                    const partnerUrl = typeof partner === 'object' ? partner.url : undefined

                    const partnerContent = partnerLogo ? (
                      <img
                        src={partnerLogo}
                        alt={partnerName}
                        className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                      />
                    ) : (
                      <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">
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
              </ScrollReveal>
            </div>

            {/* Orta: Menü düğmeleri (sağa hizalı üstte) */}
            <div className="flex-1 flex justify-end">
              <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold font-inter uppercase tracking-wider text-gray-300 items-center justify-end">
                {[
                  {to: '/products', label: t('view_all')},
                  {to: '/designers', label: t('designers')},
                  {to: '/projects', label: t('projects') || 'Projeler'},
                  {to: '/news', label: t('news')},
                  {to: '/about', label: t('about')},
                  {to: '/contact', label: t('contact')},
                ].map((link, idx) => (
                  <ScrollReveal
                    key={link.to}
                    delay={30 + idx * 15}
                    threshold={0.1}
                    width="w-auto"
                    className="h-auto"
                  >
                    <Link to={link.to} className="group relative hover:text-white">
                      <span className="relative inline-block">
                        {link.label}
                        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center"></span>
                      </span>
                    </Link>
                  </ScrollReveal>
                ))}
              </nav>
            </div>
          </div>

          {/* Sosyal medya linkleri ve email formu - Desktop'ta justify-between ile ayrılır */}
          <div className="mt-8 lg:mt-8 flex flex-col lg:flex-row flex-wrap items-center lg:items-start justify-center lg:justify-between gap-6 lg:gap-0">
            {/* Sosyal medya linkleri */}
            <ScrollReveal delay={120} threshold={0.1} width="w-auto" className="h-auto">
              <div className="w-full lg:w-auto flex justify-center lg:justify-start space-x-1">
                {(content.socialLinks || [])
                  .filter(link => link.isEnabled)
                  .map((link, index) => (
                    <ScrollReveal
                      key={link.name}
                      delay={135 + index * 15}
                      threshold={0.1}
                      width="w-auto"
                      className="h-auto"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group text-gray-300/80 hover:text-white transition-colors duration-300 ease-out"
                        onClick={() => {
                          analytics.event({
                            action: 'outbound_click',
                            category: 'Social',
                            label: link.name,
                          })
                        }}
                      >
                        <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
                          <SocialIcon
                            name={link.name}
                            svgString={link.svgIcon}
                            className="w-6 h-6"
                          />
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
              </div>
            </ScrollReveal>

            {/* Mobil: Sosyal medya ikonlarının altındaki çizgi ile partner logoları */}
            <div className="w-full lg:hidden">
              <ScrollReveal delay={210} threshold={0.1} width="w-full" className="h-auto">
                <div className="mt-2 flex flex-col items-center justify-center space-y-6 w-full">
                  {/* Üst çizgi (sosyal medya altı) */}
                  <div className="w-full border-t border-gray-700" />

                  {/* Partnerler - çizgiler arasında, butonlar/logolar */}
                  <div className="flex items-center justify-center flex-wrap gap-6">
                    {(content.partners || []).map((partner, index) => {
                      const partnerName = typeof partner === 'string' ? partner : t(partner.name)
                      const partnerLogo = typeof partner === 'object' ? partner.logo : undefined
                      const partnerUrl = typeof partner === 'object' ? partner.url : undefined

                      const partnerContent = partnerLogo ? (
                        <img
                          src={partnerLogo}
                          alt={partnerName}
                          className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                        />
                      ) : (
                        <span className="font-semibold text-gray-300 opacity-70 hover:opacity-100 transition-opacity duration-200">
                          {partnerName}
                        </span>
                      )

                      return partnerUrl ? (
                        <a
                          key={`partner-mobile-${index}`}
                          href={partnerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          {partnerContent}
                        </a>
                      ) : (
                        <span key={`partner-mobile-${index}`}>{partnerContent}</span>
                      )
                    })}
                  </div>

                  {/* Alt çizgi (partnerler altı) */}
                  <div className="w-full border-t border-gray-700" />
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Yasal linkler ve telif metni - mobilde alt alta, desktop'ta aynı satırda
              sol: telif, sağ: yasal düğmeler */}
          <ScrollReveal delay={180} threshold={0} width="w-full" className="h-auto">
            <div
              className="lg:mt-10 pt-2 lg:pt-8 w-full lg:border-t lg:border-t-2 lg:border-gray-600"
              style={{overflow: 'visible', width: '100%'}}
            >
              <div className="flex flex-col items-center justify-center gap-4 text-xs w-full lg:flex-row lg:items-start lg:justify-between">
                {/* Sol: Telif metni */}
                <div className="text-center lg:text-left">
                  <p>{t(content.copyrightText)}</p>
                </div>

                {/* Sağ: Yasal linkler */}
                {content.legalLinks && content.legalLinks.length > 0 && (
                  <div
                    id="mobile-legal-links-stack"
                    className="legal-links-inner flex flex-col w-full md:w-auto md:flex-row md:flex-wrap md:items-center items-center justify-center md:justify-center lg:justify-end lg:self-end lg:items-end gap-y-2 md:gap-x-4 md:gap-y-0"
                    style={{
                      overflow: 'visible',
                      maxWidth: '100%',
                      minWidth: 0,
                      flexShrink: 0,
                      flexGrow: 0,
                      marginLeft: 'auto',
                      marginRight: 0,
                      textAlign: 'center',
                    }}
                  >
                    {content.legalLinks
                      .filter(link => link?.isVisible)
                      .map((link, index) => {
                        const url = typeof link?.url === 'string' ? link.url : ''
                        const linkText = resolveLegalLinkText(link, locale, t)

                        // Diğer footer öğeleri gibi her yasal linke de ScrollReveal animasyonu ekle
                        return (
                          <ScrollReveal
                            key={`legal-${index}`}
                            delay={195 + index * 15}
                            threshold={0}
                            width="w-auto"
                            className="h-auto"
                          >
                            {!url ? (
                              <span
                                className="opacity-80 select-none text-gray-400"
                                style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'visible',
                                  textOverflow: 'clip',
                                  maxWidth: 'none',
                                }}
                              >
                                {linkText}
                              </span>
                            ) : (
                              (() => {
                                const isHttp = /^https?:\/\//.test(url)
                                const isInternalLink =
                                  url.startsWith('/') && !url.startsWith('//') && !isHttp
                                const commonClasses =
                                  'text-gray-300 hover:text-gray-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:rounded-sm'

                                return (
                                  <span className="legal-link-wrapper">
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
                                  </span>
                                )
                              })()
                            )}
                          </ScrollReveal>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </footer>
      {/* Mobilde footer'dan sonra ekstra padding - scroll bounce beyaz alanını önler */}
      <div className="lg:hidden h-2 bg-[#2f3332]" aria-hidden="true"></div>
    </>
  )
}
