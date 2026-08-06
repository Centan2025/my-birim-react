import {describe, it, expect, vi, beforeEach} from 'vitest'

vi.mock('./client', () => ({
  sanity: {
    fetch: vi.fn(),
    withConfig: vi.fn().mockReturnThis(),
  },
  useSanity: true,
  mapImage: vi.fn(_val => _val?.url || 'http://image.url'),
  mapImages: vi.fn(_val => []),
  extractPalette: vi.fn(_val => ({})),
  mapR2Metadata: vi.fn(_val => ({})),
  rewriteR2Url: vi.fn(_val => _val),
  toFileUrl: vi.fn(_val => 'http://file.url'),
  mapMediaUrl: vi.fn(_val => 'http://media.url'),
}))

import {sanity} from './client'
import {getHomePageContent, getAboutPageContent} from './pages'

describe('sanity pages service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getHomePageContent anasayfa içeriğini döner', async () => {
    vi.mocked(sanity.fetch).mockResolvedValue({
      heroMedia: [{type: 'image', url: 'img.png'}],
      featuredProductIds: [],
    })
    const content = await getHomePageContent()
    expect(content).toBeDefined()
    expect(sanity.fetch).toHaveBeenCalled()
  })

  it('getAboutPageContent hakkımızda içeriğini döner', async () => {
    vi.mocked(sanity.fetch).mockResolvedValue({
      title: {tr: 'Biz'},
      values: [],
    })
    const content = await getAboutPageContent()
    expect(content).toBeDefined()
    expect(sanity.fetch).toHaveBeenCalled()
  })

  it('getHomePageContent panel görsellerindeki kırpma (crop) ve metadata bilgilerini korur', async () => {
    const mockCrop = {x: 0.1, y: 0.2, width: 0.8, height: 0.6}
    const {mapR2Metadata} = await import('./client')
    vi.mocked(mapR2Metadata).mockReturnValue({crop: mockCrop, origWidth: 1000, origHeight: 800})

    vi.mocked(sanity.fetch).mockResolvedValue({
      heroMedia: [],
      contentBlocks: [
        {
          mediaType: 'panels',
          panelFit: 'cover',
          imagePanels: [
            {
              url: 'https://example.com/panel1.jpg',
              cropX: 0.1,
              cropY: 0.2,
              cropWidth: 0.8,
              cropHeight: 0.6,
            },
          ],
        },
      ],
    })

    const content = await getHomePageContent()
    expect(content?.contentBlocks?.[0]?.imagePanels?.[0]?.crop).toEqual(mockCrop)
  })

  it('getHomePageContent mobilde özel crop yapılmadığında cropMobile alanını undefined bırakır', async () => {
    const mockCropDesktop = {x: 0.1, y: 0.2, width: 0.8, height: 0.6}
    const {mapR2Metadata} = await import('./client')
    vi.mocked(mapR2Metadata).mockImplementation((obj: unknown) => {
      const o = obj as Record<string, unknown> | undefined
      if (o?.['cropDesktop'] || o?.['image']) {
        return {crop: mockCropDesktop, origWidth: 1000, origHeight: 800}
      }
      return {}
    })

    vi.mocked(sanity.fetch).mockResolvedValue({
      heroMedia: [],
      contentBlocks: [
        {
          mediaType: 'image',
          image: {url: 'https://example.com/block.jpg'},
          cropDesktop: mockCropDesktop,
        },
      ],
    })

    const content = await getHomePageContent()
    const block = content?.contentBlocks?.[0]
    expect(block?.cropDesktop).toEqual(mockCropDesktop)
    expect(block?.cropMobile).toBeUndefined()
  })
})
