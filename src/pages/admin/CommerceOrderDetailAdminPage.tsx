import React, {useEffect, useState, useCallback} from 'react'
import {useParams, Link, useNavigate} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building,
  User as UserIcon,
  MapPin,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Info,
  RotateCcw,
  Ban,
  Activity,
  Check,
} from 'lucide-react'
import {useAuth} from '../../context/AuthContext'
import {fetchAdminOrderDetailClient} from '../../services/commerce/adminOrders'
import {cancelAdminOrderClient, createAdminRefundClient} from '../../services/commerce/adminRefunds'
import type {AdminOrderDetailResult} from '../../../lib/commerce/admin-order-types'
import {canCancelOrderStatus, canRefundOrderStatus} from '../../../lib/commerce/order-lifecycle'
import {useSEO} from '../../hooks/useSEO'
import {formatCurrency} from '../../utils/currency'

export function CommerceOrderDetailAdminPage() {
  const {orderId} = useParams<{orderId: string}>()
  const auth = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<AdminOrderDetailResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action Modals State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [refundReason, setRefundReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  useSEO({
    title: order ? `BİRİM Admin - ${order.orderNumber}` : 'BİRİM Admin - Sipariş Detayı',
    description: 'BİRİM Commerce sipariş ve ödeme detayları snapshot incelemesi.',
    siteName: 'BİRİM',
    type: 'profile',
    locale: 'tr_TR',
  })

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setError('Geçersiz sipariş parametresi.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrderDetailClient(orderId)
      setOrder(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sipariş detayları yüklenemedi.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (auth.isLoggedIn && auth.user && auth.user.role === 'admin') {
      loadDetail()
    } else {
      setIsLoading(false)
    }
  }, [auth.isLoggedIn, auth.user, loadDetail])

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
    if (status === 'REFUNDED' || paymentStatus === 'REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 rounded">
          <RotateCcw className="w-4 h-4 text-purple-600" />
          İade Edildi (REFUNDED)
        </span>
      )
    }
    if (status === 'PARTIALLY_REFUNDED' || paymentStatus === 'PARTIALLY_REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 rounded">
          <RotateCcw className="w-4 h-4 text-indigo-600" />
          Kısmi İade (PARTIALLY_REFUNDED)
        </span>
      )
    }
    if (paymentStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Ödeme Alındı (PAID)
        </span>
      )
    }
    if (status === 'PENDING_PAYMENT' || paymentStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded">
          <Clock className="w-4 h-4 text-amber-600" />
          Ödeme Bekliyor (PENDING)
        </span>
      )
    }
    if (status === 'CANCELLED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 rounded">
          <XCircle className="w-4 h-4 text-rose-600" />
          İptal / Başarısız ({status})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200 rounded">
        {status}
      </span>
    )
  }

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    setActionLoading(true)
    setActionError(null)
    setActionSuccessMessage(null)

    try {
      await cancelAdminOrderClient(order.id, {reason: cancelReason.trim()})
      setActionSuccessMessage('Sipariş başarıyla iptal edildi.')
      setIsCancelModalOpen(false)
      setCancelReason('')
      await loadDetail()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sipariş iptal edilirken bir hata oluştu.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    const numAmount = parseFloat(refundAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setActionError('Lütfen geçerli bir iade tutarı girin.')
      return
    }
    if (!refundReason.trim()) {
      setActionError('İade gerekçesi zorunludur.')
      return
    }

    setActionLoading(true)
    setActionError(null)
    setActionSuccessMessage(null)

    try {
      await createAdminRefundClient({
        orderId: order.id,
        amount: numAmount,
        reason: refundReason.trim(),
      })
      setActionSuccessMessage('İade işlemi başarıyla gerçekleştirildi.')
      setIsRefundModalOpen(false)
      setRefundAmount('')
      setRefundReason('')
      await loadDetail()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'İade işlemi gerçekleştirilirken bir hata oluştu.'
      setActionError(msg)
    } finally {
      setActionLoading(false)
    }
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-gray-400 uppercase">
            <Link to="/admin/orders" className="hover:text-black transition-colors">
              Admin Siparişler
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-bold">
              {order ? order.orderNumber : 'Sipariş Detayı'}
            </span>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sipariş Listesine Dön</span>
          </button>
        </div>

        {/* Global Action Notifications */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-50 border border-rose-200 p-4 mb-6 text-rose-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border border-black/5 p-12 shadow-sm animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 w-1/3 rounded" />
            <div className="h-4 bg-gray-100 w-1/2 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="h-32 bg-gray-100 rounded" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 p-8 text-center text-rose-900 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h3 className="font-bold text-sm uppercase tracking-widest mb-2">
              Sipariş Yüklenemedi
            </h3>
            <p className="text-xs text-rose-700 mb-6">{error}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Listeye Dön
            </button>
          </div>
        )}

        {/* Order Detail Content */}
        {!isLoading && !error && order && (
          <div className="space-y-6">
            {/* Top Overview Card */}
            <div className="bg-white border border-black/5 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold font-mono text-gray-900 tracking-wide">
                      {order.orderNumber}
                    </h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                      ID: {order.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sipariş Tarihi:{' '}
                    <span className="font-semibold text-gray-800">
                      {formatDate(order.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(order.status, order.paymentStatus)}

                  {/* Action Buttons */}
                  {canCancelOrderStatus(order.status) && (
                    <button
                      onClick={() => {
                        setActionError(null)
                        setIsCancelModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 transition-colors rounded shadow-sm"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Siparişi İptal Et
                    </button>
                  )}

                  {canRefundOrderStatus(order.status) &&
                    (order.remainingRefundable ?? order.grandTotal) > 0 && (
                      <button
                        onClick={() => {
                          setActionError(null)
                          setRefundAmount(String(order.remainingRefundable ?? order.grandTotal))
                          setIsRefundModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors rounded shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        İade Başlat
                      </button>
                    )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                    Authoritative
                  </span>
                </div>
              </div>

              {/* Status Notice */}
              <div className="mt-4 p-3 bg-[#fbfbfb] border border-black/5 flex items-start gap-3 text-xs text-gray-600">
                <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <p>
                  Sipariş ve ödeme durumları doğrudan server-authoritative ödeme sağlayıcısı ve
                  veritabanı snapshotları üzerinden okunur. İptal ve iade işlemleri geri alınamaz
                  finansal operasyonlardır ve audit trail kaydı tutulur.
                </p>
              </div>
            </div>

            {/* Customer & Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Customer Info */}
              <div className="bg-white border border-black/5 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Müşteri Bilgileri
                  </h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Ad Soyad
                    </span>
                    <span className="font-semibold text-gray-900">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      E-posta
                    </span>
                    <span className="text-gray-900">{order.customerEmail}</span>
                  </div>
                  {order.customerPhone && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Telefon
                      </span>
                      <span className="text-gray-900">{order.customerPhone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      Müşteri Tipi
                    </span>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 rounded">
                      {order.customerType === 'CORPORATE' ? 'Kurumsal' : 'Bireysel'}
                    </span>
                  </div>
                  {order.userId && (
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">
                        Kullanıcı ID
                      </span>
                      <span className="font-mono text-[11px] text-gray-600">{order.userId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-black/5 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Teslimat Adresi
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  {order.shippingAddress && typeof order.shippingAddress === 'object' ? (
                    <>
                      <div className="font-semibold text-gray-900">
                        {String(order.shippingAddress['firstName'] || '')}{' '}
                        {String(order.shippingAddress['lastName'] || '')}
                      </div>
                      <div>{String(order.shippingAddress['addressLine1'] || '')}</div>
                      {order.shippingAddress['addressLine2'] ? (
                        <div>{String(order.shippingAddress['addressLine2'])}</div>
                      ) : null}
                      <div>
                        {String(order.shippingAddress['district'] || '')} /{' '}
                        {String(order.shippingAddress['city'] || '')}
                      </div>
                      <div>
                        {String(order.shippingAddress['postalCode'] || '')}{' '}
                        {String(order.shippingAddress['country'] || 'TR')}
                      </div>
                      {order.shippingAddress['phone'] ? (
                        <div className="text-gray-500 pt-1">
                          Tel: {String(order.shippingAddress['phone'])}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Teslimat adresi bulunamadı</span>
                  )}
                </div>
              </div>

              {/* Billing Address / Corporate */}
              <div className="bg-white border border-black/5 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Fatura Bilgileri
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  {order.billingAddress && typeof order.billingAddress === 'object' ? (
                    <>
                      <div className="font-semibold text-gray-900">
                        {String(order.billingAddress['firstName'] || '')}{' '}
                        {String(order.billingAddress['lastName'] || '')}
                      </div>
                      <div>{String(order.billingAddress['addressLine1'] || '')}</div>
                      {order.billingAddress['addressLine2'] ? (
                        <div>{String(order.billingAddress['addressLine2'])}</div>
                      ) : null}
                      <div>
                        {String(order.billingAddress['district'] || '')} /{' '}
                        {String(order.billingAddress['city'] || '')}
                      </div>
                      <div>
                        {String(order.billingAddress['postalCode'] || '')}{' '}
                        {String(order.billingAddress['country'] || 'TR')}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Fatura adresi bulunamadı</span>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Sipariş Kalemleri Snapshot ({order.items.length} Ürün)
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#fafafa] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-6">Ürün</th>
                      <th className="py-3 px-4">SKU / Kod</th>
                      <th className="py-3 px-4">Varyant / Seçenekler</th>
                      <th className="py-3 px-4 text-center">Adet</th>
                      <th className="py-3 px-4 text-right">Birim Fiyat</th>
                      <th className="py-3 px-6 text-right">Toplam Fiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {item.productName}
                          <span className="block font-mono text-[10px] font-normal text-gray-400">
                            ID: {item.productId}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-600">{item.sku || '—'}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? (
                            <div className="space-y-0.5">
                              {Object.entries(item.selectedOptions).map(([k, v]) => (
                                <div key={k} className="text-[11px]">
                                  <span className="font-medium text-gray-500">{k}:</span> {v}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-gray-700">
                          {formatCurrency(item.unitPrice, order.currency)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900 font-mono">
                          {formatCurrency(item.totalPrice, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Summary */}
              <div className="p-6 bg-[#fafafa] border-t border-black/10 flex flex-col sm:flex-row justify-end">
                <div className="w-full sm:w-80 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span className="font-mono">
                      {formatCurrency(order.subtotal, order.currency)}
                    </span>
                  </div>
                  {order.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>İndirim:</span>
                      <span className="font-mono">
                        -{formatCurrency(order.discountTotal, order.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Kargo Ücreti:</span>
                    <span className="font-mono">
                      {formatCurrency(order.shippingTotal, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>KDV / Vergi Dahil:</span>
                    <span className="font-mono">
                      {formatCurrency(order.taxTotal, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-black/10">
                    <span>Genel Toplam:</span>
                    <span className="font-mono text-base">
                      {formatCurrency(order.grandTotal, order.currency)}
                    </span>
                  </div>
                  {order.alreadyRefunded > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-rose-700 pt-2 border-t border-black/5">
                      <span>Toplam İade Edilen:</span>
                      <span className="font-mono">
                        -{formatCurrency(order.alreadyRefunded, order.currency)}
                      </span>
                    </div>
                  )}
                  {order.alreadyRefunded > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-gray-900">
                      <span>Kalan İade Edilebilir:</span>
                      <span className="font-mono">
                        {formatCurrency(order.remainingRefundable, order.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Refunds Section (If any exist) */}
            {order.refunds && order.refunds.length > 0 && (
              <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                      İade İşlem Kayıtları ({order.refunds.length} İade)
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 bg-[#fafafa] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-3 px-6">İade ID</th>
                        <th className="py-3 px-4">Tutar</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4">Sağlayıcı</th>
                        <th className="py-3 px-4">Gerekçe</th>
                        <th className="py-3 px-6">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {order.refunds.map(refund => (
                        <tr key={refund.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3.5 px-6 font-mono text-[11px] text-gray-700">
                            {refund.id.slice(0, 8)}...
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                            -{formatCurrency(refund.amount, refund.currency)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200 rounded">
                              <CheckCircle2 className="w-3 h-3 text-purple-600" />
                              {refund.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 uppercase text-gray-700 font-semibold text-[11px]">
                            {refund.provider}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">{refund.reason}</td>
                          <td className="py-3.5 px-6 text-gray-500 whitespace-nowrap">
                            {formatDate(refund.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Transactions Section */}
            <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                    Ödeme İşlem Kayıtları ({order.paymentTransactions.length} İşlem)
                  </h3>
                </div>
              </div>

              {order.paymentTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">
                  Bu siparişe ait henüz bir ödeme denemesi veya işlem kaydı bulunmamaktadır.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 bg-[#fafafa] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-3 px-6">İşlem ID</th>
                        <th className="py-3 px-4">Sağlayıcı</th>
                        <th className="py-3 px-4">Tutar</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4">Taksit</th>
                        <th className="py-3 px-4">Tarih</th>
                        <th className="py-3 px-6">Not / Hata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {order.paymentTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3.5 px-6 font-mono text-[11px] text-gray-700">
                            {tx.id.slice(0, 8)}...
                            {tx.providerTransactionId && (
                              <span className="block text-[10px] text-gray-400">
                                Ref: {tx.providerTransactionId}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold uppercase text-gray-900">
                            {tx.provider}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                            {formatCurrency(tx.amount, tx.currency)}
                          </td>
                          <td className="py-3.5 px-4">
                            {tx.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                BAŞARILI
                              </span>
                            ) : tx.status === 'FAILED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200 rounded">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                BAŞARISIZ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 rounded">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {tx.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {tx.installment > 1 ? `${tx.installment} Taksit` : 'Tek Çekim'}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="py-3.5 px-6 text-gray-600">
                            {tx.errorMessage ? (
                              <span className="text-rose-700 font-medium">{tx.errorMessage}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Audit Trail / Order Events */}
            {order.orderEvents && order.orderEvents.length > 0 && (
              <div className="bg-white border border-black/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                      Sipariş Olay Günlüğü / Audit Trail ({order.orderEvents.length} Olay)
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 bg-[#fafafa] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-3 px-6">Olay Türü</th>
                        <th className="py-3 px-4">Aktör</th>
                        <th className="py-3 px-4">Detay / Metadata</th>
                        <th className="py-3 px-6">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {order.orderEvents.map(event => (
                        <tr key={event.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-6 font-mono font-bold text-[11px] text-gray-900">
                            {event.eventType}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 text-neutral-700 rounded">
                              {event.actorType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                            {event.metadata && Object.keys(event.metadata).length > 0
                              ? JSON.stringify(event.metadata)
                              : '—'}
                          </td>
                          <td className="py-3 px-6 text-gray-500 whitespace-nowrap">
                            {formatDate(event.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes Section if any */}
            {order.notes && (
              <div className="bg-white border border-black/5 shadow-sm p-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
                  Müşteri Sipariş Notu
                </h4>
                <p className="text-xs text-gray-700 font-mono bg-[#fbfbfb] p-3 border border-black/5">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Modal */}
        <AnimatePresence>
          {isCancelModalOpen && order && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                className="bg-white border border-black/10 shadow-xl max-w-md w-full p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 text-rose-600 mb-4">
                  <Ban className="w-6 h-6" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                    Siparişi İptal Et
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  <span className="font-bold text-gray-900 font-mono">{order.orderNumber}</span>{' '}
                  numaralı siparişi iptal etmek üzeresiniz. Bu işlem sipariş durumunu kalıcı olarak{' '}
                  <span className="font-bold text-rose-700">CANCELLED</span> yapacaktır.
                </p>

                <form onSubmit={handleCancelOrder} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      İptal Gerekçesi (İsteğe Bağlı)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="Müşteri talebi, stok yetersizliği vb..."
                      rows={3}
                      className="w-full p-2.5 bg-[#fbfbfb] border border-black/10 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {actionError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'İptal Ediliyor...' : 'İptali Onayla'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Refund Modal */}
        <AnimatePresence>
          {isRefundModalOpen && order && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                className="bg-white border border-black/10 shadow-xl max-w-md w-full p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 text-purple-600 mb-4">
                  <RotateCcw className="w-6 h-6" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                    İade Başlat
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  <span className="font-bold text-gray-900 font-mono">{order.orderNumber}</span>{' '}
                  numaralı sipariş için iade oluşturuyorsunuz.
                </p>

                <div className="bg-[#fbfbfb] p-3 border border-black/5 mb-4 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500">
                    <span>Sipariş Toplamı:</span>
                    <span className="font-mono font-bold text-gray-800">
                      {formatCurrency(order.grandTotal, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Daha Önce İade Edilen:</span>
                    <span className="font-mono font-bold text-rose-700">
                      -{formatCurrency(order.alreadyRefunded, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold pt-1 border-t border-black/5">
                    <span>Kalan İade Edilebilir:</span>
                    <span className="font-mono text-purple-700">
                      {formatCurrency(order.remainingRefundable, order.currency)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCreateRefund} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600">
                        İade Tutarı ({order.currency}) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setRefundAmount(String(order.remainingRefundable))}
                        className="text-[10px] text-purple-700 font-bold underline hover:text-purple-900"
                      >
                        Kalanın Tamamı ({formatCurrency(order.remainingRefundable, order.currency)})
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={order.remainingRefundable}
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full p-2.5 bg-[#fbfbfb] border border-black/10 text-xs font-mono focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      İade Gerekçesi *
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={e => setRefundReason(e.target.value)}
                      placeholder="Müşteri iade talebi, kusurlu ürün, karşılıklı mutabakat vb..."
                      rows={3}
                      required
                      className="w-full p-2.5 bg-[#fbfbfb] border border-black/10 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {actionError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRefundModalOpen(false)}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'İşleniyor...' : 'İadeyi Onayla'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
