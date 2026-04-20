import {describe, it, expect, vi, beforeEach} from 'vitest'
import {renderHook, act, waitFor} from '@testing-library/react'
import {useHeaderSearch} from '../hooks/useHeaderSearch'

// Stable mock functions
const mockT = vi.fn((val: unknown) => {
  if (typeof val === 'string') return val
  const v = val as Record<string, string>
  return v?.tr || v?.en || ''
})

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: mockT,
    locale: 'tr',
  }),
}))

const mockProducts = [
  {id: 'p1', name: {tr: 'Masa'}, designerId: 'd1', categoryId: 'c1'},
  {id: 'p2', name: {tr: 'Sandalye'}, designerId: 'd2', categoryId: 'c2'},
]

const mockDesigners = [
  {id: 'd1', name: {tr: 'Ali Veli'}},
  {id: 'd2', name: {tr: 'Mehmet Can'}},
]

const mockCategories = [
  {id: 'c1', name: {tr: 'Ofis'}},
  {id: 'c2', name: {tr: 'Ev'}},
]

vi.mock('../services/cms', () => ({
  getProducts: vi.fn(),
  getDesigners: vi.fn(),
  getCategories: vi.fn(),
}))

import {getProducts, getDesigners, getCategories} from '../services/cms'

describe('useHeaderSearch - veri ile arama', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProducts).mockResolvedValue(mockProducts)
    vi.mocked(getDesigners).mockResolvedValue(mockDesigners)
    vi.mocked(getCategories).mockResolvedValue(mockCategories)
  })

  it('arama modalı açıldığında verileri çeker', async () => {
    const {result} = renderHook(() => useHeaderSearch(true))

    // isSearching true olur
    expect(result.current.isSearching).toBe(true)

    await waitFor(() => {
      expect(result.current.allData).not.toBeNull()
    })

    expect(result.current.isSearching).toBe(false)
    expect(result.current.allData?.products).toHaveLength(2)
  })

  it('sorgu yazıldığında ürünleri filtreler (debounce sonrası)', async () => {
    vi.useFakeTimers()
    const {result} = renderHook(() => useHeaderSearch(true))

    // Verilerin dolmasını bekle
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => {
      result.current.setSearchQuery('masa')
    })

    // Debounce bekle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.searchResults.products).toHaveLength(1)
    expect(result.current.searchResults.products[0].id).toBe('p1')

    vi.useRealTimers()
  })

  it('tasarımcı adına göre arama yapar', async () => {
    vi.useFakeTimers()
    const {result} = renderHook(() => useHeaderSearch(true))

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => {
      result.current.setSearchQuery('ali')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.searchResults.designers).toHaveLength(1)
    expect(result.current.searchResults.products).toHaveLength(1) // Ali'nin ürünü de çıkmalı

    vi.useRealTimers()
  })
})
