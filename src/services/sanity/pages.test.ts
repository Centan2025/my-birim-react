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
})
