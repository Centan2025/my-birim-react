import React, { useRef, useState } from 'react'
import { OptimizedImage } from '../OptimizedImage'
import { useTranslation } from '../../i18n'
import type { LocalizedString } from '../../types'

interface ProductThumbnailsProps {
    productName: LocalizedString
    bandMedia: any[]
    currentImageIndex: number
    imageBorderClass: string
    slideCount: number
    onSelect: (index: number) => void
}

const youTubeThumb = (url: string) => {
    let id = ''
    if (url.includes('youtube.com/watch?v=')) id = url.split('v=')[1].split('&')[0]
    else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0]
    else if (url.includes('youtube.com/embed/')) id = url.split('embed/')[1].split('?')[0]
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}

export const ProductThumbnails: React.FC<ProductThumbnailsProps> = ({
    productName,
    bandMedia,
    currentImageIndex,
    imageBorderClass,
    slideCount,
    onSelect,
}) => {
    const { t } = useTranslation()
    const thumbRef = useRef<HTMLDivElement | null>(null)
    const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null)
    const [thumbScrollStart, setThumbScrollStart] = useState<number>(0)
    const thumbButtonsRef = useRef<(HTMLButtonElement | null)[]>([])

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-1 md:mt-2 border-b border-gray-300 py-3">
                <div className="relative select-none">
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <div
                        ref={thumbRef}
                        className="scrollbar-hide overflow-x-auto cursor-grab active:cursor-grabbing max-lg:overflow-y-visible"
                        role="region"
                        aria-label="Thumbnail Slider"
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                        tabIndex={0}
                        onMouseDown={e => {
                            setThumbDragStartX(e.clientX)
                            setThumbScrollStart(thumbRef.current ? thumbRef.current.scrollLeft : 0)
                        }}
                        onMouseLeave={() => {
                            setThumbDragStartX(null)
                        }}
                        onMouseUp={() => {
                            setThumbDragStartX(null)
                        }}
                        onMouseMove={e => {
                            if (thumbDragStartX === null || !thumbRef.current) return
                            const delta = e.clientX - thumbDragStartX
                            thumbRef.current.scrollLeft = thumbScrollStart - delta
                        }}
                        onKeyDown={e => {
                            if (!thumbRef.current) return
                            if (e.key === 'ArrowLeft')
                                thumbRef.current.scrollBy({ left: -50, behavior: 'smooth' })
                            if (e.key === 'ArrowRight')
                                thumbRef.current.scrollBy({ left: 50, behavior: 'smooth' })
                        }}
                    >
                        <div className="relative flex gap-3 min-w-max pb-2">
                            {bandMedia.map((m, idx) => (
                                <button
                                    key={idx}
                                    ref={el => {
                                        thumbButtonsRef.current[idx] = el
                                    }}
                                    className={`relative z-20 flex-shrink-0 w-24 h-24 rounded-none transition-all duration-300 ${currentImageIndex === idx ? 'opacity-100' : 'opacity-80 hover:opacity-100 hover:scale-105'
                                        }`}
                                    onClick={() => onSelect(idx)}
                                >
                                    <div className="relative w-full h-full">
                                        {m.type === 'image' ? (
                                            <OptimizedImage
                                                src={m.url}
                                                alt={`${t(productName)} thumbnail ${idx + 1}`}
                                                className={`w-full h-full object-cover ${imageBorderClass}`}
                                                loading="lazy"
                                                quality={75}
                                                crop={m.crop}
                                                hotspot={m.hotspot}
                                            />
                                        ) : m.type === 'video' ? (
                                            <video
                                                src={m.url}
                                                className={`w-full h-full object-cover ${imageBorderClass}`}
                                                muted
                                                playsInline
                                                preload="metadata"
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        ) : (
                                            <OptimizedImage
                                                src={youTubeThumb(m.url)}
                                                alt={`youtube thumb ${idx + 1}`}
                                                className={`w-full h-full object-cover ${imageBorderClass}`}
                                                loading="lazy"
                                                quality={75}
                                            />
                                        )}
                                        {(m.type === 'video' || m.type === 'youtube') && (
                                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        className="w-5 h-5 ml-0.5"
                                                    >
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </span>
                                            </span>
                                        )}
                                        {/* Minimal active indicator */}
                                        <div
                                            className="pointer-events-none absolute -bottom-2 left-0 right-0 h-[3px] bg-gray-500 z-[30] origin-center transition-transform duration-300 ease-out"
                                            style={{
                                                transform: currentImageIndex === idx ? 'scaleX(1)' : 'scaleX(0)',
                                            }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Scroll buttons */}
                    <button
                        aria-label="scroll-left"
                        onClick={() => {
                            if (thumbRef.current)
                                thumbRef.current.scrollBy({ left: -240, behavior: 'smooth' })
                        }}
                        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
                        style={{
                            left: '-60px',
                            width: '44px',
                            height: '44px',
                            backgroundColor: 'transparent',
                            color: '#4b5563',
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="33"
                            height="33"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="16 20 8 12 16 4" />
                        </svg>
                    </button>
                    <button
                        aria-label="scroll-right"
                        onClick={() => {
                            if (thumbRef.current) thumbRef.current.scrollBy({ left: 240, behavior: 'smooth' })
                        }}
                        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-transform hover:scale-105 active:scale-95 z-10"
                        style={{
                            right: '-60px',
                            width: '44px',
                            height: '44px',
                            backgroundColor: 'transparent',
                            color: '#4b5563',
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="33"
                            height="33"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="8 20 16 12 8 4" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    )
}
