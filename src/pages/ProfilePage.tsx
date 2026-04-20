/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { deleteUserAccount } from '../services/cms'
import { motion } from 'framer-motion'
import { User, Mail, Building, Globe, Briefcase, Calendar, ArrowRight, LogOut, Trash2 } from 'lucide-react'

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
      <div className="bg-[#f5f5f5] min-h-[70vh] flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-12 bg-white shadow-sm border border-black/5 max-w-md w-full"
        >
          <h1 className="text-xl font-bold uppercase tracking-[0.3em] mb-4 text-gray-900">{t('login_required')}</h1>
          <p className="text-gray-500 mb-10 text-sm font-inter leading-relaxed">{t('login_required_desc')}</p>
          <Link
            to="/login"
            className="inline-block w-full bg-[#e5e5e5] text-black border border-black font-bold py-4 px-8 uppercase tracking-[0.2em] text-[11px] hover:bg-[#d8d8d8] transition-all duration-500 font-inter"
          >
            {t('login')}
          </Link>
        </motion.div>
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

  const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | undefined, icon: any }) => {
    if (!value) return null
    return (
      <div className="group py-6 border-b border-black/5 last:border-0 flex items-start gap-6 transition-colors hover:bg-black/[0.01] px-2 -mx-2">
        <div className="mt-1">
          <Icon className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors duration-500" strokeWidth={1} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold mb-2">{label}</p>
          <p className="text-sm md:text-base font-inter font-medium text-gray-900 tracking-wide">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-24 md:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-black/5 overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-white px-8 py-12 md:px-12 md:py-16 border-b border-black/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none -translate-y-1/4 translate-x-1/4">
                <User className="w-64 h-64" strokeWidth={0.5} />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-[0.4em] mb-4">
                {t('member_panel')}
                <span className="block h-1 w-20 bg-black mt-4" />
              </h1>
              <p className="text-gray-400 text-xs md:text-sm uppercase tracking-widest font-medium max-w-md leading-relaxed">
                {t('profile_description')}
              </p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {/* Verification Alert */}
              {auth.user.isVerified === false && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50/50 border border-red-100 text-red-800 px-6 py-4 text-xs md:text-sm font-inter tracking-wide leading-relaxed flex items-center gap-4"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {t('email_not_verified')}
                </motion.div>
              )}

              {/* Account Information */}
              <section>
                <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  {t('account_info')}
                  <div className="h-px flex-1 bg-black/5" />
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <InfoItem label={t('email')} value={auth.user.email} icon={Mail} />
                  <InfoItem label={t('full_name')} value={auth.user.name} icon={User} />
                  <InfoItem label={t('company')} value={auth.user.company} icon={Building} />
                  <InfoItem label={t('country')} value={auth.user.country} icon={Globe} />
                  <InfoItem label={t('profession')} value={auth.user.profession} icon={Briefcase} />
                  <InfoItem
                    label={t('registration_date')}
                    icon={Calendar}
                    value={new Date(auth.user.createdAt).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  />
                </div>
              </section>

              {/* Exclusive Content Section */}
              {auth.user.isVerified !== false && (
                <section className="bg-gray-50/50 p-8 border border-black/5">
                  <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-4">
                    {t('exclusive_access')}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500 font-inter mb-8 tracking-wide leading-relaxed max-w-xl">
                    {t('exclusive_access_desc')}
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-between min-w-[240px] bg-[#e5e5e5] text-black border border-black font-bold py-4 px-8 uppercase tracking-[0.2em] text-[11px] hover:bg-[#d8d8d8] transition-all duration-500 font-inter group"
                  >
                    <span>{t('view_products')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </section>
              )}

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-4 bg-[#e5e5e5] text-black border border-black font-bold py-4 px-10 uppercase tracking-[0.25em] text-[11px] hover:bg-[#d8d8d8] transition-all duration-500 font-inter min-w-[200px]"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-4 border border-black/10 text-gray-400 hover:text-red-600 hover:border-red-600/30 transition-all duration-500 uppercase tracking-[0.25em] text-[10px] font-bold font-inter px-10 py-4 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? t('deleting') : t('delete_account')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


