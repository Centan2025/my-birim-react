import {useEffect, useState} from 'react'
import {useLocation, useNavigate, Link} from 'react-router-dom'
import {useAuth} from '../App'

export function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  const searchParams = new URLSearchParams(
    location.search || location.hash.split('?')[1] || ''
  )
  const token = searchParams.get('token') || ''

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!token) {
        setStatus('error')
        return
      }

      try {
        const {verifyUserByToken} = await import('../services/cms')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8 text-center">
        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-semibold mb-4">E-posta Doğrulanıyor…</h1>
            <p className="text-gray-600 mb-2">
              Lütfen birkaç saniye bekleyin, üyeliğiniz doğrulanıyor.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-semibold mb-4">E-posta Doğrulama Başarılı</h1>
            <p className="text-gray-600 mb-4">
              Üyeliğiniz başarıyla doğrulandı. Kısa süre içinde üye paneline yönlendirileceksiniz.
            </p>
            <Link
              to="/profile"
              className="inline-block bg-gray-900 text-white px-6 py-2 font-semibold hover:bg-gray-800 transition-colors duration-200"
            >
              Üye Paneline Git
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Doğrulama Başarısız</h1>
            <p className="text-gray-600 mb-4">
              Doğrulama linkiniz geçersiz veya süresi dolmuş olabilir. Lütfen tekrar üye olun veya
              yeni bir doğrulama maili isteyin.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gray-900 text-white px-6 py-2 font-semibold hover:bg-gray-800 transition-colors duration-200"
            >
              Giriş / Üye Ol
            </Link>
          </>
        )}
      </div>
    </div>
  )
}


