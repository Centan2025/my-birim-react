import {describe, it, expect} from 'vitest'
import {isBirimDesignStudio} from '../utils/designerUtils'

describe('isBirimDesignStudio', () => {
  it('identifies Birim Design Studio by slug ID', () => {
    expect(isBirimDesignStudio('tasarimci-birim-dessign-studio')).toBe(true)
    expect(isBirimDesignStudio('tasarimci-birim-design-studio')).toBe(true)
    expect(isBirimDesignStudio({id: 'tasarimci-birim-dessign-studio'})).toBe(true)
    expect(isBirimDesignStudio({id: 'birim-design-studio'})).toBe(true)
  })

  it('identifies Birim Design Studio by name', () => {
    expect(
      isBirimDesignStudio({
        id: 'random-id',
        name: {tr: 'BIRIM DESIGN STUDIO', en: 'BIRIM DESIGN STUDIO'},
      })
    ).toBe(true)
    expect(
      isBirimDesignStudio({
        id: 'random-id',
        name: {tr: 'Birim Tasarım Stüdyosu', en: 'Birim Design Studio'},
      })
    ).toBe(true)
  })

  it('returns false for other designers', () => {
    expect(isBirimDesignStudio('tasarimci-cem-tanrikulu')).toBe(false)
    expect(
      isBirimDesignStudio({
        id: 'tasarimci-ayca-cakanisik',
        name: {tr: 'AYÇA ÇAKANIŞIK', en: 'AYCA CAKANISIK'},
      })
    ).toBe(false)
    expect(isBirimDesignStudio(null)).toBe(false)
    expect(isBirimDesignStudio(undefined)).toBe(false)
  })
})
