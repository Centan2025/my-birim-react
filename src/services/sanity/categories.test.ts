import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./client', () => ({
    sanity: {
        fetch: vi.fn(),
    },
    useSanity: true,
    mapImage: vi.fn(val => val?.url || 'http://image.url'),
    extractPalette: vi.fn(val => ({})),
}))

import { sanity } from './client'
import { getCategories, getDesigners } from './categories'

describe('sanity categories and designers service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getCategories tüm kategorileri döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue([{
            id: 'cat-1', // Projected as "id"
            name: { tr: 'Kategori' }
        }])
        const categories = await getCategories()
        expect(categories).toHaveLength(1)
        expect(categories[0].id).toBe('cat-1')
    })

    it('getDesigners tüm tasarımcıları döner', async () => {
        vi.mocked(sanity.fetch).mockResolvedValue([{
            id: 'des-1', // Projected as "id"
            name: { tr: 'Tasarımcı' }
        }])
        const designers = await getDesigners()
        expect(designers).toHaveLength(1)
        expect(designers[0].id).toBe('des-1')
    })
})
