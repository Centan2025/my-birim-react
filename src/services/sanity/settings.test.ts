import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./client', () => ({
    sanity: {
        fetch: vi.fn(),
        withConfig: vi.fn().mockReturnThis(),
    },
    useSanity: true
}))

import { sanity } from './client'
import { getSiteSettings, getLanguages, getTranslations } from './settings'

describe('sanity settings service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getSiteSettings site ayarlarını döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue({
            title: { tr: 'Birim' },
            logo: { asset: {} },
            maintenanceMode: false
        })
        const settings = await getSiteSettings()
        expect(settings.maintenanceMode).toBe(false)
    })

    it('getLanguages desteklenen dilleri döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue([{ code: 'tr' }, { code: 'en' }])
        const langs = await getLanguages()
        expect(langs).toEqual(['tr', 'en'])
    })

    it('getTranslations çevirileri döner ve map eder', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue([
            { language: 'tr', strings: { hello: 'merhaba' } },
            { language: 'en', strings: { hello: 'hello' } }
        ])
        const translations = await getTranslations()

        expect(translations['tr']).toBeDefined()
        expect(translations['tr']['hello']).toBe('merhaba')
        expect(translations['en']['hello']).toBe('hello')
    })
})
