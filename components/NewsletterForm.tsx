import React, {useState} from 'react'

import {subscribeEmail} from '../services/cms'
import {analytics} from '../src/lib/analytics'
import {useTranslation} from '../i18n'

interface NewsletterFormProps {
  variant?: 'mobile' | 'desktop'
  className?: string
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({variant = 'mobile', className}) => {
  const {t} = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage(null)

    try {
      await subscribeEmail(email)
      analytics.trackUserAction('newsletter_subscribe', email)
      setStatus('success')
      setMessage(t('newsletter_success') || 'E-posta aboneliğiniz başarıyla oluşturuldu.')
      setEmail('')
    } catch (err: any) {
      if (err?.message === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
        setStatus('success')
        setMessage(
          t('newsletter_success_local') ||
            "E-posta aboneliğiniz kaydedildi. CMS'de görünmesi için VITE_SANITY_TOKEN ekleyin."
        )
        analytics.trackUserAction('newsletter_subscribe', email)
        setEmail('')
      } else {
        setStatus('error')
        setMessage(
          err?.message ||
            t('newsletter_error') ||
            "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
        )
      }
    }
  }

  const isDesktop = variant === 'desktop'

  return (
    <form onSubmit={handleSubmit} className={className}>
      {variant === 'mobile' && (
        <p className="text-sm text-gray-300 mb-4 text-center">{t('subscribe_prompt')}</p>
      )}
      <div
        className={
          isDesktop
            ? 'flex items-center w-full lg:w-auto lg:min-w-[320px] lg:ml-auto border-b border-white/80 pb-0.5 gap-2'
            : 'flex items-center justify-center border-b border-white pb-0.5 w-full max-w-[280px] mx-auto'
        }
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('email_placeholder')}
          className={
            isDesktop
              ? 'w-full py-0.5 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[14px] text-left'
              : 'w-full py-1 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[15px] text-left'
          }
          style={{outline: 'none', boxShadow: 'none'}}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={
            isDesktop
              ? 'px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap'
              : 'px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-xs font-medium uppercase tracking-[0.25em] whitespace-nowrap'
          }
        >
          {status === 'loading' ? t('subscribing') || '...' : t('subscribe')}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${
            status === 'error' ? 'text-red-300' : 'text-emerald-300'
          } text-center max-w-xs mx-auto`}
        >
          {message}
        </p>
      )}
    </form>
  )
}


