import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useTranslation } from '../i18n'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { deleteUserAccount } from '../services/cms'

export function ProfilePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t, locale } = useTranslation()
  const pageTitle = `BIRIM - ${t('profile')}`
  const [isDeleting, setIsDeleting] = useState(false)

  useSEO({
    title: pageTitle,
    description: t('profile_description'),
    siteName: 'BIRIM',
    type: 'profile',
    locale: locale === 'tr' ? 'tr_TR' : 'en_US',
  })

  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="bg-gray-50 flex items-center justify-center animate-fade-in-up-subtle py-20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('login_required')}</h1>
          <p className="text-gray-600 mb-6">{t('login_required_desc')}</p>
          <Link
            to="/login"
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    auth.logout()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    if (!auth.user) return
    if (window.confirm(t('delete_account_confirm'))) {
      setIsDeleting(true)
      try {
        const success = await deleteUserAccount(auth.user._id)
        if (success) {
          auth.logout()
          navigate('/')
          alert(t('account_deleted'))
        } else {
          alert(t('account_delete_error'))
        }
      } catch (error) {
        alert(t('account_delete_error'))
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-US'

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-none p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('member_panel')}</h1>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('account_info')}</h2>
                <div className="space-y-3">
                  {auth.user.isVerified === false && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm">
                      {t('email_not_verified')}
                    </div>
                  )}
                  <div aria-label={t('email')} className="space-y-1">
                    <p className="block text-sm font-medium text-gray-700">{t('email')}</p>
                    <p className="text-sm text-gray-900">{auth.user.email}</p>
                  </div>
                  {auth.user.name && (
                    <div aria-label={t('full_name')} className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">{t('full_name')}</p>
                      <p className="text-sm text-gray-900">{auth.user.name}</p>
                    </div>
                  )}
                  {auth.user.company && (
                    <div aria-label={t('company')} className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">{t('company')}</p>
                      <p className="text-sm text-gray-900">{auth.user.company}</p>
                    </div>
                  )}
                  {auth.user.country && (
                    <div aria-label={t('country')} className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">{t('country')}</p>
                      <p className="text-sm text-gray-900">{auth.user.country}</p>
                    </div>
                  )}
                  {auth.user.profession && (
                    <div aria-label={t('profession')} className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">{t('profession')}</p>
                      <p className="text-sm text-gray-900">{auth.user.profession}</p>
                    </div>
                  )}
                  <div aria-label={t('registration_date')} className="space-y-1">
                    <p className="block text-sm font-medium text-gray-700">{t('registration_date')}</p>
                    <p className="text-sm text-gray-900">
                      {new Date(auth.user.createdAt).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {auth.user.isVerified !== false && (
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('exclusive_access')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('exclusive_access_desc')}
                  </p>
                  <Link
                    to="/products"
                    className="inline-block bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
                  >
                    {t('view_products')}
                  </Link>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
                >
                  {t('logout')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-600 text-white font-semibold py-2 px-6 rounded-none hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isDeleting ? t('deleting') : t('delete_account')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
