import {describe, it, expect} from 'vitest'
import {getPreliminaryInfoForm, getDistanceSalesAgreement, getKvkkPolicy} from '../services/cms'
import {
  FALLBACK_PRELIMINARY_INFO,
  FALLBACK_DISTANCE_SALES_AGREEMENT,
  FALLBACK_KVKK_COMMERCE,
} from '../data/legalFallbacks'

describe('E-Commerce Legal Agreements & CMS Fallbacks', () => {
  it('should fetch preliminary info form with Birim Mobilya corporate defaults', async () => {
    const doc = await getPreliminaryInfoForm()
    expect(doc).toBeDefined()
    expect(doc?.title).toBeDefined()
    expect(doc?.content).toBeDefined()

    const text = JSON.stringify(doc?.content)
    expect(text).toContain('Birim Mobilya')
    expect(text).toContain('CAYMA HAKKI')
  })

  it('should fetch distance sales agreement with Birim Mobilya corporate defaults', async () => {
    const doc = await getDistanceSalesAgreement()
    expect(doc).toBeDefined()
    expect(doc?.title).toBeDefined()
    expect(doc?.content).toBeDefined()

    const text = JSON.stringify(doc?.content)
    expect(text).toContain('Birim Mobilya')
    expect(text).toContain('TARAFLAR')
  })

  it('should fetch KVKK clarification text and ensure valid document structure', async () => {
    const doc = await getKvkkPolicy()
    expect(doc).toBeDefined()
    expect(doc?.content).toBeDefined()
    expect(Array.isArray(doc?.content.tr) || doc?.content.tr).toBeTruthy()
  })

  it('should verify corporate details in Turkish fallbacks', () => {
    const prelimTr = JSON.stringify(FALLBACK_PRELIMINARY_INFO.content.tr)
    expect(prelimTr).toContain('Birim Mobilya San. ve Tic. A.Ş.')
    expect(prelimTr).toContain('MERSİS')
    expect(prelimTr).toContain('CAYMA HAKKI')
    expect(prelimTr).toContain('MOBİLYA')

    const distTr = JSON.stringify(FALLBACK_DISTANCE_SALES_AGREEMENT.content.tr)
    expect(distTr).toContain('Birim Mobilya San. ve Tic. A.Ş.')
    expect(distTr).toContain('TARAFLAR')
    expect(distTr).toContain('6502')
    expect(distTr).toContain('YETKİLİ MAHKEME')

    const kvkkTr = JSON.stringify(FALLBACK_KVKK_COMMERCE.content.tr)
    expect(kvkkTr).toContain('Birim Mobilya San. ve Tic. A.Ş.')
    expect(kvkkTr).toContain('VERİ SORUMLUSU')
    expect(kvkkTr).toContain('6698')
  })

  it('should provide English translations in legal fallbacks', () => {
    expect(FALLBACK_PRELIMINARY_INFO.content.en).toBeDefined()
    const prelimEn = JSON.stringify(FALLBACK_PRELIMINARY_INFO.content.en)
    expect(prelimEn).toContain('Birim Mobilya San. ve Tic. A.Ş.')
    expect(prelimEn).toContain('WITHDRAWAL')

    expect(FALLBACK_DISTANCE_SALES_AGREEMENT.content.en).toBeDefined()
    const distEn = JSON.stringify(FALLBACK_DISTANCE_SALES_AGREEMENT.content.en)
    expect(distEn).toContain('SELLER')
    expect(distEn).toContain('BUYER')
    expect(distEn).toContain('Distance Contracts')

    expect(FALLBACK_KVKK_COMMERCE.content.en).toBeDefined()
    const kvkkEn = JSON.stringify(FALLBACK_KVKK_COMMERCE.content.en)
    expect(kvkkEn).toContain('DATA CONTROLLER')
  })
})
