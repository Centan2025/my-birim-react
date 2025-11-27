import {useEffect} from 'react'

/**
 * Sayfa başlığını (document.title) güncellemek için basit hook.
 * Örn: usePageTitle('İletişim') => "BIRIM - İletişim"
 */
export const usePageTitle = (suffix: string) => {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const base = 'BIRIM'
    const finalTitle = suffix ? `${base} - ${suffix}` : base
    document.title = finalTitle
  }, [suffix])
}
