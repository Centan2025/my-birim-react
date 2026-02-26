import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { CartSidebar } from '../components/CartSidebar'
import { SkipLink } from '../components/SkipLink'
import CookieBanner from '../components/CookieBanner'
import { PageTransition } from '../components/PageTransition'
import { PageLoader } from '../components/PageLoader'
import { Footer } from '../components/Footer'

// Lazy load pages for code splitting
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
const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('../pages/ContactPage').then(m => ({ default: m.ContactPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const NewsPage = lazy(() => import('../pages/NewsPage').then(m => ({ default: m.NewsPage })))
const NewsDetailPage = lazy(() =>
    import('../pages/NewsDetailPage').then(m => ({ default: m.NewsDetailPage }))
)
const CookiesPage = lazy(() => import('../pages/CookiesPage'))
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'))
const TermsPage = lazy(() => import('../pages/TermsPage'))
const KvkkPage = lazy(() => import('../pages/KvkkPage'))
const ProjectsPage = lazy(() =>
    import('../pages/ProjectsPage').then(m => ({ default: m.ProjectsPage }))
)
const ProjectDetailPage = lazy(() =>
    import('../pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage }))
)
const VerifyEmailPage = lazy(() =>
    import('../pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage }))
)
const ResetPasswordPage = lazy(() =>
    import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
)

export const MainLayout: React.FC = () => {
    const location = useLocation()

    return (
        <>
            <SkipLink />
            <Header />
            <CartSidebar />
            <main
                id="main-content"
                className="flex-grow"
                style={{ overflowX: 'hidden', position: 'relative', zIndex: 5 }}
                tabIndex={-1}
            >
                <Suspense fallback={<PageLoader />}>
                    <PageTransition key={location.pathname}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/categories" element={<CategoriesPage />} />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/products/:categoryId" element={<ProductsPage />} />
                            <Route path="/product/:productId" element={<ProductDetailPage />} />
                            <Route path="/designers" element={<DesignersPage />} />
                            <Route path="/designer/:designerId" element={<DesignerDetailPage />} />
                            <Route path="/projects" element={<ProjectsPage />} />
                            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/verify-email" element={<VerifyEmailPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/news" element={<NewsPage />} />
                            <Route path="/news/:newsId" element={<NewsDetailPage />} />
                            <Route path="/cookies" element={<CookiesPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/kvkk" element={<KvkkPage />} />
                        </Routes>
                    </PageTransition>
                </Suspense>
            </main>
            <CookieBanner />
            <Footer />
        </>
    )
}
