/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useEffect, useState, useCallback} from 'react'
import {createPortal} from 'react-dom'
import {useNavigate, useSearchParams, Link} from 'react-router-dom'
import {motion, AnimatePresence, LayoutGroup} from 'framer-motion'
import {
  User,
  MapPin,
  FileText,
  Package,
  Award,
  Mail,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Layers,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import {useSEO} from '../hooks/useSEO'
import {useTranslation} from '../i18n'
import {formatCurrency} from '../utils/currency'
import {
  getAccountProfile,
  updateAccountProfile,
  changeAccountPassword,
  listAccountAddresses,
  createAccountAddress,
  updateAccountAddress,
  deleteAccountAddress,
  setDefaultAccountAddress,
  listAccountBillingProfiles,
  createAccountBillingProfile,
  updateAccountBillingProfile,
  deleteAccountBillingProfile,
  setDefaultAccountBillingProfile,
  listAccountOrders,
  getAccountOrderDetail,
  type AddressPayload,
  type BillingProfilePayload,
} from '../services/accountApi'
import type {
  CustomerProfileData,
  CustomerAddress,
  CustomerBillingProfile,
  CustomerOrderSummary,
  OrderDetailResult,
} from '../types/account'

type AccountTab =
  | 'overview'
  | 'profile'
  | 'addresses'
  | 'billing'
  | 'orders'
  | 'professional'
  | 'newsletter'

export function AccountPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {locale} = useTranslation()
  const isEn = locale === 'en'

  const currentTab = (searchParams.get('tab') as AccountTab) || 'overview'

  const setTab = (tab: AccountTab) => {
    setSearchParams(tab === 'overview' ? {} : {tab}, {replace: true})
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const mainContent = document.getElementById('account-main-content')
      if (mainContent) {
        const topOffset = mainContent.getBoundingClientRect().top + window.pageYOffset - 140
        window.scrollTo({
          top: Math.max(0, topOffset),
          behavior: 'smooth',
        })
      }
    }
  }

  const [indexDrawerOpen, setIndexDrawerOpen] = useState(false)

  // Auto-scroll active tab into center view on mobile navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const activeBtn = document.getElementById(`account-tab-${currentTab}`)
      if (activeBtn) {
        activeBtn.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'})
      }
    }
  }, [currentTab])

  // Lock body scroll and pause Lenis when mobile section drawer is open
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (indexDrawerOpen) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const originalTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      // Pause Lenis smooth scroll
      ;(window as any).lenis?.stop?.()

      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.touchAction = originalTouchAction
        ;(window as any).lenis?.start?.()
      }
    }
    return undefined
  }, [indexDrawerOpen])

  useSEO({
    title: isEn ? 'BİRİM — My Account' : 'BİRİM — Hesabım',
    description: isEn
      ? 'BİRİM Customer Account, shipping addresses, billing profiles, and order history.'
      : 'BİRİM Müşteri Hesabı, teslimat adresleri, fatura profilleri ve sipariş geçmişi.',
    siteName: 'BİRİM',
    type: 'profile',
    locale: locale === 'tr' ? 'tr_TR' : 'en_US',
  })

  // Global Page Loading / Auth State
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Account Data States (isolated)
  const [profile, setProfile] = useState<CustomerProfileData | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressesError, setAddressesError] = useState<string | null>(null)

  const [billingProfiles, setBillingProfiles] = useState<CustomerBillingProfile[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  // Modals & Drawers
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [editingBilling, setEditingBilling] = useState<CustomerBillingProfile | null>(null)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'address' | 'billing'
    id: string
    title: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderDetailResult | null>(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null)

  // Feedback Toasts
  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(
    null
  )

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({type, message})
    setTimeout(() => setFeedback(null), 4000)
  }

  // Load All Account Data with Promise.allSettled fault isolation
  const loadAccountData = useCallback(async () => {
    if (!auth.isLoggedIn || !auth.user) {
      setIsInitialLoading(false)
      return
    }

    setIsInitialLoading(true)
    setAddressesLoading(true)
    setBillingLoading(true)
    setOrdersLoading(true)

    const [profileRes, addressesRes, billingRes, ordersRes] = await Promise.allSettled([
      getAccountProfile(),
      listAccountAddresses(),
      listAccountBillingProfiles(),
      listAccountOrders(),
    ])

    if (profileRes.status === 'fulfilled') {
      setProfile(profileRes.value)
      setProfileError(null)
    } else {
      setProfileError(profileRes.reason?.message || 'Profil verisi alınamadı.')
    }

    if (addressesRes.status === 'fulfilled') {
      setAddresses(addressesRes.value)
      setAddressesError(null)
    } else {
      setAddressesError(addressesRes.reason?.message || 'Adresler yüklenemedi.')
    }
    setAddressesLoading(false)

    if (billingRes.status === 'fulfilled') {
      setBillingProfiles(billingRes.value)
      setBillingError(null)
    } else {
      setBillingError(billingRes.reason?.message || 'Fatura profilleri yüklenemedi.')
    }
    setBillingLoading(false)

    if (ordersRes.status === 'fulfilled') {
      setOrders(ordersRes.value)
      setOrdersError(null)
    } else {
      setOrdersError(ordersRes.reason?.message || 'Siparişler yüklenemedi.')
    }
    setOrdersLoading(false)

    setIsInitialLoading(false)
  }, [auth.isLoggedIn, auth.user])

  useEffect(() => {
    loadAccountData()
  }, [loadAccountData])

  // Load Order Detail when selected
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetail(null)
      return
    }
    let isMounted = true
    setOrderDetailLoading(true)
    setOrderDetailError(null)

    getAccountOrderDetail(selectedOrderId)
      .then(res => {
        if (isMounted) setOrderDetail(res)
      })
      .catch(err => {
        if (isMounted) setOrderDetailError(err.message || 'Sipariş detayı alınamadı.')
      })
      .finally(() => {
        if (isMounted) setOrderDetailLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedOrderId])

  const handleLogout = () => {
    auth.logout()
    navigate('/')
  }

  // Address Actions
  const handleSaveAddress = async (payload: AddressPayload) => {
    try {
      if (editingAddress) {
        const updated = await updateAccountAddress(editingAddress.id, payload)
        setAddresses(prev => prev.map(a => (a.id === updated.id ? updated : a)))
        showFeedback(
          'success',
          isEn ? 'Shipping address updated successfully.' : 'Teslimat adresi güncellendi.'
        )
      } else {
        const created = await createAccountAddress(payload)
        setAddresses(prev => [created, ...prev])
        showFeedback(
          'success',
          isEn ? 'New shipping address added.' : 'Yeni teslimat adresi eklendi.'
        )
      }
      setAddressModalOpen(false)
      setEditingAddress(null)
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to save address.' : 'Adres kaydedilemedi.')
      )
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const updated = await setDefaultAccountAddress(id)
      setAddresses(prev =>
        prev.map(a => ({
          ...a,
          isDefaultShipping: a.id === updated.id,
        }))
      )
      showFeedback(
        'success',
        isEn ? 'Default shipping address updated.' : 'Varsayılan teslimat adresi güncellendi.'
      )
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to set default address.' : 'Varsayılan adres ayarlanamadı.')
      )
    }
  }

  const handleDeleteAddress = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteAccountAddress(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      showFeedback('success', isEn ? 'Address deleted.' : 'Adres silindi.')
      setDeleteConfirm(null)
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to delete address.' : 'Adres silinemedi.')
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Billing Actions
  const handleSaveBilling = async (payload: BillingProfilePayload) => {
    try {
      if (editingBilling) {
        const updated = await updateAccountBillingProfile(editingBilling.id, payload)
        setBillingProfiles(prev => prev.map(b => (b.id === updated.id ? updated : b)))
        showFeedback('success', isEn ? 'Billing profile updated.' : 'Fatura profili güncellendi.')
      } else {
        const created = await createAccountBillingProfile(payload)
        setBillingProfiles(prev => [created, ...prev])
        showFeedback(
          'success',
          isEn ? 'New billing profile added.' : 'Yeni fatura profili eklendi.'
        )
      }
      setBillingModalOpen(false)
      setEditingBilling(null)
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to save billing profile.' : 'Fatura profili kaydedilemedi.')
      )
    }
  }

  const handleSetDefaultBilling = async (id: string) => {
    try {
      const updated = await setDefaultAccountBillingProfile(id)
      setBillingProfiles(prev =>
        prev.map(b => ({
          ...b,
          isDefault: b.id === updated.id,
        }))
      )
      showFeedback(
        'success',
        isEn ? 'Default billing profile updated.' : 'Varsayılan fatura profili güncellendi.'
      )
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to set default profile.' : 'Varsayılan profil ayarlanamadı.')
      )
    }
  }

  const handleDeleteBilling = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteAccountBillingProfile(id)
      setBillingProfiles(prev => prev.filter(b => b.id !== id))
      showFeedback('success', isEn ? 'Billing profile deleted.' : 'Fatura profili silindi.')
      setDeleteConfirm(null)
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to delete billing profile.' : 'Fatura profili silinemedi.')
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Profile Action
  const handleUpdateProfile = async (data: {
    name?: string
    phone?: string | null
    company?: string | null
    profession?: string | null
  }) => {
    try {
      const updated = await updateAccountProfile(data)
      setProfile(updated)
      showFeedback(
        'success',
        isEn ? 'Your profile details have been updated.' : 'Profil bilgileriniz güncellendi.'
      )
      return true
    } catch (err: any) {
      showFeedback(
        'error',
        err.message || (isEn ? 'Failed to update profile.' : 'Profil güncellenemedi.')
      )
      return false
    }
  }

  // Newsletter Toggle Action
  const handleToggleNewsletter = async (subscribed: boolean) => {
    try {
      const updated = await updateAccountProfile({newsletter_subscribed: subscribed})
      setProfile(updated)
      showFeedback(
        'success',
        subscribed
          ? isEn
            ? 'Subscribed to newsletter successfully.'
            : 'Bülten aboneliğiniz başlatıldı.'
          : isEn
            ? 'Unsubscribed from newsletter.'
            : 'Bülten aboneliğiniz sonlandırıldı.'
      )
    } catch (err: any) {
      showFeedback(
        'error',
        err.message ||
          (isEn ? 'Failed to update newsletter preferences.' : 'Bülten tercihi güncellenemedi.')
      )
    }
  }

  // Unauthenticated State
  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-stone-900 p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl uppercase tracking-wider text-stone-900 dark:text-stone-100">
              {isEn ? 'Sign In' : 'Giriş Yapın'}
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {isEn
                ? 'Please sign in to access your account details, shipping addresses, and order history.'
                : 'Hesap detaylarınıza, teslimat adreslerinize ve sipariş geçmişinize erişmek için lütfen giriş yapın.'}
            </p>
          </div>
          <Link
            to="/login?redirect=/hesabim"
            className="inline-block w-full py-3 px-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            {isEn ? 'Sign In / Register' : 'Giriş Yap / Üye Ol'}
          </Link>
        </div>
      </div>
    )
  }

  const navItems: {
    id: AccountTab
    index: string
    label: string
    shortLabel: string
    shortTitle: string
    description: string
    icon: React.ComponentType<{className?: string}>
  }[] = [
    {
      id: 'overview',
      index: '01',
      label: isEn ? 'Overview' : 'Genel Bakış',
      shortLabel: isEn ? 'Overview' : 'Genel',
      shortTitle: isEn ? 'Overview Dashboard' : 'Hesap Özeti',
      description: isEn ? 'Account summary & quick access' : 'Hesap özeti ve hızlı işlemler',
      icon: User,
    },
    {
      id: 'profile',
      index: '02',
      label: isEn ? 'My Profile' : 'Profil Bilgilerim',
      shortLabel: isEn ? 'Profile' : 'Profil',
      shortTitle: isEn ? 'Personal Profile' : 'Profil Bilgileri',
      description: isEn ? 'Personal info and password' : 'Kişisel bilgiler ve şifre',
      icon: Edit2,
    },
    {
      id: 'addresses',
      index: '03',
      label: isEn ? 'Shipping Addresses' : 'Teslimat Adreslerim',
      shortLabel: isEn ? 'Addresses' : 'Adresler',
      shortTitle: isEn ? 'Saved Addresses' : 'Kayıtlı Adresler',
      description: isEn
        ? `${addresses.length} saved address${addresses.length === 1 ? '' : 'es'}`
        : `${addresses.length} kayıtlı teslimat adresi`,
      icon: MapPin,
    },
    {
      id: 'billing',
      index: '04',
      label: isEn ? 'Billing Profiles' : 'Fatura Bilgilerim',
      shortLabel: isEn ? 'Billing' : 'Fatura',
      shortTitle: isEn ? 'Billing Profiles' : 'Fatura Profilleri',
      description: isEn
        ? `${billingProfiles.length} billing profile${billingProfiles.length === 1 ? '' : 's'}`
        : `${billingProfiles.length} fatura profili`,
      icon: FileText,
    },
    {
      id: 'orders',
      index: '05',
      label: isEn ? 'My Orders' : 'Siparişlerim',
      shortLabel: isEn ? 'Orders' : 'Siparişler',
      shortTitle: isEn ? 'Order History' : 'Sipariş Geçmişi',
      description: isEn
        ? `${orders.length} order${orders.length === 1 ? '' : 's'} recorded`
        : `${orders.length} kayıtlı sipariş`,
      icon: Package,
    },
    {
      id: 'professional',
      index: '06',
      label: isEn ? 'Professional Account' : 'Profesyonel Hesabım',
      shortLabel: isEn ? 'Professional' : 'Mimar / Pro',
      shortTitle: isEn ? 'Professional Membership' : 'Profesyonel Üyelik',
      description: isEn ? 'Architect verification and office' : 'Mimar doğrulama ve ofis',
      icon: Award,
    },
    {
      id: 'newsletter',
      index: '07',
      label: isEn ? 'Newsletter & Contact' : 'Bülten & İletişim',
      shortLabel: isEn ? 'Newsletter' : 'Bülten',
      shortTitle: isEn ? 'Newsletter & Digest' : 'Mimari Bülten',
      description: isEn ? 'Editorial and digest subscriptions' : 'Mimari bülten ve iletişim',
      icon: Mail,
    },
  ]

  const currentNavItem = navItems.find(n => n.id === currentTab) ?? navItems[0]!
  const CurrentIcon = currentNavItem.icon
  const currentNavIndex = navItems.findIndex(n => n.id === currentTab)
  const prevNavItem = currentNavIndex > 0 ? navItems[currentNavIndex - 1] : null
  const nextNavItem =
    currentNavIndex >= 0 && currentNavIndex < navItems.length - 1
      ? navItems[currentNavIndex + 1]
      : null

  const displayName =
    profile?.name || auth.user?.name || auth.user?.email || (isEn ? 'Customer' : 'Müşterimiz')

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{opacity: 0, y: -10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className={`fixed top-24 right-4 z-50 flex items-center gap-3 px-4 py-3 border shadow-md text-sm ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Banner */}
        <div className="mb-8 border-b border-stone-200 dark:border-stone-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {isEn ? 'BİRİM Customer Portal' : 'BİRİM Müşteri Portalı'}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider mt-1">
              {isEn ? `Welcome, ${displayName}` : `Hoş Geldiniz, ${displayName}`}
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {isEn
                ? 'Manage all your orders, shipping addresses, and professional profile with a single BİRİM Account.'
                : 'Tek BİRİM Hesabı ile tüm siparişlerinizi, teslimat adreslerinizi ve profesyonel profilinizi yönetin.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleLogout}
              whileHover={{scale: 1.02, y: -1}}
              whileTap={{scale: 0.98}}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isEn ? 'Sign Out' : 'Çıkış'}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Architecture (< lg): Segmented Horizontal Rail + Architectural Index Selector */}
        <div className="block lg:hidden mb-6 sticky top-16 md:top-20 z-30 space-y-2">
          {/* Top Bar: Section Title + Fast Stepper + Bölümler Button (No numeric 01/07) */}
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-sm p-3 flex items-center justify-between gap-2">
            {/* Active section info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0">
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block truncate">
                  {isEn ? 'Section' : 'Hesap Bölümü'}
                </span>
                <span className="font-heading text-xs uppercase font-semibold text-stone-900 dark:text-stone-100 truncate block">
                  {currentNavItem.shortTitle}
                </span>
              </div>
            </div>

            {/* Stepper + Bölümler Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              {prevNavItem && (
                <button
                  type="button"
                  onClick={() => setTab(prevNavItem.id)}
                  aria-label={isEn ? 'Previous section' : 'Önceki bölüm'}
                  className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              {nextNavItem && (
                <button
                  type="button"
                  onClick={() => setTab(nextNavItem.id)}
                  aria-label={isEn ? 'Next section' : 'Sonraki bölüm'}
                  className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Architectural Sections Button */}
              <button
                type="button"
                onClick={() => setIndexDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="font-semibold">{isEn ? 'Sections' : 'Bölümler'}</span>
              </button>
            </div>
          </div>

          {/* Horizontal Architectural Rail (Snap & Frictionless Tap-to-Slide with Smooth Pill) */}
          <LayoutGroup id="account-mobile-tabs">
            <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-sm p-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
              {navItems.map(item => {
                const ItemIcon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    id={`account-tab-${item.id}`}
                    onClick={() => setTab(item.id)}
                    className={`relative shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors duration-200 border cursor-pointer ${
                      isActive
                        ? 'border-stone-900 dark:border-stone-100 font-semibold'
                        : 'bg-stone-50/70 dark:bg-stone-950/40 text-stone-600 dark:text-stone-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAccountTabMobileStrip"
                        className="absolute inset-0 bg-stone-900 dark:bg-stone-100 z-0"
                        transition={{type: 'spring', stiffness: 280, damping: 28, mass: 0.6}}
                      />
                    )}
                    <ItemIcon
                      className={`relative z-10 w-3.5 h-3.5 transition-colors duration-200 ${
                        isActive ? 'text-white dark:text-stone-900' : 'text-stone-500'
                      }`}
                    />
                    <span
                      className={`relative z-10 whitespace-nowrap transition-colors duration-200 ${
                        isActive ? 'text-white dark:text-stone-900' : ''
                      }`}
                    >
                      {item.shortLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Minimalist Swiss Architectural Sections Modal / Bottom Sheet (Mounted to document.body via Portal) */}
        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {indexDrawerOpen && (
                <div className="fixed inset-0 z-[99999] lg:hidden flex flex-col justify-end">
                  {/* Backdrop */}
                  <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.2}}
                    onClick={() => setIndexDrawerOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs z-0"
                  />
                  {/* Drawer sheet */}
                  <motion.div
                    initial={{opacity: 0, y: '100%'}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: '100%'}}
                    transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
                    className="relative z-10 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shadow-[0_-20px_50px_rgba(0,0,0,0.35)] max-h-[82vh] flex flex-col overscroll-contain"
                  >
                    {/* Grab handle indicator */}
                    <button
                      type="button"
                      aria-label={isEn ? 'Close drawer' : 'Çekmeceyi kapat'}
                      className="w-full pt-3 pb-1 flex justify-center cursor-pointer bg-transparent border-0"
                      onClick={() => setIndexDrawerOpen(false)}
                    >
                      <div className="w-12 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
                    </button>

                    {/* Drawer Header (No numbers) */}
                    <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">
                          {isEn ? 'Section Selector' : 'Bölüm Seçimi'}
                        </span>
                        <h3 className="font-heading text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100 font-bold">
                          {isEn ? 'Account Sections' : 'Hesap Bölümleri'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIndexDrawerOpen(false)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        aria-label={isEn ? 'Close' : 'Kapat'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Section Items (Clean, No numbers) */}
                    <LayoutGroup id="account-drawer-tabs">
                      <div className="p-3 overflow-y-auto overscroll-contain flex-1 grid grid-cols-1 gap-1.5 divide-y divide-stone-100 dark:divide-stone-800/80">
                        {navItems.map(item => {
                          const ItemIcon = item.icon
                          const isActive = currentTab === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setTab(item.id)
                                setIndexDrawerOpen(false)
                              }}
                              className={`relative w-full flex items-center justify-between p-3.5 text-left transition-colors duration-200 border cursor-pointer ${
                                isActive
                                  ? 'border-stone-900 dark:border-stone-100 font-semibold'
                                  : 'border-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeAccountTabIndexSheet"
                                  className="absolute inset-0 bg-stone-900 dark:bg-stone-100 z-0"
                                  transition={{
                                    type: 'spring',
                                    stiffness: 280,
                                    damping: 28,
                                    mass: 0.6,
                                  }}
                                />
                              )}
                              <div className="relative z-10 flex items-center gap-3.5">
                                <ItemIcon
                                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                                    isActive ? 'text-white dark:text-stone-900' : 'text-stone-500'
                                  }`}
                                />
                                <div>
                                  <span
                                    className={`font-heading text-xs uppercase tracking-wider block transition-colors duration-200 ${
                                      isActive ? 'text-white dark:text-stone-900' : ''
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono block transition-colors duration-200 ${
                                      isActive
                                        ? 'text-stone-300 dark:text-stone-600'
                                        : 'text-stone-400'
                                    }`}
                                  >
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                              {isActive && (
                                <CheckCircle2 className="relative z-10 w-4 h-4 shrink-0 text-white dark:text-stone-900" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </LayoutGroup>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

        {/* Main Layout: Desktop Sidebar + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Navigation Sidebar (hidden on mobile) with Smooth Gliding Pill */}
          <LayoutGroup id="account-desktop-tabs">
            <nav
              className="hidden lg:block space-y-1.5 lg:col-span-1"
              aria-label="Account Navigation"
            >
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = currentTab === item.id
                return (
                  <button
                    key={item.id}
                    id={`account-tab-${item.id}`}
                    onClick={() => setTab(item.id)}
                    className={`group relative w-full flex items-center justify-between px-4 py-3.5 text-xs font-mono uppercase tracking-wider transition-colors duration-200 border cursor-pointer ${
                      isActive
                        ? 'border-stone-900 dark:border-stone-100 font-semibold shadow-sm'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50/80 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAccountTabDesktop"
                        className="absolute inset-0 bg-stone-900 dark:bg-stone-100 z-0"
                        transition={{type: 'spring', stiffness: 280, damping: 28, mass: 0.6}}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors duration-200 ${
                          isActive
                            ? 'text-white dark:text-stone-900'
                            : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100'
                        }`}
                      />
                      <span
                        className={`transition-colors duration-200 ${isActive ? 'text-white dark:text-stone-900' : ''}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={`relative z-10 w-3.5 h-3.5 transition-all duration-200 ${
                        isActive
                          ? 'text-white dark:text-stone-900 translate-x-0.5'
                          : 'text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-1'
                      }`}
                    />
                  </button>
                )
              })}
            </nav>
          </LayoutGroup>

          {/* Content Pane with Pure Architectural Drift & Cross-Fade */}
          <main id="account-main-content" className="lg:col-span-3">
            {isInitialLoading ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-stone-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
                  {isEn ? 'Loading account data...' : 'Hesap verileri yükleniyor...'}
                </span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{opacity: 0, y: 8}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -6}}
                  transition={{duration: 0.26, ease: [0.16, 1, 0.3, 1]}}
                >
                  {currentTab === 'overview' && (
                    <OverviewSection
                      profile={profile}
                      addresses={addresses}
                      billingProfiles={billingProfiles}
                      orders={orders}
                      ordersLoading={ordersLoading}
                      ordersError={ordersError}
                      isEn={isEn}
                      onNavigateTab={setTab}
                      onSelectOrder={setSelectedOrderId}
                    />
                  )}

                  {currentTab === 'profile' && (
                    <ProfileSection
                      profile={profile}
                      error={profileError}
                      isEn={isEn}
                      onSave={handleUpdateProfile}
                      onOpenPasswordModal={() => setPasswordModalOpen(true)}
                    />
                  )}

                  {currentTab === 'addresses' && (
                    <AddressesSection
                      addresses={addresses}
                      loading={addressesLoading}
                      error={addressesError}
                      isEn={isEn}
                      onAdd={() => {
                        setEditingAddress(null)
                        setAddressModalOpen(true)
                      }}
                      onEdit={addr => {
                        setEditingAddress(addr)
                        setAddressModalOpen(true)
                      }}
                      onSetDefault={handleSetDefaultAddress}
                      onDelete={addr => {
                        setDeleteConfirm({
                          type: 'address',
                          id: addr.id,
                          title: addr.label || addr.addressLine1,
                        })
                      }}
                    />
                  )}

                  {currentTab === 'billing' && (
                    <BillingSection
                      billingProfiles={billingProfiles}
                      loading={billingLoading}
                      error={billingError}
                      isEn={isEn}
                      onAdd={() => {
                        setEditingBilling(null)
                        setBillingModalOpen(true)
                      }}
                      onEdit={bp => {
                        setEditingBilling(bp)
                        setBillingModalOpen(true)
                      }}
                      onSetDefault={handleSetDefaultBilling}
                      onDelete={bp => {
                        setDeleteConfirm({
                          type: 'billing',
                          id: bp.id,
                          title:
                            bp.label ||
                            bp.companyName ||
                            bp.fullName ||
                            (isEn ? 'Billing Profile' : 'Fatura Profili'),
                        })
                      }}
                    />
                  )}

                  {currentTab === 'orders' && (
                    <OrdersSection
                      orders={orders}
                      loading={ordersLoading}
                      error={ordersError}
                      isEn={isEn}
                      onSelectOrder={setSelectedOrderId}
                    />
                  )}

                  {currentTab === 'professional' && (
                    <ProfessionalSection profile={profile} isEn={isEn} />
                  )}

                  {currentTab === 'newsletter' && (
                    <NewsletterSection
                      profile={profile}
                      isEn={isEn}
                      onToggle={handleToggleNewsletter}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      {/* Address Create / Edit Modal */}
      <AnimatePresence>
        {addressModalOpen && (
          <AddressModal
            address={editingAddress}
            defaultRecipient={profile?.name || auth.user?.name || ''}
            defaultPhone={profile?.phone || ''}
            isEn={isEn}
            onClose={() => {
              setAddressModalOpen(false)
              setEditingAddress(null)
            }}
            onSave={handleSaveAddress}
          />
        )}
      </AnimatePresence>

      {/* Billing Create / Edit Modal */}
      <AnimatePresence>
        {billingModalOpen && (
          <BillingModal
            billing={editingBilling}
            defaultRecipient={profile?.name || auth.user?.name || ''}
            isEn={isEn}
            onClose={() => {
              setBillingModalOpen(false)
              setEditingBilling(null)
            }}
            onSave={handleSaveBilling}
          />
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <ChangePasswordModal
            isEn={isEn}
            onClose={() => setPasswordModalOpen(false)}
            onSuccess={() => {
              setPasswordModalOpen(false)
              showFeedback(
                'success',
                isEn ? 'Password changed successfully.' : 'Şifreniz başarıyla değiştirildi.'
              )
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            title={deleteConfirm.title}
            type={
              deleteConfirm.type === 'address'
                ? isEn
                  ? 'shipping address'
                  : 'teslimat adresini'
                : isEn
                  ? 'billing profile'
                  : 'fatura profilini'
            }
            isDeleting={isDeleting}
            isEn={isEn}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm.type === 'address') {
                handleDeleteAddress(deleteConfirm.id)
              } else {
                handleDeleteBilling(deleteConfirm.id)
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Order Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedOrderId && (
          <OrderDetailModal
            orderId={selectedOrderId}
            orderDetail={orderDetail}
            loading={orderDetailLoading}
            error={orderDetailError}
            isEn={isEn}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// 1. OVERVIEW SECTION
// ==========================================
function OverviewSection({
  profile,
  addresses,
  billingProfiles,
  orders,
  ordersLoading,
  ordersError,
  isEn,
  onNavigateTab,
  onSelectOrder,
}: {
  profile: CustomerProfileData | null
  addresses: CustomerAddress[]
  billingProfiles: CustomerBillingProfile[]
  orders: CustomerOrderSummary[]
  ordersLoading: boolean
  ordersError: string | null
  isEn: boolean
  onNavigateTab: (tab: AccountTab) => void
  onSelectOrder: (id: string) => void
}) {
  const defaultAddress = addresses.find(a => a.isDefaultShipping) || addresses[0]
  const defaultBilling = billingProfiles.find(b => b.isDefault) || billingProfiles[0]

  return (
    <div className="space-y-6">
      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all duration-300 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {isEn ? 'Personal Information' : 'Kişisel Bilgiler'}
              </span>
              <User className="w-4 h-4" />
            </div>
            <p className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100">
              {profile?.name || (isEn ? 'Customer' : 'İsimsiz Müşteri')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-1">
              {profile?.email || '—'}
            </p>
            {profile?.phone && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{profile.phone}</p>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="group mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <span>{isEn ? 'Edit Profile' : 'Profili Düzenle'}</span>
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>
        </div>

        {/* Default Shipping Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all duration-300 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {isEn ? 'Shipping Addresses' : 'Teslimat Adresleri'}
              </span>
              <MapPin className="w-4 h-4" />
            </div>
            {defaultAddress ? (
              <div>
                <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
                  {defaultAddress.label || (isEn ? 'Default Address' : 'Varsayılan Adres')}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                  {defaultAddress.addressLine1}
                  {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}
                  {`, ${defaultAddress.district} / ${defaultAddress.city}`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                {isEn
                  ? 'No registered shipping address yet.'
                  : 'Henüz kayıtlı teslimat adresi bulunmuyor.'}
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('addresses')}
            className="group mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <span>
              {isEn
                ? `Manage Addresses (${addresses.length})`
                : `Adresleri Yönet (${addresses.length})`}
            </span>
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>
        </div>

        {/* Default Billing Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all duration-300 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {isEn ? 'Billing Profile' : 'Fatura Profili'}
              </span>
              <FileText className="w-4 h-4" />
            </div>
            {defaultBilling ? (
              <div>
                <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
                  {defaultBilling.label || defaultBilling.companyName || defaultBilling.fullName}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {defaultBilling.billingType === 'company'
                    ? isEn
                      ? `Corporate • Tax No: ${maskTaxNumber(defaultBilling.taxNumber)}`
                      : `Kurumsal • VKN: ${maskTaxNumber(defaultBilling.taxNumber)}`
                    : isEn
                      ? 'Individual'
                      : 'Bireysel Fatura'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                {isEn
                  ? 'No registered billing profile yet.'
                  : 'Henüz kayıtlı fatura profili bulunmuyor.'}
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('billing')}
            className="group mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <span>
              {isEn
                ? `Manage Profiles (${billingProfiles.length})`
                : `Profilleri Yönet (${billingProfiles.length})`}
            </span>
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-4">
          <div>
            <h2 className="font-heading text-lg uppercase tracking-wider">
              {isEn ? 'Recent Orders' : 'Son Siparişler'}
            </h2>
            <p className="text-xs text-stone-500">
              {isEn
                ? 'Your recent purchases made on BİRİM Shop.'
                : 'BİRİM Shop üzerinden verilen siparişleriniz.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="group inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <span>{isEn ? `View All (${orders.length})` : `Tümünü Gör (${orders.length})`}</span>
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5">
              &rarr;
            </span>
          </button>
        </div>

        {ordersLoading ? (
          <div className="py-8 flex items-center justify-center text-xs font-mono uppercase tracking-wider text-stone-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />{' '}
            {isEn ? 'Loading orders...' : 'Siparişler yükleniyor...'}
          </div>
        ) : ordersError ? (
          <div className="py-6 text-xs text-amber-600 dark:text-amber-400">{ordersError}</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            {isEn ? 'You have no orders yet.' : 'Henüz bir siparişiniz bulunmuyor.'}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => {
              const count = (order as any).itemCount ?? order.itemsCount ?? 1
              const firstItemName =
                (order as any).firstItemNameSnapshot || (isEn ? 'Product' : 'Ürün')
              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-950/40 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} isEn={isEn} />
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {firstItemName}
                      {count > 1
                        ? isEn
                          ? ` and ${count - 1} more items`
                          : ` ve ${count - 1} diğer ürün`
                        : ''}
                    </p>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(order.grandTotal, order.currency)}
                    </span>
                    <motion.button
                      onClick={() => onSelectOrder(order.id)}
                      whileHover={{scale: 1.02}}
                      whileTap={{scale: 0.98}}
                      className="px-3.5 py-1.5 border border-stone-300 dark:border-stone-700 text-[11px] font-mono uppercase tracking-wider hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-900 hover:border-stone-900 dark:hover:border-stone-100 transition-all duration-300 cursor-pointer"
                    >
                      {isEn ? 'Detail' : 'Detay'}
                    </motion.button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 2. PROFILE SECTION
// ==========================================
function ProfileSection({
  profile,
  error,
  isEn,
  onSave,
  onOpenPasswordModal,
}: {
  profile: CustomerProfileData | null
  error: string | null
  isEn: boolean
  onSave: (data: {
    name?: string
    phone?: string | null
    company?: string | null
    profession?: string | null
  }) => Promise<boolean>
  onOpenPasswordModal: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [profession, setProfession] = useState(profile?.profession || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
      setCompany(profile.company || '')
      setProfession(profile.profession || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const success = await onSave({
      name: name.trim(),
      phone: phone.trim() || null,
      company: company.trim() || null,
      profession: profession.trim() || null,
    })
    setSaving(false)
    if (success) {
      setIsEditing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="font-heading text-xl uppercase tracking-wider">
              {isEn ? 'My Profile' : 'Profil Bilgilerim'}
            </h2>
            <p className="text-xs text-stone-500">
              {isEn
                ? 'Manage your personal and contact details.'
                : 'Kişisel ve iletişim bilgilerinizi yönetin.'}
            </p>
          </div>
          {!isEditing && (
            <motion.button
              onClick={() => setIsEditing(true)}
              whileHover={{scale: 1.02, y: -1}}
              whileTap={{scale: 0.98}}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-900 hover:border-stone-900 dark:hover:border-stone-100 transition-all duration-300 cursor-pointer shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEn ? 'Edit' : 'Düzenle'}
            </motion.button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Full Name' : 'Ad Soyad'}
              </span>
              <p className="text-sm font-medium">{profile?.name || '—'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Email (Read Only)' : 'E-posta (Salt Okunur)'}
              </span>
              <p className="text-sm font-medium font-mono text-stone-600 dark:text-stone-400">
                {profile?.email || '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Phone' : 'Telefon'}
              </span>
              <p className="text-sm font-medium font-mono">{profile?.phone || '—'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Company' : 'Firma'}
              </span>
              <p className="text-sm font-medium">{profile?.company || '—'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Profession / Specialty' : 'Meslek / Uzmanlık'}
              </span>
              <p className="text-sm font-medium">{profile?.profession || '—'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                {isEn ? 'Account Type' : 'Hesap Tipi'}
              </span>
              <p className="text-sm font-medium uppercase font-mono">
                {profile?.role === 'architect'
                  ? isEn
                    ? 'Architect / Designer'
                    : 'Mimar & Tasarımcı'
                  : isEn
                    ? 'Standard Customer'
                    : 'Standart Müşteri'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1"
                >
                  {isEn ? 'Full Name' : 'Ad Soyad'}
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1"
                >
                  {isEn ? 'Email (Cannot be changed)' : 'E-posta (Değiştirilemez)'}
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/50 text-stone-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1"
                >
                  {isEn ? 'Phone' : 'Telefon'}
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+905xxxxxxxxx"
                  className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 font-mono transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-company"
                  className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1"
                >
                  {isEn ? 'Company' : 'Firma'}
                </label>
                <input
                  id="profile-company"
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-profession"
                  className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1"
                >
                  {isEn ? 'Profession' : 'Meslek'}
                </label>
                <input
                  id="profile-profession"
                  type="text"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  placeholder={
                    isEn ? 'e.g. Interior Designer, Architect' : 'Örn: İç Mimar, Tasarımcı'
                  }
                  className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              <motion.button
                type="button"
                onClick={() => setIsEditing(false)}
                whileHover={{backgroundColor: 'rgba(0,0,0,0.05)'}}
                whileTap={{scale: 0.98}}
                className="px-5 py-2.5 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Vazgeç'}
              </motion.button>
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{scale: 1.01, y: -1}}
                whileTap={{scale: 0.98}}
                className="px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {saving
                  ? isEn
                    ? 'Saving...'
                    : 'Kaydediliyor...'
                  : isEn
                    ? 'Save Changes'
                    : 'Değişiklikleri Kaydet'}
              </motion.button>
            </div>
          </form>
        )}
      </div>

      {/* Security & Password Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              <h3 className="font-heading text-base uppercase tracking-wider font-semibold">
                {isEn ? 'Security & Password' : 'Güvenlik ve Şifre'}
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {isEn
                ? 'Change your account password directly without needing an email reset link.'
                : 'E-posta sıfırlama bağlantısına gerek kalmadan doğrudan hesap şifrenizi güncelleyin.'}
            </p>
          </div>
          <motion.button
            onClick={onOpenPasswordModal}
            whileHover={{scale: 1.02, y: -1}}
            whileTap={{scale: 0.98}}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-mono uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 shrink-0 cursor-pointer shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            {isEn ? 'Change Password' : 'Şifre Değiştir'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. ADDRESSES SECTION
// ==========================================
function AddressesSection({
  addresses,
  loading,
  error,
  isEn,
  onAdd,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  addresses: CustomerAddress[]
  loading: boolean
  error: string | null
  isEn: boolean
  onAdd: () => void
  onEdit: (address: CustomerAddress) => void
  onSetDefault: (id: string) => void
  onDelete: (address: CustomerAddress) => void
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h2 className="font-heading text-xl uppercase tracking-wider">
            {isEn ? 'Shipping Addresses' : 'Teslimat Adreslerim'}
          </h2>
          <p className="text-xs text-stone-500">
            {isEn
              ? 'Saved addresses to use for your orders.'
              : 'Siparişlerinizde kullanacağınız kayıtlı adresleriniz.'}
          </p>
        </div>
        <motion.button
          onClick={onAdd}
          whileHover={{scale: 1.02, y: -1}}
          whileTap={{scale: 0.98}}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-mono uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {isEn ? 'Add New Address' : 'Yeni Adres Ekle'}
        </motion.button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-xs font-mono uppercase tracking-wider text-stone-400">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />{' '}
          {isEn ? 'Loading addresses...' : 'Adresler yükleniyor...'}
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <MapPin className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
          <p className="text-sm text-stone-500">
            {isEn
              ? 'You have no saved shipping addresses.'
              : 'Kayıtlı teslimat adresiniz bulunmuyor.'}
          </p>
          <button
            onClick={onAdd}
            className="text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 underline underline-offset-4 cursor-pointer"
          >
            {isEn ? 'Add your first address' : 'İlk adresinizi ekleyin'} &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div
              key={address.id}
              className={`border p-5 flex flex-col justify-between relative transition-all duration-300 ${
                address.isDefaultShipping
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading text-base uppercase font-semibold">
                    {address.label || (isEn ? 'Shipping Address' : 'Teslimat Adresi')}
                  </span>
                  {address.isDefaultShipping && (
                    <span className="px-2 py-0.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-mono uppercase tracking-wider font-semibold">
                      {isEn ? 'Default' : 'Varsayılan'}
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-stone-800 dark:text-stone-200 mb-1">
                  {address.recipientName}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {address.district} / {address.city}{' '}
                  {address.postalCode ? `(${address.postalCode})` : ''}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">{address.country}</p>
                <p className="text-xs font-mono text-stone-500 mt-2">{address.phone}</p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-200 dark:border-stone-800">
                <div>
                  {!address.isDefaultShipping && (
                    <button
                      onClick={() => onSetDefault(address.id)}
                      className="text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      {isEn ? 'Set as Default' : 'Varsayılan Yap'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => onEdit(address)}
                    whileHover={{scale: 1.15}}
                    whileTap={{scale: 0.9}}
                    className="p-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    title={isEn ? 'Edit' : 'Düzenle'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    onClick={() => onDelete(address)}
                    whileHover={{scale: 1.15}}
                    whileTap={{scale: 0.9}}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title={isEn ? 'Delete' : 'Sil'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 4. BILLING SECTION
// ==========================================
function BillingSection({
  billingProfiles,
  loading,
  error,
  isEn,
  onAdd,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  billingProfiles: CustomerBillingProfile[]
  loading: boolean
  error: string | null
  isEn: boolean
  onAdd: () => void
  onEdit: (bp: CustomerBillingProfile) => void
  onSetDefault: (id: string) => void
  onDelete: (bp: CustomerBillingProfile) => void
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div>
          <h2 className="font-heading text-xl uppercase tracking-wider">
            {isEn ? 'Billing Profiles' : 'Fatura Bilgilerim'}
          </h2>
          <p className="text-xs text-stone-500">
            {isEn
              ? 'Your individual and corporate e-invoice profiles.'
              : 'Bireysel ve kurumsal e-fatura profilleriniz.'}
          </p>
        </div>
        <motion.button
          onClick={onAdd}
          whileHover={{scale: 1.02, y: -1}}
          whileTap={{scale: 0.98}}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-mono uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {isEn ? 'Add Billing Profile' : 'Yeni Fatura Profili'}
        </motion.button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-xs font-mono uppercase tracking-wider text-stone-400">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />{' '}
          {isEn ? 'Loading billing profiles...' : 'Fatura profilleri yükleniyor...'}
        </div>
      ) : billingProfiles.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
          <p className="text-sm text-stone-500">
            {isEn ? 'You have no saved billing profiles.' : 'Kayıtlı fatura profiliniz bulunmuyor.'}
          </p>
          <button
            onClick={onAdd}
            className="text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 underline"
          >
            {isEn ? 'Create your first billing profile' : 'İlk fatura profilinizi oluşturun'} &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {billingProfiles.map(bp => (
            <div
              key={bp.id}
              className={`border p-5 flex flex-col justify-between relative ${
                bp.isDefault
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-800/30'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading text-base uppercase font-semibold">
                    {bp.label || (bp.billingType === 'company' ? bp.companyName : bp.fullName)}
                  </span>
                  {bp.isDefault && (
                    <span className="px-2 py-0.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-mono uppercase tracking-wider font-semibold">
                      {isEn ? 'Default' : 'Varsayılan'}
                    </span>
                  )}
                </div>

                <div className="inline-block px-2 py-0.5 mb-2 text-[10px] font-mono uppercase border border-stone-300 dark:border-stone-700">
                  {bp.billingType === 'company'
                    ? isEn
                      ? 'Corporate Invoice'
                      : 'Kurumsal Fatura'
                    : isEn
                      ? 'Individual Invoice'
                      : 'Bireysel Fatura'}
                </div>

                {bp.billingType === 'company' ? (
                  <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {bp.companyName}
                    </p>
                    {bp.taxOffice && (
                      <p>
                        {isEn ? 'Tax Office' : 'Vergi Dairesi'}: {bp.taxOffice}
                      </p>
                    )}
                    <p className="font-mono">
                      {isEn ? 'Tax No' : 'VKN'}: {maskTaxNumber(bp.taxNumber)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                    <p className="font-medium text-stone-900 dark:text-stone-100">{bp.fullName}</p>
                    {bp.taxNumber && (
                      <p className="font-mono">
                        {isEn ? 'ID Number' : 'TCKN'}: {maskTaxNumber(bp.taxNumber)}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                  {bp.addressLine1}
                  {bp.addressLine2 ? `, ${bp.addressLine2}` : ''}
                  {`, ${bp.district} / ${bp.city}`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-200 dark:border-stone-800">
                <div>
                  {!bp.isDefault && (
                    <motion.button
                      whileHover={{scale: 1.02}}
                      whileTap={{scale: 0.98}}
                      onClick={() => onSetDefault(bp.id)}
                      className="text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline transition-colors"
                    >
                      {isEn ? 'Set as Default' : 'Varsayılan Yap'}
                    </motion.button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.95}}
                    onClick={() => onEdit(bp)}
                    className="p-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                    title={isEn ? 'Edit' : 'Düzenle'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.95}}
                    onClick={() => onDelete(bp)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                    title={isEn ? 'Delete' : 'Sil'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 5. ORDERS SECTION
// ==========================================
function OrdersSection({
  orders,
  loading,
  error,
  isEn,
  onSelectOrder,
}: {
  orders: CustomerOrderSummary[]
  loading: boolean
  error: string | null
  isEn: boolean
  onSelectOrder: (id: string) => void
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {isEn ? 'Order History' : 'Sipariş Geçmişim'}
        </h2>
        <p className="text-xs text-stone-500">
          {isEn
            ? 'Purchases made through BİRİM Shop.'
            : 'BİRİM Shop üzerinden gerçekleştirdiğiniz satın alımlar.'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center text-xs font-mono uppercase tracking-wider text-stone-400">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />{' '}
          {isEn ? 'Loading orders...' : 'Siparişler yükleniyor...'}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <Package className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
          <p className="text-sm text-stone-500">
            {isEn
              ? 'You do not have any orders yet.'
              : 'Henüz kayıtlı siparişiniz bulunmamaktadır.'}
          </p>
          <a
            href="https://shop.birim.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-300 underline transition-colors"
          >
            {isEn ? 'Explore the BİRİM Shop Collection' : 'BİRİM Shop Koleksiyonunu Keşfedin'}{' '}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const count = (order as any).itemCount ?? order.itemsCount ?? 1
            const firstItemName =
              (order as any).firstItemNameSnapshot || (isEn ? 'Product' : 'Ürün')
            const firstItemSku = (order as any).firstItemSkuSnapshot
            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-colors gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} isEn={isEn} />
                    <PaymentStatusBadge status={order.paymentStatus} isEn={isEn} />
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300">
                    {firstItemName}
                    {count > 1
                      ? isEn
                        ? ` (+${count - 1} more items)`
                        : ` (+${count - 1} ürün daha)`
                      : ''}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}
                    </span>
                    {firstItemSku && <span>SKU: {firstItemSku}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-mono text-base font-semibold">
                    {formatCurrency(order.grandTotal, order.currency)}
                  </span>
                  <motion.button
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.97}}
                    onClick={() => onSelectOrder(order.id)}
                    className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-mono uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                  >
                    {isEn ? 'Detail' : 'Detay'}
                  </motion.button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ==========================================
// 6. PROFESSIONAL SECTION
// ==========================================
function ProfessionalSection({
  profile,
  isEn,
}: {
  profile: CustomerProfileData | null
  isEn: boolean
}) {
  const isArchitect = profile?.role === 'architect'
  const status = profile?.architectVerificationStatus || (isArchitect ? 'approved' : 'none')

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {isEn ? 'Professional Account' : 'Profesyonel Hesabım'}
        </h2>
        <p className="text-xs text-stone-500">
          {isEn
            ? 'Architecture and corporate design office membership information.'
            : 'Mimarlık ve kurumsal tasarım ofisi üyelik bilgileri.'}
        </p>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-stone-800 dark:text-stone-200" />
            <span className="font-heading uppercase text-sm font-semibold tracking-wider">
              {isEn ? 'Membership Verification Status' : 'Üyelik Doğrulama Durumu'}
            </span>
          </div>
          {status === 'approved' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-mono uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />{' '}
              {isEn ? 'Verified (Active)' : 'Doğrulandı (Aktif)'}
            </span>
          ) : status === 'pending' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-mono uppercase">
              <Clock className="w-3.5 h-3.5" /> {isEn ? 'Under Review' : 'İnceleniyor'}
            </span>
          ) : status === 'rejected' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-mono uppercase">
              <AlertCircle className="w-3.5 h-3.5" /> {isEn ? 'Not Approved' : 'Onaylanmadı'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-mono uppercase">
              {isEn ? 'Standard Membership' : 'Standart Üyelik'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="border border-stone-100 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-950/30">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
              {isEn ? 'Account Role' : 'Hesap Rolü'}
            </span>
            <p className="text-xs font-medium text-stone-900 dark:text-stone-100 mt-1 uppercase font-mono">
              {isArchitect
                ? isEn
                  ? 'Architect / Designer'
                  : 'Mimar & Tasarımcı'
                : isEn
                  ? 'Standard Customer'
                  : 'Standart Müşteri'}
            </p>
          </div>
          <div className="border border-stone-100 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-950/30">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
              {isEn ? 'Company' : 'Firma Bilgisi'}
            </span>
            <p className="text-xs font-medium text-stone-900 dark:text-stone-100 mt-1 truncate">
              {profile?.company || '—'}
            </p>
          </div>
          <div className="border border-stone-100 dark:border-stone-800 p-4 bg-stone-50/50 dark:bg-stone-950/30">
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
              {isEn ? 'Profession / Specialty' : 'Meslek / Uzmanlık'}
            </span>
            <p className="text-xs font-medium text-stone-900 dark:text-stone-100 mt-1 truncate">
              {profile?.profession || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 7. NEWSLETTER SECTION
// ==========================================
function NewsletterSection({
  profile,
  isEn,
  onToggle,
}: {
  profile: CustomerProfileData | null
  isEn: boolean
  onToggle: (subscribed: boolean) => void
}) {
  const isSubscribed = Boolean(profile?.newsletterSubscribed)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await onToggle(!isSubscribed)
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {isEn ? 'Newsletter & Preferences' : 'Bülten & İletişim Tercihleri'}
        </h2>
        <p className="text-xs text-stone-500">
          {isEn
            ? 'New collections, architectural digests, and event notifications.'
            : 'Yeni koleksiyonlar, mimari bültenler ve etkinlik bildirimleri.'}
        </p>
      </div>

      <div className="border border-stone-200 dark:border-stone-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="font-heading uppercase text-sm font-semibold tracking-wider">
            {isEn ? 'BİRİM Architectural Digest' : 'BİRİM Mimari Bülten'}
          </span>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {isEn
              ? 'Receive emails about new product launches, design editorials, and private invitations.'
              : 'Yeni ürün lansmanları, tasarım makaleleri ve özel davetler hakkında e-posta alın.'}
          </p>
          <span className="text-[10px] font-mono text-stone-400">
            {isEn ? 'Status' : 'Durum'}:{' '}
            {isSubscribed
              ? isEn
                ? 'Subscribed (Active)'
                : 'Abone (Aktif)'
              : isEn
                ? 'Not Subscribed'
                : 'Abone Değil'}
          </span>
        </div>

        <motion.button
          whileHover={{scale: 1.03}}
          whileTap={{scale: 0.97}}
          onClick={handleToggle}
          disabled={loading}
          className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
            isSubscribed
              ? 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200'
          }`}
        >
          {loading
            ? isEn
              ? 'Updating...'
              : 'Güncelleniyor...'
            : isSubscribed
              ? isEn
                ? 'Unsubscribe'
                : 'Abonelikten Çık'
              : isEn
                ? 'Subscribe'
                : 'Abone Ol'}
        </motion.button>
      </div>
    </div>
  )
}

// ==========================================
// MODALS
// ==========================================

function AddressModal({
  address,
  defaultRecipient = '',
  defaultPhone = '',
  isEn,
  onClose,
  onSave,
}: {
  address: CustomerAddress | null
  defaultRecipient?: string
  defaultPhone?: string
  isEn: boolean
  onClose: () => void
  onSave: (payload: AddressPayload) => void
}) {
  const [label, setLabel] = useState(address?.label || '')
  const [recipientName, setRecipientName] = useState(
    address?.recipientName || defaultRecipient || ''
  )
  const [phone, setPhone] = useState(address?.phone || defaultPhone || '')
  const [addressLine1, setAddressLine1] = useState(address?.addressLine1 || '')
  const [addressLine2, setAddressLine2] = useState(address?.addressLine2 || '')
  const [city, setCity] = useState(address?.city || 'İstanbul')
  const [district, setDistrict] = useState(address?.district || '')
  const [postalCode, setPostalCode] = useState(address?.postalCode || '')
  const [country, setCountry] = useState(address?.country || 'Türkiye')
  const [isDefaultShipping, setIsDefaultShipping] = useState(address?.isDefaultShipping || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      label: label.trim() || undefined,
      recipientName: recipientName.trim() || defaultRecipient || (isEn ? 'Customer' : 'Müşteri'),
      phone: phone.trim() || defaultPhone || '+905550000000',
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      city: city.trim() || 'İstanbul',
      district: district.trim(),
      postalCode: postalCode.trim() || null,
      country: country.trim() || 'Türkiye',
      isDefaultShipping,
    })
  }

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.2}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 10}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 10}}
        transition={{type: 'spring', stiffness: 450, damping: 30}}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-heading text-lg uppercase tracking-wider">
            {address
              ? isEn
                ? 'Edit Shipping Address'
                : 'Adresi Düzenle'
              : isEn
                ? 'Add New Shipping Address'
                : 'Yeni Teslimat Adresi'}
          </h3>
          <motion.button
            whileHover={{scale: 1.1}}
            whileTap={{scale: 0.9}}
            onClick={onClose}
            className="p-1 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="addr-label"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Address Title (Optional)' : 'Adres Başlığı (Opsiyonel)'}
              </label>
              <input
                id="addr-label"
                type="text"
                placeholder={isEn ? 'e.g. Home, Office' : 'Örn: Ev, Ofis'}
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="addr-recipient"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Recipient Name *' : 'Alıcı Ad Soyad *'}
              </label>
              <input
                id="addr-recipient"
                type="text"
                required
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="addr-phone"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Phone *' : 'Telefon *'}
              </label>
              <input
                id="addr-phone"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="addr-line1"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Address Line 1 *' : 'Adres Satırı 1 *'}
              </label>
              <input
                id="addr-line1"
                type="text"
                required
                placeholder={isEn ? 'Street, building no, etc.' : 'Cadde, mahalle, bina no'}
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="addr-line2"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Address Line 2 (Apt, suite, unit)' : 'Adres Satırı 2 (Kat, Daire vb.)'}
              </label>
              <input
                id="addr-line2"
                type="text"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="addr-city"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'City / Province *' : 'Şehir / İl *'}
              </label>
              <input
                id="addr-city"
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="addr-district"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'District *' : 'İlçe *'}
              </label>
              <input
                id="addr-district"
                type="text"
                required
                placeholder="Kadıköy"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="addr-postal"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Postal Code' : 'Posta Kodu'}
              </label>
              <input
                id="addr-postal"
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="addr-country"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Country' : 'Ülke'}
              </label>
              <input
                id="addr-country"
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="isDefaultShipping"
              type="checkbox"
              checked={isDefaultShipping}
              onChange={e => setIsDefaultShipping(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-0"
            />
            <label
              htmlFor="isDefaultShipping"
              className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              {isEn
                ? 'Set as default shipping address'
                : 'Varsayılan teslimat adresi olarak ayarla'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Vazgeç'}
            </motion.button>
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="submit"
              className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
            >
              {isEn ? 'Save' : 'Kaydet'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function BillingModal({
  billing,
  defaultRecipient = '',
  isEn,
  onClose,
  onSave,
}: {
  billing: CustomerBillingProfile | null
  defaultRecipient?: string
  isEn: boolean
  onClose: () => void
  onSave: (payload: BillingProfilePayload) => void
}) {
  const [billingType, setBillingType] = useState<'individual' | 'company'>(
    billing?.billingType || 'company'
  )
  const [label, setLabel] = useState(billing?.label || '')
  const [fullName, setFullName] = useState(billing?.fullName || defaultRecipient || '')
  const [companyName, setCompanyName] = useState(billing?.companyName || '')
  const [taxOffice, setTaxOffice] = useState(billing?.taxOffice || '')
  const [taxNumber, setTaxNumber] = useState(billing?.taxNumber || '')
  const [addressLine1, setAddressLine1] = useState(billing?.addressLine1 || '')
  const [addressLine2, setAddressLine2] = useState(billing?.addressLine2 || '')
  const [city, setCity] = useState(billing?.city || 'İstanbul')
  const [district, setDistrict] = useState(billing?.district || '')
  const [postalCode, setPostalCode] = useState(billing?.postalCode || '')
  const [country, setCountry] = useState(billing?.country || 'Türkiye')
  const [isDefault, setIsDefault] = useState(billing?.isDefault || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      billingType,
      label: label.trim() || undefined,
      fullName:
        billingType === 'individual'
          ? fullName.trim() || defaultRecipient || (isEn ? 'Customer' : 'Müşteri')
          : null,
      companyName: billingType === 'company' ? companyName.trim() : null,
      taxOffice: billingType === 'company' ? taxOffice.trim() : null,
      taxNumber: taxNumber.trim() || null,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      city: city.trim() || 'İstanbul',
      district: district.trim(),
      postalCode: postalCode.trim() || null,
      country: country.trim() || 'Türkiye',
      isDefault,
    })
  }

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.2}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 10}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 10}}
        transition={{type: 'spring', stiffness: 450, damping: 30}}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-heading text-lg uppercase tracking-wider">
            {billing
              ? isEn
                ? 'Edit Billing Profile'
                : 'Fatura Profilini Düzenle'
              : isEn
                ? 'Add New Billing Profile'
                : 'Yeni Fatura Profili'}
          </h3>
          <motion.button
            whileHover={{scale: 1.1}}
            whileTap={{scale: 0.9}}
            onClick={onClose}
            className="p-1 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Billing Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBillingType('company')}
              className={`py-2 px-3 text-xs font-mono uppercase tracking-wider text-center transition-all duration-150 border ${
                billingType === 'company'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 font-semibold shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {isEn ? 'Corporate (Company)' : 'Kurumsal (Şirket)'}
            </button>
            <button
              type="button"
              onClick={() => setBillingType('individual')}
              className={`py-2 px-3 text-xs font-mono uppercase tracking-wider text-center transition-all duration-150 border ${
                billingType === 'individual'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 font-semibold shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {isEn ? 'Individual (Personal)' : 'Bireysel (Şahıs)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="bill-label"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Profile Title (Optional)' : 'Profil Başlığı (Opsiyonel)'}
              </label>
              <input
                id="bill-label"
                type="text"
                placeholder={
                  isEn ? 'e.g. Company Invoice, Personal' : 'Örn: Şirket Faturası, Şahıs'
                }
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            {billingType === 'company' ? (
              <>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="bill-company"
                    className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
                  >
                    {isEn ? 'Company Legal Name *' : 'Şirket Resmi Unvanı *'}
                  </label>
                  <input
                    id="bill-company"
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bill-tax-office"
                    className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
                  >
                    {isEn ? 'Tax Office *' : 'Vergi Dairesi *'}
                  </label>
                  <input
                    id="bill-tax-office"
                    type="text"
                    required
                    value={taxOffice}
                    onChange={e => setTaxOffice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bill-tax-number"
                    className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
                  >
                    {isEn ? 'Tax Number (VKN) *' : 'Vergi Numarası (VKN) *'}
                  </label>
                  <input
                    id="bill-tax-number"
                    type="text"
                    required
                    value={taxNumber}
                    onChange={e => setTaxNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="bill-fullname"
                    className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
                  >
                    {isEn ? 'Full Name *' : 'Ad Soyad *'}
                  </label>
                  <input
                    id="bill-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="bill-tckn"
                    className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
                  >
                    {isEn ? 'National ID Number (Optional)' : 'TC Kimlik No (Opsiyonel)'}
                  </label>
                  <input
                    id="bill-tckn"
                    type="text"
                    value={taxNumber}
                    onChange={e => setTaxNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="bill-line1"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Billing Address *' : 'Fatura Adresi *'}
              </label>
              <input
                id="bill-line1"
                type="text"
                required
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="bill-line2"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Address Line 2 (Apt, suite, unit)' : 'Adres Satırı 2 (Kat, Daire vb.)'}
              </label>
              <input
                id="bill-line2"
                type="text"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="bill-city"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'City *' : 'Şehir *'}
              </label>
              <input
                id="bill-city"
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="bill-district"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'District *' : 'İlçe *'}
              </label>
              <input
                id="bill-district"
                type="text"
                required
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="bill-postal"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Postal Code' : 'Posta Kodu'}
              </label>
              <input
                id="bill-postal"
                type="text"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="bill-country"
                className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
              >
                {isEn ? 'Country' : 'Ülke'}
              </label>
              <input
                id="bill-country"
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="isDefaultBilling"
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-0"
            />
            <label
              htmlFor="isDefaultBilling"
              className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              {isEn ? 'Set as default billing profile' : 'Varsayılan fatura profili olarak ayarla'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Vazgeç'}
            </motion.button>
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="submit"
              className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
            >
              {isEn ? 'Save' : 'Kaydet'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function ChangePasswordModal({
  isEn,
  onClose,
  onSuccess,
}: {
  isEn: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError(
        isEn
          ? 'New password must be at least 6 characters long.'
          : 'Yeni şifre en az 6 karakter olmalıdır.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError(isEn ? 'New passwords do not match.' : 'Yeni şifreler birbiriyle eşleşmiyor.')
      return
    }

    if (currentPassword === newPassword) {
      setError(
        isEn
          ? 'New password cannot be the same as your current password.'
          : 'Yeni şifreniz mevcut şifrenizle aynı olamaz.'
      )
      return
    }

    setLoading(true)
    try {
      await changeAccountPassword(currentPassword, newPassword)
      onSuccess()
    } catch (err: any) {
      setError(err.message || (isEn ? 'Failed to change password.' : 'Şifre değiştirilemedi.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.2}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 10}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 10}}
        transition={{type: 'spring', stiffness: 450, damping: 30}}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            <h3 className="font-heading text-lg uppercase tracking-wider">
              {isEn ? 'Change Password' : 'Şifre Değiştir'}
            </h3>
          </div>
          <motion.button
            whileHover={{scale: 1.1}}
            whileTap={{scale: 0.9}}
            onClick={onClose}
            className="p-1 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="curr-pwd"
              className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
            >
              {isEn ? 'Current Password *' : 'Mevcut Şifre *'}
            </label>
            <input
              id="curr-pwd"
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="new-pwd"
              className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
            >
              {isEn ? 'New Password * (Min 6 characters)' : 'Yeni Şifre * (En az 6 karakter)'}
            </label>
            <input
              id="new-pwd"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-pwd"
              className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1"
            >
              {isEn ? 'Confirm New Password *' : 'Yeni Şifre (Tekrar) *'}
            </label>
            <input
              id="confirm-pwd"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 bg-transparent focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {isEn ? 'Cancel' : 'Vazgeç'}
            </motion.button>
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors"
            >
              {loading
                ? isEn
                  ? 'Updating...'
                  : 'Güncelleniyor...'
                : isEn
                  ? 'Update Password'
                  : 'Şifreyi Güncelle'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function DeleteConfirmModal({
  title,
  type,
  isDeleting,
  isEn,
  onClose,
  onConfirm,
}: {
  title: string
  type: string
  isDeleting: boolean
  isEn: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.2}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 10}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 10}}
        transition={{type: 'spring', stiffness: 450, damping: 30}}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 space-y-4 shadow-2xl"
      >
        <h3 className="font-heading text-lg uppercase tracking-wider text-rose-600">
          {isEn ? 'Delete Confirmation' : 'Silme Onayı'}
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {isEn ? (
            <>
              Are you sure you want to permanently delete {type}{' '}
              <strong>&quot;{title}&quot;</strong>?
            </>
          ) : (
            <>
              <strong>&quot;{title}&quot;</strong> başlıklı {type} kalıcı olarak silmek
              istediğinizden emin misiniz?
            </>
          )}
        </p>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <motion.button
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-xs font-mono uppercase hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            {isEn ? 'Cancel' : 'İptal'}
          </motion.button>
          <motion.button
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-mono uppercase hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (isEn ? 'Deleting...' : 'Siliniyor...') : isEn ? 'Delete' : 'Sil'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function OrderDetailModal({
  orderId,
  orderDetail,
  loading,
  error,
  isEn,
  onClose,
}: {
  orderId: string
  orderDetail: OrderDetailResult | null
  loading: boolean
  error: string | null
  isEn: boolean
  onClose: () => void
}) {
  const anyDetail = orderDetail as any
  const shippingSnapshot =
    anyDetail?.shippingAddressSnapshot || anyDetail?.shipping_address_snapshot
  const billingSnapshot = anyDetail?.billingAddressSnapshot || anyDetail?.billing_address_snapshot
  const corporateSnapshot =
    anyDetail?.corporateBillingSnapshot || anyDetail?.corporate_billing_snapshot

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.2}}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 10}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 10}}
        transition={{type: 'spring', stiffness: 450, damping: 30}}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-wider">
              {isEn ? 'Order Details' : 'Sipariş Detayı'}
            </h3>
            <span className="font-mono text-xs text-stone-500">
              {orderDetail?.orderNumber || orderId}
            </span>
          </div>
          <motion.button
            whileHover={{scale: 1.1}}
            whileTap={{scale: 0.9}}
            onClick={onClose}
            className="p-1 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs font-mono uppercase tracking-wider text-stone-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>{isEn ? 'Loading details...' : 'Detaylar yükleniyor...'}</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : orderDetail ? (
          <div className="space-y-6">
            {/* Status & Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500">
                  {isEn ? 'Order Status' : 'Sipariş Durumu'}
                </span>
                <div className="mt-1">
                  <OrderStatusBadge status={orderDetail.status} isEn={isEn} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500">
                  {isEn ? 'Payment Status' : 'Ödeme Durumu'}
                </span>
                <div className="mt-1">
                  <PaymentStatusBadge status={orderDetail.paymentStatus} isEn={isEn} />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500">
                  {isEn ? 'Date' : 'Tarih'}
                </span>
                <p className="font-mono text-xs font-medium mt-1">
                  {new Date(orderDetail.createdAt).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500">
                  {isEn ? 'Grand Total' : 'Toplam Tutar'}
                </span>
                <p className="font-mono text-sm font-semibold mt-1">
                  {formatCurrency(orderDetail.grandTotal, orderDetail.currency)}
                </p>
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-3">
              <h4 className="font-heading text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">
                {isEn ? 'Ordered Products' : 'Sipariş Edilen Ürünler'}
              </h4>
              <div className="border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
                {orderDetail.items.map((item, idx) => {
                  const anyItem = item as any
                  const name =
                    anyItem.productNameSnapshot ||
                    anyItem.productName ||
                    anyItem.name ||
                    (isEn ? 'Product' : 'Ürün')
                  const sku = anyItem.skuSnapshot || anyItem.sku || ''
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                          {name}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500 mt-0.5">
                          {sku && <span>SKU: {sku}</span>}
                          <span>
                            {isEn ? 'Quantity' : 'Adet'}: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold">
                        {formatCurrency(item.totalPrice, orderDetail.currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Address Snapshots (if present) */}
            {(shippingSnapshot || billingSnapshot) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippingSnapshot && (
                  <div className="p-4 border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                      {isEn ? 'Shipping Address (Snapshot)' : 'Teslimat Adresi (Kayıt Anı)'}
                    </span>
                    <p className="text-xs font-medium">
                      {shippingSnapshot.firstName} {shippingSnapshot.lastName}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {shippingSnapshot.addressLine1}
                      {shippingSnapshot.addressLine2 ? `, ${shippingSnapshot.addressLine2}` : ''}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {shippingSnapshot.district} / {shippingSnapshot.city}
                    </p>
                  </div>
                )}

                {billingSnapshot && (
                  <div className="p-4 border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
                      {isEn ? 'Billing Address (Snapshot)' : 'Fatura Bilgisi (Kayıt Anı)'}
                    </span>
                    {corporateSnapshot ? (
                      <>
                        <p className="text-xs font-medium">{corporateSnapshot.companyName}</p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                          {isEn ? 'Tax No' : 'VKN'}: {maskTaxNumber(corporateSnapshot.taxNumber)} •{' '}
                          {corporateSnapshot.taxOffice}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium">
                        {billingSnapshot.firstName} {billingSnapshot.lastName} (
                        {isEn ? 'Individual' : 'Bireysel'})
                      </p>
                    )}
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {billingSnapshot.addressLine1}
                      {billingSnapshot.addressLine2 ? `, ${billingSnapshot.addressLine2}` : ''}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {billingSnapshot.district} / {billingSnapshot.city}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 space-y-1 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>{isEn ? 'Subtotal' : 'Ara Toplam'}</span>
                <span className="font-mono">
                  {formatCurrency(orderDetail.subtotal, orderDetail.currency)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>{isEn ? 'VAT / Tax' : 'KDV'}</span>
                <span className="font-mono">
                  {formatCurrency(orderDetail.taxTotal, orderDetail.currency)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
                <span>{isEn ? 'Grand Total' : 'Genel Toplam'}</span>
                <span className="font-mono">
                  {formatCurrency(orderDetail.grandTotal, orderDetail.currency)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// HELPERS & BADGES
// ==========================================

function maskTaxNumber(taxNumber?: string | null): string {
  if (!taxNumber) return '—'
  const trimmed = taxNumber.trim()
  if (trimmed.length <= 4) return trimmed
  return '******' + trimmed.slice(-4)
}

function OrderStatusBadge({status, isEn}: {status: string; isEn?: boolean}) {
  const mapTr: Record<string, {label: string; style: string}> = {
    CONFIRMED: {
      label: 'Onaylandı',
      style:
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    },
    PENDING_PAYMENT: {
      label: 'Ödeme Bekleniyor',
      style:
        'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    },
    PROCESSING: {
      label: 'Hazırlanıyor',
      style:
        'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    },
    SHIPPED: {
      label: 'Kargoya Verildi',
      style:
        'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200',
    },
    DELIVERED: {
      label: 'Teslim Edildi',
      style:
        'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200',
    },
    CANCELLED: {
      label: 'İptal Edildi',
      style:
        'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    },
  }

  const mapEn: Record<string, {label: string; style: string}> = {
    CONFIRMED: {
      label: 'Confirmed',
      style:
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    },
    PENDING_PAYMENT: {
      label: 'Pending Payment',
      style:
        'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    },
    PROCESSING: {
      label: 'Processing',
      style:
        'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    },
    SHIPPED: {
      label: 'Shipped',
      style:
        'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200',
    },
    DELIVERED: {
      label: 'Delivered',
      style:
        'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200',
    },
    CANCELLED: {
      label: 'Cancelled',
      style:
        'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    },
  }

  const map = isEn ? mapEn : mapTr
  const item = map[status] || {label: status, style: 'bg-stone-100 border-stone-300 text-stone-700'}
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase border ${item.style}`}
    >
      {item.label}
    </span>
  )
}

function PaymentStatusBadge({status, isEn}: {status: string; isEn?: boolean}) {
  const mapTr: Record<string, {label: string; style: string}> = {
    PAID: {
      label: 'Ödendi',
      style:
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    },
    PENDING: {
      label: 'Bekliyor',
      style:
        'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    },
    FAILED: {
      label: 'Başarısız',
      style:
        'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    },
    REFUNDED: {
      label: 'İade Edildi',
      style:
        'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200',
    },
  }

  const mapEn: Record<string, {label: string; style: string}> = {
    PAID: {
      label: 'Paid',
      style:
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    },
    PENDING: {
      label: 'Pending',
      style:
        'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    },
    FAILED: {
      label: 'Failed',
      style:
        'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    },
    REFUNDED: {
      label: 'Refunded',
      style:
        'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200',
    },
  }

  const map = isEn ? mapEn : mapTr
  const item = map[status] || {label: status, style: 'bg-stone-100 border-stone-300 text-stone-700'}
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase border ${item.style}`}
    >
      {item.label}
    </span>
  )
}
