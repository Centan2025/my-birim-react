import {describe, it, expect} from 'vitest'
import fs from 'fs'
import path from 'path'

describe('BİRİM Sanity Phase 3.5 Multi-Site & Shared Content Tests', () => {
  const schemaIndexContent = fs.readFileSync(
    path.resolve(__dirname, '../../birim-web/schemaTypes/index.ts'),
    'utf8'
  )
  const shopHomeContent = fs.readFileSync(
    path.resolve(__dirname, '../../birim-web/schemaTypes/documents/shopHomePage.tsx'),
    'utf8'
  )
  const shopSettingsContent = fs.readFileSync(
    path.resolve(__dirname, '../../birim-web/schemaTypes/documents/shopSettings.tsx'),
    'utf8'
  )
  const deskContent = fs.readFileSync(
    path.resolve(__dirname, '../../birim-web/deskStructure.ts'),
    'utf8'
  )
  const sanityConfigContent = fs.readFileSync(
    path.resolve(__dirname, '../../birim-web/sanity.config.ts'),
    'utf8'
  )

  describe('1. Schema Registration & Anti-Duplication Rule', () => {
    it('registers shopHomePage and shopSettings in schemaTypes index', () => {
      expect(schemaIndexContent).toContain("import shopHomePage from './documents/shopHomePage'")
      expect(schemaIndexContent).toContain("import shopSettings from './documents/shopSettings'")
      expect(schemaIndexContent).toContain('shopHomePage,')
      expect(schemaIndexContent).toContain('shopSettings,')
    })

    it('ensures shared models are NOT duplicated into separate shop documents', () => {
      expect(schemaIndexContent).toContain('category,')
      expect(schemaIndexContent).toContain('designer,')
      expect(schemaIndexContent).toContain('product,')
      expect(schemaIndexContent).toContain('materialGroup,')

      // Anti-duplication assertions
      expect(schemaIndexContent).not.toContain('shopProduct')
      expect(schemaIndexContent).not.toContain('shopCategory')
      expect(schemaIndexContent).not.toContain('shopDesigner')
      expect(schemaIndexContent).not.toContain('shopMaterialGroup')
    })
  })

  describe('2. shopHomePage Schema & Structure', () => {
    it('contains all 6 required architectural field groups', () => {
      expect(shopHomeContent).toContain("name: 'hero'")
      expect(shopHomeContent).toContain("name: 'selectedObjects'")
      expect(shopHomeContent).toContain("name: 'editorial'")
      expect(shopHomeContent).toContain("name: 'categoryDiscovery'")
      expect(shopHomeContent).toContain("name: 'featuredProduct'")
      expect(shopHomeContent).toContain("name: 'seo'")
    })

    it('references shared product and category schemas directly', () => {
      expect(shopHomeContent).toContain("to: [{type: 'product'}]")
      expect(shopHomeContent).toContain("to: [{type: 'category'}]")
      expect(shopHomeContent).toContain("name: 'selectedProducts'")
      expect(shopHomeContent).toContain("name: 'featuredCategories'")
      expect(shopHomeContent).toContain("name: 'editorialSections'")
      expect(shopHomeContent).toContain("name: 'featuredProduct'")
    })
  })

  describe('3. shopSettings Schema & Separation of Concerns', () => {
    it('cleanly separates language configuration from currency configuration', () => {
      // Language
      expect(shopSettingsContent).toContain("name: 'defaultLanguage'")
      expect(shopSettingsContent).toContain("name: 'availableLanguages'")

      // Currency
      expect(shopSettingsContent).toContain("name: 'defaultCurrency'")
      expect(shopSettingsContent).toContain("name: 'supportedCurrencies'")

      // Commercial messages
      expect(shopSettingsContent).toContain("name: 'freeShippingThreshold'")
      expect(shopSettingsContent).toContain("name: 'announcementBannerText'")
      expect(shopSettingsContent).toContain("name: 'mainSiteUrl'")
    })

    it('ensures shopSettings contains no sensitive secrets or credentials', () => {
      const lower = shopSettingsContent.toLowerCase()
      expect(lower).not.toContain('secret')
      expect(lower).not.toContain('admin_secret')
      expect(lower).not.toContain('apikey')
      expect(lower).not.toContain('password')
      expect(lower).not.toContain('privatekey')
    })
  })

  describe('4. Desk Structure Information Architecture', () => {
    it('organizes content into BİRİM.COM, BİRİM SHOP, Ürünler & Katalog (Ortak), and Settings', () => {
      expect(deskContent).toContain('BİRİM.COM (Ana Site)')
      expect(deskContent).toContain('BİRİM SHOP')
      expect(deskContent).toContain('Ürünler & Katalog (Ortak)')
      expect(deskContent).toContain('Kullanıcılar & Raporlar')
      expect(deskContent).toContain('Site Ayarları & Diller')
      expect(deskContent).toContain('Yasal Metinler (Ortak)')

      // Verify shop singletons in deskStructure
      expect(deskContent).toContain("schemaType('shopHomePage')")
      expect(deskContent).toContain("documentId('shopHomePage')")
      expect(deskContent).toContain("schemaType('shopSettings')")
      expect(deskContent).toContain("documentId('shopSettings')")
    })
  })

  describe('5. Singleton Safety in Sanity Config', () => {
    it('ensures sanity.config.ts protects singletons from duplication and global creation', () => {
      expect(sanityConfigContent).toContain('shopHomePage')
      expect(sanityConfigContent).toContain('shopSettings')
      expect(sanityConfigContent).toContain('newDocumentOptions')
      expect(sanityConfigContent).toContain('singletonTypes')
    })
  })

  describe('6. Localization Fallback Semantics', () => {
    function resolveLocalizedText(
      data?: {tr?: string; en?: string} | null,
      requestedLang: 'tr' | 'en' = 'tr'
    ): string {
      if (!data) return ''
      if (requestedLang === 'tr') {
        return (data.tr || data.en || '').trim()
      }
      return (data.en || data.tr || '').trim()
    }

    it('returns exact requested language if present', () => {
      const text = {tr: 'Modern Kanepe', en: 'Modern Sofa'}
      expect(resolveLocalizedText(text, 'tr')).toBe('Modern Kanepe')
      expect(resolveLocalizedText(text, 'en')).toBe('Modern Sofa')
    })

    it('falls back to alternate language if requested language is missing', () => {
      const textTrOnly = {tr: 'Masa', en: ''}
      expect(resolveLocalizedText(textTrOnly, 'en')).toBe('Masa')

      const textEnOnly = {tr: '', en: 'Chair'}
      expect(resolveLocalizedText(textEnOnly, 'tr')).toBe('Chair')
    })

    it('returns empty string if both languages are empty or undefined', () => {
      expect(resolveLocalizedText(null, 'tr')).toBe('')
      expect(resolveLocalizedText({}, 'en')).toBe('')
    })
  })
})
