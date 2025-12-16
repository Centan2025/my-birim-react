import React from 'react'
import { Link } from 'react-router-dom'

import { ContentBlock } from '../types'
import { useTranslation } from '../i18n'
import ScrollReveal from './ScrollReveal'
import { OptimizedImage } from './OptimizedImage'
import { OptimizedVideo } from './OptimizedVideo'
import { YouTubeBackground } from './YouTubeBackground'

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

        // Content alanları arasında dikey boşluk olmasın
        const sectionSpacingClass = 'py-0'

        return (
          <section
            key={index}
            className={`content-block-wrapper font-gotham ${sectionSpacingClass} ${backgroundColor}`}
            data-block-index={index}
          >
            {isFullWidth ? (
              <div className="w-full overflow-hidden">
                {hasTitle && (
                  <div className="container mx-auto px-2 sm:px-3 lg:px-4 pt-6 md:pt-8 pb-6 md:pb-8">
                    <ScrollReveal
                      delay={0}
                      threshold={0.1}
                      width="w-full"
                      className="h-auto"
                      distance={50}
                      duration={0.6}
                    >
                      <h2
                        className={`text-2xl md:text-4xl lg:text-5xl font-oswald uppercase ${textAlignClass} text-gray-950`}
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontFamily: '"Oswald", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t(block.title)}
                      </h2>
                    </ScrollReveal>
                  </div>
                )}
                <ScrollReveal delay={50} threshold={0.1} width="w-full" className="h-auto">
                  {block.mediaType === 'youtube' ? (
                    <div className="relative w-full aspect-video overflow-hidden">
                      <YouTubeBackground url={mediaUrl} />
                    </div>
                  ) : block.mediaType === 'video' ? (
                    <OptimizedVideo
                      src={mediaUrl}
                      className={`w-full h-auto max-w-full ${
                        isMobile ? 'object-contain' : 'object-cover'
                      }`}
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
                      className={`w-full h-auto ${
                        isMobile ? 'object-contain' : 'object-cover'
                      } max-w-full block`}
                      loading="lazy"
                      quality={85}
                    />
                  )}
                </ScrollReveal>
                {hasDescription && (
                  <div className="container mx-auto px-2 sm:px-3 lg:px-4 pt-6 pb-10">
                    <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                      <div className={`prose max-w-none ${textAlignClass}`}>
                        <p className="text-lg md:text-xl text-gray-900 font-normal leading-relaxed tracking-[0.03em]">
                          {t(block.description)}
                        </p>
                      </div>
                    </ScrollReveal>
                    {block.linkText && block.linkUrl && (
                      <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                        <div className={`mt-6 ${textAlignClass}`}>
                          <Link
                            to={block.linkUrl}
                            className="group inline-flex items-center gap-x-3 text-gray-950 font-bold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                          >
                            <span className="inline-flex items-end gap-x-3 border-b border-transparent md:group-hover:border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                              <span className="group-hover:text-gray-500 leading-none font-bold tracking-[0.05em] uppercase">
                                {t(block.linkText)}
                              </span>
                              <span className="w-8 h-[1px] md:w-10 bg-current" />
                            </span>
                          </Link>
                        </div>
                      </ScrollReveal>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="container mx-auto px-2 sm:px-3 lg:px-4">
                {hasTitle && (
                  <div className={`pt-6 md:pt-8 pb-6 md:pb-8 ${textAlignClass}`}>
                    <ScrollReveal
                      delay={0}
                      threshold={0.1}
                      width="w-full"
                      className="h-auto"
                      distance={50}
                      duration={0.6}
                    >
                      <h2
                        className="text-2xl md:text-4xl lg:text-5xl font-oswald uppercase text-gray-950"
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontFamily: '"Oswald", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t(block.title)}
                      </h2>
                    </ScrollReveal>
                  </div>
                )}
                <div
                  className={
                    hasTextContent
                      ? `flex flex-col ${
                          isLeft
                            ? 'md:flex-row'
                            : isRight
                              ? 'md:flex-row-reverse'
                              : 'md:flex-row items-center'
                        } gap-8 md:gap-10`
                      : 'flex flex-col items-center gap-8 md:gap-10'
                  }
                >
                  <div
                    className={`w-full ${
                      !hasTextContent || isCenter ? 'md:w-full' : 'md:w-1/2'
                    } overflow-visible`}
                  >
                    <ScrollReveal delay={50} threshold={0.1} width="w-full" className="h-auto">
                      {block.mediaType === 'youtube' ? (
                        <div className="relative w-full aspect-video overflow-hidden">
                          <YouTubeBackground url={mediaUrl} />
                        </div>
                      ) : block.mediaType === 'video' ? (
                        <OptimizedVideo
                          src={mediaUrl}
                          className={`w-full h-auto ${imageBorderClass} max-w-full ${
                            isMobile ? 'object-contain' : 'object-cover'
                          }`}
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
                          className={`w-full h-auto ${imageBorderClass} ${
                            isMobile ? 'object-contain' : 'object-cover'
                          } max-w-full block`}
                          loading="lazy"
                          quality={85}
                        />
                      )}
                    </ScrollReveal>
                  </div>
                  {hasDescription && (
                    <div className={`w-full ${isCenter ? 'md:w-full' : 'md:w-1/2'}`}>
                      <ScrollReveal delay={100} threshold={0.1} width="w-full" className="h-auto">
                        <div className={`prose max-w-none ${textAlignClass}`}>
                          <p className="text-lg md:text-xl text-gray-900 font-normal leading-relaxed tracking-[0.03em]">
                            {t(block.description)}
                          </p>
                        </div>
                      </ScrollReveal>
                      {block.linkText && block.linkUrl && (
                        <ScrollReveal delay={200} threshold={0.1} width="w-full" className="h-auto">
                          <div className={`mt-6 ${textAlignClass}`}>
                            <Link
                              to={block.linkUrl}
                              className="group inline-flex items-center gap-x-3 text-gray-950 font-bold py-3 pl-0 pr-5 text-sm md:text-lg rounded-lg"
                            >
                              <span className="inline-flex items-end gap-x-3 border-b border-transparent md:group-hover:border-transparent group-hover:border-gray-900 pb-1 transition-all duration-300 ease-out">
                                <span className="group-hover:text-gray-500 leading-none font-bold tracking-[0.05em] uppercase">
                                  {t(block.linkText)}
                                </span>
                                <span className="w-8 h-[1px] md:w-10 bg-current" />
                              </span>
                            </Link>
                          </div>
                        </ScrollReveal>
                      )}
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


