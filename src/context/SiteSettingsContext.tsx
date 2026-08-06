import {useContext, createContext, PropsWithChildren, useEffect} from 'react'
import {useQuery} from '@tanstack/react-query'
import {getSiteSettings} from '../services/cms'
import {useSeoDefaults} from '../hooks/useSEO'
import type {SiteSettings} from '../types'

interface SiteSettingsContextType {
  settings: SiteSettings | null
  isLoading: boolean
  error: Error | null
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  return context || {settings: null, isLoading: false, error: null}
}

export const SiteSettingsProvider = ({children}: PropsWithChildren) => {
  const setSeoDefaults = useSeoDefaults()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 30, // 30 dakika cache
  })

  useEffect(() => {
    if (
      settings?.topBannerText &&
      typeof settings.topBannerText === 'string' &&
      settings.topBannerText.trim()
    ) {
      setSeoDefaults({
        title: settings.topBannerText.trim(),
        siteName: settings.topBannerText.trim(),
      })
    }
  }, [setSeoDefaults, settings?.topBannerText])

  return (
    <SiteSettingsContext.Provider
      value={{settings: settings || null, isLoading, error: error as Error | null}}
    >
      {children}
    </SiteSettingsContext.Provider>
  )
}
