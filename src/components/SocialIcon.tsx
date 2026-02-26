import React from 'react'
import {FaInstagram, FaFacebookF, FaYoutube, FaPinterestP, FaLinkedinIn} from 'react-icons/fa'
import {sanitizeHtml} from '../lib/sanitize'

interface SocialIconProps {
  name: string
  svgString?: string
  className?: string
}

export const SocialIcon: React.FC<SocialIconProps> = ({name, svgString, className = 'w-6 h-6'}) => {
  const key = name.toLowerCase()

  // 1. If we have a dedicated react-icons match (preferred for consistency)
  if (key.includes('instagram')) return <FaInstagram className={className} />
  if (key.includes('facebook') || key === 'fb') return <FaFacebookF className={className} />
  if (key.includes('youtube')) return <FaYoutube className={className} />
  if (key.includes('pinterest')) return <FaPinterestP className={className} />
  if (key.includes('linkedin')) return <FaLinkedinIn className={className} />

  // 2. If no match and we have an SVG from CMS
  if (svgString) {
    return (
      <div
        className={'flex items-center justify-center ' + className}
        dangerouslySetInnerHTML={{__html: sanitizeHtml(svgString)}}
      />
    )
  }

  // 3. Last fallback: Empty space or Generic Icon
  return null
}
