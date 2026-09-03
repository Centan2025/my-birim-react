import {describe, it, expect, vi, beforeEach} from 'vitest'

vi.mock('./client', () => ({
  sanity: {
    fetch: vi.fn(),
    withConfig: vi.fn().mockReturnThis(),
  },
  useSanity: true,
  mapImage: vi.fn(_val => (_val ? _val.url || 'http://image.url' : '')),
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

  it('getHomePageContent uses imageR2 crop when imageDesktopR2 has the same URL and imageR2 is cropped', async () => {
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
          origWidth: Number(o['width'] || 2560),
          origHeight: Number(o['height'] || 1440),
        }
      }
      return {}
    })

    vi.mocked(sanity.fetch).mockResolvedValue({
      heroMedia: [],
      contentBlocks: [
        {
          mediaType: 'image',
          imageR2: {
            url: 'https://example.com/same-image.webp',
            cropX: 0.486,
            cropY: 0,
            cropWidth: 0.2252,
            cropHeight: 1,
            width: 2560,
            height: 1440,
          },
          imageDesktopR2: {
            url: 'https://example.com/same-image.webp',
            cropX: 0,
            cropY: 0.073,
            cropWidth: 1,
            cropHeight: 0.8999,
            width: 2560,
            height: 1440,
          },
        },
      ],
    })

    const content = await getHomePageContent()
    const block = content?.contentBlocks?.[0]
    expect(block?.crop).toEqual({
      x: 0.486,
      y: 0,
      width: 0.2252,
      height: 1,
    })
  })

  it('getHomePageContent populates image and url when imageR2 is undefined but imageDesktopR2 is present', async () => {
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
          origWidth: Number(o['width'] || 2560),
          origHeight: Number(o['height'] || 1440),
        }
      }
      return {}
    })

    vi.mocked(sanity.fetch).mockResolvedValue({
      heroMedia: [],
      contentBlocks: [
        {
          mediaType: 'image',
          imageDesktopR2: {
            url: 'https://example.com/desktop-only.webp',
            cropX: 0,
            cropY: 0,
            cropWidth: 1,
            cropHeight: 1,
            width: 2560,
            height: 1440,
          },
          imageMobileR2: {
            url: 'https://example.com/mobile-only.webp',
            width: 1037,
            height: 2000,
          },
        },
      ],
    })

    const content = await getHomePageContent()
    const block = content?.contentBlocks?.[0]
    expect(block?.image).toBe('https://example.com/desktop-only.webp')
    expect(block?.imageDesktop).toBe('https://example.com/desktop-only.webp')
    expect(block?.url).toBe('https://example.com/desktop-only.webp')
    expect(block?.urlDesktop).toBe('https://example.com/desktop-only.webp')
    expect(block?.urlMobile).toBe('https://example.com/mobile-only.webp')
  })
})
