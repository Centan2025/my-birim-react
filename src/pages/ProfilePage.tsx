import {useNavigate} from 'react-router-dom'
import {useAuth} from '../App'
import {useTranslation} from '../i18n'
import {Link} from 'react-router-dom'
import {useSEO} from '../hooks/useSEO'

export function ProfilePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const {t} = useTranslation()
  const pageTitle = `BIRIM - ${t('profile') || 'Üye Paneli'}`

  useSEO({
    title: pageTitle,
    description:
      t('profile_description') ||
      'Üye bilgilerinizi yönetin, özel içeriklere ve ürünlere erişin.',
    siteName: 'BIRIM',
    type: 'profile',
    locale: 'tr_TR',
  })

  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="bg-gray-50 flex items-center justify-center animate-fade-in-up-subtle py-20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold mb-4">Giriş Yapmanız Gerekiyor</h1>
          <p className="text-gray-600 mb-6">Bu sayfaya erişmek için üye olmanız gerekiyor.</p>
          <Link
            to="/login"
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    auth.logout()
    navigate('/')
  }

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-none p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Üye Paneli</h1>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
                <div className="space-y-3">
                  {auth.user.isVerified === false && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm">
                      E-posta adresinizi henüz doğrulamadınız. Lütfen gelen kutunuzu kontrol edin ve
                      doğrulama linkine tıklayın. Doğrulama tamamlanana kadar özel içeriklere
                      erişiminiz kısıtlı olacaktır.
                    </div>
                  )}
                  <div aria-label="E-posta" className="space-y-1">
                    <p className="block text-sm font-medium text-gray-700">E-posta</p>
                    <p className="text-sm text-gray-900">{auth.user.email}</p>
                  </div>
                  {auth.user.name && (
                    <div aria-label="Ad Soyad" className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">Ad Soyad</p>
                      <p className="text-sm text-gray-900">{auth.user.name}</p>
                    </div>
                  )}
                  {auth.user.company && (
                    <div aria-label="Firma" className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">Firma</p>
                      <p className="text-sm text-gray-900">{auth.user.company}</p>
                    </div>
                  )}
                  {auth.user.country && (
                    <div aria-label="Ülke" className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">Ülke</p>
                      <p className="text-sm text-gray-900">{auth.user.country}</p>
                    </div>
                  )}
                  {auth.user.profession && (
                    <div aria-label="Meslek" className="space-y-1">
                      <p className="block text-sm font-medium text-gray-700">Meslek</p>
                      <p className="text-sm text-gray-900">{auth.user.profession}</p>
                    </div>
                  )}
                  <div aria-label="Kayıt Tarihi" className="space-y-1">
                    <p className="block text-sm font-medium text-gray-700">Kayıt Tarihi</p>
                    <p className="text-sm text-gray-900">
                      {new Date(auth.user.createdAt).toLocaleDateString('tr-TR', {
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Özel İçerik Erişimi</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Üye olduğunuz için ürünlerin özel içeriklerine (teknik çizimler, 3D modeller,
                    özel görseller) erişebilirsiniz.
                  </p>
                  <Link
                    to="/products"
                    className="inline-block bg-gray-800 text-white font-semibold py-2 px-6 rounded-none hover:bg-gray-700 transition-colors duration-200"
                  >
                    Ürünleri Görüntüle
                  </Link>
                </div>
              )}

              <div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white font-semibold py-2 px-6 rounded-none hover:bg-red-700 transition-colors duration-200"
                >
                  {t('logout') || 'Çıkış Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
