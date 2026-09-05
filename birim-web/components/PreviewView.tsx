import React from 'react'

interface PreviewViewProps {
  document: {
    displayed: {
      _id?: string
      _type: string
      [key: string]: unknown
    }
  }
}

export function PreviewView({document}: PreviewViewProps) {
  const {displayed} = document
  if (!displayed) {
    return (
      <div style={{padding: '2em', textAlign: 'center'}}>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  const rawSlug =
    (displayed.id as {current?: string})?.current ||
    (displayed.slug as {current?: string})?.current ||
    displayed._id?.replace(/^drafts\./, '') ||
    ''
  const type = displayed._type

  // Site URL tespiti
  const remoteUrl = 'https://www.birim.com'
  const localUrl = 'http://localhost:3001'
  const baseUrl = window.location.hostname === 'localhost' ? localUrl : remoteUrl

  // Tip bazlı path tespiti
  let path = ''
  switch (type) {
    case 'product':
      path = `/product/${rawSlug}`
      break
    case 'project':
      path = `/projects/${rawSlug}`
      break
    case 'newsItem':
      path = `/news/${rawSlug}`
      break
    case 'category':
      path = `/products/${rawSlug}`
      break
    case 'designer':
      path = `/designer/${rawSlug}`
      break
    case 'homePage':
      path = '/'
      break
    case 'aboutPage':
    case 'aboutPageV2':
      path = '/about'
      break
    case 'factoryPage':
      path = '/factory'
      break
    case 'contactPage':
      path = '/contact'
      break
    default:
      path = '/'
  }

  // Preview token
  const previewToken =
    (typeof import.meta !== 'undefined' && import.meta.env?.['SANITY_STUDIO_PREVIEW_TOKEN']) ||
    (typeof process !== 'undefined' && process.env?.['SANITY_STUDIO_PREVIEW_TOKEN']) ||
    (typeof process !== 'undefined' && process.env?.['SANITY_TOKEN']) ||
    ''

  const url = `${baseUrl}/#${path}${path.includes('?') ? '&' : '?'}preview=${previewToken}`

  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <div
        style={{
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
          color: '#666',
          zIndex: 10,
        }}
      >
        Önizleme Adresi: {url}
      </div>
      <iframe
        src={url}
        style={{width: '100%', height: 'calc(100% - 30px)', marginTop: '30px', border: 'none'}}
        title="Görsel Önizleme"
      />
    </div>
  )
}
