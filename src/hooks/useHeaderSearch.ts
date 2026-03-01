import {useState, useEffect, useCallback} from 'react'
import {useTranslation} from '../i18n'
import {Product, Designer, Category} from '../types'
import {getProducts, getDesigners, getCategories} from '../services/cms'

export function useHeaderSearch(isSearchOpen: boolean) {
  const {t, locale} = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    products: Product[]
    designers: Designer[]
    categories: Category[]
  }>({products: [], designers: [], categories: []})
  const [isSearching, setIsSearching] = useState(false)
  const [allData, setAllData] = useState<{
    products: Product[]
    designers: Designer[]
    categories: Category[]
  } | null>(null)

  // Locale-aware normalization helper
  const normalizeSearchText = useCallback(
    (value: string): string => {
      if (!value) return ''
      let lower: string
      try {
        if (locale === 'tr' || locale === 'tr-TR') {
          lower = value.toLocaleLowerCase('tr')
        } else {
          lower = value.toLocaleLowerCase()
        }
      } catch {
        lower = value.toLowerCase()
      }
      try {
        return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      } catch {
        return lower
      }
    },
    [locale]
  )

  const closeSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults({products: [], designers: [], categories: []})
  }, [])

  // Fetch all data for search when the search modal is opened for the first time.
  useEffect(() => {
    if (isSearchOpen && !allData) {
      setIsSearching(true)
      Promise.all([getProducts(), getDesigners(), getCategories()])
        .then(([products, designers, categories]) => {
          setAllData({products, designers, categories})
          setIsSearching(false)
        })
        .catch(() => {
          setIsSearching(false)
        })
    }
  }, [isSearchOpen, allData])

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({products: [], designers: [], categories: []})
      return
    }

    if (!allData) return

    setIsSearching(true)
    const handler = setTimeout(() => {
      const lowercasedQuery = normalizeSearchText(searchQuery).trim()
      if (!lowercasedQuery) {
        setSearchResults({products: [], designers: [], categories: []})
        setIsSearching(false)
        return
      }

      const searchTerms = lowercasedQuery.split(/\s+/).filter(term => term.length > 0)

      const filteredProducts = allData.products.filter(p => {
        const productName = normalizeSearchText(t(p.name))
        const category = allData.categories.find(c => c.id === p.categoryId)
        const categoryName = category ? normalizeSearchText(t(category.name)) : ''
        const designer = allData.designers.find(d => d.id === p.designerId)
        const designerName = designer ? normalizeSearchText(t(designer.name)) : ''
        const searchableText = `${productName} ${categoryName} ${designerName}`
        return searchTerms.every(term => searchableText.includes(term))
      })

      const filteredDesigners = allData.designers.filter(d => {
        const designerName = normalizeSearchText(t(d.name))
        return searchTerms.every(term => designerName.includes(term))
      })

      const filteredCategories = allData.categories.filter(c => {
        const categoryName = normalizeSearchText(t(c.name))
        return searchTerms.every(term => categoryName.includes(term))
      })

      setSearchResults({
        products: filteredProducts,
        designers: filteredDesigners,
        categories: filteredCategories,
      })
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery, allData, normalizeSearchText, t])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    allData,
    normalizeSearchText,
    internalCloseSearch: closeSearch,
  }
}
