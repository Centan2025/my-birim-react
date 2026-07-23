import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useSEO } from '../hooks/useSEO'
import { useTranslation } from '../i18n'
import { AiRoomPlannerModal } from '../components/AiRoomPlannerModal'
import { PageLoading } from '../components/LoadingSpinner'
import type { Product } from '../types'

export function AiRoomPlannerPage() {
  const { settings, isLoading: settingsLoading } = useSiteSettings()
  const { data: products, isLoading: productsLoading } = useProducts()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useSEO({
    title: 'AI Room Planner - Birim Design',
    description:
      'Google Gemini Nano Banana AI altyapısıyla Birim mobilyalarını odanızda canlı olarak deneyimleyin.',
  })

  if (settingsLoading || productsLoading) {
    return <PageLoading />
  }

  // Feature flag check via CMS
  const isEnabled = settings?.enableAiRoomPlanner !== false

  if (!isEnabled) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-black text-white space-y-4">
        <h2 className="text-2xl font-light">AI Room Planner Geçici Olarak Devre Dışı</h2>
        <p className="text-sm text-neutral-400 max-w-md">
          Bu özellik şu anda yönetim paneli üzerinden bakıma alınmıştır. Lütfen daha sonra tekrar deneyin.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2.5 text-xs font-medium uppercase tracking-wider bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    )
  }

  const handleOpenPlanner = (prod: Product) => {
    setSelectedProduct(prod)
    setIsModalOpen(true)
  }

  const getProductImageUrl = (prod: Product): string => {
    if (typeof prod.mainImage === 'string') return prod.mainImage
    if (prod.mainImage && typeof prod.mainImage === 'object' && 'url' in prod.mainImage) {
      return (prod.mainImage as { url: string }).url || ''
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="px-3.5 py-1 text-xs font-sans tracking-widest text-[#c5a059] uppercase bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full inline-block">
            AI 3D Mekan Tasarımı
          </span>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white">
            AI Room Planner
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 font-sans leading-relaxed">
            Kataloğumuzdan dilediğiniz tasarımı seçin, odanızın fotoğrafını yükleyin ve yapay zekanın ışık, gölge ve perspektif analiziyle mobilyayı odanızda anında görüntüleyin.
          </p>
        </div>

        {/* Product Selection Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h2 className="text-xl font-light tracking-wide text-neutral-200">
              Visualizer için Ürün Seçin
            </h2>
            <span className="text-xs text-neutral-500 font-sans">
              {products?.length || 0} Ürün Listeleniyor
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.map((prod) => {
              const imgUrl = getProductImageUrl(prod)
              return (
                <div
                  key={prod.id}
                  className="group relative bg-neutral-900/60 rounded-xl overflow-hidden border border-neutral-800/80 hover:border-[#c5a059]/50 transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden bg-neutral-950">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={t(prod.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700">
                        Görsel Yok
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <button
                        onClick={() => handleOpenPlanner(prod)}
                        className="w-full py-2.5 px-4 text-xs font-semibold tracking-wider uppercase text-black bg-white hover:bg-neutral-100 rounded-none border border-neutral-300 shadow-none transition-colors flex items-center justify-center gap-2 font-sans cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Odamda Gör
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="text-sm font-medium text-white group-hover:text-[#c5a059] transition-colors font-sans">
                        {t(prod.name)}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 font-sans">
                      <Link
                        to={`/product/${prod.id}`}
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        Detayları İncele →
                      </Link>
                      <button
                        onClick={() => handleOpenPlanner(prod)}
                        className="text-xs text-[#c5a059] hover:underline font-medium cursor-pointer"
                      >
                        Visualizer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <AiRoomPlannerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialProduct={{
            id: selectedProduct.id,
            name: t(selectedProduct.name),
            image: getProductImageUrl(selectedProduct),
          }}
        />
      )}
    </div>
  )
}
