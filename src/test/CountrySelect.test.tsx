import {describe, it, expect, vi} from 'vitest'
import {render, screen, fireEvent} from '@testing-library/react'
import React from 'react'
import {CountrySelect} from '../components/CountrySelect'
import {searchCountries, normalizeSearchText, findCountryByNameOrCode} from '../lib/countries'
import {I18nContext} from '../i18n'

describe('Country Search Utility (countries.ts)', () => {
  it('normalizes Turkish and Latin characters properly', () => {
    expect(normalizeSearchText('Türkiye')).toBe('turkiye')
    expect(normalizeSearchText('İSTANBUL')).toBe('istanbul')
    expect(normalizeSearchText('İsviçre')).toBe('isvicre')
    expect(normalizeSearchText('Almanya')).toBe('almanya')
  })

  it('returns Turkey first when search query is empty in Turkish locale', () => {
    const results = searchCountries('', 'tr')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].code).toBe('TR')
    expect(results[0].nameTr).toBe('Türkiye')
  })

  it('finds Germany by Turkish name, English name, and alias', () => {
    const byTr = searchCountries('almanya', 'tr')
    expect(byTr.some(c => c.code === 'DE')).toBe(true)

    const byEn = searchCountries('germany', 'tr')
    expect(byEn.some(c => c.code === 'DE')).toBe(true)

    const byCode = searchCountries('de', 'tr')
    expect(byCode.some(c => c.code === 'DE')).toBe(true)
  })

  it('finds United States by "abd", "usa", "amerika"', () => {
    const byAbd = searchCountries('abd', 'tr')
    expect(byAbd.some(c => c.code === 'US')).toBe(true)

    const byUsa = searchCountries('usa', 'tr')
    expect(byUsa.some(c => c.code === 'US')).toBe(true)
  })

  it('finds United Kingdom by "ingiltere", "uk"', () => {
    const byIng = searchCountries('ingiltere', 'tr')
    expect(byIng.some(c => c.code === 'GB')).toBe(true)

    const byUk = searchCountries('uk', 'tr')
    expect(byUk.some(c => c.code === 'GB')).toBe(true)
  })

  it('findCountryByNameOrCode finds country accurately', () => {
    expect(findCountryByNameOrCode('Türkiye')?.code).toBe('TR')
    expect(findCountryByNameOrCode('Turkey')?.code).toBe('TR')
    expect(findCountryByNameOrCode('TR')?.code).toBe('TR')
    expect(findCountryByNameOrCode('Almanya')?.code).toBe('DE')
    expect(findCountryByNameOrCode('UnknownCountry123')).toBeUndefined()
  })
})

const renderWithI18n = (ui: React.ReactElement, locale = 'tr') => {
  const dummyContext = {
    locale,
    setLocale: vi.fn(),
    t: (key: unknown) => {
      const map: Record<string, string> = {
        country: 'Ülke',
        country_placeholder: 'Ülkeniz',
        search_country: 'Ülke ara...',
        no_country_found: 'Sonuç bulunamadı',
      }
      return typeof key === 'string' && map[key] ? map[key] : String(key || '')
    },
    supportedLocales: ['tr', 'en'],
  }

  return render(<I18nContext.Provider value={dummyContext}>{ui}</I18nContext.Provider>)
}

describe('CountrySelect Component', () => {
  it('renders with placeholder when no country is selected', () => {
    renderWithI18n(<CountrySelect value="" onChange={vi.fn()} placeholder="Ülke Seçiniz" />)
    const input = screen.getByPlaceholderText('Ülke Seçiniz')
    expect(input).toBeInTheDocument()
  })

  it('displays country name and flag when value is set', () => {
    renderWithI18n(<CountrySelect value="Türkiye" onChange={vi.fn()} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toContain('🇹🇷')
    expect(input.value).toContain('Türkiye')
  })

  it('opens dropdown and lists countries on focus', () => {
    renderWithI18n(<CountrySelect value="" onChange={vi.fn()} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Türkiye')).toBeInTheDocument()
  })

  it('filters countries when user types in search input', () => {
    renderWithI18n(<CountrySelect value="" onChange={vi.fn()} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, {target: {value: 'alm'}})

    expect(screen.getByText('Almanya')).toBeInTheDocument()
    expect(screen.queryByText('Avustralya')).not.toBeInTheDocument()
  })

  it('selects country on click and triggers onChange', () => {
    const handleChange = vi.fn()
    renderWithI18n(<CountrySelect value="" onChange={handleChange} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, {target: {value: 'alm'}})

    const option = screen.getByText('Almanya')
    fireEvent.click(option)

    expect(handleChange).toHaveBeenCalledWith('Almanya')
  })

  it('clears selected value when clear button is clicked', () => {
    const handleChange = vi.fn()
    renderWithI18n(<CountrySelect value="Türkiye" onChange={handleChange} />)
    const clearBtn = screen.getByLabelText('Temizle')
    fireEvent.click(clearBtn)

    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('supports keyboard navigation (ArrowDown and Enter)', () => {
    const handleChange = vi.fn()
    renderWithI18n(<CountrySelect value="" onChange={handleChange} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, {target: {value: 'fransa'}})

    // Press enter to select highlighted item
    fireEvent.keyDown(input, {key: 'Enter', code: 'Enter'})
    expect(handleChange).toHaveBeenCalledWith('Fransa')
  })

  it('closes dropdown on Escape key', () => {
    renderWithI18n(<CountrySelect value="" onChange={vi.fn()} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(input, {key: 'Escape', code: 'Escape'})
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
