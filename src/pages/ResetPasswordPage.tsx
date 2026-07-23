import {useState} from 'react'
import {useSearchParams, useNavigate, Link} from 'react-router-dom'
import {useTranslation} from '../i18n'
import {requestPasswordReset, resetPassword} from '../services/cms'
import {useSEO} from '../hooks/useSEO'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const {t} = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useSEO({
    title: `BIRIM - ${t('reset_password')}`,
    description: t('reset_password_desc'),
  })

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(t('reset_link_sent'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError(t('passwords_mismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('password_min_length'))
      return
    }

    setIsLoading(true)

    try {
      if (!token) throw new Error(t('invalid_token'))
      await resetPassword(token, password)
      setSuccess(t('password_updated'))
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-light text-[var(--text-primary)] mb-2 tracking-tight">
            {token ? t('set_new_password') : t('forgot_password')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {token ? t('set_new_password_desc') : t('forgot_password_desc')}
          </p>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-8 shadow-sm">
          {!token ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-[var(--text-primary)] transition-all duration-200"
                  style={{outline: 'none', boxShadow: 'none'}}
                  placeholder={t('email_placeholder')}
                />
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">{success}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium hover:opacity-90 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? t('sending') : t('send_reset_link')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                  {t('new_password')}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-[var(--text-primary)] transition-all duration-200"
                  style={{outline: 'none', boxShadow: 'none'}}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                >
                  {t('new_password_confirm')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-[var(--text-primary)] transition-all duration-200"
                  style={{outline: 'none', boxShadow: 'none'}}
                  placeholder="••••••••"
                />
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">{success}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium hover:opacity-90 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? t('updating') : t('update_password')}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
            >
              {t('back_to_login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
