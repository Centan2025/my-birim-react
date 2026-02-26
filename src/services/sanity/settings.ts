import groq from 'groq'
import type { SiteSettings } from '../../types'
import { sanity, useSanity, mapImage } from './client'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const KEYS = {
    SITE_SETTINGS: 'birim_site_settings',
    LANGUAGES: 'birim_languages',
    FOOTER: 'birim_footer',
}

// Fallback logic
let storage: Storage
const memoryStore: { [key: string]: string } = {}
try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem('__storage_test__', 'test')
        window.localStorage.removeItem('__storage_test__')
        storage = window.localStorage
    } else {
        throw new Error('localStorage not available')
    }
} catch (e) {
    storage = {
        getItem: (key: string) => memoryStore[key] || null,
        setItem: (key: string, value: string) => { memoryStore[key] = value },
        removeItem: (key: string) => { delete memoryStore[key] },
        clear: () => {
            for (const key in memoryStore) {
                if (Object.prototype.hasOwnProperty.call(memoryStore, key)) {
                    delete memoryStore[key]
                }
            }
        },
        get length() { return Object.keys(memoryStore).length },
        key: (index: number) => Object.keys(memoryStore)[index] || null,
    }
}

export const getItem = <T>(key: string): T | null => {
    const data = storage.getItem(key)
    if (!data) return null
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

export const setItem = <T>(key: string, data: T): void => {
    try {
        storage.setItem(key, JSON.stringify(data))
    } catch (e) {
        console.warn("Could not save changes to localStorage.")
    }
}

export const getLanguages = async (): Promise<string[]> => {
    if (useSanity && sanity) {
        try {
            const langs = await sanity.fetch(groq`*[_type=="siteSettings"][0].languages`)
            const base = ['tr', 'en']
            if (Array.isArray(langs)) {
                interface LanguageItem { code: string; visible: boolean }
                const normalized = langs
                    .map((l: string | { code?: string; visible?: boolean }) => {
                        if (typeof l === 'string') return { code: l, visible: true }
                        const code = String(l?.code || '').toLowerCase()
                        if (!code) return null
                        return { code, visible: l?.visible !== false }
                    })
                    .filter((l): l is LanguageItem => l !== null)
                const visibleCodes = normalized.filter(l => l.visible).map(l => l.code)
                return Array.from(new Set([...base, ...visibleCodes]))
            }
            return base
        } catch (e) {
            // Failed to fetch languages
        }
    }
    await delay(SIMULATED_DELAY)
    const fromLocal = getItem<string[]>(KEYS.LANGUAGES) || []
    const base = ['tr', 'en']
    return Array.from(new Set(fromLocal.length ? [...base, ...fromLocal] : base))
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
    if (useSanity && sanity) {
        try {
            const q = groq`*[_type == "siteSettings" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{ ..., logo, logoR2 }`
            const s = await sanity.withConfig({ useCdn: false }).fetch(q)
            return {
                logoUrl: s?.logoR2?.url || (s?.logo ? mapImage(s.logo) : s?.logoUrl || ''),
                topBannerText: s?.topBannerText || '',
                showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
                showRelatedProducts: s?.showRelatedProducts !== false,
                showCartButton: Boolean(s?.showCartButton ?? true),
                imageBorderStyle: s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square' ? s.imageBorderStyle : 'square',
                isLanguageSwitcherVisible: s?.isLanguageSwitcherVisible !== false,
                languages: Array.isArray(s?.languages) ? s.languages : undefined,
                maintenanceMode: Boolean(s?.maintenanceMode ?? false),
                mobileHeaderAnimation: s?.mobileHeaderAnimation === 'overlay' ? 'overlay' : 'default',
            }
        } catch {
            // Ignore
        }
    }
    await delay(SIMULATED_DELAY)
    const s = getItem<SiteSettings>(KEYS.SITE_SETTINGS)
    return {
        logoUrl: s?.logoUrl || '',
        topBannerText: s?.topBannerText || '',
        showProductPrevNext: Boolean(s?.showProductPrevNext ?? false),
        showRelatedProducts: s?.showRelatedProducts !== false,
        showCartButton: Boolean(s?.showCartButton ?? true),
        imageBorderStyle: s?.imageBorderStyle === 'rounded' || s?.imageBorderStyle === 'square' ? s.imageBorderStyle : 'square',
        maintenanceMode: Boolean(s?.maintenanceMode ?? false),
        mobileHeaderAnimation: s?.mobileHeaderAnimation === 'overlay' ? 'overlay' : 'default',
    }
}
