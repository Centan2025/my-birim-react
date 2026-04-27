import React from 'react'

export default function PortableTextImagePreview(props: any) {
  let url = props.imageR2?.url || props.value?.imageR2?.url
  const domain = process.env.SANITY_STUDIO_R2_DOMAIN

  // Rewrite .r2.dev to the custom worker domain if needed
  if (url && domain && url.includes('.r2.dev') && !domain.includes('.r2.dev')) {
    try {
      const parsed = new URL(url)
      let path = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname

      // Hardening: Add migration prefix for known folders if missing
      const r2Folders = [
        'uploads/',
        'bulk-uploads/',
        'products/',
        'designers/',
        'projects/',
        'news/',
      ]
      if (!path.startsWith('migration/')) {
        const folder = r2Folders.find((f) => path.startsWith(f))
        if (folder) {
          path = `migration/${path}`
        }
      }

      url = `${domain}/${path}`
    } catch (e) {
      // ignore
    }
  }
  const title = props.caption || props.alt || props.title || 'Görsel (R2)'

  return (
    <div style={{display: 'flex', flexDirection: 'column', padding: '0.5rem'}}>
      {url ? (
        <img
          src={url}
          alt={title}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            objectFit: 'contain',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
          }}
        />
      ) : (
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f3f4f6',
            textAlign: 'center',
            borderRadius: '4px',
            color: '#6b7280',
          }}
        >
          Lütfen bir görsel seçin
        </div>
      )}
      <div style={{marginTop: '0.5rem', fontWeight: 600, fontSize: '14px', textAlign: 'center'}}>
        {title}
      </div>
    </div>
  )
}
