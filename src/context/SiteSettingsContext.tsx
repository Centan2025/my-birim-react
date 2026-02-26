/* eslint-disable react-refresh/only-export-components */
import { useState, useContext, createContext, PropsWithChildren, useEffect } from 'react'
import { getSiteSettings } from '../services/cms'
import { useSeoDefaults } from '../hooks/useSEO'
import type { SiteSettings } from '../types'

interface SiteSettingsContextType {
    settings: SiteSettings | null
}

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null)

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext)
    if (!context) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
    }
    return context
}

export const SiteSettingsProvider = ({ children }: PropsWithChildren) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const setSeoDefaults = useSeoDefaults()

    useEffect(() => {
        getSiteSettings().then(setSettings)
    }, [])

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
        <SiteSettingsContext.Provider value={{ settings }}>
            {children}
        </SiteSettingsContext.Provider>
    )
}
