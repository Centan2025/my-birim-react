import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {motion} from 'framer-motion'
import {
  Package,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {fetchCustomerOrdersClient} from '../services/commerce/orders'
import type {CustomerOrderSummary} from '../../lib/commerce/order-types'
import {useSEO} from '../hooks/useSEO'
import {formatCurrency} from '../utils/currency'

export function CommerceOrdersPage() {
  const auth = useAuth()
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useSEO({
    title: 'BİRİM - Siparişlerim',
    description: 'BİRİM hesap sipariş geçmişi ve detayları.',
    siteName: 'BİRİM',
    type: 'profile',
    locale: 'tr_TR',
  })

  useEffect(() => {
    let isMounted = true

    if (!auth.isLoggedIn || !auth.user) {
      setIsLoading(false)
      return
    }

    async function loadOrders() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchCustomerOrdersClient()
        if (isMounted) {
          setOrders(data)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Siparişler yüklenirken bir hata oluştu.'
          setError(msg)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [auth.isLoggedIn, auth.user])

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return isoStr
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Ödeme Alındı
        </span>
      )
    }
    if (status === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Ödeme Bekliyor
        </span>
      )
    }
    if (status === 'CANCELLED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          İptal / Başarısız
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/5 text-gray-800 border border-black/10">
        {status}
      </span>
    )
  }

  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="bg-[#f5f5f5] min-h-[70vh] flex items-center justify-center py-20">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="text-center p-12 bg-white shadow-sm border border-black/5 max-w-md w-full"
        >
          <h1 className="text-xl font-bold uppercase tracking-[0.3em] mb-4 text-gray-900">
            GİRİŞ GEREKLİ
          </h1>
          <p className="text-gray-500 mb-10 text-sm font-inter leading-relaxed">
            Sipariş geçmişinizi görüntülemek için lütfen üye girişi yapın.
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-[#e5e5e5] text-black border border-black font-bold py-4 px-8 uppercase tracking-[0.2em] text-[11px] hover:bg-[#d8d8d8] transition-all duration-500 font-inter"
          >
            Giriş Yap / Üye Ol
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-24 md:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header & Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-gray-400 uppercase mb-4">
              <Link to="/profile" className="hover:text-black transition-colors">
                Profil
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900">Siparişlerim</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 pb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-[0.4em]">
                  SİPARİŞLERİM
                </h1>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mt-2">
                  Tüm siparişlerinizi ve güncel durumlarını buradan takip edebilirsiniz.
                </p>
              </div>
              <Link
                to="/profile"
                className="text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
              >
                ← Profil Bilgilerine Dön
              </Link>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="bg-white p-6 border border-black/5 animate-pulse flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 w-48 rounded" />
                    <div className="h-3 bg-gray-100 w-32 rounded" />
                  </div>
                  <div className="h-8 bg-gray-200 w-28 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!isLoading && error && (
            <div className="bg-rose-50 border border-rose-200 p-8 text-center text-rose-800 my-8">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
              <h3 className="font-bold text-sm uppercase tracking-widest mb-1">
                Siparişler Alınamadı
              </h3>
              <p className="text-xs text-rose-700 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && orders.length === 0 && (
            <div className="bg-white border border-black/5 p-12 md:p-16 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4 stroke-[1]" />
              <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-gray-900 mb-2">
                Henüz bir siparişiniz bulunmuyor
              </h3>
              <p className="text-xs text-gray-500 font-inter max-w-md mx-auto mb-8 leading-relaxed">
                BİRİM koleksiyonlarındaki zamansız mobilya ve aydınlatma tasarımlarını inceleyerek
                hemen sipariş oluşturabilirsiniz.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-[#e5e5e5] text-black border border-black font-bold py-3.5 px-8 uppercase tracking-[0.2em] text-[11px] hover:bg-[#d8d8d8] transition-all font-inter"
              >
                <span>Koleksiyonu Keşfet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Orders List */}
          {!isLoading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white border border-black/5 hover:border-black/20 transition-all shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] p-6 md:p-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Order Metadata */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-bold tracking-wider text-gray-900">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-inter">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>{order.itemsCount} Ürün</span>
                      </div>
                    </div>

                    {/* Order Total & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-black/5">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
                          Toplam Tutar
                        </span>
                        <span className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
                          {formatCurrency(order.grandTotal, order.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {order.status === 'PENDING_PAYMENT' && order.paymentStatus !== 'PAID' && (
                          <Link
                            to={`/account/orders/${order.id}`}
                            className="bg-black text-white px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                          >
                            Ödemeyi Tamamla
                          </Link>
                        )}
                        <Link
                          to={`/account/orders/${order.id}`}
                          className="inline-flex items-center gap-2 bg-[#f5f5f5] text-black border border-black/10 px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#e8e8e8] transition-colors"
                        >
                          <span>Detayı Gör</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
