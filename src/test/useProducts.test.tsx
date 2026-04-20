/**
 * useProducts, useProduct, useProductsByCategory, useProductsByDesigner
 * hook'larını test eder.
 *
 * Sanity client'i mock'lanır — gerçek ağ isteği yapılmaz.
 */
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {renderHook, waitFor} from '@testing-library/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
import {
  useProducts,
  useProduct,
  useProductsByCategory,
  useProductsByDesigner,
} from '../hooks/useProducts'
import { Product } from '../types'

// ----- Service mock'ları -----
vi.mock('@/services/cms', () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
  getProductsByCategoryId: vi.fn(),
  getProductsByDesignerId: vi.fn(),
}))

import {
  getProducts,
  getProductById,
  getProductsByCategoryId,
  getProductsByDesignerId,
} from '@/services/cms'

// Örnek ürün fixture'u
const mockProduct: Product = {
  id: 'chair-1',
  name: {tr: 'Kanatlar', en: 'Wings'},
  description: {tr: 'Açıklama', en: 'Description'},
  designerId: 'designer-1',
  categoryId: 'category-1',
  year: 2023,
  isPublished: true,
  mainImage: {url: '/img/chair.jpg'},
  alternativeMedia: [],
  media: [],
  materials: [],
  groupedMaterials: [],
  dimensionImages: [],
  buyable: false,
  price: 0,
  currency: 'TRY',
  showMediaPanels: false,
  exclusiveContent: {images: [], drawings: [], models3d: []},
}

// React Query wrapper yardımcısı
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
    },
  })
  return ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// ----- TESTLER -----

describe('useProducts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('başarıyla ürün listesi döndürür', async () => {
    vi.mocked(getProducts).mockResolvedValueOnce([mockProduct])

    const {result} = renderHook(() => useProducts(), {wrapper: makeWrapper()})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('chair-1')
  })

  it('servis hata verirse isError=true olur', async () => {
    vi.mocked(getProducts).mockRejectedValueOnce(new Error('Ağ hatası'))

    const {result} = renderHook(() => useProducts(), {wrapper: makeWrapper()})

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('ilk render sırasında isLoading=true olur', () => {
    vi.mocked(getProducts).mockReturnValue(new Promise(() => {})) // Asıl hiç resolve etme

    const {result} = renderHook(() => useProducts(), {wrapper: makeWrapper()})

    expect(result.current.isLoading).toBe(true)
  })
})

describe('useProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ürün ID verildiğinde doğru ürünü getirir', async () => {
    vi.mocked(getProductById).mockResolvedValueOnce(mockProduct)

    const {result} = renderHook(() => useProduct('chair-1'), {wrapper: makeWrapper()})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.id).toBe('chair-1')
    expect(getProductById).toHaveBeenCalledWith('chair-1')
  })

  it('ürün bulunamazsa 404 error fırlatır', async () => {
    vi.mocked(getProductById).mockResolvedValueOnce(undefined)

    const {result} = renderHook(() => useProduct('not-found'), {wrapper: makeWrapper()})

    await waitFor(() => expect(result.current.isError).toBe(true))

    const err = result.current.error as Error & {status?: number}
    expect(err.status).toBe(404)
  })

  it('ID undefined ise query devre dışı (enabled=false)', () => {
    const {result} = renderHook(() => useProduct(undefined), {wrapper: makeWrapper()})

    expect(result.current.fetchStatus).toBe('idle')
    expect(getProductById).not.toHaveBeenCalled()
  })
})

describe('useProductsByCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('categoryId ile filtrelenmiş ürünleri döndürür', async () => {
    vi.mocked(getProductsByCategoryId).mockResolvedValueOnce([mockProduct])

    const {result} = renderHook(() => useProductsByCategory('category-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(getProductsByCategoryId).toHaveBeenCalledWith('category-1')
  })

  it('categoryId undefined ise query çalışmaz', () => {
    const {result} = renderHook(() => useProductsByCategory(undefined), {
      wrapper: makeWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useProductsByDesigner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('designerId ile filtrelenmiş ürünleri döndürür', async () => {
    vi.mocked(getProductsByDesignerId).mockResolvedValueOnce([mockProduct])

    const {result} = renderHook(() => useProductsByDesigner('designer-1'), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].designerId).toBe('designer-1')
    expect(getProductsByDesignerId).toHaveBeenCalledWith('designer-1')
  })

  it('designerId undefined ise query çalışmaz', () => {
    const {result} = renderHook(() => useProductsByDesigner(undefined), {
      wrapper: makeWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
