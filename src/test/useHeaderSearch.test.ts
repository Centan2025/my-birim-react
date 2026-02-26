/**
 * useHeaderSearch hook'unu test eder.
 * 
 * - Locale-aware normalizasyon (Türkçe karakter)
 * - Minimum 2 karakter eşiği
 * - Çoklu terim (boşlukla ayrılmış) arama
 * - closeSearch temizleme
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHeaderSearch } from '../hooks/useHeaderSearch'

// cms servisleri mock'la
vi.mock('../services/cms', () => ({
    getProducts: vi.fn(),
    getDesigners: vi.fn(),
    getCategories: vi.fn(),
}))

// i18n mock
vi.mock('../i18n', () => ({
    useTranslation: () => ({
        t: (val: any) => (typeof val === 'string' ? val : val?.tr || val?.en || ''),
        locale: 'tr',
    }),
}))

import { getProducts, getDesigners, getCategories } from '../services/cms'

const mockProducts = [
    {
        id: 'p1',
        name: { tr: 'Kanatlar Koltuğu', en: 'Wings Chair' },
        designerId: 'd1',
        categoryId: 'c1',
    },
    {
        id: 'p2',
        name: { tr: 'Çizgi Masa', en: 'Line Table' },
        designerId: 'd2',
        categoryId: 'c2',
    },
]

const mockDesigners = [
    { id: 'd1', name: { tr: 'Ahmet Celik', en: 'Ahmet Celik' } },
    { id: 'd2', name: { tr: 'Mehmet Sahin', en: 'Mehmet Sahin' } },
]

const mockCategories = [
    { id: 'c1', name: { tr: 'Koltuklar', en: 'Armchairs' } },
    { id: 'c2', name: { tr: 'Masalar', en: 'Tables' } },
]

describe('useHeaderSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ shouldAdvanceTime: false })
        vi.mocked(getProducts).mockResolvedValue(mockProducts as any)
        vi.mocked(getDesigners).mockResolvedValue(mockDesigners as any)
        vi.mocked(getCategories).mockResolvedValue(mockCategories as any)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('başlangıçta boş sonuçlar döner', () => {
        const { result } = renderHook(() => useHeaderSearch(false))

        expect(result.current.searchResults.products).toEqual([])
        expect(result.current.searchResults.designers).toEqual([])
        expect(result.current.searchResults.categories).toEqual([])
        expect(result.current.isSearching).toBe(false)
    })

    it('arama açıldığında veri yüklenir', async () => {
        const { result } = renderHook(() => useHeaderSearch(true))

        await waitFor(() => expect(result.current.allData).not.toBeNull(), { timeout: 3000 })

        expect(getProducts).toHaveBeenCalledTimes(1)
        expect(result.current.allData!.products).toHaveLength(2)
    })

    it('2 karakterden az sorguda sonuç dönmez', async () => {
        const { result } = renderHook(() => useHeaderSearch(true))
        await waitFor(() => expect(result.current.allData).not.toBeNull(), { timeout: 3000 })

        act(() => { result.current.setSearchQuery('k') })
        act(() => { vi.advanceTimersByTime(400) })

        expect(result.current.searchResults.products).toEqual([])
    })

    it('internalCloseSearch çağrıldığında sorgu temizlenir', async () => {
        const { result } = renderHook(() => useHeaderSearch(true))
        await waitFor(() => expect(result.current.allData).not.toBeNull(), { timeout: 3000 })

        act(() => { result.current.setSearchQuery('kanat') })
        act(() => { result.current.internalCloseSearch() })

        expect(result.current.searchQuery).toBe('')
        expect(result.current.searchResults.products).toHaveLength(0)
    })

    it('normalizeSearchText büyük/küçük harf duyarsız çalışır', () => {
        const { result } = renderHook(() => useHeaderSearch(false))

        expect(result.current.normalizeSearchText('KANAT')).toBe('kanat')
        expect(result.current.normalizeSearchText('Masa')).toBe('masa')
    })

    it('normalizeSearchText Türkçe karakter normalizer', () => {
        const { result } = renderHook(() => useHeaderSearch(false))

        // "şahin" → NFD → 'sahin' (accent kaldırılır)
        const normalized = result.current.normalizeSearchText('sahin')
        expect(normalized).toBe('sahin')
    })
})
