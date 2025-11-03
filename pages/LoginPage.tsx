import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTranslation } from '../i18n';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'user@example.com' && password === 'password') {
      auth.login();
      navigate('/'); 
    } else {
      setError(t('invalid_credentials'));
    }
  };
  
  const handleLogout = () => {
    auth.logout();
    navigate('/');
  }

  if (auth.isLoggedIn) {
      return (
          <div className="bg-gray-50 flex items-center justify-center animate-fade-in-up py-20">
              <div className="text-center p-8">
                  <h1 className="text-2xl font-semibold mb-4">{t('already_logged_in')}</h1>
                  <button
                      onClick={handleLogout}
                      className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 active:scale-100 hover:shadow-lg"
                  >
                      {t('logout')}
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center pt-20 animate-fade-in-up py-20">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">{t('login')}</h2>
        <p className="text-center text-gray-600 mb-6">{t('login_prompt')} <br/> {t('login_test_creds')}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110 active:scale-100 hover:shadow-lg"
            >
              {t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}