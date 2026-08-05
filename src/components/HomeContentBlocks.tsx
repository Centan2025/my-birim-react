import React, {useMemo, useState, useRef, useCallback} from 'react'
import {Link} from 'react-router-dom'

import {ContentBlock, InteractiveShowcaseItem, LocalizedString} from '../types'
import {useTranslation} from '../i18n'
import ScrollReveal from './ScrollReveal'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'
import {YouTubeBackground} from './YouTubeBackground'
import PortableTextLite from './PortableTextLite'
import {useGoogleFonts} from '../hooks/useGoogleFont'
import {InteractiveShowcase} from './InteractiveShowcase'

interface HomeContentBlocksProps {
  blocks: ContentBlock[]
  isMobile: boolean
  imageBorderClass: string
  overrideBackgroundColor?: string
  onMediaClick?: (url: string) => void
  interactiveShowcase?: InteractiveShowcaseItem[]
  interactiveShowcaseTitle?: LocalizedString
  interactiveShowcaseBlockIndex?: number
}

const ContentBlockSnapWrapper: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <div style={{scrollSnapAlign: 'start'}} className="scroll-snap-start">
      {children}
    </div>
  )
}

/**
 * Panel Media Slider Component
 * Side-by-side horizontal scroll with dots and video support
 */
const PanelSlider: React.FC<{
  media: Array<{
    url: string
    urlMobile?: string
    urlDesktop?: string
    type: 'image' | 'video'
    crop?: {x: number; y: number; width: number; height: number}
    hotspot?: {x: number; y: number}
    origWidth?: number
    origHeight?: number
    cropMobile?: {x: number; y: number; width: number; height: number}
    hotspotMobile?: {x: number; y: number}
    origWidthMobile?: number
    origHeightMobile?: number
  }>
  panelSize?: 'small' | 'medium' | 'large'
  panelFit?: 'cover' | 'contain' | 'natural'
  panelGap?: 'none' | 'small' | 'medium' | 'large'
  imageBorderClass: string
  onMediaClick?: (url: string) => void
}> = ({
  media,
  panelSize,
  panelFit = 'cover',
  panelGap = 'medium',
  imageBorderClass,
  onMediaClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Mouse Drag-to-Scroll state
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const getGapPx = useCallback(() => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    switch (panelGap) {
      case 'none':
        return 0
      case 'small':
        return isMobile ? 6 : 12
      case 'large':
        return isMobile ? 12 : 32
      default:
        return isMobile ? 8 : 16
    }
  }, [panelGap])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const item = container.querySelector('div')
    if (!item) return

    const itemWidth = item.clientWidth
    const gap = getGapPx()
    const scrollLeft = container.scrollLeft
    const index = Math.round(scrollLeft / (itemWidth + gap))

    if (index !== activeIndex) {
      setActiveIndex(index)
    }
  }, [activeIndex, getGapPx])

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const item = container.querySelector('div')
    if (!item) return

    const itemWidth = item.clientWidth
    const gap = getGapPx()
    container.scrollTo({
      left: index * (itemWidth + gap),
      behavior: 'smooth',
    })
  }

  const scrollPrev = () => {
    if (activeIndex > 0) {
      scrollTo(activeIndex - 1)
    }
  }

  const scrollNext = () => {
    if (activeIndex < media.length - 1) {
      scrollTo(activeIndex + 1)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsMouseDown(true)
    setIsDragging(false)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsMouseDown(false)
    setTimeout(() => setIsDragging(false), 50)
  }

  const handleMouseUp = () => {
    setIsMouseDown(false)
    setTimeout(() => setIsDragging(false), 50)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    if (Math.abs(x - startX) > 5) {
      setIsDragging(true)
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk
  }

  // Determine width based on panel size
  const getWidthClass = () => {
    switch (panelSize) {
      case 'small':
        return 'w-[28vw] sm:w-[25vw] md:w-[22vw] lg:w-[15vw]'
      case 'large':
        return 'w-[70vw] sm:w-[65vw] md:w-[60vw] lg:w-[45vw]'
      default:
        return 'w-[36vw] sm:w-[32vw] md:w-[35vw] lg:w-[25vw]'
    }
  }

  const getGapClass = () => {
    switch (panelGap) {
      case 'none':
        return 'gap-0'
      case 'small':
        return 'gap-1.5 md:gap-3'
      case 'large':
        return 'gap-3 md:gap-8'
      default:
        return 'gap-2 md:gap-4'
    }
  }

  const getFitClass = () => {
    switch (panelFit) {
      case 'contain':
        return 'object-contain bg-black/5 dark:bg-white/5'
      case 'natural':
        return 'object-scale-down'
      default:
        return 'object-cover'
    }
  }

  return (
    <div className="w-full relative group/panels flex flex-col gap-2 pb-2">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto ${getGapClass()} pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory ${
          isMouseDown ? 'cursor-grabbing select-none snap-none' : 'cursor-grab'
        }`}
      >
        {media.map((item, i) => {
          return (
            <div
              key={i}
              className={`flex-shrink-0 snap-start relative overflow-hidden ${imageBorderClass} ${
                panelFit === 'natural' ? 'h-auto max-h-[70vh]' : 'aspect-[3/4]'
              } group cursor-pointer ${getWidthClass()}`}
              onClick={() => {
                if (!isDragging && onMediaClick) {
                  onMediaClick(item.url)
                }
              }}
              onKeyDown={e => {
                if (onMediaClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onMediaClick(item.url)
                }
              }}
              role="button"
              tabIndex={0}
            >
              {item.type === 'video' ? (
                <OptimizedVideo
                  src={item.url}
                  className={`w-full h-full ${getFitClass()} pointer-events-none`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : (
                <OptimizedImage
                  src={item.url}
                  srcMobile={item.urlMobile}
                  srcDesktop={item.urlDesktop}
                  alt=""
                  className={`w-full ${panelFit === 'natural' ? 'h-auto' : 'h-full'} ${getFitClass()} transition-transform duration-700 pointer-events-none`}
                  loading="lazy"
                  quality={85}
                  crop={item.crop}
                  hotspot={item.hotspot}
                  origWidth={item.origWidth}
                  origHeight={item.origHeight}
                  cropMobile={item.cropMobile}
                  hotspotMobile={item.hotspotMobile}
                  origWidthMobile={item.origWidthMobile}
                  origHeightMobile={item.origHeightMobile}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Sol / Sağ Ok Butonları (Desktop Daima Görünür) */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={activeIndex === 0}
            className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md items-center justify-center transition-all duration-300 shadow-md ${
              activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Previous image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={activeIndex === media.length - 1}
            className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md items-center justify-center transition-all duration-300 shadow-md ${
              activeIndex === media.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Next image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {media.length > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2 pb-1">
          {media.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              className={`relative h-2 w-2 rounded-none transition-all duration-300 ${
                activeIndex === i
                  ? 'bg-red-900 opacity-100 shadow-sm'
                  : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-500 dark:hover:bg-neutral-400 border border-neutral-400/50 dark:border-neutral-500/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              {activeIndex === i && (
                <div
                  key={i}
                  className="absolute top-0 left-0 h-full w-full rounded-none bg-red-900 animate-fill-line"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const HomeContentBlocks: React.FC<HomeContentBlocksProps> = ({
  blocks,
  isMobile,
  imageBorderClass,
  overrideBackgroundColor,
  onMediaClick,
  interactiveShowcase,
  interactiveShowcaseTitle,
  interactiveShowcaseBlockIndex,
}) => {
  const {t} = useTranslation()

  // Tüm bloklardaki fontları topla ve yükle (stabilize with useMemo)
  const allFonts = useMemo(() => {
    const fonts = new Set<string>()
    if (Array.isArray(blocks)) {
      blocks.forEach(b => {
        if (b.titleFont && b.titleFont !== 'normal') fonts.add(b.titleFont)
        if (b.contentFont && b.contentFont !== 'normal') fonts.add(b.contentFont)
      })
    }
    return Array.from(fonts)
  }, [blocks])

  useGoogleFonts(allFonts)

  const hasInteractiveShowcase =
    Array.isArray(interactiveShowcase) && interactiveShowcase.length > 0
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks && !hasInteractiveShowcase) {
    return null
  }

  if (!hasBlocks && hasInteractiveShowcase) {
    return (
      <InteractiveShowcase items={interactiveShowcase} sectionTitle={interactiveShowcaseTitle} />
    )
  }

  const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0))
  const targetIndex =
    interactiveShowcaseBlockIndex !== undefined && interactiveShowcaseBlockIndex !== null
      ? Math.max(0, interactiveShowcaseBlockIndex)
      : 1

  return (
    <>
      {hasInteractiveShowcase && targetIndex === 0 && (
        <InteractiveShowcase items={interactiveShowcase} sectionTitle={interactiveShowcaseTitle} />
      )}
      {sortedBlocks.map((block, index) => {
        const titleContent = block.title ? t(block.title) : ''
        const descriptionRaw = block.description ? t(block.description) : ''
        const descriptionContent =
          Array.isArray(descriptionRaw) && descriptionRaw.length === 0 ? '' : descriptionRaw
        const hasTitle =
          typeof titleContent === 'string' ? titleContent.trim().length > 0 : !!titleContent
        const hasDescription = Array.isArray(descriptionContent)
          ? descriptionContent.length > 0
          : typeof descriptionContent === 'string'
            ? descriptionContent.trim().length > 0
            : !!descriptionContent
        const hasTextContent =
          hasTitle ||
          hasDescription ||
          !!(block.linkText && (!block.showButtonOnMedia || block.linkUrl))

        const mediaUrl = block.mediaType === 'image' ? block.image || '' : block.url || ''
        const mediaMobileUrl = block.mediaType === 'image' ? block.imageMobile : block.urlMobile
        const mediaDesktopUrl = block.mediaType === 'image' ? block.imageDesktop : block.urlDesktop
        const isFullWidth = block.position === 'full'
        const isLeft = block.position === 'left'
        const isRight = block.position === 'right'
        const isCenter = block.position === 'center'

        const backgroundColor = overrideBackgroundColor
          ? overrideBackgroundColor
          : block.backgroundColor === 'gray'
            ? 'bg-[var(--bg-secondary)]'
            : 'bg-[var(--bg-primary)]'

        const borderThickness = block.hasBorder
          ? Math.max(1, Math.min(12, Number(block.borderThickness || 1)))
          : 0

        const borderOverlayColor =
          typeof block.borderColor === 'string'
            ? block.borderColor
            : (block.borderColor as unknown as {hex?: string})?.hex ||
              'color-mix(in srgb, var(--text-primary) 28%, transparent)'
        const borderOverlay = borderThickness > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              boxShadow: `inset 0 0 0 ${borderThickness}px ${borderOverlayColor}`,
            }}
          />
        )

        // Çerçeve varsa veya manuel padding girilmişse içeriğe boşluk ekle
        const customPadding = block.padding !== undefined ? Number(block.padding) : undefined
        const borderPaddingStyle =
          customPadding !== undefined ? {padding: `${customPadding}px`} : undefined

        const borderPaddingClass =
          !borderPaddingStyle && borderThickness > 0
            ? isFullWidth
              ? 'p-4 md:p-8'
              : 'p-4 md:p-6'
            : ''

        const textAlign = block.textAlignment || 'left'
        const textAlignClass =
          textAlign === 'center'
            ? 'text-center'
            : textAlign === 'right'
              ? 'text-right'
              : 'text-left'

        // Separate title alignment (falls back to textAlignment)
        const titleAlign = block.titleAlignment || textAlign
        const titleAlignClass =
          titleAlign === 'center'
            ? 'text-center'
            : titleAlign === 'right'
              ? 'text-right'
              : 'text-left'

        const textPosition = block.textPosition || 'below'
        const titlePosition = block.titlePosition || 'below'
        const titleFont = block.titleFont || 'normal'
        const contentFont = block.contentFont || 'normal'
        const verticalAlignClass =
          block.verticalAlignment === 'top'
            ? 'justify-start'
            : block.verticalAlignment === 'bottom'
              ? 'justify-end'
              : 'justify-center'

        const getButtonPositionClasses = (pos?: string) => {
          switch (pos) {
            case 'top-left':
              return 'top-4 left-4 md:top-8 md:left-8 justify-start items-start'
            case 'top-right':
              return 'top-4 right-4 md:top-8 md:right-8 justify-end items-start'
            case 'bottom-left':
              return 'bottom-4 left-4 md:bottom-8 md:left-8 justify-start items-end'
            case 'bottom-right':
              return 'bottom-4 right-4 md:bottom-8 md:right-8 justify-end items-end'
            case 'center':
            default:
              return 'inset-0 justify-center items-center'
          }
        }

        // Helper: ref callback to apply font-family with !important (React inline styles ignore !important)
        const applyFontRef = (fontFamily: string | undefined) => (el: HTMLElement | null) => {
          if (el && fontFamily) {
            el.style.setProperty('font-family', fontFamily, 'important')
          }
        }

        const titleFontFamily = '"Oswald", sans-serif'

        const titleElement = hasTitle && (
          <ScrollReveal
            delay={0}
            threshold={0.1}
            width="w-full"
            className="h-auto"
            distance={15}
            duration={1.0}
          >
            <h2
              ref={applyFontRef(titleFontFamily)}
              className={`${isFullWidth ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-xl md:text-3xl lg:text-4xl'} uppercase ${titleAlignClass} text-[var(--text-primary)] w-full ${block.verticalAlignment === 'top' ? 'mt-0' : ''} ${titleAlign === 'center' ? 'mx-auto' : titleAlign === 'right' ? 'ml-auto' : 'mr-auto'}`}
              style={{
                fontWeight: titleFont === 'normal' || titleFont === 'Oswald' ? 200 : 'inherit',
                letterSpacing: '0.04em',
              }}
            >
              {titleContent as string}
            </h2>
          </ScrollReveal>
        )

        const isNormalContentFont = contentFont === 'normal' || contentFont === 'Barlow Condensed'
        const contentFontFamily = isNormalContentFont
          ? undefined
          : contentFont === 'serif'
            ? 'serif'
            : contentFont === 'mono'
              ? 'monospace'
              : `"${contentFont}", sans-serif`

        const bodyElement = (hasDescription ||
          (block.linkText && (!block.showButtonOnMedia || block.linkUrl))) && (
          <div
            className={`w-full ${block.verticalAlignment === 'top' && !hasTitle ? 'mt-0 pt-0' : ''}`}
          >
            {hasDescription && (
              <ScrollReveal
                delay={100}
                threshold={0.1}
                width="w-full"
                className={`h-auto ${block.verticalAlignment === 'top' && !hasTitle ? 'mt-0 pb-0' : ''}`}
              >
                <div
                  className={`prose max-w-none ${textAlignClass} ${block.verticalAlignment === 'top' && !hasTitle ? 'mt-0 pt-0 prose-p:first-of-type:!mt-0 [&_.portable-text-container>*:first-child]:!mt-0' : ''}`}
                >
                  {(() => {
                    const desc = descriptionContent
                    const widthClass = textAlign === 'center' ? 'max-w-4xl' : 'w-full'
                    const marginClass =
                      textAlign === 'center'
                        ? 'mx-auto'
                        : textAlign === 'right'
                          ? 'ml-auto'
                          : 'mr-auto'

                    if (Array.isArray(desc)) {
                      return (
                        <div
                          ref={!isNormalContentFont ? applyFontRef(contentFontFamily) : undefined}
                          className={`${marginClass} ${widthClass} ${isNormalContentFont ? 'font-light text-base md:text-lg lg:text-xl' : ''} text-[var(--text-primary)] opacity-90 ${block.verticalAlignment === 'top' && !hasTitle ? '[&_.portable-text-container>*:first-child]:!mt-0' : ''}`}
                          style={!isNormalContentFont ? {fontWeight: 300} : {}}
                        >
                          <PortableTextLite
                            value={desc}
                            removeTopMargin={block.verticalAlignment === 'top' && !hasTitle}
                            onMediaClick={onMediaClick}
                          />
                        </div>
                      )
                    }

                    return (
                      <p
                        ref={!isNormalContentFont ? applyFontRef(contentFontFamily) : undefined}
                        className={`text-[var(--text-primary)] opacity-90 ${isNormalContentFont ? 'font-light text-base md:text-lg lg:text-xl' : ''} leading-relaxed ${widthClass} ${marginClass} ${block.verticalAlignment === 'top' && !hasTitle ? 'mt-0' : ''}`}
                        style={!isNormalContentFont ? {fontWeight: 300} : {}}
                      >
                        {desc}
                      </p>
                    )
                  })()}
                </div>
              </ScrollReveal>
            )}
            {block.linkText && !block.showButtonOnMedia && (
              <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                <div
                  className={`mt-6 ${textAlignClass} flex ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}
                >
                  {block.linkUrl ? (
                    <Link
                      to={block.linkUrl}
                      className={`group inline-flex items-center text-[var(--text-primary)] hover:opacity-70 border border-gray-400 dark:border-gray-500 px-8 py-4 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter transition-all duration-300`}
                    >
                      {t(block.linkText)}
                    </Link>
                  ) : (
                    <div
                      className={`inline-flex items-center text-[var(--text-primary)] px-8 py-4 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                    >
                      {t(block.linkText)}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}
          </div>
        )

        const mediaWidthClass = isFullWidth
          ? 'w-full'
          : 'w-full md:max-w-[92%] lg:max-w-[80vw] mx-auto'

        const isButtonWhite = block.buttonColor === 'white'
        const buttonTextColorClass = isButtonWhite ? 'text-white' : 'text-[var(--text-primary)]'

        const hasMedia =
          !!mediaUrl ||
          (block.mediaType === 'panels' &&
            Array.isArray(block.imagePanels) &&
            block.imagePanels.length > 0)

        const mediaContent = hasMedia ? (
          <ScrollReveal
            delay={50}
            threshold={0.1}
            width={isFullWidth || isCenter ? 'w-full' : 'w-auto'}
            className={`h-auto ${isFullWidth || isCenter ? 'w-full' : ''} ${isCenter ? 'flex justify-center' : ''}`}
          >
            {block.mediaType === 'youtube' ? (
              <div
                className={`relative ${mediaWidthClass} ${isMobile ? 'w-full' : ''} aspect-video overflow-hidden`}
              >
                <YouTubeBackground url={mediaUrl} />
                {block.showButtonOnMedia && block.linkText && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    {block.linkUrl ? (
                      <Link
                        to={block.linkUrl}
                        className={`group pointer-events-auto inline-flex items-center ${buttonTextColorClass} hover:opacity-50 px-4 py-2 md:px-8 md:py-4 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-gray-300/80' : 'border-gray-400 dark:border-gray-500'} text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center ${buttonTextColorClass} px-4 py-2 md:px-8 md:py-4 bg-transparent text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : block.mediaType === 'video' ? (
              <div
                className={`relative w-full h-full ${onMediaClick && !block.linkUrl ? 'cursor-pointer' : ''}`}
                onClick={() => onMediaClick && !block.linkUrl && onMediaClick(mediaUrl)}
                onKeyDown={
                  onMediaClick && !block.linkUrl
                    ? e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onMediaClick(mediaUrl)
                        }
                      }
                    : undefined
                }
                role={onMediaClick && !block.linkUrl ? 'button' : undefined}
                tabIndex={onMediaClick && !block.linkUrl ? 0 : undefined}
              >
                <OptimizedVideo
                  src={mediaUrl}
                  srcMobile={mediaMobileUrl}
                  srcDesktop={mediaDesktopUrl}
                  className={`${isFullWidth ? 'w-full h-auto max-w-full' : `${mediaWidthClass} ${imageBorderClass}`} ${isMobile ? 'w-full object-cover' : 'object-cover'} block`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  loading="lazy"
                />
                {block.showButtonOnMedia && block.linkText && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    {block.linkUrl ? (
                      <Link
                        to={block.linkUrl}
                        className={`group pointer-events-auto inline-flex items-center ${buttonTextColorClass} hover:opacity-50 px-4 py-2 md:px-8 md:py-4 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-gray-300/80' : 'border-gray-400 dark:border-gray-500'} text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center ${buttonTextColorClass} px-4 py-2 md:px-8 md:py-4 bg-transparent text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : block.mediaType === 'panels' ? (
              <div className={`relative ${mediaWidthClass}`}>
                <PanelSlider
                  media={block.imagePanels || []}
                  panelSize={block.panelSize}
                  panelFit={block.panelFit}
                  panelGap={block.panelGap}
                  imageBorderClass={imageBorderClass}
                  onMediaClick={onMediaClick}
                />
              </div>
            ) : (
              <div
                className={`relative w-full h-auto ${onMediaClick && !block.linkUrl ? 'cursor-pointer' : ''}`}
                onClick={() => onMediaClick && !block.linkUrl && onMediaClick(mediaUrl)}
                onKeyDown={
                  onMediaClick && !block.linkUrl
                    ? e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onMediaClick(mediaUrl)
                        }
                      }
                    : undefined
                }
                role={onMediaClick && !block.linkUrl ? 'button' : undefined}
                tabIndex={onMediaClick && !block.linkUrl ? 0 : undefined}
              >
                <OptimizedImage
                  src={mediaUrl}
                  srcMobile={mediaMobileUrl}
                  srcDesktop={mediaDesktopUrl}
                  alt=""
                  className={`${isFullWidth ? 'w-full h-auto' : `${mediaWidthClass} ${imageBorderClass}`} w-full h-auto block`}
                  loading="lazy"
                  quality={85}
                  crop={block.crop}
                  hotspot={block.hotspot}
                  origWidth={block.origWidth}
                  origHeight={block.origHeight}
                  cropMobile={block.cropMobile}
                  hotspotMobile={block.hotspotMobile}
                  origWidthMobile={block.origWidthMobile}
                  origHeightMobile={block.origHeightMobile}
                />
                {block.showButtonOnMedia && block.linkText && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    {block.linkUrl ? (
                      <Link
                        to={block.linkUrl}
                        className={`group pointer-events-auto inline-flex items-center ${buttonTextColorClass} hover:opacity-50 px-4 py-2 md:px-8 md:py-4 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-gray-300/80' : 'border-gray-400 dark:border-gray-500'} text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center ${buttonTextColorClass} px-4 py-2 md:px-8 md:py-4 bg-transparent text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-medium font-inter`}
                      >
                        {t(block.linkText)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        ) : null

        const hasTopContent =
          (titlePosition === 'above' && hasTitle) ||
          (textPosition === 'above' &&
            (hasDescription || (block.linkText && !block.showButtonOnMedia)))

        const hasBottomContent =
          (titlePosition === 'below' && hasTitle) ||
          (textPosition === 'below' &&
            (hasDescription || (block.linkText && !block.showButtonOnMedia)))

        const textContentAbove = hasTopContent ? (
          <div
            className={`${isFullWidth || isMobile ? `w-full max-w-full px-4 md:px-0 ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-4 md:pt-8'} pb-2 md:pb-3` : isCenter ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-6 md:pt-8'} pb-3` : 'w-full mx-auto mb-4'} flex flex-col gap-3 md:gap-4 ${titleAlign === 'center' ? 'items-center text-center' : titleAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
          >
            {titlePosition === 'above' && titleElement}
            {textPosition === 'above' && bodyElement}
          </div>
        ) : null

        const textContentBelow = hasBottomContent ? (
          <div
            className={`${isFullWidth || isMobile ? `w-full max-w-full px-4 md:px-0 ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-2 md:pt-3'} pb-4 md:pb-8` : isCenter ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-3'} pb-6 md:pb-8` : `w-full mx-auto ${block.verticalAlignment === 'top' ? 'mt-0' : 'mt-4'}`} flex flex-col gap-3 md:gap-4 ${titleAlign === 'center' ? 'items-center text-center' : titleAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
          >
            {titlePosition === 'below' && titleElement}
            {textPosition === 'below' && bodyElement}
          </div>
        ) : null

        const bottomSpacing = block.spacingBottom || 0
        const isSideBySide = !isFullWidth && !isCenter

        return (
          <React.Fragment key={index}>
            <ContentBlockSnapWrapper>
              <section
                className={`content-block-wrapper home-content-block-snap relative z-20 min-h-0 flex flex-col justify-start ${backgroundColor} transition-colors duration-500 py-0 my-0`}
                style={{
                  paddingTop: isMobile
                    ? 0
                    : isSideBySide
                      ? `${customPadding !== undefined ? customPadding : 24}px`
                      : customPadding !== undefined
                        ? `${customPadding}px`
                        : '24px',
                  paddingBottom: isMobile
                    ? 0
                    : isSideBySide
                      ? `${customPadding !== undefined ? customPadding : 24}px`
                      : !hasTextContent || index === sortedBlocks.length - 1
                        ? customPadding !== undefined
                          ? `${customPadding}px`
                          : 0
                        : bottomSpacing > 0
                          ? `${bottomSpacing}px`
                          : customPadding !== undefined
                            ? `${customPadding}px`
                            : '24px',
                }}
                data-block-index={index}
              >
                {isFullWidth || isCenter ? (
                  <div
                    className={`${isFullWidth || isMobile ? 'w-full max-w-full' : 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto'} overflow-hidden flex flex-col items-center relative ${borderPaddingClass}`}
                    style={borderPaddingStyle}
                  >
                    {textContentAbove}
                    {mediaContent}
                    {textContentBelow}
                    {/* Title-only fallback: when no media and no above/below content assigned, render title directly */}
                    {!hasMedia && !textContentAbove && !textContentBelow && hasTitle && (
                      <div
                        className={`w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-0 flex flex-col gap-4 ${titleAlign === 'center' ? 'items-center text-center' : titleAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
                      >
                        {titleElement}
                        {bodyElement}
                      </div>
                    )}
                    {borderOverlay}
                  </div>
                ) : (
                  <div
                    className={`w-full ${isMobile ? 'max-w-full px-0' : 'max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0'} overflow-hidden relative ${borderPaddingClass}`}
                  >
                    <div
                      className={
                        hasTextContent && hasMedia
                          ? `flex flex-col ${
                              isLeft
                                ? 'md:flex-row'
                                : isRight
                                  ? 'md:flex-row-reverse'
                                  : 'md:flex-row'
                            } ${block.verticalAlignment === 'top' ? 'gap-x-4 md:gap-x-6 gap-y-0' : 'gap-4 md:gap-12'} ${
                              block.verticalAlignment === 'top'
                                ? 'items-start'
                                : block.verticalAlignment === 'bottom'
                                  ? 'items-end'
                                  : 'items-center'
                            }`
                          : hasTextContent && !hasMedia
                            ? 'flex flex-col'
                            : 'flex flex-col items-center gap-4 md:gap-6'
                      }
                    >
                      {hasMedia && (
                        <div
                          className={`w-full ${
                            !hasTextContent ? 'md:w-full flex flex-col items-center' : 'md:w-1/2'
                          } overflow-visible`}
                        >
                          {mediaContent}
                        </div>
                      )}
                      {hasTextContent && (
                        <div
                          className={`w-full ${hasMedia ? 'md:w-1/2' : 'md:w-full'} ${isMobile ? 'px-4 py-4 md:px-0 md:py-0' : ''} flex flex-col ${hasTitle && (hasDescription || block.linkText) ? 'gap-4 md:gap-6' : 'gap-0'} ${block.verticalAlignment === 'top' ? 'self-start' : block.verticalAlignment === 'bottom' ? 'self-end' : 'self-center'} ${verticalAlignClass} ${block.verticalAlignment === 'top' && !hasTitle ? 'pt-0 mt-0' : ''}`}
                        >
                          {hasTitle && titleElement}
                          {bodyElement}
                        </div>
                      )}
                    </div>
                    {borderOverlay}
                  </div>
                )}
              </section>
            </ContentBlockSnapWrapper>
            {hasInteractiveShowcase &&
              (index + 1 === targetIndex ||
                (index === sortedBlocks.length - 1 && targetIndex > index + 1)) && (
                <InteractiveShowcase
                  key={`interactive-showcase-${index}`}
                  items={interactiveShowcase}
                  sectionTitle={interactiveShowcaseTitle}
                />
              )}
          </React.Fragment>
        )
      })}
    </>
  )
}
