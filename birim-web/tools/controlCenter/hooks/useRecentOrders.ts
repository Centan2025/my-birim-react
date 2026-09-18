import {useState, useEffect, useCallback} from 'react'
import type {OrderSummaryItem, RecentOrdersResponse} from '../types'
import {getAdminApiUrl} from '../../../utils/apiConfig'

export function useRecentOrders(limit: number = 6) {
  const [orders, setOrders] = useState<OrderSummaryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(getAdminApiUrl(`/api/admin/commerce/orders?limit=${limit}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (res.status === 401 || res.status === 403) {
        setError('Yetkisiz erişim: BİRİM Admin oturumu gereklidir.')
        setOrders([])
        return
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const msg = errJson.message || `API Hatası (${res.status})`
        setError(msg)
        setOrders([])
        return
      }

      const json: RecentOrdersResponse = await res.json()
      if (json.success && Array.isArray(json.orders)) {
        setOrders(json.orders)
      } else {
        setError('Sipariş listesi alınamadı.')
        setOrders([])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sunucu bağlantı hatası'
      setError(msg)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  }
}
