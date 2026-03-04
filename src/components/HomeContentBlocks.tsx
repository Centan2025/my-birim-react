import React, { SVGProps } from 'react'
import { Link } from 'react-router-dom'

import { ContentBlock } from '../types'
import { useTranslation } from '../i18n'
import ScrollReveal from './ScrollReveal'
import { OptimizedImage } from './OptimizedImage'
import { OptimizedVideo } from './OptimizedVideo'
import { YouTubeBackground } from './YouTubeBackground'
import PortableTextLite from './PortableTextLite'
import { useGoogleFonts } from '../hooks/useGoogleFont'

const ArrowRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 10 22 16" />
    <path d="M22 16H2" />
  </svg>
)

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
        const hasTextContent = hasTitle || hasDescription || !!(block.linkText && block.linkUrl && !block.showButtonOnMedia)

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
              className={`${isFullWidth ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-3xl md:text-5xl lg:text-6xl'} uppercase ${textAlignClass} text-gray-950 w-full mb-4 ${textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : 'mr-auto'}`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily:
                  titleFont === 'normal'
                    ? '"Oswald", sans-serif'
                    : titleFont === 'serif'
                      ? 'serif'
                      : titleFont === 'mono'
                        ? 'monospace'
                        : `"${titleFont}", sans-serif`,
                fontWeight: titleFont === 'normal' || titleFont === 'Oswald' ? 200 : 'inherit',
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
                    const widthClass = textAlign === 'center' ? 'max-w-4xl' : 'w-full'
                    const marginClass =
                      textAlign === 'center'
                        ? 'mx-auto'
                        : textAlign === 'right'
                          ? 'ml-auto'
                          : 'mr-auto'

                    return Array.isArray(desc) ? (
                      <div
                        className={`${marginClass} ${widthClass} mt-3 font-roboto-thin text-gray-950 text-xl md:text-2xl lg:text-3xl`}
                      >
                        <PortableTextLite value={desc} />
                      </div>
                    ) : (
                      <p
                        className={`mt-3 text-gray-950 font-roboto-thin leading-relaxed ${widthClass} text-2xl md:text-3xl lg:text-4xl ${marginClass}`}
                      >
                        {desc}
                      </p>
                    )
                  })()}
                </div>
              </ScrollReveal>
            )}
            {block.linkText && block.linkUrl && !block.showButtonOnMedia && (
              <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                <div
                  className={`mt-6 ${textAlignClass} flex ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'}`}
                >
                  <Link
                    to={block.linkUrl}
                    className={`group inline-flex items-center gap-x-3 text-gray-950 font-bold py-4 text-base md:text-xl lg:text-2xl transition-all duration-300`}
                  >
                    <span className="inline-flex justify-center transition-all duration-500 ease-out">
                      <span className="font-bold tracking-[0.05em] transition-all duration-500 ease-out md:group-hover:tracking-[0.10em]">
                        {t(block.linkText)}
                      </span>
                    </span>
                    <ArrowRight className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                  </Link>
                </div>
              </ScrollReveal>
            )}
          </div>
        )

        const mediaWidthClass = isFullWidth
          ? 'w-full'
          : 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto'

        const isButtonWhite = block.buttonColor === 'white'
        const buttonTextColorClass = isButtonWhite ? 'text-white' : 'text-gray-950'

        const mediaContent = (
          <ScrollReveal
            delay={50}
            threshold={0.1}
            width={isFullWidth || isCenter ? 'w-full' : 'w-auto'}
            className={`h-auto ${isFullWidth || isCenter ? 'w-full' : ''} ${isCenter ? 'flex justify-center' : ''}`}
          >
            {block.mediaType === 'youtube' ? (
              <div className={`relative ${mediaWidthClass} aspect-video overflow-hidden`}>
                <YouTubeBackground url={mediaUrl} />
                {block.showButtonOnMedia && block.linkText && block.linkUrl && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    <Link
                      to={block.linkUrl}
                      className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 transition-all duration-300 bg-transparent hover:bg-transparent`}
                    >
                      <span className="inline-flex justify-center transition-all duration-500 ease-out">
                        <span className="font-bold tracking-[0.05em] transition-all duration-500 ease-out md:group-hover:tracking-[0.10em]">
                          {t(block.linkText)}
                        </span>
                      </span>
                      <ArrowRight className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                    </Link>
                  </div>
                )}
              </div>
            ) : block.mediaType === 'video' ? (
              <div className="relative w-full h-full">
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
                {block.showButtonOnMedia && block.linkText && block.linkUrl && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    <Link
                      to={block.linkUrl}
                      className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 transition-all duration-300 bg-transparent hover:bg-transparent`}
                    >
                      <span className="inline-flex justify-center transition-all duration-500 ease-out">
                        <span className="font-bold tracking-[0.05em] transition-all duration-500 ease-out md:group-hover:tracking-[0.10em]">
                          {t(block.linkText)}
                        </span>
                      </span>
                      <ArrowRight className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full">
                <OptimizedImage
                  src={mediaUrl}
                  alt=""
                  className={`${isFullWidth ? 'w-full h-auto' : `${mediaWidthClass} ${imageBorderClass}`} ${isMobile ? 'object-contain' : 'object-cover'} block`}
                  loading="lazy"
                  quality={85}
                  crop={block.crop}
                  hotspot={block.hotspot}
                />
                {block.showButtonOnMedia && block.linkText && block.linkUrl && (
                  <div
                    className={`absolute z-30 flex pointer-events-none p-2 md:p-8 ${getButtonPositionClasses(block.buttonPositionOnMedia)}`}
                  >
                    <Link
                      to={block.linkUrl}
                      className={`group pointer-events-auto inline-flex items-center gap-x-3 ${buttonTextColorClass} font-bold py-4 px-4 md:px-8 transition-all duration-300 bg-transparent hover:bg-transparent`}
                    >
                      <span className="inline-flex justify-center transition-all duration-500 ease-out">
                        <span className="font-bold tracking-[0.05em] transition-all duration-500 ease-out md:group-hover:tracking-[0.10em]">
                          {t(block.linkText)}
                        </span>
                      </span>
                      <ArrowRight className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        )

        const hasTopContent =
          (titlePosition === 'above' && hasTitle) ||
          (textPosition === 'above' && (hasDescription || (block.linkText && block.linkUrl && !block.showButtonOnMedia)))

        const hasBottomContent =
          (titlePosition === 'below' && hasTitle) ||
          (textPosition === 'below' && (hasDescription || (block.linkText && block.linkUrl && !block.showButtonOnMedia)))

        const textContentAbove = hasTopContent ? (
          <div
            className={`${isFullWidth ? 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-0 pt-6 md:pt-8 pb-3' : isCenter ? 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto pt-6 md:pt-8 pb-3' : 'w-full mx-auto mb-4'} flex flex-col ${textAlign === 'center' ? 'items-center text-center' : textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
          >
            {titlePosition === 'above' && titleElement}
            {textPosition === 'above' && bodyElement}
          </div>
        ) : null

        const textContentBelow = hasBottomContent ? (
          <div
            className={`${isFullWidth ? 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-0 pt-3 pb-6 md:pb-8' : isCenter ? 'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto pt-3 pb-6 md:pb-8' : 'w-full mx-auto mt-4'} flex flex-col ${textAlign === 'center' ? 'items-center text-center' : textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
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
            className={`content-block-wrapper relative z-20 ${backgroundColor}`}
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
              <div className="w-full overflow-hidden flex flex-col items-center">
                {textContentAbove}
                {mediaContent}
                {textContentBelow}
              </div>
            ) : (
              <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
                <div
                  className={
                    hasTextContent
                      ? `flex flex-col ${isLeft
                        ? 'md:flex-row'
                        : isRight
                          ? 'md:flex-row-reverse'
                          : 'md:flex-row'
                      } gap-4 md:gap-6 items-start`
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
                    <div className={`w-full md:w-1/2 flex flex-col ${verticalAlignClass}`}>
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
