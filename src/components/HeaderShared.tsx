import React from 'react'
import type {LocalizedString} from '../types'

// Ortak çeviri fonksiyonu tipi (Header ve alt bileşenlerde)
export type HeaderTranslateFn = (
  value: string | LocalizedString,
  ...rest: (string | number)[]
) => string

// Ortak cross-fade metin bileşeni (Header içinde ve alt bileşenlerde kullanmak için)
export const CrossFadeText: React.FC<{
  text: string
  className?: string
  triggerKey?: string | number
}> = ({text, className = '', triggerKey}) => {
  const [currentText, setCurrentText] = React.useState(text)
  const [previousText, setPreviousText] = React.useState(text)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setPreviousText(currentText)
    setCurrentText(text)
    setIsAnimating(true)

    const timeout = window.setTimeout(() => {
      setIsAnimating(false)
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [triggerKey, text, currentText])

  if (!isAnimating) {
    return (
      <span className={`relative inline-block ${className}`}>
        <span className={`block ${className}`}>{currentText}</span>
      </span>
    )
  }

  return (
    <span key={String(triggerKey)} className={`relative inline-block ${className}`}>
      <span className={`block cross-fade-text-in ${className}`}>{currentText}</span>
      <span className={`block absolute inset-0 cross-fade-text-out ${className}`}>{previousText}</span>
    </span>
  )
}

// Header dışındaki bileşenlerde de kullanılabilen DynamicIcon
export const DynamicIcon: React.FC<{svgString: string}> = ({svgString}) => (
  <div dangerouslySetInnerHTML={{__html: svgString}} />
)

export const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

export const ChevronRightIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
)


