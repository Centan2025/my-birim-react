import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '../i18n'
import { requestPasswordReset, resetPassword } from '../services/cms'
import { useSEO } from '../hooks/useSEO'

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useSEO({
        title: `BIRIM - ${t('reset_password') || 'Şifre Sıfırlama'}`,
        description: 'BIRIM hesabınızın şifresini sıfırlayın.',
    })

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsLoading(true)

        try {
            await requestPasswordReset(email)
            setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password !== confirmPassword) {
            setError('Şifreler uyuşmuyor.')
            return
        }

        if (password.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır.')
            return
        }

        setIsLoading(true)

        try {
            if (!token) throw new Error('Geçersiz token.')
            await resetPassword(token, password)
            setSuccess('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-light text-gray-900 mb-2 tracking-tight">
                        {token ? 'Yeni Şifre Belirle' : 'Şifremi Unuttum'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {token
                            ? 'Lütfen hesabınız için yeni bir şifre girin.'
                            : 'E-posta adresinizi girerek şifre sıfırlama bağlantısı isteyebilirsiniz.'}
                    </p>
                </div>

                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                    {!token ? (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('email') || 'E-posta'}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 outline-none"
                                    placeholder="E-posta adresiniz"
                                />
                            </div>

                            {error && <div className="text-red-600 text-sm">{error}</div>}
                            {success && <div className="text-green-600 text-sm">{success}</div>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Yeni Şifre
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Yeni Şifre (Tekrar)
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && <div className="text-red-600 text-sm">{error}</div>}
                            {success && <div className="text-green-600 text-sm">{success}</div>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
