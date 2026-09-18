import {useState, useEffect, useCallback} from 'react'
import type {CommerceMetricsResponse, ControlCenterTimeRange} from '../types'
import {getAdminApiUrl} from '../../../utils/apiConfig'

export function useCommerceMetrics(range: ControlCenterTimeRange = '30d') {
  const [data, setData] = useState<CommerceMetricsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsUnauthorized(false)

    try {
      const res = await fetch(
        getAdminApiUrl(`/api/admin/commerce/metrics?range=${encodeURIComponent(range)}`),
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

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

      const json: CommerceMetricsResponse = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Metrikler yüklenemedi.')
        setData(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sunucu bağlantı hatası'
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    data,
    loading,
    error,
    isUnauthorized,
    refetch: fetchMetrics,
  }
}
