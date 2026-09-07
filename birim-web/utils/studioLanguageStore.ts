import {useSyncExternalStore} from 'react'

export interface LanguageOption {
  id: string
  title: string
  shortLabel: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {id: 'tr', title: 'Türkçe', shortLabel: 'TR', flag: '🇹🇷'},
  {id: 'en', title: 'English', shortLabel: 'EN', flag: '🇬🇧'},
  {id: 'it', title: 'Italiano', shortLabel: 'IT', flag: '🇮🇹'},
  {id: 'de', title: 'Deutsch', shortLabel: 'DE', flag: '🇩🇪'},
  {id: 'fr', title: 'Français', shortLabel: 'FR', flag: '🇫🇷'},
  {id: 'es', title: 'Español', shortLabel: 'ES', flag: '🇪🇸'},
]

export const ALL_LANGUAGES_OPTION: LanguageOption = {
  id: 'all',
  title: 'Tüm Diller',
  shortLabel: 'Hepsi',
  flag: '🌐',
}

const STORAGE_KEY = 'sanity_studio_active_language'
const DEFAULT_LANGUAGE = 'tr'

let currentLanguage: string = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (saved === 'all' || SUPPORTED_LANGUAGES.some((l) => l.id === saved))) {
        return saved
      }
    } catch {
      // localStorage erişilemezse varsayılan dön
    }
  }
  return DEFAULT_LANGUAGE
})()

const listeners = new Set<() => void>()

export function getStudioLanguage(): string {
  return currentLanguage
}

export function setStudioLanguage(lang: string) {
  if (currentLanguage === lang) return
  currentLanguage = lang

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  listeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error in language listener:', e)
    }
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStudioLanguage(): string {
  return useSyncExternalStore(subscribe, getStudioLanguage, () => DEFAULT_LANGUAGE)
}
