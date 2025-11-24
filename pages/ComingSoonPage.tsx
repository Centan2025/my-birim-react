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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {settings?.logoUrl && (
          <div className="mb-12">
            <SiteLogo logoUrl={settings.logoUrl} className="h-12 w-auto mx-auto" />
          </div>
        )}

        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-light tracking-tight">
            {t('coming_soon_title') || 'Yakında'}
          </h1>

          <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-md mx-auto">
            {t('coming_soon_message') ||
              'Web sitemiz yakında yayında olacak. Lütfen daha sonra tekrar kontrol edin.'}
          </p>
        </div>

        <div className="pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {t('coming_soon_footer') || 'Yakında sizlerle olacağız...'}
          </p>
        </div>
      </div>
    </div>
  )
}
