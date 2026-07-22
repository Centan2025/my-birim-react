import React, { useState, useRef, useCallback, useEffect } from 'react'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Orijinal Oda',
  afterLabel = 'AI Tasarım (Nano Banana)',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    let position = (x / rect.width) * 100
    if (position < 0) position = 0
    if (position > 100) position = 100
    setSliderPosition(position)
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX)
      }
    },
    [isDragging, handleMove]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      handleMove(e.clientX)
    },
    [isDragging, handleMove]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[400px] md:h-[500px] select-none overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true)
        handleMove(e.clientX)
      }}
      onTouchStart={(e) => {
        setIsDragging(true)
        if (e.touches[0]) handleMove(e.touches[0].clientX)
      }}
    >
      {/* After Image (Background / AI Image) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute top-4 right-4 z-10 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase bg-black/60 backdrop-blur-md rounded-full border border-white/20">
        {afterLabel}
      </div>

      {/* Before Image (Clipped / Original Room) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-semibold tracking-wider text-white uppercase bg-black/60 backdrop-blur-md rounded-full border border-white/20">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg border-2 border-black/10 text-xs font-bold transition-transform active:scale-95">
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 9l-3 3m0 0l3 3m-3-3h14m-3-6l3 3m0 0l-3 3"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
