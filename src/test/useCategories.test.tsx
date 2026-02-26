/**
 * useCategories ve useCategory hook'larını test eder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCategories, useCategory } from '../hooks/useCategories'

vi.mock('@/services/cms', () => ({
    getCategories: vi.fn(),
}))

import { getCategories } from '@/services/cms'

const mockCategories = [
    { id: 'koltuk', name: { tr: 'Koltuklar', en: 'Armchairs' } },
    { id: 'masa', name: { tr: 'Masalar', en: 'Tables' } },
]

function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

describe('useCategories', () => {
    beforeEach(() => vi.clearAllMocks())

    it('tüm kategorileri başarıyla döndürür', async () => {
        vi.mocked(getCategories).mockResolvedValueOnce(mockCategories as any)

        const { result } = renderHook(() => useCategories(), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(2)
        expect(result.current.data![0].id).toBe('koltuk')
    })

    it('ağ hatasında isError=true olur', async () => {
        vi.mocked(getCategories).mockRejectedValueOnce(new Error('Bağlantı hatası'))

        const { result } = renderHook(() => useCategories(), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isError).toBe(true))
    })

    it('boş liste döndüğünde data boş array olur', async () => {
        vi.mocked(getCategories).mockResolvedValueOnce([])

        const { result } = renderHook(() => useCategories(), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual([])
    })
})

describe('useCategory', () => {
    beforeEach(() => vi.clearAllMocks())

    it('ID ile doğru kategoriyi bulur', async () => {
        vi.mocked(getCategories).mockResolvedValueOnce(mockCategories as any)

        const { result } = renderHook(() => useCategory('masa'), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.id).toBe('masa')
        expect(result.current.data?.name).toEqual({ tr: 'Masalar', en: 'Tables' })
    })

    it('olmayan ID için data=undefined döner', async () => {
        vi.mocked(getCategories).mockResolvedValueOnce(mockCategories as any)

        const { result } = renderHook(() => useCategory('olmayan'), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeUndefined()
    })

    it('ID undefined verildiğinde data=undefined kalır', async () => {
        vi.mocked(getCategories).mockResolvedValueOnce(mockCategories as any)

        const { result } = renderHook(() => useCategory(undefined), { wrapper: makeWrapper() })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toBeUndefined()
    })
})
