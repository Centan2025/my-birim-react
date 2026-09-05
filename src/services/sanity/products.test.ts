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
  mapImage: vi.fn(_val => 'http://image.url'),
  mapImages: vi.fn(_val => []),
  extractPalette: vi.fn(_val => ({})),
  mapR2Metadata: vi.fn(_val => ({})),
  rewriteR2Url: vi.fn(_val => _val),
  toFileUrl: vi.fn(_val => 'http://file.url'),
  mapMediaUrl: vi.fn(_val => 'http://media.url'),
  mapProductMedia: vi.fn(_val => []),
  mapAlternativeMedia: vi.fn(_val => []),
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

  it('getProductById maps mobile crop, hotspot and url correctly', async () => {
    const {mapR2Metadata} = await import('./client')
    vi.mocked(mapR2Metadata).mockImplementation((obj: unknown) => {
      const o = obj as Record<string, unknown> | undefined
      if (o?.['cropX'] !== undefined) {
        return {
          crop: {
            x: Number(o['cropX']),
            y: Number(o['cropY'] || 0),
            width: Number(o['cropWidth']),
            height: Number(o['cropHeight'] || 1),
          },
          hotspot: {
            x: Number(o['hotspotX'] ?? 0.5),
            y: Number(o['hotspotY'] ?? 0.5),
          },
          origWidth: 2432,
          origHeight: 1368,
        }
      }
      return {}
    })

    const mockData = {
      id: 'sh0018-palm',
      name: {tr: 'Palm'},
      media: [
        {
          type: 'image',
          isCover: true,
          imageR2: {
            url: 'https://r2.dev/palm.webp',
            width: 2432,
            height: 1368,
          },
          imageMobileR2: {
            url: 'https://r2.dev/palm-mob.webp',
            cropX: 0.2891,
            cropY: 0,
            cropWidth: 0.4234,
            cropHeight: 1,
            hotspotX: 0.3952,
            hotspotY: 0.5006,
          },
        },
      ],
    }
    vi.mocked(sanity.fetch).mockResolvedValue(mockData)

    const product = await getProductById('sh0018-palm')
    const mediaItem = product?.media?.[0] as Record<string, unknown> | undefined
    expect(mediaItem?.['cropMobile']).toEqual({
      x: 0.2891,
      y: 0,
      width: 0.4234,
      height: 1,
    })
    expect(mediaItem?.['hotspotMobile']).toEqual({
      x: 0.3952,
      y: 0.5006,
    })
    expect(mediaItem?.['urlMobile']).toBe('http://image.url')
  })
})
