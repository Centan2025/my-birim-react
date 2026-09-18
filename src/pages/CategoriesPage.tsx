import {Link} from 'react-router-dom'
import {useEffect, useMemo, useRef} from 'react'
import {motion, useInView} from 'framer-motion'
import {OptimizedImage} from '../components/OptimizedImage'
import {PageLoading} from '../components/LoadingSpinner'
import {useTranslation} from '../i18n'
import {Breadcrumbs} from '../components/Breadcrumbs'
import {useCategories} from '../hooks/useCategories'
import {useProducts} from '../hooks/useProducts'
import ScrollReveal from '../components/ScrollReveal'
import {useSEO} from '../hooks/useSEO'
import {useHeaderTheme} from '../context/HeaderThemeContext'
import type {R2ImageMetadata} from '../types'

type CategoryWithImage = NonNullable<ReturnType<typeof useCategories>['data']>[number] & {
  displayImage: unknown
}

interface CategoryCardItemProps {
  category: CategoryWithImage
  index: number
}

function CategoryCardItem({category, index}: CategoryCardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, {once: true, amount: 0.05, margin: '0px 0px 50px 0px'})
  const colIndex = index % 3
  const cardDelay = index < 6 ? 0.06 + index * 0.08 : (colIndex % 3) * 0.07
  const {t} = useTranslation()

  return (
    <motion.div
      ref={cardRef}
      initial={{opacity: 0, y: 45, scale: 0.92}}
      animate={isInView ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 45, scale: 0.92}}
      transition={{
        y: {
          duration: 0.92,
          delay: cardDelay,
          ease: [0.16, 1, 0.3, 1],
        },
        scale: {
          duration: 0.84,
          delay: cardDelay + 0.05,
          ease: [0.45, 0, 0.2, 1],
        },
        opacity: {
          duration: 0.68,
          delay: cardDelay,
          ease: 'easeOut',
        },
      }}
      className="h-[300px] sm:h-[350px] lg:h-[450px] will-change-transform"
    >
      <Link
        to={`/products/${category.id}`}
        className="group block w-full h-full overflow-hidden rounded-none"
      >
        <div className="relative w-full h-full overflow-hidden rounded-none border-none flex items-center justify-center bg-white dark:bg-neutral-900">
          {category.displayImage ? (
            <OptimizedImage
              src={
                typeof category.displayImage === 'string'
                  ? category.displayImage
                  : (category.displayImage as {url: string}).url
              }
              srcMobile={
                typeof category.displayImage === 'object'
                  ? (category.displayImage as {urlMobile?: string}).urlMobile
                  : undefined
              }
              srcDesktop={
                typeof category.displayImage === 'object'
                  ? (category.displayImage as {urlDesktop?: string}).urlDesktop
                  : undefined
              }
              alt={t(category.name)}
              className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03] rounded-none"
              fitAuto={true}
              loading={index < 6 ? 'eager' : 'lazy'}
              quality={85}
              crop={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'crop'
                    ] as R2ImageMetadata['crop']) ||
                    ((category.displayImage as Record<string, unknown>)['cropX'] !== undefined
                      ? {
                          x:
                            Number(
                              (category.displayImage as Record<string, unknown>)['cropX']
                            ) || 0,
                          y:
                            Number(
                              (category.displayImage as Record<string, unknown>)['cropY']
                            ) || 0,
                          width:
                            Number(
                              (category.displayImage as Record<string, unknown>)[
                                'cropWidth'
                              ]
                            ) || 1,
                          height:
                            Number(
                              (category.displayImage as Record<string, unknown>)[
                                'cropHeight'
                              ]
                            ) || 1,
                        }
                      : undefined)
                  : undefined
              }
              hotspot={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'hotspot'
                    ] as R2ImageMetadata['hotspot']) ||
                    ((category.displayImage as Record<string, unknown>)['hotspotX'] !== undefined
                      ? {
                          x:
                            Number(
                              (category.displayImage as Record<string, unknown>)[
                                'hotspotX'
                              ]
                            ) ?? 0.5,
                          y:
                            Number(
                              (category.displayImage as Record<string, unknown>)[
                                'hotspotY'
                              ]
                            ) ?? 0.5,
                        }
                      : undefined)
                  : undefined
              }
              cropMobile={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'cropMobile'
                    ] as R2ImageMetadata['crop'])
                  : undefined
              }
              cropDesktop={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'cropDesktop'
                    ] as R2ImageMetadata['crop'])
                  : undefined
              }
              hotspotMobile={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'hotspotMobile'
                    ] as R2ImageMetadata['hotspot'])
                  : undefined
              }
              hotspotDesktop={
                typeof category.displayImage === 'object' && category.displayImage
                  ? ((category.displayImage as Record<string, unknown>)[
                      'hotspotDesktop'
                    ] as R2ImageMetadata['hotspot'])
                  : undefined
              }
              origWidth={
                typeof category.displayImage === 'object' && category.displayImage
                  ? Number((category.displayImage as Record<string, unknown>)['origWidth']) ||
                    undefined
                  : undefined
              }
              origHeight={
                typeof category.displayImage === 'object' && category.displayImage
                  ? Number((category.displayImage as Record<string, unknown>)['origHeight']) ||
                    undefined
                  : undefined
              }
              origWidthMobile={
                typeof category.displayImage === 'object' && category.displayImage
                  ? Number(
                      (category.displayImage as Record<string, unknown>)['origWidthMobile']
                    ) || undefined
                  : undefined
              }
              origHeightMobile={
                typeof category.displayImage === 'object' && category.displayImage
                  ? Number(
                      (category.displayImage as Record<string, unknown>)['origHeightMobile']
                    ) || undefined
                  : undefined
              }
              isMirrored={
                typeof category.displayImage === 'object' && category.displayImage
                  ? Boolean(
                      (category.displayImage as Record<string, unknown>)['isMirrored']
                    )
                  : undefined
              }
              isMirroredMobile={
                typeof category.displayImage === 'object' && category.displayImage
                  ? (category.displayImage as Record<string, unknown>)[
                      'isMirroredMobile'
                    ] !== undefined
                    ? Boolean(
                        (category.displayImage as Record<string, unknown>)[
                          'isMirroredMobile'
                        ]
                      )
                    : undefined
                  : undefined
              }
              isMirroredDesktop={
                typeof category.displayImage === 'object' && category.displayImage
                  ? (category.displayImage as Record<string, unknown>)[
                      'isMirroredDesktop'
                    ] !== undefined
                    ? Boolean(
                        (category.displayImage as Record<string, unknown>)[
                          'isMirroredDesktop'
                        ]
                      )
                    : undefined
                  : undefined
              }
            />
          ) : null}
          {/* Text content & animated bottom line */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end pointer-events-none p-4 sm:p-5 lg:p-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-light tracking-widest text-gray-400 uppercase leading-tight transition-colors duration-700 ease-out group-hover:text-[var(--text-primary)]">
              {t(category.name)}
            </h2>
            {/* Line aligned with category name on left and right, rising from bottom to under the name */}
            <div className="w-full mt-3 sm:mt-3.5">
              <div className="h-[1px] w-full bg-neutral-400/70 dark:bg-neutral-400/60 opacity-0 translate-y-8 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function CategoriesPage() {
  const {data: categories = [], isLoading: categoriesLoading} = useCategories()
  const {data: allProducts = [], isLoading: productsLoading} = useProducts()
  const {t} = useTranslation()
  const {reset} = useHeaderTheme()
  const pageTitle = `BIRIM - ${t('categories') || t('products') || 'Kategoriler'}`

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.birim.com'
  useSEO({
    title: pageTitle,
    description: t('products_page_subtitle') || t('products') || 'Ürün kategorileri',
    siteName: 'BIRIM',
    type: 'website',
    locale:
      typeof window !== 'undefined' && document.documentElement.lang === 'en' ? 'en_US' : 'tr_TR',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('categories') || t('products') || 'Kategoriler',
      description: t('products_page_subtitle') || 'Ürün kategorileri',
      url: `${baseUrl}/categories`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: categories.length,
        itemListElement: categories.slice(0, 30).map((c, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t(c.name),
          url: `${baseUrl}/products/${c.id}`,
        })),
      },
    },
  })

  // Ürünleri kategori ID'sine gore haritalayarak aramalari O(N) karmasikligina dusur
  const categoryImageMap = useMemo(() => {
    const map = new Map<string, unknown>()
    for (const product of allProducts) {
      const catId = product.categoryId?.toLowerCase()
      const hasUrl =
        typeof product.mainImage === 'object' && product.mainImage !== null
          ? (product.mainImage as {url?: string}).url
          : false
      if (product && catId && hasUrl && !map.has(catId)) {
        map.set(catId, product.mainImage)
      }
    }
    return map
  }, [allProducts])

  // Her kategori için görsel belirle: heroImage yoksa haritadan bul
  const categoriesWithImages = useMemo(() => {
    return categories.map(category => {
      // Eğer kategori görseli varsa onu kullan
      if (category.heroImage) {
        return {...category, displayImage: category.heroImage}
      }

      // Kategori görseli yoksa, harita uzerindeki urun görselini kullan
      const displayImage = categoryImageMap.get(category.id) || null
      return {...category, displayImage}
    })
  }, [categories, categoryImageMap])

  // Header temasını varsayılana sıfırla (Kategoriler dizini için rastgele renk atamasını kaldır)
  useEffect(() => {
    reset()
    return () => reset()
  }, [reset])

  if (categoriesLoading || productsLoading) {
    return (
      <div className="pt-20 min-h-screen">
        <PageLoading message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen transition-colors duration-500 pt-20 md:pt-20 lg:pt-20">
      {/* Breadcrumb Band */}
      <div className="w-full relative z-20">
        <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 py-4 text-gray-400">
          <Breadcrumbs
            items={[{label: t('homepage'), to: '/'}, {label: t('categories') || 'Ürün Grupları'}]}
          />
        </div>
      </div>

      {/* Sayfa Başlığı */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pt-4 md:pt-12 pb-12">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 1, ease: 'easeOut'}}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight text-center uppercase">
            {t('categories') || 'Ürün Grupları'}
          </h1>
        </motion.div>
      </div>

      {/* Categories Grid */}
      <div className="w-full max-w-[95%] md:max-w-[92%] lg:max-w-[80vw] mx-auto px-4 md:px-8 lg:px-0 pb-16 md:pb-24">
        {categoriesWithImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
            {categoriesWithImages.map((category, index) => (
              <CategoryCardItem
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        ) : (
          <ScrollReveal delay={0} threshold={0.01}>
            <p className="text-[var(--text-secondary)] text-center">
              {t('no_products_in_category')}
            </p>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
