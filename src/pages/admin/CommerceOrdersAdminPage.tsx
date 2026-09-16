import React, {useEffect, useState, useCallback} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import {useAuth} from '../../context/AuthContext'
import {fetchAdminOrdersClient} from '../../services/commerce/adminOrders'
import type {
  AdminOrderSummary,
  AdminOrderListPagination,
} from '../../../lib/commerce/admin-order-types'
import {useSEO} from '../../hooks/useSEO'
import {formatCurrency} from '../../utils/currency'

export function CommerceOrdersAdminPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [pagination, setPagination] = useState<AdminOrderListPagination>({
    total: 0,
    limit: 20,
    page: 1,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useSEO({
    title: 'BİRİM Admin - Commerce Sipariş Yönetimi',
    description: 'BİRİM Commerce online sipariş yönetimi ve ödeme takibi.',
    siteName: 'BİRİM',
    type: 'profile',
    locale: 'tr_TR',
  })

  const loadOrders = useCallback(
    async (targetPage = page) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetchAdminOrdersClient({
          params: {
            page: targetPage,
            limit: 20,
            q: searchQuery.trim() || undefined,
            status: statusFilter.trim() || undefined,
            paymentStatus: paymentStatusFilter.trim() || undefined,
          },
        })
        setOrders(res.orders)
        setPagination(res.pagination)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Siparişler yüklenirken bir hata oluştu.'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [page, searchQuery, statusFilter, paymentStatusFilter]
  )

  useEffect(() => {
    if (auth.isLoggedIn && auth.user && auth.user.role === 'admin') {
      loadOrders(page)
    } else {
      setIsLoading(false)
    }
  }, [auth.isLoggedIn, auth.user, page, loadOrders])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOrders(1)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setPaymentStatusFilter('')
    setPage(1)
  }

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Ödeme Alındı
        </span>
      )
    }
    if (status === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded-sm">
          <Clock className="w-3 h-3 text-amber-600" />
          Ödeme Bekliyor
        </span>
      )
    }
    if (status === 'CANCELLED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 rounded-sm">
          <XCircle className="w-3 h-3 text-rose-600" />
          İptal / Başarısız
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-sm">
        {status}
      </span>
    )
  }

  // Access Control: Strict Admin Check
  if (!auth.isLoggedIn || !auth.user || auth.user.role !== 'admin') {
    return (
      <div className="bg-[#f5f5f5] min-h-[70vh] flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="text-center p-12 bg-white shadow-sm border border-black/10 max-w-md w-full"
        >
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4 stroke-[1.5]" />
          <h1 className="text-lg font-bold uppercase tracking-[0.25em] mb-2 text-gray-900">
            YETKİSİZ ERİŞİM
          </h1>
          <p className="text-gray-500 mb-8 text-xs font-inter leading-relaxed">
            Bu yönetim paneline yalnızca yetkili BİRİM Admin kullanıcıları erişebilir.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-black text-white font-bold py-3.5 px-6 uppercase tracking-[0.2em] text-[11px] hover:bg-neutral-800 transition-colors"
          >
            Admin Girişi Yap
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-20 md:py-28 font-inter">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-[0.3em] text-gray-900 font-sans">
                COMMERCE SİPARİŞ YÖNETİMİ
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-black text-white uppercase tracking-wider">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1.5">
              Online sipariş kayıtları, ödeme durumları ve müşteri sipariş snapshot detayları.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadOrders(page)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-white border border-black/10 text-gray-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-black/5 shadow-sm p-4 sm:p-6 mb-6">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4"
          >
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Sipariş No, Müşteri Adı veya E-posta ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#fbfbfb] border border-black/10 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-3">
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2.5 bg-[#fbfbfb] border border-black/10 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
              >
                <option value="">Tüm Sipariş Durumları</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT (Ödeme Bekliyor)</option>
                <option value="PAID">PAID (Ödendi)</option>
                <option value="PAYMENT_FAILED">PAYMENT_FAILED (Başarısız)</option>
                <option value="CANCELLED">CANCELLED (İptal Edildi)</option>
                <option value="REFUNDED">REFUNDED (İade)</option>
                <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED (Kısmi İade)</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="lg:col-span-3">
              <select
                value={paymentStatusFilter}
                onChange={e => {
                  setPaymentStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2.5 bg-[#fbfbfb] border border-black/10 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
              >
                <option value="">Tüm Ödeme Durumları</option>
                <option value="PENDING">PENDING (Bekliyor)</option>
                <option value="AUTHORIZED">AUTHORIZED (Onaylandı)</option>
                <option value="PAID">PAID (Ödendi)</option>
                <option value="FAILED">FAILED (Başarısız)</option>
                <option value="CANCELLED">CANCELLED (İptal)</option>
                <option value="REFUNDED">REFUNDED (İade)</option>
              </select>
            </div>

            {/* Search / Filter Buttons */}
            <div className="lg:col-span-1 flex gap-2">
              <button
                type="submit"
                className="w-full bg-black text-white text-xs font-bold uppercase tracking-wider py-2.5 hover:bg-neutral-800 transition-colors"
              >
                Filtrele
              </button>
            </div>
          </form>

          {(searchQuery || statusFilter || paymentStatusFilter) && (
            <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-gray-500">
              <span>Aktif filtreler uygulanıyor</span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-black font-semibold underline hover:text-neutral-600 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-6 mb-6 text-rose-900 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Hata Oluştu</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => loadOrders(page)}
              className="bg-rose-600 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-white border border-black/5 p-6 shadow-sm space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="animate-pulse flex items-center justify-between py-3 border-b border-black/5"
              >
                <div className="space-y-2 w-1/3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-6 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="bg-white border border-black/5 p-12 text-center shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4 stroke-[1]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 mb-2">
              Sipariş Bulunamadı
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              Arama kriterlerinize uygun commerce siparişi bulunamadı. Filtreleri temizleyerek
              tekrar deneyebilirsiniz.
            </p>
            {(searchQuery || statusFilter || paymentStatusFilter) && (
              <button
                onClick={handleResetFilters}
                className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Filtreleri Sıfırla
              </button>
            )}
          </div>
        )}

        {/* Orders Table */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/10 bg-[#fafafa] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4 sm:px-6">Sipariş No</th>
                    <th className="py-3.5 px-4">Müşteri</th>
                    <th className="py-3.5 px-4">Tarih</th>
                    <th className="py-3.5 px-4 text-right">Tutar</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-center">Kalem</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-xs">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors group">
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-mono font-bold text-gray-900 tracking-wide block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-[11px] text-gray-500">{order.customerEmail}</div>
                        {order.customerType === 'CORPORATE' && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            Kurumsal
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(order.grandTotal, order.currency)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 font-mono">
                        {order.itemsCount}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="inline-flex items-center gap-1.5 bg-[#f0f0f0] text-gray-900 border border-black/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-200"
                        >
                          <span>Detay</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#fafafa]">
              <div className="text-xs text-gray-500">
                Toplam <span className="font-bold text-gray-900">{pagination.total}</span> sipariş •
                Sayfa <span className="font-bold text-gray-900">{pagination.page}</span> /{' '}
                <span className="font-bold text-gray-900">{pagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prev = Math.max(1, page - 1)
                    setPage(prev)
                  }}
                  disabled={page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 bg-white border border-black/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Önceki</span>
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(pagination.totalPages, page + 1)
                    setPage(next)
                  }}
                  disabled={page >= pagination.totalPages || isLoading}
                  className="inline-flex items-center gap-1 bg-white border border-black/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
