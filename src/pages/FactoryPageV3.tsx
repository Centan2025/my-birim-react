import {useState, useEffect, useMemo} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {getFactoryPageContent} from '../services/cms'
import type {FactoryPageContent} from '../types'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import ScrollReveal from '../components/ScrollReveal'
import PortableTextLite from '../components/PortableTextLite'
import {FullscreenMediaViewer} from '../components/FullscreenMediaViewer/FullscreenMediaViewer'

// Fallback high-res production images
const DEFAULT_FACTORY_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
  wood: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
  metal:
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop',
  upholstery:
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2070&auto=format&fit=crop',
  finishing:
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop',
  rnd: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=2070&auto=format&fit=crop',
}

interface WorkshopSpec {
  id: string
  code: string
  titleTr: string
  titleEn: string
  tagTr: string
  tagEn: string
  descTr: string
  descEn: string
  capabilitiesTr: string[]
  capabilitiesEn: string[]
  specs: {labelTr: string; labelEn: string; value: string}[]
  fallbackImage: string
}

const WORKSHOP_SPECS: WorkshopSpec[] = [
  {
    id: 'woodworking',
    code: 'ATELIER-01',
    titleTr: 'Masif Ahşap & Hassas Kaplama Atölyesi',
    titleEn: 'Solid Wood & Precision Veneer Atelier',
    tagTr: '5-Eksenli CNC & Doğal Doku İşleme',
    tagEn: '5-Axis CNC & Natural Grain Fabrication',
    descTr:
      'Fırınlanmış Avrupa meşesi, ceviz ve egzotik kaplamalar; 5-eksenli CNC frezeler ile mikron hassasiyetinde işlenir. Ahşabın doğal strüktürü korunarak kalıcı formlar üretilir.',
    descEn:
      'Kiln-dried European oak, walnut, and exotic veneers are shaped with 5-axis CNC routers at sub-millimeter tolerances while preserving natural grain integrity.',
    capabilitiesTr: [
      '5-Eksenli 3D Ahşap Frezeleme',
      'Eşleşmeli Kaplama Marküteri',
      'Fırınlanmış Masif Gövde Üretimi',
    ],
    capabilitiesEn: [
      '5-Axis 3D Wood Routing',
      'Bookmatched Veneer Marquetry',
      'Kiln-Dried Solid Frame Production',
    ],
    specs: [
      {labelTr: 'Hassasiyet Toleransı', labelEn: 'Precision Tolerance', value: '± 0.08 mm'},
      {labelTr: 'İşleme Kapasitesi', labelEn: 'Machining Capacity', value: '3200 × 1600 mm'},
      {labelTr: 'Sürdürülebilirlik', labelEn: 'Sustainability', value: '100% FSC Sertifikalı'},
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.wood,
  },
  {
    id: 'metal',
    code: 'ATELIER-02',
    titleTr: 'Metal İşleme & Robotik Lazer Atölyesi',
    titleEn: 'Metal Engineering & Robotic Laser Atelier',
    tagTr: 'Fiber Lazer & TIG/MIG Robotik Kaynak',
    tagEn: 'Fiber Laser & Robotic TIG/MIG Welding',
    descTr:
      'Paslanmaz çelik, pirinç ve alüminyum profiller; yüksek güçlü fiber lazerler ve robotik kaynak istasyonlarında sıfır hata prensibiyle birleştirilir.',
    descEn:
      'Stainless steel, solid brass, and aerospace aluminum are fabricated using high-power fiber lasers and robotic welding stations for seamless joint precision.',
    capabilitiesTr: [
      'Fiber Lazer Boru & Sac Kesim',
      'Hassas TIG/MIG Robotik Kaynak',
      'Pirinç & Bronz Metal Polisajı',
    ],
    capabilitiesEn: [
      'Fiber Laser Tube & Sheet Cutting',
      'Robotic TIG/MIG Fusion',
      'Solid Brass & Bronze Polishing',
    ],
    specs: [
      {labelTr: 'Lazer Gücü', labelEn: 'Laser Power', value: '6000W Fiber'},
      {labelTr: 'Kesim Kalınlığı', labelEn: 'Cutting Gauge', value: '0.5 – 25 mm'},
      {labelTr: 'Kaynak Standartı', labelEn: 'Welding Standard', value: 'ISO 3834-2 Class A'},
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.metal,
  },
  {
    id: 'upholstery',
    code: 'ATELIER-03',
    titleTr: 'Döşeme & Terzihane Laboratuvarı',
    titleEn: 'Upholstery & Master Tailoring Laboratory',
    tagTr: 'Anilin Deri & Çok Katmanlı Ergonomi',
    tagEn: 'Aniline Leather & Multi-Density Ergonomics',
    descTr:
      'İtalyan anilin deriler ve yüksek mukavemetli kumaşlar; usta ellerde el dikişi, kapitone ve çok katmanlı poliüretan sünger blokları ile ergonomik mükemmelliğe kavuşur.',
    descEn:
      'Premium Italian aniline leathers and contract-grade textiles are meticulously hand-tailored over multi-density ergonomic foam structures for lifetime comfort.',
    capabilitiesTr: [
      'El Dikişi & Özel Kapitone',
      'Varyasyonlu Sünger Katmanlama',
      'Deri Kalıp Optimizasyonu',
    ],
    capabilitiesEn: [
      'Hand-Stitched Saddle Seams',
      'Variable Density Layering',
      'Digital Leather Pattern Nesting',
    ],
    specs: [
      {labelTr: 'Döşeme Süngeri', labelEn: 'Foam Standard', value: 'HR 35-50 kg/m³'},
      {labelTr: 'Deri Kalitesi', labelEn: 'Leather Grade', value: 'Full-Grain Italian Aniline'},
      {labelTr: 'Aşınma Direnci', labelEn: 'Abrasion Resistance', value: '> 100.000 Martindale'},
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.upholstery,
  },
  {
    id: 'finishing',
    code: 'ATELIER-04',
    titleTr: 'Yüzey Koruma & Organik Cila Kabini',
    titleEn: 'Surface Finishing & Organic Coating Booth',
    tagTr: 'Elektrostatik Toz Boya & Düşük VOC Cila',
    tagEn: 'Powder Coating & Low-VOC Organic Oils',
    descTr:
      'Pozitif basınçlı tozsuz kabinlerde, metaller elektrostatik fırın boyayla kaplanırken ahşap yüzeyler doğal bitkisel yağlar ve ipeksi mat verniklerle korunur.',
    descEn:
      'Inside positive-pressure dustless booths, metal surfaces receive architectural powder coating while timber is treated with natural organic oils and matte lacquers.',
    capabilitiesTr: [
      'Elektrostatik Fırın Boya',
      'Doğal Bitkisel Yağ Uygulaması',
      'İpeksi Mat & Parlak Lake',
    ],
    capabilitiesEn: [
      'Architectural Powder Coating',
      'Organic Botanical Oil Treatment',
      'Silk-Matte & High-Gloss Lacquer',
    ],
    specs: [
      {labelTr: 'VOC Emisyonu', labelEn: 'VOC Emission', value: 'Zero / Ultra-Low VOC'},
      {labelTr: 'Korozyon Direnci', labelEn: 'Corrosion Resistance', value: 'C4-High Class'},
      {labelTr: 'Fırın Sıcaklığı', labelEn: 'Curing Temperature', value: '180°C – 220°C'},
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.finishing,
  },
  {
    id: 'rnd',
    code: 'ATELIER-05',
    titleTr: 'Ar-Ge, Sayısal İkiz & Prototipleme',
    titleEn: 'R&D, Digital Twin & Prototyping Lab',
    tagTr: 'Parametrik Modelleme & Mukavemet Analizi',
    tagEn: 'Parametric CAD & Structural Stress Testing',
    descTr:
      'Her tasarım, seri üretime geçmeden önce FEA mukavemet analizlerine ve 1:1 ölçekli fonksiyonel prototip testlerine tabi tutulur.',
    descEn:
      'Before full-scale fabrication, each furniture piece undergoes FEA structural load analysis and rigorous 1:1 functional prototyping.',
    capabilitiesTr: [
      'FEA Yapısal Gerilim Analizi',
      '1:1 Fonksiyonel Prototipleme',
      'Bespoke Sözleşmeli Mühendislik',
    ],
    capabilitiesEn: [
      'FEA Structural Stress Analysis',
      '1:1 Functional Prototyping',
      'Bespoke Contract Engineering',
    ],
    specs: [
      {labelTr: 'Dayanım Standardı', labelEn: 'Contract Standard', value: 'EN 16139 Level 2'},
      {labelTr: 'Dijital İkiz', labelEn: 'Digital Twin Model', value: 'BIM / STEP / SolidWorks'},
      {labelTr: 'Döngü Testi', labelEn: 'Cycle Durability Test', value: '200.000+ Cycles'},
    ],
    fallbackImage: DEFAULT_FACTORY_IMAGES.rnd,
  },
]

export function FactoryPageV3() {
  const {t, locale} = useTranslation()
  const {setBrightness, reset} = useHeaderTheme()
  const isTr = locale === 'tr'

  const [content, setContent] = useState<FactoryPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSpecIndex, setActiveSpecIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  useEffect(() => {
    setBrightness(1)
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
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchContent()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  useSEO({
    title: isTr
      ? 'BIRIM — Üretim & Fabrika Dosyası (V3)'
      : 'BIRIM — Manufacturing & Atelier Dossier (V3)',
    description: isTr
      ? 'BIRIM 15.000 m² entegre üretim tesisi, CNC teknolojileri ve usta zanaatkarlık mimarisi.'
      : 'BIRIM 15,000 m² integrated production plant, CNC robotics, and master artisanal craftsmanship.',
    type: 'website',
    siteName: 'BIRIM',
    locale: isTr ? 'tr_TR' : 'en_US',
    section: 'Factory',
  })

  // Extract gallery media
  const galleryItems = useMemo(() => {
    if (!content?.gallery) return []
    return content.gallery.map(m => ({
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
  }, [content])

  const heroImageUrl =
    galleryItems[0]?.url ||
    (typeof content?.content === 'object' &&
    (content.content as unknown as Record<string, unknown>)?.['heroImage']
      ? ((content.content as unknown as Record<string, unknown>)['heroImage'] as string)
      : DEFAULT_FACTORY_IMAGES.hero)

  if (loading || !content) {
    return (
      <div className="pt-24 min-h-screen bg-[var(--bg-primary)]">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  const activeSpec = WORKSHOP_SPECS[activeSpecIndex] ?? WORKSHOP_SPECS[0]!
  const activeSpecImage =
    galleryItems[activeSpecIndex % galleryItems.length]?.url || activeSpec.fallbackImage

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-white selection:text-black font-light overflow-x-hidden">
      {/* 1. TOP TECHNICAL BREADCRUMB & COORDINATE BAR */}
      <div className="w-full border-b border-[var(--border-primary,#e5e7eb)]/30 pt-20 md:pt-20 lg:pt-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <Breadcrumbs
            items={[
              {label: t('homepage'), to: '/'},
              {label: isTr ? 'Üretim & Fabrika' : 'Factory & Atelier'},
            ]}
          />
          <div className="hidden sm:flex items-center gap-4 text-[11px] tracking-wider uppercase opacity-75">
            <span>COORD: 40°59&apos;N 29°17&apos;E</span>
            <span>•</span>
            <span>STATUS: ACTIVE INDUSTRIAL FACILITY</span>
            <span>•</span>
            <span className="text-emerald-500">● 100% OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* 2. ARCHITECTURAL BLUEPRINT HERO WITH SPLIT DOSSIER */}
      <section className="relative w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-8 md:pt-14 pb-12 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end">
          {/* Left Hero Typographic Statement */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-neutral-500/30 text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--text-secondary)]">
              <span>DOSSIER // 003</span>
              <span>—</span>
              <span>INTEGRATED MANUFACTURING INFRASTRUCTURE</span>
            </div>

            <h1 className="font-outfit text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight uppercase leading-[0.95] text-[var(--text-primary)]">
              {isTr ? (
                <>
                  Hassas Mühendislik. <br />
                  <span className="text-[var(--text-secondary)]">Zanaatın Mimarisi.</span>
                </>
              ) : (
                <>
                  Precision Robotics. <br />
                  <span className="text-[var(--text-secondary)]">Artisanal Heritage.</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] font-light leading-relaxed max-w-xl">
              {isTr
                ? 'Birim’in 15.000 m² entegre üretim kampüsü; ileri teknoloji 5-eksen CNC istasyonlarını, robotik metal füzyonunu ve yarım asırlık usta el işçiliğini tek bir çatı altında senkronize eder.'
                : 'Birim’s 15,000 m² integrated production campus synchronizes advanced 5-axis CNC stations, robotic metal fusion, and half a century of master craftsmanship under one roof.'}
            </p>

            {/* Micro Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-[11px] text-[var(--text-secondary)]">
              <span className="px-3 py-1.5 border border-neutral-500/20 bg-[var(--bg-secondary)]">
                ISO 9001:2015 CERTIFIED
              </span>
              <span className="px-3 py-1.5 border border-neutral-500/20 bg-[var(--bg-secondary)]">
                FSC® TIMBER CHAIN
              </span>
              <span className="px-3 py-1.5 border border-neutral-500/20 bg-[var(--bg-secondary)]">
                ZERO-WASTE RECOVERY
              </span>
            </div>
          </div>

          {/* Right Hero Cinematic Visual Card */}
          <div className="lg:col-span-5">
            <ScrollReveal distance={20} duration={0.8}>
              <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-zinc-950 border border-neutral-500/30 group">
                <OptimizedImage
                  src={heroImageUrl}
                  fallbackSrc={DEFAULT_FACTORY_IMAGES.hero}
                  alt="Birim Factory Exterior & Facility"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  quality={90}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white font-mono text-[11px]">
                  <span>PLANT: ISTANBUL HQ</span>
                  <span className="text-white/70">15.000 m² FLOOR AREA</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 3. FOUR-COLUMN KEY PERFORMANCE METRICS MATRIX */}
      <section className="w-full border-y border-[var(--border-primary,#e5e7eb)]/30 bg-[var(--bg-secondary)] py-12 md:py-16">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="space-y-1">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[var(--text-secondary)] block">
                01 // {isTr ? 'KAPALI ALAN' : 'TOTAL AREA'}
              </span>
              <div className="font-outfit text-3xl sm:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)]">
                15.000{' '}
                <span className="text-base sm:text-xl text-[var(--text-secondary)] font-normal">
                  m²
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-1">
                {isTr ? 'Entegre 5 bağımsız üretim atölyesi' : 'Integrated 5 independent ateliers'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[var(--text-secondary)] block">
                02 // {isTr ? 'ENDÜSTRİYEL MİRAS' : 'HERITAGE'}
              </span>
              <div className="font-outfit text-3xl sm:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)]">
                45+{' '}
                <span className="text-base sm:text-xl text-[var(--text-secondary)] font-normal">
                  {isTr ? 'Yıl' : 'Yrs'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-1">
                {isTr
                  ? '1980’den bu yana kesintisiz üretim'
                  : 'Continuous manufacturing since 1980'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[var(--text-secondary)] block">
                03 // {isTr ? 'İŞ GÜCÜ & UZMANLIK' : 'WORKFORCE'}
              </span>
              <div className="font-outfit text-3xl sm:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)]">
                120+{' '}
                <span className="text-base sm:text-xl text-[var(--text-secondary)] font-normal">
                  {isTr ? 'Usta' : 'Master'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-1">
                {isTr
                  ? 'Zanaatkar, mühendis ve tasarımcı kadro'
                  : 'Artisans, engineers and designers'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[var(--text-secondary)] block">
                04 // {isTr ? 'HASSASİYET STANDARDI' : 'TOLERANCE'}
              </span>
              <div className="font-outfit text-3xl sm:text-5xl lg:text-6xl font-extralight text-[var(--text-primary)]">
                ±0.08{' '}
                <span className="text-base sm:text-xl text-[var(--text-secondary)] font-normal">
                  mm
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pt-1">
                {isTr ? 'Mikron seviyesinde CNC işleme toleransı' : 'Sub-millimeter CNC precision'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE PRODUCTION ATELIER DOSSIER SELECTOR */}
      <section className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-16 md:py-24">
        <div className="mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-2">
            <span>SECTOR INSPECTION</span>
            <span>—</span>
            <span>5 SPECIALIZED PRODUCTION UNITS</span>
          </div>
          <h2 className="font-outfit text-3xl sm:text-5xl font-extralight uppercase tracking-tight text-[var(--text-primary)]">
            {isTr ? 'Atölye ve Teknoloji Disiplinleri' : 'Atelier & Technology Disciplines'}
          </h2>
        </div>

        {/* Tab Selector Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
          {WORKSHOP_SPECS.map((spec, idx) => {
            const isActive = activeSpecIndex === idx
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => setActiveSpecIndex(idx)}
                className={`p-4 text-left border rounded-none transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-secondary)] border-[var(--text-primary)] shadow-sm'
                    : 'border-neutral-500/20 hover:border-[var(--text-primary)]/40 bg-transparent'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] block mb-1">
                  {spec.code}
                </span>
                <span className="font-outfit text-xs sm:text-sm font-light uppercase tracking-tight text-[var(--text-primary)] line-clamp-2">
                  {isTr ? spec.titleTr.split('&')[0] : spec.titleEn.split('&')[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active Atelier Technical Detail Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSpec.id}
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -15}}
            transition={{duration: 0.35}}
            className="border border-neutral-500/20 bg-[var(--bg-secondary)] p-6 sm:p-10 lg:p-14"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Technical Narrative & Specs */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--text-secondary)] block mb-1">
                    {activeSpec.code} // {isTr ? activeSpec.tagTr : activeSpec.tagEn}
                  </span>
                  <h3 className="font-outfit text-2xl sm:text-4xl font-light uppercase tracking-tight text-[var(--text-primary)] leading-tight">
                    {isTr ? activeSpec.titleTr : activeSpec.titleEn}
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed">
                  {isTr ? activeSpec.descTr : activeSpec.descEn}
                </p>

                {/* Capabilities List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] block">
                    {isTr ? 'TEMEL YETKİNLİKLER' : 'CORE CAPABILITIES'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(isTr ? activeSpec.capabilitiesTr : activeSpec.capabilitiesEn).map(
                      (cap, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)]"
                        >
                          <span className="w-1.5 h-1.5 bg-[var(--text-primary)]" />
                          <span>{cap}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Machine Specs Table */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-500/20">
                  {activeSpec.specs.map((item, sIdx) => (
                    <div key={sIdx} className="space-y-0.5">
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block truncate">
                        {isTr ? item.labelTr : item.labelEn}
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[var(--text-primary)] block">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Atelier Large Visual */}
              <div className="lg:col-span-6">
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-950 border border-neutral-500/30 group">
                  <OptimizedImage
                    src={activeSpecImage}
                    fallbackSrc={DEFAULT_FACTORY_IMAGES.hero}
                    alt={isTr ? activeSpec.titleTr : activeSpec.titleEn}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 font-mono text-[11px] text-white">
                    <span>{activeSpec.code} // ATELIER LIVE FEED</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 5. NARRATIVE PRODUCTION STORY (FROM SANITY CMS) */}
      {content.content && (
        <section className="w-full border-t border-[var(--border-primary,#e5e7eb)]/30 py-16 md:py-24 bg-[var(--bg-secondary)]">
          <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0">
            <div className="max-w-4xl mx-auto space-y-6 text-center">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)] block">
                {isTr ? 'ÜRETİM FELSEFESİ' : 'MANUFACTURING PHILOSOPHY'}
              </span>
              <h2 className="font-outfit text-3xl sm:text-5xl font-extralight uppercase tracking-tight text-[var(--text-primary)]">
                {t(content.title)}
              </h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm sm:text-base md:text-lg text-[var(--text-secondary)] font-light leading-relaxed text-left pt-6">
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

                  return <p>{textContent as string}</p>
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. CINEMATIC PRODUCTION ARCHIVE GALLERY */}
      {galleryItems.length > 0 && (
        <section className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-16 md:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)] block mb-1">
                VISUAL DOSSIER // ARCHIVE
              </span>
              <h2 className="font-outfit text-3xl sm:text-5xl font-extralight uppercase tracking-tight text-[var(--text-primary)]">
                {isTr ? 'Üretim Sahası Görsel Arşivi' : 'Manufacturing Site Gallery'}
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {galleryItems.length} {isTr ? 'GÖRSEL / VİDEO KAYIT' : 'MEDIA RECORDS'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {galleryItems.map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 60} distance={15} duration={0.6}>
                <div
                  onClick={() => {
                    setViewerIndex(idx)
                    setViewerOpen(true)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setViewerIndex(idx)
                      setViewerOpen(true)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative aspect-video overflow-hidden bg-neutral-950 border border-neutral-500/20 cursor-pointer"
                >
                  {item.type === 'video' || item.type === 'youtube' ? (
                    <div className="w-full h-full relative">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border border-white/60 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <OptimizedImage
                      src={item.url}
                      srcMobile={item.urlMobile}
                      srcDesktop={item.urlDesktop}
                      alt={`Manufacturing Asset ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                      quality={85}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end justify-between font-mono text-[11px] text-white">
                    <span>RECORD #{String(idx + 1).padStart(2, '0')}</span>
                    <span>EXPAND ↗</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen Media Viewer */}
      {viewerOpen && (
        <FullscreenMediaViewer
          items={galleryItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}
