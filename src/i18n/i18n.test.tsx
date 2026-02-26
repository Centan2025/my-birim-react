import {describe, it, expect, vi, beforeEach} from 'vitest'
import {render, screen, act} from '@testing-library/react'
import React from 'react'
import {I18nProvider, useTranslation} from './index'

// CMS mocks
vi.mock('../services/cms', () => ({
  getLanguages: vi.fn().mockResolvedValue(['tr', 'en']),
  getTranslations: vi.fn().mockResolvedValue({
    tr: {welcome: 'Hoşgeldiniz'},
    en: {welcome: 'Welcome'},
  }),
}))

const TestComponent = () => {
  const {t, setLocale, locale} = useTranslation()
  return (
    <div>
      <span data-testid="greeting">{t('welcome')}</span>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale('en')}>Change to EN</button>
    </div>
  )
}

describe('I18n Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Mock navigator to ensure deterministic locale detection in tests
    vi.stubGlobal('navigator', {language: 'tr-TR'})
  })

  it('başlangıçta TR dili ile yüklenir (navigator tr ise)', async () => {
    await act(async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      )
    })

    expect(screen.getByTestId('locale').textContent).toBe('tr')
    expect(screen.getByTestId('greeting').textContent).toBe('Hoşgeldiniz')
  })

  it('dil değiştirildiğinde t fonksiyonu yeni dili yansıtır', async () => {
    await act(async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      )
    })

    const btn = screen.getByText('Change to EN')
    await act(async () => {
      btn.click()
    })

    expect(screen.getByTestId('locale').textContent).toBe('en')
    expect(screen.getByTestId('greeting').textContent).toBe('Welcome')
  })
})
