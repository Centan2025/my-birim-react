import React from 'react'
import { Link } from 'react-router-dom'

interface PageErrorFallbackProps {
    pageName?: string
}

/**
 * Sayfa bazlı hata fallback bileşeni.
 * Her route'u saran ErrorBoundary'de kullanılır.
 * Uygulama çökmeden sadece ilgili sayfa hata mesajı gösterir.
 */
export const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ pageName }) => (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
            <div className="mb-6 text-6xl select-none">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                {pageName ? `${pageName} yüklenemedi` : 'Sayfa yüklenemedi'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                Beklenmeyen bir hata oluştu. Diğer sayfalar çalışmaya devam etmektedir.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
                <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                    Yenile
                </button>
                <Link
                    to="/"
                    className="px-5 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    Ana Sayfa
                </Link>
            </div>
        </div>
    </div>
)

export default PageErrorFallback
