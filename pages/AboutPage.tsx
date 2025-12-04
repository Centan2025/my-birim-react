import React, {useState, useEffect, useRef} from 'react'
import {getAboutPageContent} from '../services/cms'
import type {AboutPageContent} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'

const CrossFadeText: React.FC<{text: string; triggerKey: number}> = ({text, triggerKey}) => {
  const [currentText, setCurrentText] = useState(text)
  const [previousText, setPreviousText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    // İlk mount'ta animasyon oynatma
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      setCurrentText(text)
      setPreviousText(text)
      return
    }

    setPreviousText(currentText)
    setCurrentText(text)
    setIsAnimating(true)

    const timeout = window.setTimeout(() => {
      setIsAnimating(false)
    }, 500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [triggerKey])

  if (!isAnimating) {
    return <>{currentText}</>
  }

  return (
    <span className="relative inline-block">
      <span className="block cross-fade-text-out">{previousText}</span>
      <span className="block absolute inset-0 cross-fade-text-in">{currentText}</span>
    </span>
  )
}

export function AboutPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const {t} = useTranslation()
  const [activeSection, setActiveSection] = useState<'history' | 'identity' | 'quality' | null>(
    null
  )
  const [sectionChangeId, setSectionChangeId] = useState(0)
  const tabsContainerRef = useRef<HTMLDivElement | null>(null)
  const historyBtnRef = useRef<HTMLButtonElement | null>(null)
  const identityBtnRef = useRef<HTMLButtonElement | null>(null)
  const qualityBtnRef = useRef<HTMLButtonElement | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{left: number; width: number} | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const pageContent = await getAboutPageContent()
        setContent(pageContent || null)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [])

  // Aktif sekmeye göre altındaki gri highlight alanını butonların gerçek genişliğine göre hizala
  useEffect(() => {
    const updateIndicator = () => {
      if (!activeSection || !tabsContainerRef.current) {
        setIndicatorStyle(null)
        return
      }

      let btn: HTMLButtonElement | null = null
      if (activeSection === 'history') btn = historyBtnRef.current
      else if (activeSection === 'identity') btn = identityBtnRef.current
      else if (activeSection === 'quality') btn = qualityBtnRef.current

      if (!btn) {
        setIndicatorStyle(null)
        return
      }

      setIndicatorStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeSection])

  if (loading || !content) {
    return (
      <div className="pt-24">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-white animate-fade-in-up-subtle">
      <style>
        {`
          @keyframes aboutTextFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes aboutTextFadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          .cross-fade-text-in {
            animation: aboutTextFadeIn 0.5s ease-in-out forwards;
          }
          .cross-fade-text-out {
            animation: aboutTextFadeOut 0.5s ease-in-out forwards;
          }
        `}
      </style>
      {/* Hero Section */}
      <div className="relative h-[50vh] bg-gray-800 text-white flex items-center justify-center overflow-hidden">
        {content.heroImage && (
          <div className="absolute inset-0 w-full h-full">
            <OptimizedImage
              src={content.heroImage}
              alt={t(content.heroTitle)}
              className="w-full h-full object-cover opacity-40"
              loading="eager"
              quality={90}
            />
          </div>
        )}
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-light tracking-tighter uppercase">
            {t(content.heroTitle)}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-light">
            {t(content.heroSubtitle)}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-16">
        <Breadcrumbs
          className="mb-6"
          items={[
            {label: t('homepage'), to: '/'},
            {label: t('about')},
          ]}
        />
        {/* Our Story Section */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 prose prose-lg text-gray-500 max-w-none font-light">
            <h2 className="text-3xl font-light text-gray-600">{t(content.storyTitle)}</h2>
            <p>{t(content.storyContentP1)}</p>
            <p>{t(content.storyContentP2)}</p>
          </div>
          <div className="md:col-span-2">
            {content.storyImage && (
              <OptimizedImage
                src={content.storyImage}
                alt="story"
                className="w-full shadow-lg"
                loading="lazy"
                quality={85}
              />
            )}
          </div>
        </div>

        {/* Üçlü özel içerik bölümü: TARİHÇE, KİMLİK, KALİTE (tıklanabilir, ortak metin alanı) */}
        <div className="my-24">
          <div className="flex flex-col items-center">
            <div className="w-full md:w-auto">
              <div
                ref={tabsContainerRef}
                className="relative inline-flex w-full max-w-4xl justify-center border-b border-gray-300"
              >
                {/* Seçili düğme için kayan koyu gri arka plan */}
                {activeSection && indicatorStyle && (
                  <div
                    className="absolute bottom-0 top-0 bg-gray-300 transition-all duration-500 ease-out pointer-events-none"
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                    }}
                  />
                )}
                <div className="relative z-10 flex flex-row w-full">
              <button
                ref={historyBtnRef}
                type="button"
                onClick={() => {
                  setActiveSection(prev => {
                    const next = prev === 'history' ? null : 'history'
                    if (next) {
                      setSectionChangeId(id => id + 1)
                    }
                    return next
                  })
                }}
                className={`flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-[0.25em] uppercase transition-colors duration-200 ${
                  activeSection === 'history' ? 'text-black' : 'text-gray-800 hover:text-black'
                }`}
              >
                TARİHÇE
              </button>
              <button
                ref={identityBtnRef}
                type="button"
                onClick={() => {
                  setActiveSection(prev => {
                    const next = prev === 'identity' ? null : 'identity'
                    if (next) {
                      setSectionChangeId(id => id + 1)
                    }
                    return next
                  })
                }}
                className={`flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-[0.25em] uppercase transition-colors duration-200 ${
                  activeSection === 'identity' ? 'text-black' : 'text-gray-800 hover:text-black'
                }`}
              >
                KİMLİK
              </button>
              <button
                ref={qualityBtnRef}
                type="button"
                onClick={() => {
                  setActiveSection(prev => {
                    const next = prev === 'quality' ? null : 'quality'
                    if (next) {
                      setSectionChangeId(id => id + 1)
                    }
                    return next
                  })
                }}
                className={`flex-1 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm tracking-[0.25em] uppercase transition-colors duration-200 ${
                  activeSection === 'quality' ? 'text-black' : 'text-gray-800 hover:text-black'
                }`}
              >
                KALİTE
              </button>
                </div>
              </div>
            </div>

            {activeSection && (
              <div className="mt-8 max-w-3xl mx-auto text-center">
                <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed font-light">
                  <CrossFadeText
                    text={
                      activeSection === 'history' && content.historySection?.content
                        ? t(content.historySection.content)
                        : activeSection === 'identity' && content.identitySection?.content
                          ? t(content.identitySection.content)
                          : activeSection === 'quality' && content.qualitySection?.content
                            ? t(content.qualitySection.content)
                            : ''
                    }
                    triggerKey={sectionChangeId}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
