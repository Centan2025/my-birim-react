import {describe, it, expect, vi, beforeEach} from 'vitest'

// Mock the sanity client properly
vi.mock('./client', () => ({
  sanity: {
    fetch: vi.fn(),
  },
  useSanity: true,
  urlFor: vi.fn(() => ({
    url: () => 'http://image.url',
  })),
  mapImage: vi.fn(val => 'http://image.url'),
  mapImages: vi.fn(val => []),
  extractPalette: vi.fn(val => ({})),
  mapR2Metadata: vi.fn(val => ({})),
  rewriteR2Url: vi.fn(val => val),
  toFileUrl: vi.fn(val => 'http://file.url'),
  mapMediaUrl: vi.fn(val => 'http://media.url'),
  mapProductMedia: vi.fn(val => []),
  mapAlternativeMedia: vi.fn(val => []),
}))

import {sanity} from './client'
import {getProducts, getProductById} from './products'

describe('sanity products service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getProducts tüm ürünleri döner ve veriyi normalize eder', async () => {
    const mockData = [
      {
        id: 'prod-1', // Projected string
        name: {tr: 'Ürün 1'},
        mainImageR2: {},
        designer: {designerId: 'd1'},
        category: {categoryId: 'c1'},
      },
    ]
    vi.mocked(sanity.fetch).mockResolvedValue(mockData)

    const products = await getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].id).toBe('prod-1')
  })

  it('getProductById detayları doğru eşler', async () => {
    const mockData = {
      id: 'p-123', // Projected string
      name: {tr: 'Test Product'},
      mainImageR2: {},
    }
    vi.mocked(sanity.fetch).mockResolvedValue(mockData)

    const product = await getProductById('p-123')
    expect(product?.id).toBe('p-123')
  })
})
