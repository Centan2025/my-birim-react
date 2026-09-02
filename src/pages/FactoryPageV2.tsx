import {useState, useEffect, useMemo, useRef} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {Link} from 'react-router-dom'
import {getFactoryPageContent} from '../services/cms'
import {mapImage} from '../services/sanity/client'
import type {FactoryPageContent, NewsMedia, LocalizedString} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer/FullscreenMediaViewer'

const containerClass =
  'w-full max-w-[95%] md:max-w-[92%] lg:max-w-[82vw] mx-auto px-4 md:px-8 lg:px-0'

const DEFAULT_FACTORY_IMAGES = {
  hero: '/img/about/quality.jpg',
  wood: '/img/about/history.jpg',
  metal: '/img/about/hero.jpg',
  upholstery: '/img/about/identity.jpg',
  finishing: '/img/about/quality.jpg',
}

interface DisciplineItem {
  id: string
  titleTr: string
  titleEn: string
  subtitleTr: string
  subtitleEn: string
  descTr: string
  descEn: string
  featuresTr: string[]
  featuresEn: string[]
  fallbackImage: string
}

const DISCIPLINES: DisciplineItem[] = [
  {
    id: 'wood',
    titleTr: 'Ahşap & Masif İşleme',
    titleEn: 'Woodworking & Solid Timber',
    subtitleTr: '5-Eksen CNC ve Geleneksel Ustalık',
    subtitleEn: '5-Axis CNC & Traditional Mastery',
    descTr:
      'Özenle seçilmiş masif ağaçlar ve doğal kaplamalar, mikron toleranslı 5-eksen CNC tezgâhlarımız ve ustalarımızın el hassasiyetiyle kusursuz formlara dönüşür.',
    descEn:
      'Carefully selected solid timber and natural veneers are transformed into flawless architectural forms using 5-axis CNC machining and master craftsmanship.',
    featuresTr: [
      '5-Eksen 3D CNC Frezeleme Teknolojisi',
      'FSC Sertifikalı Doğal Ağaç & Masif Seçkisi',
      'Hassas Zıvana & Gizli Kırlangıç Birleşimler',
    ],
    featuresEn: [
      '5-Axis 3D CNC Milling Technology',
      'FSC Certified Sustainable Solid Timber',
      'Precision Joinery & Hidden Dowel Structures',
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.wood,
  },
  {
    id: 'metal',
    titleTr: 'Metal & İleri Form Verme',
    titleEn: 'Metal & Precision Fabrication',
    subtitleTr: 'Lazer Kesim & Robotik Kaynak',
    subtitleEn: 'Laser Cutting & Robotic Welding',
    descTr:
      'Mimari detayların gerektirdiği mukavemet ve estetik; fiber lazer kesim, hassas büküm ve TIG/MIG robotik kaynak parkurumuzda şekil bulur.',
    descEn:
      'Structural strength and delicate aesthetic required by architectural projects are shaped through fiber laser cutting, precision bending, and robotic welding.',
    featuresTr: [
      'Fiber Lazer Sac & Boru Kesim Hattı',
      'Robotik TIG/MIG & Manuel Zanaatkar Kaynağı',
      'Elektrostatik Toz Boya & Mat Fırınlama',
    ],
    featuresEn: [
      'Fiber Laser Sheet & Tube Cutting Line',
      'Robotic TIG/MIG & Artisan Manual Welding',
      'Electrostatic Powder Coating & Matte Curing',
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.metal,
  },
  {
    id: 'upholstery',
    titleTr: 'Zanaatkar Döşeme & Terzilik',
    titleEn: 'Master Upholstery & Tailoring',
    subtitleTr: 'Ergonomi ve El İşçiliği',
    subtitleEn: 'Ergonomics & Handcrafted Tailoring',
    descTr:
      'Yüksek yoğunluklu ortopedik sünger blokları, premium deri ve seçkin dokuma kumaşlarla usta terzilerimizin ellerinde özenle giydirilir.',
    descEn:
      'High-density ergonomic foams are meticulously tailored with premium leathers and exclusive contract fabrics by our master upholsterers.',
    featuresTr: [
      'Özel Kalıp ve Bilgisayarlı Kumaş Kesimi',
      'İtalyan Deri & Alev Almaz Kontrat Kumaşlar',
      'El İşçiliği Fitil, Kapitone ve Dikiş Detayları',
    ],
    featuresEn: [
      'Bespoke Patterning & Automated Cutting',
      'Premium Italian Leathers & Fire-Retardant Fabrics',
      'Handcrafted Piping, Tufting & Stitch Details',
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.upholstery,
  },
  {
    id: 'finishing',
    titleTr: 'Yüzey İşlem & Akrilik Cila',
    titleEn: 'Finishing & Surface Treatment',
    subtitleTr: 'Ekolojik Koruma ve Dokunsal Lüks',
    subtitleEn: 'Eco Protection & Tactile Luxury',
    descTr:
      'Doğal yağlar, su bazlı ekolojik boyalar ve UV dayanımlı poliüretan cila kabinlerimiz, ahşabın ve metalin dokusunu koruyarak yıllara meydan okuyan dayanıklılık kazandırır.',
    descEn:
      'Natural oils, water-based eco coatings, and UV-resistant polyurethane finishing protect the authentic texture of materials for generations.',
    featuresTr: [
      'Su Bazlı Ekolojik ve Kokusuz Boya Sistemleri',
      'Mat Doğal Dokulu İpek Yağ Uygulamaları',
      'İklim ve Nem Koşullarına Dirençli UV Katmanlar',
    ],
    featuresEn: [
      'Water-Based Eco-Friendly Coating Systems',
      'Matte Tactile Silk Oil Formulations',
      'Climate & Humidity Resistant Protective UV Layers',
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.finishing,
  },
]

export function FactoryPageV2() {
  const [content, setContent] = useState<FactoryPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDisciplineIndex, setActiveDisciplineIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [initialViewerIndex, setInitialViewerIndex] = useState(0)
  const mobileCarouselRef = useRef<HTMLDivElement>(null)

  const scrollToDiscipline = (index: number) => {
    setActiveDisciplineIndex(index)
    if (mobileCarouselRef.current) {
      const el = mobileCarouselRef.current.children[index] as HTMLElement | undefined
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }
  }

  const handleMobileCarouselScroll = () => {
    if (!mobileCarouselRef.current) return
    const container = mobileCarouselRef.current
    const children = Array.from(container.children) as HTMLElement[]
    if (children.length === 0) return
    const center = container.scrollLeft + container.clientWidth / 2
    let closestIndex = 0
    let minDiff = Infinity
    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2
      const diff = Math.abs(center - childCenter)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = idx
      }
    })
    if (closestIndex !== activeDisciplineIndex) {
      setActiveDisciplineIndex(closestIndex)
    }
  }

  const {t, locale} = useTranslation()
  const isTr = locale === 'tr'
  const {setBrightness, reset} = useHeaderTheme()

  useEffect(() => {
    setBrightness(0)
    return () => reset()
  }, [setBrightness, reset])

  useEffect(() => {
    let isMounted = true
    const fetchContent = async () => {
      setLoading(true)
      try {
        const pageContent = await getFactoryPageContent()
        if (isMounted) {
          setContent(pageContent || null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchContent()
    return () => {
      isMounted = false
    }
  }, [])

  const galleryItems = useMemo(() => {
    if (content?.gallery && content.gallery.length > 0) {
      return content.gallery
    }
    return [
      {type: 'image', url: DEFAULT_FACTORY_IMAGES.hero, caption: 'Birim Üretim Tesisi'},
      {type: 'image', url: DEFAULT_FACTORY_IMAGES.wood, caption: 'CNC Ahşap İşleme Parkuru'},
      {type: 'image', url: DEFAULT_FACTORY_IMAGES.metal, caption: 'Metal Şekillendirme ve Kaynak'},
      {type: 'image', url: DEFAULT_FACTORY_IMAGES.upholstery, caption: 'Zanaatkar Döşeme Atölyesi'},
      {type: 'image', url: DEFAULT_FACTORY_IMAGES.finishing, caption: 'Yüzey Koruma ve Cila'},
    ] as NewsMedia[]
  }, [content?.gallery])

  const heroImageUrl =
    (content?.heroImageR2 ? mapImage(content.heroImageR2 as never) : '') ||
    galleryItems[0]?.url ||
    DEFAULT_FACTORY_IMAGES.hero

  const resolveCmsText = (
    field: LocalizedString | undefined,
    fallbackTr: string,
    fallbackEn: string
  ): string => {
    // CMS verisi hiç yoksa (CMS yüklenmediyse) fallback kullan
    if (!content) {
      return isTr ? fallbackTr : fallbackEn
    }
    // CMS dokümanı yüklendiğinde alan boşsa veya silindiyse kesinlikle boş string döndür
    if (!field) {
      return ''
    }
    // CMS'te alan varsa seçili dildeki değerini al (boşsa boş döner)
    return t(field)
  }

  const heroTitle = resolveCmsText(
    content?.heroTitle,
    'Zanaatın Endüstriyel Ölçekle Buluşması',
    'Where Craftsmanship Meets Industrial Scale'
  )

  const heroDescription = resolveCmsText(
    content?.heroDescription,
    'Birim’in 15.000 m² entegre üretim tesisi; ahşap, metal, döşeme ve yüzey işlem atölyelerini mikron düzeyinde hassasiyetle tek çatı altında buluşturuyor.',
    'Birim’s 15,000 m² integrated manufacturing facility unites woodworking, metal fabrication, upholstery, and finishing with micro-precision under one roof.'
  )

  const metrics = useMemo(() => {
    if (content?.metrics && content.metrics.length > 0) {
      return content.metrics.map(m => ({
        value: m.value !== undefined ? t(m.value) : '',
        label: m.label !== undefined ? t(m.label) : '',
      }))
    }
    return [
      {
        value: isTr ? '15.000 m²' : '15,000 m²',
        label: isTr
          ? 'Entegre kapalı üretim tesisi ve modern makine parkuru'
          : 'Integrated manufacturing facility and advanced machine park',
      },
      {
        value: isTr ? '50+ Yıl' : '50+ Yrs',
        label: isTr
          ? 'Kuşaktan kuşağa aktarılan zanaatkarlık mirası ve uzmanlık'
          : 'Generations of artisanal mastery and manufacturing know-how',
      },
      {
        value: isTr ? '4 Disiplin' : '4 Units',
        label: isTr
          ? 'Ahşap, Metal, Döşeme ve Yüzey İşlem tek çatı altında'
          : 'Wood, Metal, Upholstery & Finishing under single management',
      },
      {
        value: '%100 FSC',
        label: isTr
          ? 'Sürdürülebilir orman kaynakları ve çevre dostu üretim'
          : 'Sustainably sourced certified timber & eco-conscious processes',
      },
    ]
  }, [content?.metrics, isTr, t])

  const disciplinesList = useMemo(() => {
    if (content?.disciplines && content.disciplines.length > 0) {
      return content.disciplines.map((d, index) => ({
        id: d.id || `discipline-${index}`,
        title: d.title !== undefined ? t(d.title) : '',
        subtitle: d.subtitle !== undefined ? t(d.subtitle) : '',
        description: d.description !== undefined ? t(d.description) : '',
        features: Array.isArray(d.features)
          ? d.features.map(f => (f !== undefined ? t(f) : '')).filter(Boolean)
          : [],
        image:
          d.image ||
          (d.imageR2 ? mapImage(d.imageR2 as never) : undefined) ||
          galleryItems[index % galleryItems.length]?.url ||
          DEFAULT_FACTORY_IMAGES.hero,
        fallbackImage: DEFAULT_FACTORY_IMAGES.hero,
      }))
    }
    return DISCIPLINES.map((d, index) => ({
      id: d.id,
      title: isTr ? d.titleTr : d.titleEn,
      subtitle: isTr ? d.subtitleTr : d.subtitleEn,
      description: isTr ? d.descTr : d.descEn,
      features: isTr ? d.featuresTr : d.featuresEn,
      image: galleryItems[index % galleryItems.length]?.url || d.fallbackImage,
      fallbackImage: d.fallbackImage,
    }))
  }, [content?.disciplines, galleryItems, isTr, t])

  const disciplinesTag = resolveCmsText(
    content?.disciplinesTag,
    'ÜRETİM DEPARTMANLARI',
    'PRODUCTION UNITS'
  )

  const disciplinesTitle = resolveCmsText(
    content?.disciplinesTitle,
    'Entegre Üretim Disiplinleri',
    'Integrated Manufacturing Units'
  )

  const disciplinesDescription = resolveCmsText(
    content?.disciplinesDescription,
    'Fikirden nihai ürüne kadar tüm aşamaları kendi bünyesinde çözen esnek ve güçlü üretim ekosistemi.',
    'A flexible and high-capacity manufacturing ecosystem resolving every detail from sketch to final production in-house.'
  )

  const philosophyTag = resolveCmsText(content?.philosophyTag, 'ÜRETİM FELSEFESİ', 'PHILOSOPHY')

  const philosophyTitle = resolveCmsText(
    content?.philosophyTitle,
    'Endüstrinin Hızı, El İşçiliğinin Ruhu',
    'Industrial Speed, Handcrafted Soul'
  )

  const philosophySubtitle = resolveCmsText(
    content?.philosophySubtitle,
    'Her parçanın ardında onlarca yıllık zanaat birikimi ve ileri mühendislik disiplini yer alır.',
    'Behind every piece lies decades of artisanal heritage combined with rigorous engineering.'
  )

  const galleryTag = resolveCmsText(content?.galleryTag, 'GÖRSEL ARŞİV', 'VISUAL ARCHIVE')

  const galleryTitle = resolveCmsText(
    content?.galleryTitle,
    'Atölyelerden Kareler',
    'Inside the Factory'
  )

  const gallerySubtitle = resolveCmsText(
    content?.gallerySubtitle,
    'Görselleri tam ekran incelemek için üzerlerine tıklayabilirsiniz.',
    'Click on any image to view in fullscreen high-resolution mode.'
  )

  const sustainabilityTag = resolveCmsText(
    content?.sustainabilityTag,
    'KALİTE & TAAHHÜT',
    'QUALITY & SUSTAINABILITY'
  )

  const sustainabilityTitle = resolveCmsText(
    content?.sustainabilityTitle,
    'Geleceğe Saygılı, Uzun Ömürlü Mobilya Üretimi',
    'Eco-Conscious, Long-Lasting Furniture Creation'
  )

  const sustainabilityDescription = resolveCmsText(
    content?.sustainabilityDescription,
    'Birim üretim felsefesi; atık minimizasyonu, %100 geri dönüştürülebilir metal iskeletler ve sertifikalı ahşap kaynakları kullanarak nesiller boyu kullanılacak dayanıklı mobilyalar inşa etmeyi temel alır.',
    'Birim’s manufacturing ethos is grounded in waste minimization, 100% recyclable metal structures, and certified forest timber to build furniture that lasts for generations.'
  )

  const ctaPrimaryText = resolveCmsText(content?.ctaPrimaryText, 'İletişime Geçin', 'Contact Us')

  const ctaPrimaryLink = content?.ctaPrimaryLink || '/contact'

  const ctaSecondaryText = resolveCmsText(
    content?.ctaSecondaryText,
    'Projelerimizi İnceleyin',
    'Explore Projects'
  )

  const ctaSecondaryLink = content?.ctaSecondaryLink || '/projects'

  useSEO({
    title: `BIRIM - ${t('factory') || 'Üretim Tesisi & Fabrika'}`,
    description:
      (content && (t(content.title) as string)) ||
      (isTr
        ? 'Birim 15.000 m² entegre üretim tesisi; ileri teknoloji ve el işçiliğiyle mimari mobilya üretimi.'
        : 'Birim 15,000 m² integrated production plant combining advanced technology and bespoke craftsmanship.'),
    image: heroImageUrl,
    type: 'website',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'Factory',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ManufacturingBusiness',
      name: 'BIRIM - İleri Üretim ve Tasarım Tesisi',
      description: 'BIRIM mobilya ve mimari tasarım üretim tesisi',
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/factory`,
      image: heroImageUrl,
      parentOrganization: {
        '@id': `${typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'}/#organization`,
      },
    },
  })

  const openViewer = (index: number) => {
    setInitialViewerIndex(index)
    setViewerOpen(true)
  }

  const viewerItems = galleryItems.map(m => ({
    type: (m.type === 'youtube' ? 'youtube' : m.type === 'video' ? 'video' : 'image') as
      | 'image'
      | 'video'
      | 'youtube',
    url: m.url,
    urlMobile: m.urlMobile,
    urlDesktop: m.urlDesktop,
    crop: m.crop,
    hotspot: m.hotspot,
  }))

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-[var(--bg-primary)]">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const defaultDiscipline = {
    id: 'wood',
    title: isTr ? 'Ahşap & Masif İşleme' : 'Woodworking & Solid Timber',
    subtitle: isTr ? '5-Eksen CNC ve Geleneksel Ustalık' : '5-Axis CNC & Traditional Mastery',
    description: isTr
      ? 'Özenle seçilmiş masif ağaçlar ve doğal kaplamalar, mikron toleranslı 5-eksen CNC tezgâhlarımız ve ustalarımızın el hassasiyetiyle kusursuz formlara dönüşür.'
      : 'Carefully selected solid timber and natural veneers are transformed into flawless architectural forms using 5-axis CNC machining and master craftsmanship.',
    features: isTr
      ? [
          '5-Eksen 3D CNC Frezeleme Teknolojisi',
          'FSC Sertifikalı Doğal Ağaç & Masif Seçkisi',
          'Hassas Zıvana & Gizli Kırlangıç Birleşimler',
        ]
      : [
          '5-Axis 3D CNC Milling Technology',
          'FSC Certified Sustainable Solid Timber',
          'Precision Joinery & Hidden Dowel Structures',
        ],
    image: DEFAULT_FACTORY_IMAGES.wood,
    fallbackImage: DEFAULT_FACTORY_IMAGES.wood,
  }

  const activeDiscipline =
    disciplinesList[activeDisciplineIndex] ?? disciplinesList[0] ?? defaultDiscipline

  const currentDisciplineImage =
    activeDiscipline.image ||
    galleryItems[activeDisciplineIndex % galleryItems.length]?.url ||
    DEFAULT_FACTORY_IMAGES.wood

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] animate-fade-in-up-subtle font-light selection:bg-[var(--text-primary)] selection:text-[var(--bg-primary)]">
      {/* 1. CINEMATIC FULL-WIDTH ARCHITECTURAL HERO SECTION */}
      <section className="hero-section relative h-[65vh] sm:h-[80vh] min-h-[480px] sm:min-h-[600px] bg-neutral-950 text-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full scale-105 animate-slow-zoom">
          <OptimizedImage
            src={heroImageUrl}
            fallbackSrc={DEFAULT_FACTORY_IMAGES.hero}
            alt={isTr ? 'Birim Üretim Tesisi' : 'Birim Manufacturing Plant'}
            className="w-full h-full opacity-85 object-cover"
            width={1920}
            height={1080}
            loading="eager"
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          {heroTitle ? (
            <motion.div
              initial={{opacity: 0, y: 25}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.9, ease: 'easeOut'}}
            >
              <h1 className="font-outfit text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight uppercase leading-tight sm:leading-none text-white max-w-4xl mx-auto">
                {heroTitle}
              </h1>
            </motion.div>
          ) : null}

          {heroDescription ? (
            <motion.p
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.9, delay: 0.25, ease: 'easeOut'}}
              className="mt-5 sm:mt-7 text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed tracking-wide px-2"
            >
              {heroDescription}
            </motion.p>
          ) : null}
        </div>
      </section>

      {/* 2. BREADCRUMBS & CAPACITY METRICS */}
      <div className="pb-16 sm:pb-28">
        <div className={containerClass + ' py-4 text-xs text-neutral-400'}>
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('factory') || 'Fabrika'}]}
          />
        </div>

        {/* METRICS GRID */}
        <section className="py-8 sm:py-14 border-b border-[var(--border-primary,#e5e7eb)]/40">
          <div className={containerClass}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-primary,#e5e7eb)]/40">
              {metrics.map((m, mIdx) => (
                <ScrollReveal key={mIdx} delay={mIdx * 100} distance={15}>
                  <div className="pt-4 sm:pt-0 sm:px-4 text-center sm:text-left">
                    <div className="font-outfit text-3xl sm:text-5xl font-light text-[var(--text-primary)] tracking-tight">
                      {m.value}
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                      {m.label}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE PRODUCTION DISCIPLINES & WORKSHOPS */}
        <section className="py-16 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/40">
          <div className={containerClass}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-4">
              <div>
                {disciplinesTag ? (
                  <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-secondary)]">
                    {disciplinesTag}
                  </span>
                ) : null}
                {disciplinesTitle ? (
                  <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-2">
                    {disciplinesTitle}
                  </h2>
                ) : null}
              </div>
              {disciplinesDescription ? (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md font-light leading-relaxed">
                  {disciplinesDescription}
                </p>
              ) : null}
            </div>

            {/* 1. MOBİL GÖRÜNÜM: Başlıklarıyla Birlikte Kayan Sinematik Kartlar (Horizontal Snap Carousel - md:hidden) */}
            <div className="md:hidden -mx-4 sm:-mx-6 mb-10">
              {/* Yatay Kaydırma Kart Alanı (Snap Carousel) */}
              <div
                ref={mobileCarouselRef}
                onScroll={handleMobileCarouselScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-4 sm:px-6 scroll-smooth pt-2"
                style={{WebkitOverflowScrolling: 'touch'}}
              >
                {disciplinesList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="w-[85vw] max-w-[330px] flex-shrink-0 snap-center border border-[var(--border-primary,#e5e7eb)]/60 bg-[var(--bg-secondary)] p-5 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      {/* Kart Başlığı & Alt Başlığı - Kartla Birlikte Kayar */}
                      <div className="mb-3.5 space-y-1">
                        <h3 className="font-outfit text-xl font-medium text-[var(--text-primary)] tracking-tight leading-snug">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="font-outfit text-xs text-[var(--text-secondary)] italic font-light">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Kart Görseli */}
                      <div
                        className="relative aspect-[16/10] overflow-hidden bg-black/10 cursor-pointer group shadow-sm"
                        onClick={() => openViewer(idx % galleryItems.length)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openViewer(idx % galleryItems.length)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <OptimizedImage
                          src={item.image || item.fallbackImage}
                          fallbackSrc={item.fallbackImage}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                      </div>

                      {/* Açıklama Metni */}
                      {item.description && (
                        <p className="mt-3.5 text-xs text-[var(--text-primary)] font-light leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Öne Çıkan Kabiliyetler */}
                    {item.features && item.features.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[var(--border-primary,#e5e7eb)]/40">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                          {isTr ? 'Öne Çıkan Kabiliyetler' : 'Key Capabilities'}
                        </h4>
                        <ul className="space-y-1.5">
                          {item.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-light"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] flex-shrink-0" />
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Alt Kare Göstergeleri (Pagination Squares) */}
              <div className="flex items-center justify-center gap-2 mt-5">
                {disciplinesList.map((item, idx) => {
                  const isActive = activeDisciplineIndex === idx
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToDiscipline(idx)}
                      className={`w-2 h-2 transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-[var(--text-primary)] scale-125'
                          : 'bg-[var(--text-secondary)]/30 hover:bg-[var(--text-secondary)]/60'
                      }`}
                      aria-label={`${item.title} ${idx + 1}`}
                    />
                  )
                })}
              </div>
            </div>

            {/* 2. MASAÜSTÜ GÖRÜNÜM: 4'lü Grid + Geniş Showcase Kartı (hidden md:block) */}
            <div className="hidden md:block">
              {/* Discipline Tab Selectors */}
              <div className="grid md:grid-cols-4 gap-3 mb-8 sm:mb-12">
                {disciplinesList.map((item, idx) => {
                  const isActive = activeDisciplineIndex === idx
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveDisciplineIndex(idx)}
                      className={`text-left p-5 sm:p-6 transition-all duration-300 border cursor-pointer relative overflow-hidden focus:outline-none flex flex-col justify-start ${
                        isActive
                          ? 'bg-[var(--bg-secondary)] border-[var(--text-primary)] shadow-sm'
                          : 'border-[var(--border-primary,#e5e7eb)]/60 hover:border-[var(--text-primary)]/40 bg-transparent'
                      }`}
                    >
                      <h3 className="font-outfit text-base sm:text-lg md:text-xl font-medium text-[var(--text-primary)] tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 line-clamp-2 font-light leading-relaxed">
                          {item.subtitle}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Active Discipline Detailed Showcase Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDiscipline.id}
                  initial={{opacity: 0, y: 15}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -15}}
                  transition={{duration: 0.45, ease: 'easeOut'}}
                  className="grid grid-cols-12 gap-8 items-center bg-[var(--bg-secondary)] border border-[var(--border-primary,#e5e7eb)]/50 p-8 sm:p-10"
                >
                  <div className="col-span-5 space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-light text-[var(--text-primary)] uppercase tracking-tight">
                        {activeDiscipline.title}
                      </h3>
                      {activeDiscipline.subtitle && (
                        <p className="font-outfit text-sm sm:text-base text-[var(--text-secondary)] italic font-light">
                          {activeDiscipline.subtitle}
                        </p>
                      )}
                    </div>

                    {activeDiscipline.description && (
                      <p className="text-sm sm:text-base text-[var(--text-primary)] font-light leading-relaxed">
                        {activeDiscipline.description}
                      </p>
                    )}

                    {activeDiscipline.features && activeDiscipline.features.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-primary,#e5e7eb)]/50">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                          {isTr ? 'Öne Çıkan Kabiliyetler' : 'Key Capabilities'}
                        </h4>
                        <ul className="space-y-2.5">
                          {activeDiscipline.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-primary)] font-light"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] flex-shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="col-span-7">
                    <div
                      className="relative aspect-[16/10] overflow-hidden bg-black/10 cursor-pointer group shadow-sm"
                      onClick={() => openViewer(activeDisciplineIndex % galleryItems.length)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openViewer(activeDisciplineIndex % galleryItems.length)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <OptimizedImage
                        src={currentDisciplineImage}
                        fallbackSrc={activeDiscipline.fallbackImage}
                        alt={activeDiscipline.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 4. EDITORIAL STORY / CMS CONTENT */}
        {content?.content && (
          <section className="py-16 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/40">
            <div className={containerClass}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-start">
                <div className="lg:col-span-4">
                  {philosophyTag ? (
                    <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-secondary)]">
                      {philosophyTag}
                    </span>
                  ) : null}
                  {philosophyTitle ? (
                    <h2 className="font-outfit text-2xl sm:text-4xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-2">
                      {philosophyTitle}
                    </h2>
                  ) : null}
                  {philosophySubtitle ? (
                    <p className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                      {philosophySubtitle}
                    </p>
                  ) : null}
                </div>

                <div className="lg:col-span-8">
                  <div className="text-[var(--text-primary)] leading-relaxed font-roboto-thin text-base sm:text-lg md:text-xl space-y-4">
                    {(() => {
                      const textContent = t(content.content)
                      const isPortable =
                        Array.isArray(textContent) ||
                        (typeof textContent === 'object' &&
                          textContent !== null &&
                          (textContent as Record<string, unknown>)['_type'] === 'block')

                      if (isPortable) {
                        const blocks = Array.isArray(textContent) ? textContent : [textContent]
                        return (
                          <PortableTextLite
                            value={blocks as Parameters<typeof PortableTextLite>[0]['value']}
                          />
                        )
                      }

                      const plainContent = typeof textContent === 'string' ? textContent : ''
                      return <p className="leading-relaxed font-light">{plainContent}</p>
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. FULLSCREEN MEDIA & VIDEO GALLERY SHOWCASE */}
        <section className="py-16 sm:py-24 border-b border-[var(--border-primary,#e5e7eb)]/40">
          <div className={containerClass}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-14 gap-4">
              <div>
                {galleryTag ? (
                  <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-secondary)]">
                    {galleryTag}
                  </span>
                ) : null}
                {galleryTitle ? (
                  <h2 className="font-outfit text-2xl sm:text-4xl md:text-5xl font-extralight text-[var(--text-primary)] uppercase tracking-tight mt-2">
                    {galleryTitle}
                  </h2>
                ) : null}
              </div>
              {gallerySubtitle ? (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light">
                  {gallerySubtitle}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryItems.map((m, idx) => {
                const captionText =
                  typeof m.caption === 'string' ? m.caption : m.caption ? String(m.caption) : ''
                const fallbackAlt = (t('factory') as string) || 'Factory'
                return (
                  <ScrollReveal key={idx} delay={idx * 60} distance={10} threshold={0.1}>
                    <div
                      className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)] cursor-pointer group shadow-sm"
                      onClick={() => openViewer(idx)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openViewer(idx)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {m.type === 'video' || m.type === 'youtube' ? (
                        <div className="w-full h-full relative">
                          <video
                            src={m.url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border border-white/60 flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:scale-110 transition-transform">
                              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                          <OptimizedImage
                            src={m.url}
                            fallbackSrc={DEFAULT_FACTORY_IMAGES.hero}
                            srcMobile={m.urlMobile}
                            srcDesktop={m.urlDesktop}
                            alt={captionText || `${fallbackAlt} ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            crop={m.crop}
                            hotspot={m.hotspot}
                            origWidth={m.origWidth as number}
                            origHeight={m.origHeight as number}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                          {captionText && (
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity">
                              {captionText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* 6. SUSTAINABILITY & QUALITY STANDARDS */}
        <section className="py-16 sm:py-24">
          <div className={containerClass}>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary,#e5e7eb)]/60 p-8 sm:p-14 text-center max-w-4xl mx-auto space-y-6">
              {sustainabilityTag ? (
                <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-secondary)]">
                  {sustainabilityTag}
                </span>
              ) : null}
              {sustainabilityTitle ? (
                <h3 className="font-outfit text-2xl sm:text-3xl md:text-4xl font-extralight text-[var(--text-primary)] uppercase tracking-tight">
                  {sustainabilityTitle}
                </h3>
              ) : null}
              {sustainabilityDescription ? (
                <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] font-light max-w-2xl mx-auto leading-relaxed">
                  {sustainabilityDescription}
                </p>
              ) : null}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                {ctaPrimaryText ? (
                  <Link
                    to={ctaPrimaryLink}
                    className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase font-mono tracking-wider font-medium hover:opacity-90 transition-opacity"
                  >
                    {ctaPrimaryText}
                  </Link>
                ) : null}
                {ctaSecondaryText ? (
                  <Link
                    to={ctaSecondaryLink}
                    className="px-6 py-2.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-xs uppercase font-mono tracking-wider font-medium hover:bg-[var(--text-primary)]/5 transition-colors"
                  >
                    {ctaSecondaryText}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fullscreen Lightbox Media Viewer */}
      {viewerOpen && (
        <FullscreenMediaViewer
          items={viewerItems}
          initialIndex={initialViewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}
