import React from 'react'

export function PreviewView({document, options}: any) {
  const {displayed} = document
  if (!displayed) {
    return (
      <div style={{padding: '2em', textAlign: 'center'}}>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  const {id, _type} = displayed
  const pubId = id.replace(/^drafts\./, '')
  
  // Site URL tespiti
  const remoteUrl = 'https://www.birim.com'
  const localUrl = 'http://localhost:5173'
  const baseUrl = window.location.hostname === 'localhost' ? localUrl : remoteUrl

  // Tip bazlı path tespiti
  let path = ''
  switch (_type) {
    case 'product':
      path = `/product/${pubId}`
      break
    case 'project':
      path = `/projects/${pubId}`
      break
    case 'newsItem':
      path = `/news/${pubId}`
      break
    case 'designer':
      path = `/designers/${pubId}`
      break
    case 'homePage':
      path = '/'
      break
    case 'aboutPage':
      path = '/about'
      break
    case 'factoryPage':
      path = '/factory'
      break
    default:
      path = '/'
  }

  // Preview token (sk... ile başlayan token güvenli bir şekilde aktarılmalı)
  // Şimdilik sadece preview modu aktif etmek için flag gönderiyoruz
  // Gerçek token .env'den VITE_SANITY_TOKEN olarak eklenmeli
  const previewToken = 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw'
  
  const url = `${baseUrl}/#${path}${path.includes('?') ? '&' : '?'}preview=${previewToken}`

  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30px',
        background: '#f4f4f4',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        borderBottom: '1px solid #ddd',
        color: '#666'
      }}>
        Önizleme: {url}
      </div>
      <iframe
        src={url}
        style={{width: '100%', height: 'calc(100% - 30px)', marginTop: '30px', border: 'none'}}
        title="Görsel Önizleme"
      />
    </div>
  )
}
