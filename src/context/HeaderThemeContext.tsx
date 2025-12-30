import { createContext, useContext, useMemo, useState, useCallback, PropsWithChildren } from 'react'
import type { SanityImagePalette } from '../types'

type HeaderThemeMode = 'light' | 'dark'

interface HeaderThemeState {
  brightness: number | null
  mode?: HeaderThemeMode
  background?: string
  foreground?: string
  palette?: SanityImagePalette
}

interface HeaderThemeContextValue {
  theme: HeaderThemeState
  setFromPalette: (palette?: SanityImagePalette) => void
  setBrightness: (value: number | null) => void
  reset: () => void
}

const HeaderThemeContext = createContext<HeaderThemeContextValue | null>(null)

const hexToLuminance = (hex?: string): number | null => {
  if (!hex || typeof hex !== 'string') return null
  const normalized = hex.trim().replace('#', '')
  if (![3, 6].includes(normalized.length)) return null
  const full = normalized.length === 3 ? normalized.split('').map(ch => ch + ch).join('') : normalized
  const int = parseInt(full, 16)
  if (Number.isNaN(int)) return null
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  const srgb = [r, g, b].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  const [sr, sg, sb] = srgb
  if (sr === undefined || sg === undefined || sb === undefined) return null
  const luminance = 0.2126 * sr + 0.7152 * sg + 0.0722 * sb
  return Number.isFinite(luminance) ? Math.min(1, Math.max(0, luminance)) : null
}

export const HeaderThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setTheme] = useState<HeaderThemeState>({ brightness: null })

  const setFromPalette = useCallback((palette?: SanityImagePalette) => {
    const bg = palette?.dominant?.background
    const fg = palette?.dominant?.foreground
    const brightness = hexToLuminance(bg)
    const mode: HeaderThemeMode | undefined =
      brightness === null ? undefined : brightness >= 0.5 ? 'light' : 'dark'
    setTheme({
      brightness,
      mode,
      background: bg,
      foreground: fg,
      palette,
    })
  }, [])

  const setBrightness = useCallback((value: number | null) => {
    const mode: HeaderThemeMode | undefined =
      value === null ? undefined : value >= 0.5 ? 'light' : 'dark'
    setTheme(current => ({
      ...current,
      brightness: value,
      mode,
    }))
  }, [])

  const reset = useCallback(() => setTheme({ brightness: null }), [])

  const value = useMemo<HeaderThemeContextValue>(
    () => ({
      theme,
      setFromPalette,
      setBrightness,
      reset,
    }),
    [theme, setFromPalette, setBrightness, reset]
  )

  return <HeaderThemeContext.Provider value={value}>{children}</HeaderThemeContext.Provider>
}

export const useHeaderTheme = () => {
  const ctx = useContext(HeaderThemeContext)
  if (!ctx) throw new Error('useHeaderTheme must be used within HeaderThemeProvider')
  return ctx
}

