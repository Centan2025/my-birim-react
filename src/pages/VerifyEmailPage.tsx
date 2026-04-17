import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

export function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  const searchParams = new URLSearchParams(location.search || location.hash.split('?')[1] || '')
  let token = searchParams.get('token') || ''
  if (token.includes('#')) {
    token = token.split('#')[0] || ''
  }

  useSEO({
    title: 'BIRIM - E-posta Doğrulama',
    description: 'Üyeliğinizi doğrulayın ve üye paneline erişin.',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
  })

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!token) {
        setStatus('error')
        return
      }

      try {
        const { verifyUserByToken } = await import('../services/cms')
        const user = await verifyUserByToken(token)
        if (!user) {
          if (!cancelled) setStatus('error')
          return
        }

        if (!cancelled) {
          auth.login(user)
          setStatus('success')
          setTimeout(() => {
            navigate('/profile')
          }, 1500)
        }
      } catch (e) {
        if (!cancelled) setStatus('error')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [token, auth, navigate])

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-8 text-center shadow-sm">
        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">E-posta Doğrulanıyor…</h1>
            <p className="text-[var(--text-secondary)] mb-2">
              Lütfen birkaç saniye bekleyin, üyeliğiniz doğrulanıyor.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">E-posta Doğrulama Başarılı</h1>
            <p className="text-[var(--text-secondary)] mb-4">
              Üyeliğiniz başarıyla doğrulandı. Kısa süre içinde üye paneline yönlendirileceksiniz.
            </p>
            <Link
              to="/profile"
              className="inline-block bg-[var(--text-primary)] text-[var(--bg-primary)] px-8 py-3 font-semibold hover:opacity-90 transition-all duration-200"
            >
              Üye Paneline Git
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Doğrulama Başarısız</h1>
            <p className="text-[var(--text-secondary)] mb-4">
              Doğrulama linkiniz geçersiz veya süresi dolmuş olabilir. Lütfen tekrar üye olun veya
              yeni bir doğrulama maili isteyin.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[var(--text-primary)] text-[var(--bg-primary)] px-8 py-3 font-semibold hover:opacity-90 transition-all duration-200"
            >
              Giriş / Üye Ol
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
