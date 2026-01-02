import { useState, useEffect, useRef, FC, FormEventHandler } from 'react'
import { subscribeEmail } from '../services/cms'
import { analytics } from '../lib/analytics'
import { useTranslation } from '../i18n'

interface NewsletterFormProps {
  variant?: 'mobile' | 'desktop'
  className?: string
}

export const NewsletterForm: FC<NewsletterFormProps> = ({ variant = 'mobile', className }) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [isMessageVisible, setIsMessageVisible] = useState(false)

  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showMessage = (msg: string, type: 'success' | 'error') => {
    // Önceki zamanlayıcıları temizle
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

    setMessage(msg)
    setStatus(type)

    // Fade-in efekti için önce görünmez yapıp bir sonraki tickte görünür yapıyoruz
    setIsMessageVisible(false)
    setTimeout(() => {
      setIsMessageVisible(true)
    }, 10)

    // 3 saniye sonra fade-out başlat
    messageTimeoutRef.current = setTimeout(() => {
      setIsMessageVisible(false)

      // Fade-out animasyonu (300ms) bitince mesajı sil
      hideTimeoutRef.current = setTimeout(() => {
        setMessage(null)
        setStatus('idle')
      }, 300)
    }, 3000)
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    if (!email) return

    const normalizedEmail = email.trim().toLowerCase()

    // Aynı tarayıcıda / oturumda tekrar tekrar aynı e-postayı göndermeyi
    // engellemek ve kullanıcıya "zaten abonesiniz" demek için basit bir
    // localStorage kontrolü ekliyoruz.
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('birim_newsletter_subscribers')
        const list: string[] = raw ? JSON.parse(raw) : []
        if (list.includes(normalizedEmail)) {
          const alreadyMessage = t('newsletter_already_subscribed') || 'Bu e-posta adresi zaten aboneliğe kayıtlı.'
          showMessage(alreadyMessage, 'success')
          return
        }
      }
    } catch {
      // localStorage erişilemezse sessizce devam et
    }

    setStatus('loading')
    // Mesajı hemen sıfırlamıyoruz, showMessage zaten halledecek

    try {
      const result = await subscribeEmail(email)
      analytics.trackUserAction('newsletter_subscribe', email)

      // Backend bazı durumlarda "zaten kayıtlı" uyarısını normal dönüşte verebilir;
      // bu yüzden hem dönüş değerine hem de hata mesajlarına bakıyoruz.
      const normalizedMessage = String(
        (result as { message?: string } | null | undefined)?.message || ''
      ).toLowerCase()
      const isAlready =
        normalizedMessage.includes('zaten aboneliğe kayıtlı') ||
        normalizedMessage.includes('zaten kayıtlı') ||
        normalizedMessage.includes('already subscribed')

      const finalMessage = isAlready
        ? t('newsletter_already_subscribed') || 'Bu e-posta adresi zaten aboneliğe kayıtlı.'
        : t('newsletter_success') || 'E-posta aboneliğiniz başarıyla oluşturuldu.'

      showMessage(finalMessage, 'success')

      // Başarılı abonelikte (veya zaten kayıtlıysa) e-postayı localStorage'a yaz
      try {
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem('birim_newsletter_subscribers')
          const list: string[] = raw ? JSON.parse(raw) : []
          if (!list.includes(normalizedEmail)) {
            list.push(normalizedEmail)
            window.localStorage.setItem(
              'birim_newsletter_subscribers',
              JSON.stringify(list)
            )
          }
        }
      } catch {
        // localStorage yazılamazsa sessizce devam et
      }

      setEmail('')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : String((err as unknown) ?? '')

      if (errorMessage === 'EMAIL_SUBSCRIBER_LOCAL_STORAGE') {
        // Token yokken local storage'a yazılan durum
        const localMessage = t('newsletter_success_local') ||
          "E-posta aboneliğiniz kaydedildi. CMS'de görünmesi için VITE_SANITY_TOKEN ekleyin."
        showMessage(localMessage, 'success')
        analytics.trackUserAction('newsletter_subscribe', email)
        setEmail('')
      } else if (
        errorMessage.includes('zaten aboneliğe kayıtlı') ||
        errorMessage.includes('zaten kayıtlı') ||
        errorMessage.toLowerCase().includes('already subscribed')
      ) {
        // E-posta zaten CMS'de veya localde kayıtlıysa
        const alreadyMessage = t('newsletter_already_subscribed') || 'Bu e-posta adresi zaten aboneliğe kayıtlı.'
        showMessage(alreadyMessage, 'success')
      } else {
        const errorMsg = errorMessage ||
          t('newsletter_error') ||
          "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
        showMessage(errorMsg, 'error')
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const isDesktop = variant === 'desktop'

  return (
    <form
      onSubmit={handleSubmit}
      className={`${isDesktop ? 'flex flex-col items-end' : 'flex flex-col items-center'} ${className || ''
        }`}
    >
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
          onChange={e => {
            setEmail(e.target.value)
            // Kullanıcı e-postayı düzenlemeye başladığında mesajı hemen temizle
            if (message) {
              if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
              if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
              setMessage(null)
              setStatus('idle')
              setIsMessageVisible(false)
            }
          }}
          placeholder={t('email_placeholder')}
          className={
            isDesktop
              ? 'w-full py-0.5 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[14px] text-left'
              : 'w-full py-1 bg-transparent border-0 rounded-none text-white placeholder-white/40 focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-200 text-[15px] text-left'
          }
          style={{ outline: 'none', boxShadow: 'none' }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={
            isDesktop
              ? 'px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-xs font-bold tracking-[0.25em] whitespace-nowrap'
              : 'px-0 py-1 bg-transparent border-0 text-gray-300 hover:text-white transition-colors duration-200 text-xs font-bold tracking-[0.25em] whitespace-nowrap'
          }
        >
          {status === 'loading' ? t('subscribing') || '...' : t('subscribe')}
        </button>
      </div>
      {/* Mesaj için sabit yükseklikte alan ayırarak alt elemanların aşağı itilmesini engelle */}
      <div
        className={
          isDesktop
            ? 'mt-2 min-h-[18px] w-full text-left'
            : 'mt-3 min-h-[18px] w-full flex justify-center'
        }
      >
        {message && (
          <p
            className={`text-[11px] md:text-xs leading-snug transition-all duration-300 ease-in-out transform ${status === 'error' ? 'text-red-400' : 'text-gray-200'
              } ${isMessageVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-2'
              }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  )
}

