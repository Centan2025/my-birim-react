import React, {useState, useEffect} from 'react'

const DefaultLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Birim Web Logo"
    {...props}
  >
    <path d="M4 8h12v12H4z" />
    <path d="M8 4h12v12H8z" opacity="0.75" />
  </svg>
)

interface SiteLogoProps {
  logoUrl?: string | null
  className?: string
}

export const SiteLogo: React.FC<SiteLogoProps> = ({logoUrl, className}) => {
  const [imgError, setImgError] = useState(false)

  // Prioritize the URL from props, but fall back to a standard path.
  const finalLogoUrl = logoUrl || '/img/logo.png'

  useEffect(() => {
    // Reset error state whenever the logo URL changes
    setImgError(false)
  }, [finalLogoUrl])

  if (imgError || !finalLogoUrl) {
    // If there's an error loading the image OR if the final URL is somehow empty, show the default SVG.
    return <DefaultLogo className={className} />
  }

  return (
    <img
      src={finalLogoUrl}
      alt="Birim Web Logo"
      className={`${className} object-contain`}
      onError={() => setImgError(true)}
    />
  )
}
