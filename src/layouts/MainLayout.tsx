import React, { Suspense, lazy, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { PageTransition } from '../components/PageTransition'
import { CartSidebar } from '../components/CartSidebar'
import { FloatingAuthPanel } from '../components/FloatingAuthPanel'
import CookieBanner from '../components/CookieBanner'
import { PageLoading } from '../components/LoadingSpinner'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { SkipLink } from '../components/SkipLink'

// Lazy loaded pages
const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })))
const CategoriesPage = lazy(() =>
  import('../pages/CategoriesPage').then(m => ({ default: m.CategoriesPage }))
)
const ProductsPage = lazy(() =>
  import('../pages/ProductsPage').then(m => ({ default: m.ProductsPage }))
)
const ProductDetailPage = lazy(() =>
  import('../pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage }))
)
const DesignersPage = lazy(() =>
  import('../pages/DesignersPage').then(m => ({ default: m.DesignersPage }))
)
const DesignerDetailPage = lazy(() =>
  import('../pages/DesignerDetailPage').then(m => ({ default: m.DesignerDetailPage }))
)
const ProjectsPage = lazy(() =>
  import('../pages/ProjectsPage').then(m => ({ default: m.ProjectsPage }))
)
const ProjectDetailPage = lazy(() =>
  import('../pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage }))
)
const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('../pages/ContactPage').then(m => ({ default: m.ContactPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const VerifyEmailPage = lazy(() =>
  import('../pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage }))
)
const ResetPasswordPage = lazy(() =>
  import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
)
const NewsPage = lazy(() => import('../pages/NewsPage').then(m => ({ default: m.NewsPage })))
const NewsDetailPage = lazy(() =>
  import('../pages/NewsDetailPage').then(m => ({ default: m.NewsDetailPage }))
)
const CookiesPage = lazy(() => import('../pages/CookiesPage').then(m => ({ default: m.default })))
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then(m => ({ default: m.default })))
const TermsPage = lazy(() => import('../pages/TermsPage').then(m => ({ default: m.default })))
const KvkkPage = lazy(() => import('../pages/KvkkPage').then(m => ({ default: m.default })))

interface PageBoundaryProps {
  children: React.ReactNode
  pageName?: string
}

const PageBoundary: React.FC<PageBoundaryProps> = ({ children }) => (
  <ErrorBoundary>
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  </ErrorBoundary>
)

export const MainLayout: React.FC = () => {
  const location = useLocation()

  return (
    <>
      <SkipLink />
      <Header />
      <CartSidebar />
      <FloatingAuthPanel />
      <main id="main-content" className="flex flex-col flex-grow relative overflow-x-clip">
        <AnimatePresence mode="sync" initial={true}>
          <PageTransitionWrapper key={location.pathname} location={location} />
        </AnimatePresence>
      </main>
      <CookieBanner />
    </>
  )
}

/**
 * Bu wrapper, lokasyonu "capture" eder ve hapseder.
 * PageTransition exit yaparken bile kendi içindeki Routes'a eski lokasyonu verir.
 */
const PageTransitionWrapper = React.forwardRef<HTMLDivElement, { location: any }>(
  ({ location: liveLocation }, ref) => {
    // Lokasyonu ilk mount anındaki haliyle donduruyoruz.
    const [frozenLocation] = useState(liveLocation)
    const isSlideOver = (frozenLocation.state as any)?.slideOver === true

    // slideOver olan sayfa için ek sınıf veya mantık eklenebilir,
    // ancak `fixed` yapmak sayfa geçişi bittikten sonra scroll'u kilitliyor.
    // Framer motion zaten initial/exit durumlarında `fixed` yapıyor.

    return (
      <div ref={ref} className={isSlideOver ? '' : 'flex-grow flex flex-col'}>
        <PageTransition>
          <Suspense fallback={<PageLoading />}>
            <Routes location={frozenLocation}>
              <Route
                path="/"
                element={
                  <PageBoundary pageName="Ana Sayfa">
                    <HomePage />
                  </PageBoundary>
                }
              />
              <Route
                path="/categories"
                element={
                  <PageBoundary pageName="Kategoriler">
                    <CategoriesPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/products"
                element={
                  <PageBoundary pageName="Ürünler">
                    <ProductsPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/products/:categoryId"
                element={
                  <PageBoundary pageName="Ürünler">
                    <ProductsPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/product/:productId"
                element={
                  <PageBoundary pageName="Ürün Detayı">
                    <ProductDetailPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/designers"
                element={
                  <PageBoundary pageName="Tasarımcılar">
                    <DesignersPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/designer/:designerId"
                element={
                  <PageBoundary pageName="Tasarımcı">
                    <DesignerDetailPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/projects"
                element={
                  <PageBoundary pageName="Projeler">
                    <ProjectsPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <PageBoundary pageName="Proje">
                    <ProjectDetailPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/about"
                element={
                  <PageBoundary pageName="Hakkımızda">
                    <AboutPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/contact"
                element={
                  <PageBoundary pageName="İletişim">
                    <ContactPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/login"
                element={
                  <PageBoundary pageName="Giriş / Üyelik">
                    <LoginPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/profile"
                element={
                  <PageBoundary pageName="Profil">
                    <ProfilePage />
                  </PageBoundary>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PageBoundary pageName="E-posta Doğrulama">
                    <VerifyEmailPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PageBoundary pageName="Şifre Sıfırlama">
                    <ResetPasswordPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/news"
                element={
                  <PageBoundary pageName="Haberler">
                    <NewsPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/news/:newsId"
                element={
                  <PageBoundary pageName="Haber">
                    <NewsDetailPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/cookies"
                element={
                  <PageBoundary>
                    <CookiesPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/privacy"
                element={
                  <PageBoundary>
                    <PrivacyPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/terms"
                element={
                  <PageBoundary>
                    <TermsPage />
                  </PageBoundary>
                }
              />
              <Route
                path="/kvkk"
                element={
                  <PageBoundary>
                    <KvkkPage />
                  </PageBoundary>
                }
              />
            </Routes>
          </Suspense>
        </PageTransition>
      </div>
    )
  }
)
