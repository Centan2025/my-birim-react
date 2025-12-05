import React, {useEffect, useState, useRef} from 'react'
import {useLocation} from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

export const PageTransition: React.FC<PageTransitionProps> = ({children}) => {
  const location = useLocation()
  const [isEntering, setIsEntering] = useState(false)
  const prevPathRef = useRef(location.pathname)
  const isFirstMount = useRef(true)

  useEffect(() => {
    // İlk mount'ta animasyon yapma
    if (isFirstMount.current) {
      isFirstMount.current = false
      prevPathRef.current = location.pathname
      return
    }

    // Sadece gerçek sayfa değişikliğinde animasyon yap
    const isProductDetail = location.pathname.includes('/product/')
    const wasProductDetail = prevPathRef.current.includes('/product/')
    const isFromProducts = prevPathRef.current.includes('/products') && !wasProductDetail

    if (isProductDetail && isFromProducts) {
      // Yeni sayfa aşağıdan gelsin
      setIsEntering(true)
      
      // Eski sayfayı yukarı kaydır
      const main = document.querySelector('main')
      if (main) {
        // Tüm sayfa içeriklerini bul (TopBanner hariç)
        const pageContents = Array.from(main.children).filter(
          (child) => {
            const el = child as HTMLElement
            return el.tagName !== 'SCRIPT' && 
                   el.tagName !== 'DIV' && 
                   !el.querySelector('[data-product-detail]') &&
                   !el.id?.includes('top-banner')
          }
        ) as HTMLElement[]
        
        pageContents.forEach((content) => {
          if (content && !content.querySelector('[data-product-detail]')) {
            content.style.transition = 'transform 0.7s ease-out'
            content.style.transform = 'translateY(-100vh)'
            content.style.position = 'absolute'
            content.style.top = '0'
            content.style.left = '0'
            content.style.right = '0'
            content.style.width = '100%'
            content.style.zIndex = '1'
          }
        })
      }

      // Yeni sayfayı göster
      const timer = setTimeout(() => {
        setIsEntering(false)
      }, 50)

      prevPathRef.current = location.pathname

      return () => {
        clearTimeout(timer)
        // Cleanup - eski içeriği temizle
        const main = document.querySelector('main')
        if (main) {
          const pageContents = Array.from(main.children).filter(
            (child) => {
              const el = child as HTMLElement
              return el.tagName !== 'SCRIPT' && 
                     el.tagName !== 'DIV' && 
                     !el.querySelector('[data-product-detail]') &&
                     !el.id?.includes('top-banner')
            }
          ) as HTMLElement[]
          
          pageContents.forEach((content) => {
            if (content && content.style.transform === 'translateY(-100vh)') {
              content.style.display = 'none'
            }
          })
        }
      }
    } else {
      // Normal geçiş - animasyon yapma
      setIsEntering(false)
      prevPathRef.current = location.pathname
    }
  }, [location.pathname])

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isEntering
          ? 'opacity-0 translate-y-20'
          : 'opacity-100 translate-y-0'
      }`}
      style={{
        transform: isEntering ? 'translateY(80px)' : 'translateY(0)',
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        backgroundColor: 'white',
      }}
    >
      {children}
    </div>
  )
}

