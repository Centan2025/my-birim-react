import React, {useEffect, useRef} from 'react'
import {Link} from 'react-router-dom'
import {Helmet} from 'react-helmet-async'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  fadeOnScroll?: boolean
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  fadeOnScroll = false,
}) => {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!fadeOnScroll) return

    let rafId: number | null = null

    const updateOpacity = () => {
      if (!navRef.current) return
      const scrollY = window.scrollY || document.documentElement.scrollTop
      // 0px -> 55px scroll aralığında breadcrumb yukarı doğru kayarken şeffaflaşır ve header altına girmeden kaybolur
      const progress = Math.max(0, Math.min(1, scrollY / 55))
      const opacity = 1 - progress
      const translateY = -progress * 8

      navRef.current.style.opacity = String(opacity)
      navRef.current.style.transform = `translateY(${translateY}px)`
      navRef.current.style.pointerEvents = opacity <= 0.05 ? 'none' : 'auto'
    }

    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        updateOpacity()
        rafId = null
      })
    }

    updateOpacity()
    window.addEventListener('scroll', onScroll, {passive: true})

    const win = window as unknown as {
      lenis?: {
        on: (event: string, handler: () => void) => void
        off: (event: string, handler: () => void) => void
      }
    }
    if (win.lenis && typeof win.lenis.on === 'function') {
      win.lenis.on('scroll', onScroll)
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', onScroll)
      if (win.lenis && typeof win.lenis.off === 'function') {
        win.lenis.off('scroll', onScroll)
      }
    }
  }, [fadeOnScroll])

  if (!items || items.length === 0) return null

  // Base URL for schema
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'

  // Construct structured data representing the breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      // For the last item or items without 'to', we don't always provide an 'item' URL,
      // but if we do, it must be an absolute URL.
      item: item.to ? `${baseUrl}${item.to.startsWith('/') ? item.to : `/${item.to}`}` : undefined,
    })),
  }

  return (
    <>
      <Helmet prioritizeSeoTags>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <nav
        ref={navRef}
        aria-label="Breadcrumb"
        className={className}
        style={
          fadeOnScroll
            ? {
                transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                willChange: 'opacity, transform',
              }
            : undefined
        }
      >
        <ol className="list-none p-0 inline-flex flex-wrap items-center font-inter text-[11px] sm:text-[13px] text-[var(--text-secondary)]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const label =
              typeof item.label === 'string' ? item.label.toLocaleUpperCase('tr-TR') : item.label
            return (
              <li key={index} className="flex items-center">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="font-light text-[var(--text-primary)] hover:opacity-80 transition-colors"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="font-bold text-[var(--text-primary)]">{label}</span>
                )}
                {!isLast && <span className="font-light text-gray-400 mx-2">|</span>}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
