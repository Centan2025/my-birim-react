import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { ContentBlock } from '../types'
import { useTranslation } from '../i18n'
import ScrollReveal from './ScrollReveal'
import { OptimizedImage } from './OptimizedImage'
import { OptimizedVideo } from './OptimizedVideo'
import { YouTubeBackground } from './YouTubeBackground'
import PortableTextLite from './PortableTextLite'
import { useGoogleFonts } from '../hooks/useGoogleFont'

interface HomeContentBlocksProps {
  blocks: ContentBlock[]
  isMobile: boolean
  imageBorderClass: string
}

export const HomeContentBlocks: React.FC<HomeContentBlocksProps> = ({
  blocks,
  isMobile,
  imageBorderClass,
}) => {
  const { t } = useTranslation()
  const [playMobileArrowIntro, setPlayMobileArrowIntro] = useState(false)
  const hasPlayedMobileArrowIntro = useRef(false)

  // Mobilde sol ok intro animasyonu
  useEffect(() => {
    if (!isMobile || hasPlayedMobileArrowIntro.current) return
    hasPlayedMobileArrowIntro.current = true
    setPlayMobileArrowIntro(true)
  }, [isMobile])


  // Tüm bloklardaki fontları topla ve yükle
  const allFonts = blocks.map(b => b.titleFont).filter(Boolean) as string[]
  useGoogleFonts(allFonts)

  if (!blocks || blocks.length === 0) {
    return null
  }

  const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <>
      {sortedBlocks.map((block, index) => {
        const hasTitle = !!block.title
        const hasDescription = !!block.description
        const hasTextContent = hasTitle || hasDescription

        const getMediaUrl = () => {
          if (block.mediaType === 'image' && block.image) {
            return block.image
          }
          return block.url || ''
        }

        const mediaUrl = getMediaUrl()
        const isFullWidth = block.position === 'full'
        const isLeft = block.position === 'left'
        const isRight = block.position === 'right'
        const isCenter = block.position === 'center'

        const backgroundColor = block.backgroundColor === 'gray' ? 'bg-gray-100' : 'bg-white'
        const textAlign = block.textAlignment || 'left'
        const textAlignClass =
          textAlign === 'center'
            ? 'text-center'
            : textAlign === 'right'
              ? 'text-right'
              : 'text-left'

        const textPosition = block.textPosition || 'below'
        const titlePosition = block.titlePosition || 'below'
        const titleFont = block.titleFont || 'normal'

        const titleElement = hasTitle && (
          <ScrollReveal
            delay={0}
            threshold={0.1}
            width="w-full"
            className="h-auto"
            distance={50}
            duration={0.6}
          >
            <h2
              className={`${isFullWidth ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-3xl md:text-4xl lg:text-5xl'} uppercase ${textAlignClass} text-gray-950 max-w-4xl mb-4 ${textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : 'mr-auto'}`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: titleFont === 'normal' ? '"Oswald", sans-serif' :
                  titleFont === 'serif' ? 'serif' :
                    titleFont === 'mono' ? 'monospace' :
                      `"${titleFont}", sans-serif`,
                fontWeight: (titleFont === 'normal' || titleFont === 'Oswald') ? 200 : 'inherit',
                letterSpacing: '0.1em',
              }}
            >
              {t(block.title)}
            </h2>
          </ScrollReveal>
        )

        const bodyElement = (hasDescription || (block.linkText && block.linkUrl)) && (
          <div className="w-full">
            {hasDescription && (
              <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                <div className={`prose max-w-none ${textAlignClass}`}>
                  {(() => {
                    const desc = t(block.description)
                    const widthClass = textAlign === 'center' ? 'max-w-4xl' : 'max-w-2xl'
                    const marginClass = textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : 'mr-auto'

                    return Array.isArray(desc) ? (
                      <div className={`${marginClass} ${widthClass} mt-3 font-roboto-thin text-gray-800`}>
                        <PortableTextLite value={desc} />
                      </div>
                    ) : (
                      <p className={`mt-3 text-gray-800 font-roboto-thin leading-relaxed ${widthClass} text-lg md:text-xl ${marginClass}`}>
                        {desc}
                      </p>
                    )
                  })()}
                </div>
              </ScrollReveal>
            )}
            {block.linkText && block.linkUrl && (
              <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                <div className={`mt-6 ${textAlignClass} flex ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <Link
                    to={block.linkUrl}
                    className={`group inline-flex items-center gap-x-3 text-gray-950 font-bold py-3 ${textAlign === 'right' ? 'pl-5 pr-0' : 'pl-0 pr-5'} text-sm md:text-lg rounded-lg`}
                  >
                    <span className="inline-flex justify-center transition-all duration-500 ease-out">
                      <span className="leading-none font-bold tracking-[0.05em] transition-all duration-500 ease-out md:group-hover:tracking-[0.12em] md:group-hover:text-gray-600">
                        {t(block.linkText)}
                      </span>
                    </span>
                  </Link>
                </div>
              </ScrollReveal>
            )}
          </div>
        )

        const mediaWidthClass = isFullWidth
          ? 'w-full'
          : isCenter
            ? 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto'
            : 'w-full max-w-[94%] mx-auto'

        const mediaContent = (
          <ScrollReveal
            delay={50}
            threshold={0.1}
            width={(isFullWidth || isCenter) ? "w-full" : "w-auto"}
            className={`h-auto ${(isFullWidth || isCenter) ? 'w-full' : ''} ${isCenter ? 'flex justify-center' : ''}`}
          >
            {block.mediaType === 'youtube' ? (
              <div className={`relative ${mediaWidthClass} aspect-video overflow-hidden`}>
                <YouTubeBackground url={mediaUrl} />
              </div>
            ) : block.mediaType === 'video' ? (
              <OptimizedVideo
                src={mediaUrl}
                className={`${isFullWidth ? 'w-full h-auto max-w-full' : `${mediaWidthClass} ${imageBorderClass}`} ${isMobile ? 'object-contain' : 'object-cover'}`}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                loading="lazy"
              />
            ) : (
              <OptimizedImage
                src={mediaUrl}
                alt=""
                className={`${isFullWidth ? 'w-full h-auto' : `${mediaWidthClass} ${imageBorderClass}`} ${isMobile ? 'object-contain' : 'object-cover'} block`}
                loading="lazy"
                quality={85}
              />
            )}
            {/* Mobile Scroll Indicator - Sadece ok (HomeHero ile aynı) */}
            {isMobile && (
              <div
                className={`absolute left-8 z-30 pointer-events-none mix-blend-difference ${playMobileArrowIntro ? 'animate-hero-mobile-left-arrow-intro' : ''}`}
                style={{
                  bottom: '16px',
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-70"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </ScrollReveal>
        )

        const textContentAbove = (
          <div className={`${(isFullWidth || isCenter) ? 'max-w-[94%] mx-auto px-4 md:px-0 pt-6 md:pt-8 pb-3' : 'w-full mx-auto mb-4'} flex flex-col ${textAlign === 'center' ? 'items-center text-center' : textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
            {titlePosition === 'above' && titleElement}
            {textPosition === 'above' && bodyElement}
          </div>
        )

        const textContentBelow = (
          <div className={`${(isFullWidth || isCenter) ? 'max-w-[94%] mx-auto px-4 md:px-0 pt-3 pb-6 md:pb-8' : 'w-full mx-auto mt-4'} flex flex-col ${textAlign === 'center' ? 'items-center text-center' : textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
            {titlePosition === 'below' && titleElement}
            {textPosition === 'below' && bodyElement}
          </div>
        )

        // Content alanları arasında dikey boşluk olmasın
        const sectionSpacingClass = 'py-0'

        return (
          <section
            key={index}
            className={`content-block-wrapper relative z-20 ${sectionSpacingClass} ${backgroundColor}`}
            data-block-index={index}
          >
            {(isFullWidth || isCenter) ? (
              <div className="w-full overflow-hidden flex flex-col items-center">
                {(titlePosition === 'above' || textPosition === 'above') && textContentAbove}
                {mediaContent}
                {(titlePosition === 'below' || textPosition === 'below') && textContentBelow}
              </div>
            ) : (
              <div className="container mx-auto px-6 sm:px-8 lg:px-4">
                <div
                  className={
                    hasTextContent
                      ? `flex flex-col ${isLeft
                        ? 'md:flex-row'
                        : isRight
                          ? 'md:flex-row-reverse'
                          : 'md:flex-row items-center'
                      } gap-4 md:gap-6`
                      : 'flex flex-col items-center gap-4 md:gap-6'
                  }
                >
                  <div
                    className={`w-full ${!hasTextContent ? 'md:w-full flex flex-col items-center' : 'md:w-1/2'
                      } overflow-visible`}
                  >
                    {mediaContent}
                  </div>
                  {hasTextContent && (
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                      {titleElement}
                      {bodyElement}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}


