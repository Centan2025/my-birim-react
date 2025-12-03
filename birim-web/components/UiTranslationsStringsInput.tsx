import React, {useEffect, useMemo, useRef} from 'react'
import type {ObjectInputProps} from 'sanity'
import {set} from 'sanity'
import {useClient, useFormValue} from 'sanity'

function shallowEqual(a?: Record<string, any>, b?: Record<string, any>) {
  if (a === b) return true
  if (!a || !b) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    const va = a[k]
    const vb = b[k]
    if ((va ?? '') !== (vb ?? '')) return false
  }
  return true
}
// Proje başlangıcındaki varsayılan metinler (fallback)
const BASE_TRANSLATIONS: Record<string, Record<string, string>> = {
  tr: {
    collection: 'KOLEKSİYON',
    subscribe: 'ABONE OL',
    email_placeholder: 'E-posta adresiniz',
    designers: 'TASARIMCILAR',
    news: 'HABERLER',
    about: 'HAKKIMIZDA',
    contact: 'İLETİŞİM',
    projects: 'PROJELER',
    search_placeholder: 'Ara...',
    search_no_results: '"{0}" için sonuç bulunamadı.',
    searching: 'Aranıyor...',
    products: 'Ürünler',
    all_products: 'Tüm Ürünler',
    all_products_subtitle: 'Koleksiyonumuzdaki tüm tasarımları keşfedin.',
    view_all: 'TÜM MODELLER',
    categories: 'Kategoriler',
    designer: 'Tasarımcı',
    category: 'Kategori',
    featured_products: 'Öne Çıkan Ürünler',
    featured_products_subtitle: 'Her biri birer ikon olan, en sevilen tasarımlarımızdan bir seçki.',
    designer_spotlight: 'Tasarımcı Odağı',
    discover_the_designer: 'Tasarımcıyı Keşfet',
    sort: 'Sırala',
    sort_newest: 'En Yeni',
    sort_name_asc: 'İsme Göre (A-Z)',
    no_products_in_category: 'Bu kategoride ürün bulunamadı.',
    loading: 'Yükleniyor...',
    homepage: 'Anasayfa',
    description: 'Açıklama',
    dimensions: 'Ölçüler',
    material_alternatives: 'Malzeme Alternatifleri',
    add_to_cart: 'Sepete ekle',
    added_to_cart: '{0} sepete eklendi!',
    exclusive_content: 'Özel İçerik',
    additional_images: 'Ek Görseller',
    technical_drawings: 'Teknik Çizimler',
    '3d_models': '3D Modeller',
    product_not_found: 'Ürün bulunamadı.',
    designer_not_found: 'Tasarımcı bulunamadı.',
    designs: 'Tasarımlar',
    no_products_by_designer: 'Bu tasarımcıya ait ürün bulunamadı.',
    login: 'Giriş Yap',
    login_prompt: 'Özel içeriğe erişmek için giriş yapın.',
    login_test_creds: '(Test: user@example.com / password)',
    email: 'E-posta',
    password: 'Şifre',
    invalid_credentials: 'Geçersiz e-posta veya şifre.',
    already_logged_in: 'Zaten giriş yaptınız.',
    logout: 'Çıkış Yap',
    subscribe_prompt: 'Güncel kalmak için abone olun',
    news_title: 'Haberler',
    no_news: 'Şu anda gösterilecek haber bulunmamaktadır.',
    products_page_subtitle: 'Koleksiyonumuzdaki en rafine parçaları keşfedin.',
    map_not_available: 'Seçili lokasyon için harita mevcut değil.',
    other_location_type: 'Diğer',
    previous_product: 'Önceki Ürün',
    next_product: 'Sonraki Ürün',
    news_not_found: 'Haber bulunamadı.',
    navigation: 'Navigasyon',
  },
  en: {
    collection: 'Collection',
    subscribe: 'SUBSCRIBE',
    email_placeholder: 'Your e-mail address',
    designers: 'Designers',
    news: 'News',
    about: 'About Us',
    contact: 'Contact',
    projects: 'PROJECTS',
    search_placeholder: 'Search...',
    search_no_results: 'No results found for "{0}".',
    searching: 'Searching...',
    products: 'Products',
    all_products: 'All Products',
    all_products_subtitle: 'Discover all designs in our collection.',
    view_all: 'ALL MODELS',
    categories: 'Categories',
    designer: 'Designer',
    category: 'Category',
    featured_products: 'Featured Products',
    featured_products_subtitle:
      'A selection of our most beloved designs, each an icon in its own right.',
    designer_spotlight: 'Designer Spotlight',
    discover_the_designer: 'Discover the Designer',
    sort: 'Sort',
    sort_newest: 'Newest',
    sort_name_asc: 'By Name (A-Z)',
    no_products_in_category: 'No products found in this category.',
    loading: 'Loading...',
    homepage: 'Homepage',
    description: 'Description',
    dimensions: 'Dimensions',
    material_alternatives: 'Finishes',
    add_to_cart: 'Add to cart',
    added_to_cart: '{0} added to cart!',
    exclusive_content: 'Exclusive Content',
    additional_images: 'Additional Images',
    technical_drawings: 'Technical Drawings',
    '3d_models': '3D Models',
    product_not_found: 'Product not found.',
    designer_not_found: 'Designer not found.',
    designs: 'Designs',
    no_products_by_designer: 'No products found for this designer.',
    login: 'Login',
    login_prompt: 'Log in to access exclusive content.',
    login_test_creds: '(Test: user@example.com / password)',
    email: 'Email',
    password: 'Password',
    invalid_credentials: 'Invalid email or password.',
    already_logged_in: 'You are already logged in.',
    logout: 'Logout',
    subscribe_prompt: 'Subscribe to stay updated',
    news_title: 'News',
    no_news: 'There are currently no news items to display.',
    products_page_subtitle: 'Discover the most refined pieces in our collection.',
    map_not_available: 'Map not available for selected location.',
    other_location_type: 'Other',
    previous_product: 'Previous Product',
    next_product: 'Next Product',
    news_not_found: 'News item not found.',
    navigation: 'Navigation',
  },
}

/**
 * UiTranslationsStringsInput
 * Seçilen dil için mevcut bir uiTranslations dokümanı varsa,
 * strings alanı boşken onu otomatik doldurur. Kullanıcı yazmaya başladıysa dokunmaz.
 */
export default function UiTranslationsStringsInput(props: ObjectInputProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  const currentLanguage = (useFormValue(['language']) as string) || ''
  const hasPrefilledRef = useRef(false)
  const prevLanguageRef = useRef<string>('')

  const docId = useFormValue(['_id']) as string | undefined

  const isStringsEmpty = useMemo(() => {
    const v = props.value as Record<string, any> | undefined
    if (!v) return true
    // Eğer herhangi bir alan doluysa boş saymayalım
    return Object.values(v).every(
      (val) => val === undefined || val === null || String(val).trim() === '',
    )
  }, [props.value])

  // Dil değiştiğinde, ilgili mevcut kaydı ya da yerel varsayılanları YENİDEN uygula
  useEffect(() => {
    if (!currentLanguage) return
    // Dil her değiştiğinde yeniden doldurmaya izin ver
    hasPrefilledRef.current = false
    prevLanguageRef.current = currentLanguage
    const fetchAndApply = async () => {
      try {
        const existing = await client.fetch(
          '*[_type == "uiTranslations" && language == $lang][0]',
          {lang: currentLanguage},
        )
        // Base değerleri hazırla ve anahtarları normalize et
        const baseRaw = BASE_TRANSLATIONS[currentLanguage] || {}
        const normalizedBase: Record<string, any> = {...baseRaw}
        if (normalizedBase['3d_models'] && !normalizedBase.models_3d) {
          normalizedBase.models_3d = normalizedBase['3d_models']
        }
        // Mevcut doküman değerleri (varsa) yalnızca DOLU ise base'i ezer
        const fromExisting = existing && existing.strings ? existing.strings : {}
        const merged: Record<string, any> = {}
        const allKeys = new Set<string>([
          ...Object.keys(normalizedBase),
          ...Object.keys(fromExisting),
        ])
        allKeys.forEach((k) => {
          const vExisting = fromExisting[k]
          const useExisting =
            vExisting !== undefined && vExisting !== null && String(vExisting).trim() !== ''
          merged[k] = useExisting ? vExisting : normalizedBase[k]
        })
        // Aynı değerleri tekrar yazıp dokümanı kirletme
        const currentVal = (props.value as Record<string, any>) || {}
        if (!shallowEqual(currentVal, merged)) {
          props.onChange(set(merged))
        }
        hasPrefilledRef.current = true
      } catch {
        // sessiz geç
      }
    }
    fetchAndApply()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, docId])

  return props.renderDefault(props)
}
