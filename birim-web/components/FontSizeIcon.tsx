import React, {useRef, useEffect} from 'react'
import {usePortableTextEditor, PortableTextEditor} from '@portabletext/editor'

export const FONT_SIZE_MARKS = [
  'size-12px',
  'size-14px',
  'size-16px',
  'size-18px',
  'size-24px',
  'size-32px',
  'size-48px',
]

interface FontSizeIconProps {
  px: string
  markValue: string
}

/**
 * FontSizeIcon:
 * Sanity Portable Text Toolbar ve açılır menüsünde font boyutu ikonunu render eder.
 * Tıklandığında diğer tüm font boyutlarını otomatik olarak kapatarak
 * "tekli seçim (radio button)" davranışını sağlar.
 */
export default function FontSizeIcon({px, markValue}: FontSizeIconProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  let editor: any = null
  try {
    editor = usePortableTextEditor()
  } catch {
    // PortableTextEditor bağlamı dışında (SSR / şema ayrıştırma) hata vermesini engelle
  }

  useEffect(() => {
    const el = spanRef.current
    if (!el || !editor) return

    // İkonun içinde bulunduğu buton veya menü öğesini bul (toolbar button ya da dropdown menu item)
    const btn = el.closest('button, [role="menuitem"], [role="option"]')
    if (!btn) return

    const handleAction = () => {
      if (!editor) return
      // Seçilen font boyutu açılmadan önce, mevcut diğer aktif font boyutlarını kapat
      FONT_SIZE_MARKS.forEach((m) => {
        if (m !== markValue) {
          try {
            if (PortableTextEditor.isMarkActive(editor, m)) {
              PortableTextEditor.toggleMark(editor, m)
            }
          } catch {
            // Editör odaklanmamışsa veya meşgulse hata yutulur
          }
        }
      })
    }

    // Capture fazında dinleyerek Sanity'nin kendi toggleMark olayından HEMEN ÖNCE çalıştırıyoruz
    btn.addEventListener('click', handleAction, true)
    btn.addEventListener('pointerdown', handleAction, true)

    return () => {
      btn.removeEventListener('click', handleAction, true)
      btn.removeEventListener('pointerdown', handleAction, true)
    }
  }, [editor, markValue])

  return (
    <span ref={spanRef} style={{fontSize: '11px', fontWeight: 700, padding: '0 2px'}}>
      {px}
    </span>
  )
}
