import React, {useRef, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {motion} from 'framer-motion'
import type {Project} from '../../types'
import {OptimizedImage} from '../OptimizedImage'
import {Breadcrumbs} from '../Breadcrumbs'
import ScrollReveal from '../ScrollReveal'
import {useTranslation} from '../../i18n'

interface ProjectVerticalCardProps {
  project: Project
  index: number
  isFeatured: boolean
}

const ProjectVerticalCard: React.FC<ProjectVerticalCardProps> = ({project, index, isFeatured}) => {
  const {t} = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const imageWrapperRef = useRef<HTMLDivElement>(null)

  // 60FPS High-Performance Vertical Parallax Displacement Effect
  useEffect(() => {
    let animationFrameId: number | null = null

    const updateParallax = () => {
      if (!cardRef.current || !imageWrapperRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight || document.documentElement.clientHeight

      // Only calculate if visible near viewport
      if (rect.bottom >= -150 && rect.top <= windowHeight + 150) {
        const cardCenterY = rect.top + rect.height / 2
        const screenCenterY = windowHeight / 2
        const normalizedPosY = (cardCenterY - screenCenterY) / (windowHeight / 2)
        const clampedPosY = Math.max(-1.4, Math.min(1.4, normalizedPosY))
        const shiftY = clampedPosY * -55 // Smooth 55px vertical parallax displacement

        imageWrapperRef.current.style.transform = `scale(1.22) translate3d(0px, ${shiftY.toFixed(1)}px, 0px)`
      }
    }

    const onScroll = () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateParallax)
    }

    updateParallax()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll, {passive: true})

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const dateVal = typeof project.date === 'string' ? project.date : t(project.date as never)
  const year = typeof dateVal === 'string' ? dateVal.match(/\d{4}/)?.[0] || dateVal : ''
  const projObj = project as unknown as Record<string, unknown>
  const location = projObj['location'] ? t(projObj['location'] as never) : ''

  return (
    <div ref={cardRef} className={`w-full ${isFeatured ? 'md:col-span-2' : 'md:col-span-1'}`}>
      <ScrollReveal delay={index * 60} distance={25} duration={0.7}>
        <Link
          to={`/projects/${project.id}`}
          className="group block relative w-full overflow-hidden bg-zinc-950 border-[0.5px] border-white/10 hover:border-white/70 shadow-2xl transition-all duration-500"
        >
          {/* Image Container with 60FPS Parallax Offset */}
          <div
            className={`relative w-full overflow-hidden ${
              isFeatured
                ? 'aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]'
                : 'aspect-[4/3] sm:aspect-[16/10]'
            }`}
          >
            <div
              ref={imageWrapperRef}
              className="w-full h-full will-change-transform pointer-events-none"
              style={{
                transform: 'scale(1.22) translate3d(0px, 0px, 0px)',
              }}
            >
              {project.cover && (
                <OptimizedImage
                  src={typeof project.cover === 'string' ? project.cover : project.cover?.url || ''}
                  srcMobile={
                    typeof project.cover === 'object' ? project.cover.urlMobile : undefined
                  }
                  srcDesktop={
                    typeof project.cover === 'object' ? project.cover.urlDesktop : undefined
                  }
                  alt={t(project.title)}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading={index < 2 ? 'eager' : 'lazy'}
                  quality={90}
                  crop={typeof project.cover === 'object' ? project.cover.crop : undefined}
                  hotspot={typeof project.cover === 'object' ? project.cover.hotspot : undefined}
                />
              )}
            </div>

            {/* Gradient Shadow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

            {/* Card Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
              {/* Metadata Badges */}
              <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                {year && (
                  <span className="text-[10px] md:text-[11px] font-bold tracking-[0.3em] text-white uppercase">
                    {year}
                  </span>
                )}
                {year && project.projectCategory && <div className="w-5 h-px bg-white/40" />}
                {project.projectCategory && (
                  <span className="text-[10px] md:text-[11px] font-medium tracking-[0.25em] text-white/70 uppercase">
                    {t(project.projectCategory)}
                  </span>
                )}
                {location && (
                  <>
                    <div className="w-5 h-px bg-white/40" />
                    <span className="text-[10px] md:text-[11px] font-medium tracking-[0.2em] text-white/60 uppercase">
                      {location}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2
                className={`font-light tracking-[-0.05em] text-white uppercase leading-tight mb-3 transition-colors duration-300 group-hover:text-white font-michroma ${
                  isFeatured
                    ? 'text-2xl sm:text-3xl md:text-4xl'
                    : 'text-xl sm:text-2xl md:text-3xl'
                }`}
                style={{letterSpacing: '-0.05em'}}
              >
                {t(project.title)}
              </h2>

              {/* Bottom Action Line */}
              <div className="flex items-center justify-between pt-3 border-t border-white/15">
                <span className="text-[11px] font-mono tracking-widest text-white/60 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <span>PROJEYİ İNCELE</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </span>
                <span className="text-[10px] font-mono tracking-widest text-white/40">
                  BIRIM / ARCH
                </span>
              </div>
            </div>
          </div>
        </Link>
      </ScrollReveal>
    </div>
  )
}

interface ProjectsV2VerticalViewProps {
  projects: Project[]
}

export const ProjectsV2VerticalView: React.FC<ProjectsV2VerticalViewProps> = ({projects}) => {
  const {t} = useTranslation()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden pt-20 md:pt-20 lg:pt-20 pb-32">
      {/* Breadcrumb Section */}
      <div className="relative z-20 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
        <Breadcrumbs
          items={[{label: t('homepage'), to: '/'}, {label: t('projects') || 'Projeler'}]}
        />
      </div>

      {/* Header Section (Matching Designers Page) */}
      <header className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t('projects') || 'Projeler'}
          </h1>
        </motion.div>
      </header>

      {/* Vertical Exhibition Grid */}
      <main className="relative z-10 w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
            {projects.map((project, index) => (
              <ProjectVerticalCard
                key={project.id}
                project={project}
                index={index}
                isFeatured={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[var(--text-secondary)] text-lg italic font-light tracking-widest">
              {t('project_not_found')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
