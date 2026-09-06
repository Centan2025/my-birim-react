import React, {Suspense} from 'react'
import {Routes, Route, Location} from 'react-router-dom'
import {PageLoading} from '../components/LoadingSpinner'
import {ErrorBoundary} from '../components/ErrorBoundary'
import {Footer} from '../components/Footer'
import {lazyWithRetry} from '../utils/lazyWithRetry'

// Lazy loaded pages with auto-retry on new deployment / chunk failure
const HomePage = lazyWithRetry(() => import('../pages/HomePage').then(m => ({default: m.HomePage})))
const CategoriesPage = lazyWithRetry(() =>
  import('../pages/CategoriesPage').then(m => ({default: m.CategoriesPage}))
)
const ProductsPage = lazyWithRetry(() =>
  import('../pages/ProductsPage').then(m => ({default: m.ProductsPage}))
)
const ProductDetailPage = lazyWithRetry(() =>
  import('../pages/ProductDetailPage').then(m => ({default: m.ProductDetailPage}))
)
const DesignersPage = lazyWithRetry(() =>
  import('../pages/DesignersPage').then(m => ({default: m.DesignersPage}))
)
const DesignerDetailPage = lazyWithRetry(() =>
  import('../pages/DesignerDetailPage').then(m => ({default: m.DesignerDetailPage}))
)
const ProjectsPage = lazyWithRetry(() =>
  import('../pages/ProjectsPage').then(m => ({default: m.ProjectsPage}))
)
const ProjectDetailPage = lazyWithRetry(() =>
  import('../pages/ProjectDetailPage').then(m => ({default: m.ProjectDetailPage}))
)
const AboutPageNew = lazyWithRetry(() =>
  import('../pages/AboutPageNew').then(m => ({default: m.AboutPageNew}))
)
const FactoryPage = lazyWithRetry(() =>
  import('../pages/FactoryPage').then(m => ({default: m.FactoryPage}))
)
const ContactPage = lazyWithRetry(() =>
  import('../pages/ContactPage').then(m => ({default: m.ContactPage}))
)
const LoginPage = lazyWithRetry(() =>
  import('../pages/LoginPage').then(m => ({default: m.LoginPage}))
)
const ProfilePage = lazyWithRetry(() =>
  import('../pages/ProfilePage').then(m => ({default: m.ProfilePage}))
)
const VerifyEmailPage = lazyWithRetry(() =>
  import('../pages/VerifyEmailPage').then(m => ({default: m.VerifyEmailPage}))
)
const ResetPasswordPage = lazyWithRetry(() =>
  import('../pages/ResetPasswordPage').then(m => ({default: m.ResetPasswordPage}))
)
const NewsPage = lazyWithRetry(() => import('../pages/NewsPage').then(m => ({default: m.NewsPage})))
const NewsDetailPage = lazyWithRetry(() =>
  import('../pages/NewsDetailPage').then(m => ({default: m.NewsDetailPage}))
)
const CookiesPage = lazyWithRetry(() =>
  import('../pages/CookiesPage').then(m => ({default: m.default}))
)
const PrivacyPage = lazyWithRetry(() =>
  import('../pages/PrivacyPage').then(m => ({default: m.default}))
)
const TermsPage = lazyWithRetry(() =>
  import('../pages/TermsPage').then(m => ({default: m.default}))
)
const KvkkPage = lazyWithRetry(() => import('../pages/KvkkPage').then(m => ({default: m.default})))
const AiRoomPlannerPage = lazyWithRetry(() =>
  import('../pages/AiRoomPlannerPage').then(m => ({default: m.AiRoomPlannerPage}))
)
const AnalyticsPage = lazyWithRetry(() => import('../pages/AnalyticsPage'))

interface PageBoundaryProps {
  children: React.ReactNode
  pageName?: string
  hideFooter?: boolean
}

const PageBoundary: React.FC<PageBoundaryProps> = ({children, hideFooter = false}) => (
  <ErrorBoundary>
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  </ErrorBoundary>
)

interface AppRoutesProps {
  frozenLocation: Location
}

export const AppRoutes: React.FC<AppRoutesProps> = ({frozenLocation}) => {
  return (
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
              <ProductDetailPage key={frozenLocation.pathname} />
            </PageBoundary>
          }
        />
        <Route
          path="/ai-room-planner"
          element={
            <PageBoundary pageName="AI Room Planner">
              <AiRoomPlannerPage />
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
              <AboutPageNew />
            </PageBoundary>
          }
        />
        <Route
          path="/about-v2"
          element={
            <PageBoundary pageName="Hakkımızda">
              <AboutPageNew />
            </PageBoundary>
          }
        />
        <Route
          path="/factory"
          element={
            <PageBoundary pageName="Fabrika">
              <FactoryPage defaultVersion="v2" />
            </PageBoundary>
          }
        />
        <Route
          path="/factory-v2"
          element={
            <PageBoundary pageName="Fabrika">
              <FactoryPage defaultVersion="v2" />
            </PageBoundary>
          }
        />
        <Route
          path="/contact"
          element={
            <PageBoundary pageName="İletişim">
              <ContactPage defaultVersion="v2" />
            </PageBoundary>
          }
        />
        <Route
          path="/contact-v2"
          element={
            <PageBoundary pageName="İletişim V2">
              <ContactPage defaultVersion="v2" />
            </PageBoundary>
          }
        />
        <Route
          path="/contact-v1"
          element={
            <PageBoundary pageName="İletişim V1">
              <ContactPage defaultVersion="v1" />
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
        <Route
          path="/site-analitigi"
          element={
            <PageBoundary pageName="Site Analitiği" hideFooter>
              <AnalyticsPage />
            </PageBoundary>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageBoundary pageName="Site Analitiği" hideFooter>
              <AnalyticsPage />
            </PageBoundary>
          }
        />
      </Routes>
    </Suspense>
  )
}
