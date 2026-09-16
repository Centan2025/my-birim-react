import {useEffect, useState, useCallback} from 'react'
import {useParams, Link} from 'react-router-dom'
import {motion} from 'framer-motion'
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Package,
} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {fetchCommerceOrderClient} from '../services/commerce/orders'
import {initiateCommercePayment, completeMockPaymentClient} from '../services/commerce/payments'
import type {OrderDetailResult} from '../../lib/commerce/order-types'
import {useSEO} from '../hooks/useSEO'
import {formatCurrency} from '../utils/currency'

export function CommerceOrderDetailPage() {
  const {orderId} = useParams<{orderId: string}>()
  const auth = useAuth()

  const [order, setOrder] = useState<OrderDetailResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment retry modal / inline state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null)
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null)

  useSEO({
    title: order ? `BİRİM - Sipariş ${order.orderNumber}` : 'BİRİM - Sipariş Detayı',
    description: 'BİRİM sipariş detayı ve ödeme durumu.',
    siteName: 'BİRİM',
    type: 'profile',
    locale: 'tr_TR',
  })

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) {
      setError('Geçersiz sipariş ID.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchCommerceOrderClient(orderId)
      setOrder(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sipariş detayları alınamadı.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (auth.isLoggedIn && auth.user) {
      loadOrderDetail()
    } else {
      setIsLoading(false)
    }
  }, [auth.isLoggedIn, auth.user, loadOrderDetail])

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  const handleStartPayment = async () => {
    if (!order) return
    setIsProcessingPayment(true)
    setPaymentActionError(null)
    try {
      const result = await initiateCommercePayment(order.id)
      if (result.id) {
        setPaymentTransactionId(result.id)
        setIsPayModalOpen(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ödeme başlatılamadı.'
      setPaymentActionError(msg)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCompleteMockPayment = async (outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED') => {
    if (!paymentTransactionId) return
    setIsProcessingPayment(true)
    setPaymentActionError(null)
    try {
      await completeMockPaymentClient(paymentTransactionId, {
        status: outcome,
        orderId: order?.id,
      })
      setIsPayModalOpen(false)
      // Reload fresh authoritative order details from DB
      await loadOrderDetail()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ödeme simülasyonu başarısız.'
      setPaymentActionError(msg)
    } finally {
      setIsProcessingPayment(false)
    }
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
            Sipariş detayını görüntülemek için lütfen üye girişi yapın.
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
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb & Navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-gray-400 uppercase mb-4">
              <Link to="/profile" className="hover:text-black transition-colors">
                Profil
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/account/orders" className="hover:text-black transition-colors">
                Siparişlerim
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900 font-mono">
                {order ? order.orderNumber : 'Sipariş Detayı'}
              </span>
            </div>

            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Siparişlerime Dön</span>
            </Link>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="bg-white p-8 border border-black/5 animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 w-1/3 rounded" />
              <div className="h-4 bg-gray-100 w-1/4 rounded" />
              <div className="space-y-4 pt-6">
                <div className="h-16 bg-gray-50 border border-gray-100 rounded" />
                <div className="h-16 bg-gray-50 border border-gray-100 rounded" />
              </div>
            </div>
          )}

          {/* Error / Unauthorized State */}
          {!isLoading && error && (
            <div className="bg-white border border-black/5 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 stroke-[1.5]" />
              <h2 className="text-lg font-bold uppercase tracking-[0.25em] text-gray-900 mb-2">
                Sipariş Görüntülenemedi
              </h2>
              <p className="text-xs text-gray-500 font-inter max-w-md mx-auto mb-8 leading-relaxed">
                {error}
              </p>
              <Link
                to="/account/orders"
                className="inline-flex items-center gap-2 bg-[#e5e5e5] text-black border border-black font-bold py-3.5 px-8 uppercase tracking-[0.2em] text-[11px] hover:bg-[#d8d8d8] transition-all font-inter"
              >
                <span>Sipariş Listesine Dön</span>
              </Link>
            </div>
          )}

          {/* Order Detail View */}
          {!isLoading && !error && order && (
            <div className="space-y-8">
              {/* Header Box */}
              <div className="bg-white border border-black/5 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/10 pb-6">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                      Sipariş Numarası
                    </span>
                    <h1 className="font-mono text-xl md:text-2xl font-bold tracking-wider text-gray-900">
                      {order.orderNumber}
                    </h1>
                    <p className="text-xs text-gray-500 font-inter mt-1">
                      Kayıt Tarihi: {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                      Ödeme Durumu
                    </span>
                    {order.paymentStatus === 'PAID' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Ödeme Alındı
                      </span>
                    ) : order.paymentStatus === 'FAILED' || order.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Ödeme Başarısız / İptal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Ödeme Bekliyor
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Action Bar if Pending */}
                {order.paymentStatus !== 'PAID' && (
                  <div className="mt-6 bg-amber-50/70 border border-amber-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        Ödemesi Tamamlanmamış Sipariş
                      </h3>
                      <p className="text-xs text-amber-800 font-inter">
                        Siparişinizin üretime/hazırlığa alınabilmesi için ödemenin tamamlanması
                        gerekmektedir.
                      </p>
                      {paymentActionError && (
                        <p className="text-xs text-rose-700 font-medium">{paymentActionError}</p>
                      )}
                    </div>
                    <button
                      onClick={handleStartPayment}
                      disabled={isProcessingPayment}
                      className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isProcessingPayment ? 'Hazırlanıyor...' : 'Şimdi Öde'}
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items (Server Snapshots) */}
              <div className="bg-white border border-black/5 p-8 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Sipariş Edilen Ürünler ({order.items.length})
                </h2>

                <div className="divide-y divide-black/5">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-md">
                        <h3 className="font-bold text-sm text-gray-900 tracking-wide">
                          {item.productName}
                        </h3>
                        {item.sku && (
                          <p className="text-xs font-mono text-gray-400">SKU: {item.sku}</p>
                        )}
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {Object.entries(item.selectedOptions).map(([key, val]) => (
                              <span
                                key={key}
                                className="inline-block text-[11px] font-inter bg-gray-100 text-gray-700 px-2 py-0.5 rounded-sm"
                              >
                                {key}: {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-end md:items-center justify-between md:justify-end gap-8 text-right font-inter">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            Birim Fiyat
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatCurrency(item.unitPrice, order.currency)} × {item.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                            Toplam
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(item.totalPrice, order.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-white border border-black/5 p-8 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-6">
                  Özet ve Tutar Dökümü
                </h2>

                <div className="space-y-3 font-inter text-xs max-w-sm ml-auto">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>

                  {order.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>İndirim</span>
                      <span>-{formatCurrency(order.discountTotal, order.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Kargo / Lojistik</span>
                    <span>
                      {order.shippingTotal === 0
                        ? 'Ücretsiz'
                        : formatCurrency(order.shippingTotal, order.currency)}
                    </span>
                  </div>

                  {order.taxTotal > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>KDV</span>
                      <span>{formatCurrency(order.taxTotal, order.currency)}</span>
                    </div>
                  )}

                  <div className="border-t border-black/10 pt-3 flex justify-between text-sm font-bold text-gray-900">
                    <span className="uppercase tracking-widest text-xs">Genel Toplam</span>
                    <span>{formatCurrency(order.grandTotal, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mock Payment Simulation Modal (DEV only, strictly omitted in production) */}
          {import.meta.env.DEV && isPayModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                className="bg-white max-w-md w-full p-8 shadow-2xl border border-black/10"
              >
                <div className="flex items-center gap-3 border-b border-black/10 pb-4 mb-6">
                  <ShieldCheck className="w-6 h-6 text-black" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                      Ödeme Sağlayıcı Simülasyonu
                    </h3>
                    <p className="text-[11px] text-gray-500 font-inter">
                      Provider-Neutral Gateway Testi
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-inter mb-6 leading-relaxed">
                  Gerçek ödeme sağlayıcısı seçilene kadar MockPaymentProvider devrededir. Simüle
                  etmek istediğiniz sonucu seçin:
                </p>

                {paymentActionError && (
                  <div
                    aria-live="polite"
                    className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 mb-4 rounded-sm font-inter"
                  >
                    {paymentActionError}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleCompleteMockPayment('SUCCESS')}
                    disabled={isProcessingPayment}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isProcessingPayment ? 'İşleniyor...' : '✓ Başarılı Ödeme Simüle Et (SUCCESS)'}
                  </button>

                  <button
                    onClick={() => handleCompleteMockPayment('FAILED')}
                    disabled={isProcessingPayment}
                    className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 px-4 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    ✕ Başarısız Ödeme Simüle Et (FAILED)
                  </button>

                  <button
                    onClick={() => handleCompleteMockPayment('CANCELLED')}
                    disabled={isProcessingPayment}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-4 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    İptal Et (CANCELLED)
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-black/10 text-center">
                  <button
                    onClick={() => setIsPayModalOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
