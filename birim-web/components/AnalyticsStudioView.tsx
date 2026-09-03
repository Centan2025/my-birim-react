import React, {useState, useEffect} from 'react'

export const AnalyticsStudioView: React.FC = () => {
  // Determine site URL based on current host
  const [siteUrl, setSiteUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const base = isLocal ? 'http://localhost:3001' : 'https://www.birim.com'
      // Pass bypass / studio auth so Studio users don't need to enter PIN
      setSiteUrl(`${base}/site-analitigi?bypass=birim-dev-2025`)
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{fontSize: '18px'}}>📊</span>
          <span style={{fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px'}}>
            Google Analytics 4 (GA4) &mdash; Canlı Site Analitiği
          </span>
        </div>
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#818cf8',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Ayrı Sekmede Aç ↗
          </a>
        )}
      </div>

      {siteUrl ? (
        <iframe
          src={siteUrl}
          title="Birim Site Analitiği"
          style={{
            width: '100%',
            flex: 1,
            minHeight: '850px',
            border: 'none',
            backgroundColor: '#f8fafc',
          }}
        />
      ) : (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1}}>
          <p style={{color: '#64748b'}}>Yükleniyor...</p>
        </div>
      )}
    </div>
  )
}
