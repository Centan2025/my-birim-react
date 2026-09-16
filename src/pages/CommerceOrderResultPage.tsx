import React, {useEffect, useState} from 'react'
import {useParams, useLocation, Link} from 'react-router-dom'
import {Helmet} from 'react-helmet-async'
import {useSEO} from '../hooks/useSEO'
import {useTranslation} from '../i18n'
import {fetchCommerceOrderClient} from '../services/commerce/orders'
import {formatCurrency} from '../utils/currency'
import type {OrderDetailResult} from '../../lib/commerce/order-types'

function formatPrice(amount: number, currency: string = 'TRY'): string {
  return formatCurrency(amount, currency, 'tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export const CommerceOrderResultPage: React.FC = () => {
  const {orderId} = useParams<{orderId: string}>()
  const location = useLocation()
  const {t} = useTranslation()

  useSEO({
    title: 'Sipariş Detayı | BİRİM',
  })

  // Read guestToken purely from React memory navigation state (Zero token in URL!)
  const stateGuestToken = (location.state as {guestToken?: string} | undefined)?.guestToken

  const [order, setOrder] = useState<OrderDetailResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!orderId) {
      setIsLoading(false)
      setErrorMsg('Geçersiz sipariş numarası.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    fetchCommerceOrderClient(orderId, {guestToken: stateGuestToken})
      .then(res => {
        if (isMounted) {
          setOrder(res)
          setIsLoading(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setIsLoading(false)
          if (err?.statusCode === 403) {
            setErrorMsg('Bu siparişe erişim yetkiniz bulunmamaktadır.')
          } else if (err?.statusCode === 404) {
            setErrorMsg('Belirtilen sipariş kaydı bulunamadı.')
          } else {
            setErrorMsg('Sipariş detayları alınırken bir hata oluştu.')
          }
        }
      })

    return () => {
      isMounted = false
    }
  }, [orderId, stateGuestToken])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {isLoading && (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-500">Sipariş bilgileri yükleniyor...</p>
        </div>
      )}

      {errorMsg && !isLoading && (
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h1 className="font-serif text-2xl text-neutral-900 mb-2">Erişim Hatası</h1>
          <p className="text-sm text-neutral-600 mb-6">{errorMsg}</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            {t('common.viewProducts') || 'Ürünleri İncele'}
          </Link>
        </div>
      )}

      {order && !isLoading && (
        <div className="space-y-10">
          <div className="border-b border-neutral-200 pb-8">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Sipariş Kaydı</p>
            <h1 className="font-serif text-3xl md:text-4xl text-neutral-900 tracking-tight">
              {order.orderNumber}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 border border-neutral-200 p-6 md:p-8">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Sipariş Durumu</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    order.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Ödeme Durumu</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Ara Toplam</span>
                <span>{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200">
                <span className="text-neutral-500">Kargo</span>
                <span className="text-emerald-700 font-medium">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-base font-semibold py-1">
                <span className="text-neutral-900">Genel Toplam</span>
                <span className="text-neutral-900">
                  {formatPrice(order.grandTotal, order.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 mb-4">
              Sipariş Edilen Ürünler
            </h2>
            <div className="divide-y divide-neutral-200 border border-neutral-200 bg-white">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="p-4 sm:p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{item.productName}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {Object.entries(item.selectedOptions)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">
                      Adet: {item.quantity} × {formatPrice(item.unitPrice, order.currency)}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-900 text-sm">
                    {formatPrice(item.totalPrice, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              {t('common.viewProducts') || 'Ürünleri İncele'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommerceOrderResultPage
