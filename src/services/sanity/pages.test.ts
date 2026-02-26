import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./client', () => ({
    sanity: {
        fetch: vi.fn(),
        withConfig: vi.fn().mockReturnThis(),
    },
    useSanity: true,
    mapImage: vi.fn(val => val?.url || 'http://image.url'),
    mapImages: vi.fn(val => []),
    extractPalette: vi.fn(val => ({})),
    mapR2Metadata: vi.fn(val => ({})),
    rewriteR2Url: vi.fn(val => val),
    toFileUrl: vi.fn(val => 'http://file.url'),
    mapMediaUrl: vi.fn(val => 'http://media.url'),
}))

import { sanity } from './client'
import { getHomePageContent, getAboutPageContent } from './pages'

describe('sanity pages service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getHomePageContent anasayfa içeriğini döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue({
            heroMedia: [{ type: 'image', url: 'img.png' }],
            featuredProductIds: []
        })
        const content = await getHomePageContent()
        expect(content).toBeDefined()
        expect(sanity.fetch).toHaveBeenCalled()
    })

    it('getAboutPageContent hakkımızda içeriğini döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue({
            title: { tr: 'Biz' },
            values: []
        })
        const content = await getAboutPageContent()
        expect(content).toBeDefined()
        expect(sanity.fetch).toHaveBeenCalled()
    })
})
