import React, {useMemo} from 'react'
import {Link} from 'react-router-dom'

import {ContentBlock} from '../types'
import {useTranslation} from '../i18n'
import ScrollReveal from './ScrollReveal'
import {OptimizedImage} from './OptimizedImage'
import {OptimizedVideo} from './OptimizedVideo'
import {YouTubeBackground} from './YouTubeBackground'
import PortableTextLite from './PortableTextLite'
import {useGoogleFonts} from '../hooks/useGoogleFont'

interface HomeContentBlocksProps {
  blocks: ContentBlock[]
  isMobile: boolean
  imageBorderClass: string
  overrideBackgroundColor?: string
}

export const HomeContentBlocks: React.FC<HomeContentBlocksProps> = ({
  blocks,
  isMobile,
  imageBorderClass,
  overrideBackgroundColor,
}) => {
  const {t} = useTranslation()

  // Tüm bloklardaki fontları topla ve yükle (stabilize with useMemo)
  const allFonts = useMemo(() => {
    const fonts = new Set<string>()
    blocks.forEach(b => {
      if (b.titleFont && b.titleFont !== 'normal') fonts.add(b.titleFont)
      if (b.contentFont && b.contentFont !== 'normal') fonts.add(b.contentFont)
    })
    return Array.from(fonts)
  }, [blocks])

  useGoogleFonts(allFonts)

  if (!blocks || blocks.length === 0) {
    return null
  }

  const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <>
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

        const backgroundColor = overrideBackgroundColor
          ? overrideBackgroundColor
          : block.backgroundColor === 'gray'
            ? 'bg-[var(--bg-secondary)]'
            : 'bg-[var(--bg-primary)]'

        const borderThickness = block.hasBorder
          ? Math.max(1, Math.min(12, Number(block.borderThickness || 1)))
          : 0

        const borderOverlayColor = typeof block.borderColor === 'string' 
          ? block.borderColor 
          : (block.borderColor as any)?.hex || 'color-mix(in srgb, var(--text-primary) 28%, transparent)'

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
        const borderPaddingStyle = customPadding !== undefined
          ? { padding: `${customPadding}px` }
          : undefined

        const borderPaddingClass = !borderPaddingStyle && borderThickness > 0 
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

        const titleFontFamily =
          titleFont === 'normal'
            ? '"Oswald", sans-serif'
            : titleFont === 'serif'
              ? 'serif'
              : titleFont === 'mono'
                ? 'monospace'
                : `"${titleFont}", sans-serif`

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
              className={`${isFullWidth ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-3xl md:text-5xl lg:text-6xl'} uppercase ${titleAlignClass} text-[var(--text-primary)] w-full ${block.verticalAlignment === 'top' ? 'mt-0' : ''} ${titleAlign === 'center' ? 'mx-auto' : titleAlign === 'right' ? 'ml-auto' : 'mr-auto'}`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontWeight: titleFont === 'normal' || titleFont === 'Oswald' ? 200 : 'inherit',
                letterSpacing: '0.1em',
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
                          className={`${marginClass} ${widthClass} ${isNormalContentFont ? 'font-roboto-thin text-xl md:text-2xl lg:text-3xl' : ''} text-[var(--text-primary)] ${block.verticalAlignment === 'top' && !hasTitle ? '[&_.portable-text-container>*:first-child]:!mt-0' : ''}`}
                          style={!isNormalContentFont ? {fontWeight: 300} : {}}
                        >
                          <PortableTextLite
                            value={desc}
                            removeTopMargin={block.verticalAlignment === 'top' && !hasTitle}
                          />
                        </div>
                      )
                    }

                    return (
                      <p
                        ref={!isNormalContentFont ? applyFontRef(contentFontFamily) : undefined}
                        className={`text-[var(--text-primary)] ${isNormalContentFont ? 'font-roboto-thin text-2xl md:text-3xl lg:text-4xl' : ''} leading-relaxed ${widthClass} ${marginClass} ${block.verticalAlignment === 'top' && !hasTitle ? 'mt-0' : ''}`}
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
                      className={`group inline-flex items-center gap-x-3 text-[var(--text-primary)] hover:opacity-70 border border-[var(--text-primary)] px-8 py-3 text-sm md:text-lg lg:text-xl transition-all duration-300`}
                    >
                      <span className="inline-flex justify-center">
                        <span className="font-bold font-helvetica tracking-[0.05em]">
                          {t(block.linkText)}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <div
                      className={`inline-flex items-center gap-x-3 text-[var(--text-primary)] font-bold py-4 text-sm md:text-lg lg:text-xl`}
                    >
                      <span className="inline-flex justify-center">
                        <span className="font-bold font-helvetica tracking-[0.05em]">
                          {t(block.linkText)}
                        </span>
                      </span>
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

        const hasMedia = !!mediaUrl

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
                        className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} hover:opacity-50 font-bold py-3 px-8 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-white' : 'border-[var(--text-primary)]'}`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 bg-transparent`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : block.mediaType === 'video' ? (
              <div className="relative w-full h-full">
                <OptimizedVideo
                  src={mediaUrl}
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
                        className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} hover:opacity-50 font-bold py-3 px-8 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-white' : 'border-[var(--text-primary)]'}`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 bg-transparent`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full">
                <OptimizedImage
                  src={mediaUrl}
                  alt=""
                  className={`${isFullWidth ? 'w-full h-auto' : `${mediaWidthClass} ${imageBorderClass}`} ${isMobile ? 'w-full object-cover' : 'object-cover'} block`}
                  loading="lazy"
                  quality={85}
                  crop={block.crop}
                  hotspot={block.hotspot}
                  origWidth={block.origWidth}
                  origHeight={block.origHeight}
                />
                {block.showButtonOnMedia && block.linkText && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    {block.linkUrl ? (
                      <Link
                        to={block.linkUrl}
                        className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} hover:opacity-50 font-bold py-3 px-8 transition-opacity duration-300 bg-transparent border ${isButtonWhite ? 'border-white' : 'border-[var(--text-primary)]'}`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <div
                        className={`pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 bg-transparent`}
                      >
                        <span className="inline-flex justify-center">
                          <span className="font-bold font-helvetica tracking-[0.05em]">
                            {t(block.linkText)}
                          </span>
                        </span>
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
            className={`${isFullWidth ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-0 ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-6 md:pt-8'} pb-3` : isCenter ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-6 md:pt-8'} pb-3` : 'w-full mx-auto mb-4'} flex flex-col gap-4 ${titleAlign === 'center' ? 'items-center text-center' : titleAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
          >
            {titlePosition === 'above' && titleElement}
            {textPosition === 'above' && bodyElement}
          </div>
        ) : null

        const textContentBelow = hasBottomContent ? (
          <div
            className={`${isFullWidth ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-0 ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-3'} pb-6 md:pb-8` : isCenter ? `w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto ${block.verticalAlignment === 'top' ? 'pt-0' : 'pt-3'} pb-6 md:pb-8` : `w-full mx-auto ${block.verticalAlignment === 'top' ? 'mt-0' : 'mt-4'}`} flex flex-col gap-4 ${titleAlign === 'center' ? 'items-center text-center' : titleAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
          >
            {titlePosition === 'below' && titleElement}
            {textPosition === 'below' && bodyElement}
          </div>
        ) : null

        // Content alanları arasında dikey boşluk olmasın (Sanity'den ayarlanabilir)
        const bottomSpacing = block.spacingBottom || 0

        return (
          <section
            key={index}
            className={`content-block-wrapper relative z-20 ${backgroundColor} transition-colors duration-500`}
            style={{
              paddingBottom:
                !hasTextContent || index === sortedBlocks.length - 1
                  ? 0
                  : bottomSpacing > 0
                    ? `${bottomSpacing}px`
                    : undefined,
            }}
            data-block-index={index}
          >
            {isFullWidth || isCenter ? (
              <div
                className={`${isFullWidth ? 'w-full' : 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto'} overflow-hidden flex flex-col items-center relative ${borderPaddingClass}`}
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
                className={`w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 overflow-hidden relative ${borderPaddingClass}`}
                style={borderPaddingStyle}
              >
                <div
                  className={
                    hasTextContent && hasMedia
                      ? `flex flex-col ${
                          isLeft ? 'md:flex-row' : isRight ? 'md:flex-row-reverse' : 'md:flex-row'
                        } ${block.verticalAlignment === 'top' ? 'gap-x-4 md:gap-x-6 gap-y-0' : 'gap-4 md:gap-6'} items-start`
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
                      className={`w-full ${hasMedia ? 'md:w-1/2' : 'md:w-full'} flex flex-col ${hasTitle && (hasDescription || block.linkText) ? 'gap-6' : 'gap-0'} self-stretch ${verticalAlignClass} ${block.verticalAlignment === 'top' && !hasTitle ? 'pt-0 mt-0' : ''}`}
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
        )
      })}
    </>
  )
}
