import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n'
import { analytics } from '../lib/analytics'

export const ScrollToTop = () => {
    const location = useLocation()
    const { pathname } = location
    const { t } = useTranslation()

    // Sadece rota değişiminde en üste kaydır; dil değişiminde mevcut pozisyonu koru
    useEffect(() => {
        // slideOver geçişinde scroll pozisyonunu koru
        if (location.state?.slideOver) return

        // Route değişiminde yukarıya yumuşak kaydır
        if (typeof window !== 'undefined' && 'scrollBehavior' in document.documentElement.style) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            window.scrollTo(0, 0)
        }

        // Dinamik detay sayfaları (ürün, proje, haber, tasarımcı) için
        // başlık ve pageview takibini ilgili sayfa bileşenleri yapıyor.
        const isDynamicDetail =
            pathname.startsWith('/product/') ||
            pathname.startsWith('/projects/') ||
            pathname.startsWith('/news/') ||
            pathname.startsWith('/designer/')
        if (isDynamicDetail) {
            return
        }

        // Sayfa başlığı - rota bazlı dinamik title
        const baseTitle = 'BIRIM'
        let suffix = ''

        if (pathname === '/' || pathname === '') {
            suffix = t('homepage') || 'Ana Sayfa'
        } else if (pathname === '/about') {
            suffix = t('about') || 'Hakkımızda'
        } else if (pathname === '/products') {
            suffix = t('products') || 'Ürünler'
        } else if (pathname.startsWith('/product/')) {
            suffix = t('product_detail_title') || t('product') || 'Ürün Detayı'
        } else if (pathname === '/categories') {
            suffix = t('categories') || 'Kategoriler'
        } else if (pathname === '/designers') {
            suffix = t('designers') || 'Tasarımcılar'
        } else if (pathname.startsWith('/designer/')) {
            suffix = t('designer_detail_title') || t('designers') || 'Tasarımcı Detayı'
        } else if (pathname === '/projects') {
            suffix = t('projects') || 'Projeler'
        } else if (pathname.startsWith('/projects/')) {
            suffix = t('project_detail_title') || t('projects') || 'Proje Detayı'
        } else if (pathname === '/news') {
            suffix = t('news') || 'Haberler'
        } else if (pathname.startsWith('/news/')) {
            suffix = t('news_detail_title') || t('news') || 'Haber Detayı'
        } else if (pathname === '/contact') {
            suffix = t('contact') || 'İletişim'
        } else if (pathname === '/login') {
            suffix = t('login') || 'Giriş'
        } else if (pathname === '/profile') {
            suffix = t('profile') || 'Profil'
        } else if (pathname === '/verify-email') {
            suffix = 'E-posta Doğrulama'
        } else if (pathname === '/cookies') {
            suffix = t('cookies') || 'Çerez Politikası'
        } else if (pathname === '/privacy') {
            suffix = t('privacy') || 'Gizlilik Politikası'
        } else if (pathname === '/terms') {
            suffix = t('terms') || 'Kullanım Şartları'
        } else if (pathname === '/kvkk') {
            suffix = t('kvkk') || 'KVKK'
        }

        const finalTitle = suffix ? `${baseTitle} - ${suffix}` : baseTitle

        // Google Analytics pageview (sadece statik sayfalar için)
        analytics.pageview(pathname, finalTitle)
    }, [pathname, t])

    return null
}
