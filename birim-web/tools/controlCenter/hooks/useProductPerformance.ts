import {useState, useEffect, useCallback} from 'react'
import type {ProductPerformanceResponse, ControlCenterTimeRange} from '../types'

export function useProductPerformance(
  range: ControlCenterTimeRange = '30d',
  currency: string = 'TRY',
) {
  const [data, setData] = useState<ProductPerformanceResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false)

  const fetchPerformance = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsUnauthorized(false)

    try {
      const url = `/api/admin/analytics/products?range=${encodeURIComponent(range)}&currency=${encodeURIComponent(currency)}`
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.status === 401 || res.status === 403) {
        setIsUnauthorized(true)
        setError('Yetkisiz erişim: BİRİM Admin oturumu gereklidir.')
        setData(null)
        return
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const msg = errJson.message || `API Hatası (${res.status})`
        setError(msg)
        setData(null)
        return
      }

      const json: ProductPerformanceResponse = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Ürün performans verileri yüklenemedi.')
        setData(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sunucu bağlantı hatası'
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [range, currency])

  useEffect(() => {
    fetchPerformance()
  }, [fetchPerformance])

  return {
    data,
    loading,
    error,
    isUnauthorized,
    refetch: fetchPerformance,
  }
}
