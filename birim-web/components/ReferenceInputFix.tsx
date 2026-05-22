import React, {useEffect, useRef} from 'react'
import type {ReferenceInputProps} from 'sanity'

/**
 * ReferenceInputFix
 * Sanity Studio'nun dahili referans ve autocomplete bileşenlerinde eksik kalan
 * id ve name özniteliklerini MutationObserver kullanarak agresif bir şekilde yakalar ve atar.
 */
export default function ReferenceInputFix(props: ReferenceInputProps) {
  const {renderDefault, id} = props
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fixInputs = () => {
      if (!containerRef.current) return

      // Konteyner içindeki tüm inputları tara
      const inputs = containerRef.current.querySelectorAll('input')
      inputs.forEach((input) => {
        const role = input.getAttribute('role')
        const ariaLabel = input.getAttribute('aria-label') || ''
        const placeholder = input.placeholder || ''

        // Combobox olan veya "Search" ifadesi geçen inputları hedefle
        const isTarget =
          role === 'combobox' ||
          ariaLabel.toLowerCase().includes('search') ||
          placeholder.toLowerCase().includes('search')

        if (isTarget) {
          if (!input.id) input.id = id
          // @ts-ignore
          if (!input.name) input.name = id
        }
      })
    }

    // İlk yüklemede çalıştır
    fixInputs()

    // Sanity'nin asenkron render işlemleri (örneğin popover açılması) için MutationObserver kullan
    const observer = new MutationObserver(() => {
      fixInputs()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    // Kısa bir süre sonra tekrar kontrol et (bazı bileşenler gecikmeli render olabiliyor)
    const timeoutId = setTimeout(fixInputs, 500)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [id])

  return (
    <div ref={containerRef}>
      {/* Label'ın her zaman bir hedefi olması için sabit, gizli bir input */}
      <input
        type="text"
        id={id}
        name={id}
        autoComplete="off"
        readOnly
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
          opacity: 0,
        }}
      />
      {renderDefault(props)}
    </div>
  )
}
