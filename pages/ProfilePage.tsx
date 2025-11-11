import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTranslation } from '../i18n';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!auth.isLoggedIn || !auth.user) {
    return (
      <div className="bg-gray-50 flex items-center justify-center animate-fade-in-up py-20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold mb-4">Giriş Yapmanız Gerekiyor</h1>
          <p className="text-gray-600 mb-6">Bu sayfaya erişmek için üye olmanız gerekiyor.</p>
          <Link
            to="/login"
            className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 active:scale-100 hover:shadow-lg"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Üye Paneli</h1>
            
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hesap Bilgileri</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-posta</label>
                    <p className="mt-1 text-sm text-gray-900">{auth.user.email}</p>
                  </div>
                  {auth.user.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                      <p className="mt-1 text-sm text-gray-900">{auth.user.name}</p>
                    </div>
                  )}
                  {auth.user.company && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Firma</label>
                      <p className="mt-1 text-sm text-gray-900">{auth.user.company}</p>
                    </div>
                  )}
                  {auth.user.profession && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Meslek</label>
                      <p className="mt-1 text-sm text-gray-900">{auth.user.profession}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(auth.user.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Özel İçerik Erişimi</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Üye olduğunuz için ürünlerin özel içeriklerine (teknik çizimler, 3D modeller, özel görseller) erişebilirsiniz.
                </p>
                <Link
                  to="/products"
                  className="inline-block bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 active:scale-100 hover:shadow-lg"
                >
                  Ürünleri Görüntüle
                </Link>
              </div>

              <div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 active:scale-100 hover:shadow-lg"
                >
                  {t('logout') || 'Çıkış Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

