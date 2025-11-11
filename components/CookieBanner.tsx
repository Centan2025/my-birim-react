import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie_consent_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setVisible(!v);
    } catch {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ all: true, ts: Date.now() })); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-4">
        <div className="rounded-md bg-black/80 text-white backdrop-blur border border-white/10 p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <p className="text-sm leading-relaxed flex-1">
              Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Detaylar için{' '}
              <Link to="/cookies" className="underline underline-offset-2 hover:text-white">
                Çerez Politikası
              </Link>
              'nı inceleyebilirsiniz.
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/cookies"
                className="px-3 py-2 text-xs rounded border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Daha Fazla Bilgi
              </Link>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-xs rounded bg-white text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


