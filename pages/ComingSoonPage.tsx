import React from 'react'
import {SiteLogo} from '../components/SiteLogo'
import {getSiteSettings} from '../services/cms'
import type {SiteSettings} from '../types'
import {useTranslation} from '../i18n'

export function ComingSoonPage() {
  const [settings, setSettings] = React.useState<SiteSettings | null>(null)
  const {t} = useTranslation()

  React.useEffect(() => {
    getSiteSettings().then(setSettings)
  }, [])

  const logoUrl = settings?.logoUrl

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex items-start justify-center px-4 md:px-8 py-5">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center justify-start text-center animate-fade-in">
          {/* Logo / Placeholder */}
          <div className="w-full max-w-full flex justify-center items-center mb-3">
            {logoUrl ? (
              <SiteLogo
                logoUrl={logoUrl}
                className="max-w-[400px] max-h-[400px] w-auto h-auto object-contain"
              />
            ) : (
              <div className="flex justify-center items-center opacity-30">
                <svg
                  width="300"
                  height="300"
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="300" height="300" rx="20" fill="#e5e5e5" />
                  <path
                    d="M75 105L150 180L225 105"
                    stroke="#d0d0d0"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Sofa image */}
          <div className="w-full max-w-full flex justify-center items-center mb-5">
            <img
              src="/img/sofa.jpg"
              alt="Sofa"
              className="w-full max-w-full max-h-[50vh] h-auto object-contain block"
            />
          </div>

          {/* Title */}
          <h1 className="text-[1.8rem] md:text-[2rem] font-normal tracking-[0.12em] mb-5 font-[Inter,'system-ui',sans-serif]">
            {t('coming_soon_under_construction') || 'Under construction'}
          </h1>

          {/* Contact */}
          <div className="mt-0">
            <a
              href="mailto:info@birim.com"
              className="text-[#1a1a1a] font-bold text-[0.9rem] tracking-[0.15em] border-b border-[#1a1a1a] pb-[2px] hover:opacity-60 hover:border-transparent transition-opacity"
            >
              info@birim.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
