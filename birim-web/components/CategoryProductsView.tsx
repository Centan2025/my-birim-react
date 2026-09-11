import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {useClient} from 'sanity'
import {
  Card,
  Stack,
  Text,
  Spinner,
  Box,
  Flex,
  Heading,
  TextInput,
  Button,
  useToast,
} from '@sanity/ui'
import {SearchIcon, CloseIcon, AddIcon, SyncIcon} from '@sanity/icons'
import {useRouter} from 'sanity/router'
import {getPreviewUrl} from '../schemaTypes/utils/previewUrl'

interface CategoryProductsViewProps {
  document: {
    displayed: {
      _id: string
    }
  }
}

interface ProductMediaItem {
  type: string
  isCover?: boolean
  isMirrored?: boolean
  imageR2?: {url: string; isMirrored?: boolean}
  imageDesktopR2?: {url: string; isMirrored?: boolean}
  imageMobileR2?: {url: string; isMirrored?: boolean}
  videoFileR2?: {url: string; isMirrored?: boolean}
  videoFileDesktopR2?: {url: string; isMirrored?: boolean}
  videoFileMobileR2?: {url: string; isMirrored?: boolean}
  thumbnailR2?: {url: string; isMirrored?: boolean}
}

interface Product {
  _id: string
  name: {tr?: string; en?: string}
  media?: ProductMediaItem[]
}

export function CategoryProductsView(props: CategoryProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const client = useClient({apiVersion: '2024-01-01'})
  const categoryId = props.document.displayed._id
  const router = useRouter()
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  const fetchProducts = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true)
      const cleanId = categoryId.replace('drafts.', '')
      const draftId = `drafts.${cleanId}`

      const query = `*[_type == "product" && (category._ref == $categoryId || category._ref == $draftId || category._ref == $cleanId)] | order(name.tr asc) {
        _id,
        name,
        media[] {
          type,
          isCover,
          isMirrored,
          imageR2 { url, isMirrored },
          imageDesktopR2 { url, isMirrored },
          imageMobileR2 { url, isMirrored },
          videoFileR2 { url, isMirrored },
          videoFileDesktopR2 { url, isMirrored },
          videoFileMobileR2 { url, isMirrored },
          thumbnailR2 { url, isMirrored }
        }
      }`

      try {
        const data: Product[] = await client.fetch(query, {categoryId, draftId, cleanId})
        // Mükerrer (draft ve published) olanları temizle. En güncel olan taslağı (draft) tercih et.
        const productMap = new Map<string, Product>()
        data.forEach((p) => {
          const cleanProdId = p._id.replace('drafts.', '')
          const isDraft = p._id.startsWith('drafts.')
          const existing = productMap.get(cleanProdId)

          if (!existing || isDraft) {
            productMap.set(cleanProdId, p)
          }
        })
        setProducts(Array.from(productMap.values()))
      } catch (err: unknown) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
        if (isManual) setRefreshing(false)
      }
    },
    [categoryId, client],
  )

  useEffect(() => {
    setLoading(true)
    fetchProducts()

    // Canlı dinleyici: Ürün silindiğinde, oluşturulduğunda veya güncellendiğinde listeyi anında yenile
    const subscription = client
      .listen('*[_type == "product"]', {}, {includeResult: false, visibility: 'query'})
      .subscribe(() => {
        fetchProducts()
      })

    const handleFocus = () => {
      fetchProducts()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchProducts, client])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const trName = p.name?.tr?.toLowerCase() || ''
      const enName = p.name?.en?.toLowerCase() || ''
      const idStr = p._id.toLowerCase()
      return trName.includes(q) || enName.includes(q) || idStr.includes(q)
    })
  }, [products, searchQuery])

  const handleProductClick = (productId: string) => {
    const cleanCatId = categoryId.replace('drafts.', '')
    const cleanProdId = productId.replace('drafts.', '')
    router.navigateUrl({path: `/structure/orderable-category;${cleanCatId};${cleanProdId}`})
  }

  const handleEditCategoryClick = () => {
    const cleanId = categoryId.replace('drafts.', '')
    router.navigateUrl({path: `/structure/orderable-category;${cleanId},view=editor`})
  }

  const handleCreateModel = useCallback(async () => {
    try {
      setCreating(true)
      const cleanCatId = categoryId.replace('drafts.', '')
      const newId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 12)
      const draftId = `drafts.${newId}`

      const newProductDoc = {
        _id: draftId,
        _type: 'product',
        name: {tr: '', en: ''},
        category: {
          _type: 'reference',
          _ref: cleanCatId,
        },
        isPublished: true,
        showMaterials: true,
        showMediaPanels: true,
      }

      await client.create(newProductDoc)

      toast.push({
        status: 'success',
        title: 'Model Taslağı Oluşturuldu',
        description: 'Yeni model düzenleme sayfasına yönlendiriliyorsunuz...',
      })

      router.navigateUrl({path: `/structure/orderable-category;${cleanCatId};${newId}`})
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu.'
      console.error('Error creating product in category:', err)
      toast.push({
        status: 'error',
        title: 'Model Oluşturulamadı',
        description: errorMsg,
      })
    } finally {
      setCreating(false)
    }
  }, [categoryId, client, router, toast])

  if (loading) {
    return (
      <Card padding={4} style={{minHeight: '400px'}}>
        <Flex align="center" justify="center" style={{height: '100%'}}>
          <Spinner size={3} />
        </Flex>
      </Card>
    )
  }

  return (
    <Card padding={4} style={{minHeight: '400px', maxWidth: '800px', margin: '0 auto'}}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" gap={2} style={{flexWrap: 'wrap'}}>
          <Heading size={2}>Bu Kategorideki Modeller</Heading>
          <Flex align="center" gap={2}>
            <Button
              mode="bleed"
              tone="default"
              icon={SyncIcon}
              title="Listeyi Yenile"
              loading={refreshing}
              disabled={refreshing}
              onClick={() => fetchProducts(true)}
              style={{cursor: 'pointer'}}
            />
            <Button
              tone="primary"
              icon={AddIcon}
              text={creating ? 'Oluşturuluyor...' : 'Yeni Model Ekle'}
              loading={creating}
              disabled={creating}
              onClick={handleCreateModel}
              style={{cursor: 'pointer'}}
            />
            <button
              onClick={handleEditCategoryClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'var(--card-muted-bg-color, #f1f5f9)',
                color: 'var(--card-fg-color, #1e293b)',
                border: '1px solid var(--card-border-color, #cbd5e1)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ✏️ Kategoriyi Düzenle
            </button>
          </Flex>
        </Flex>

        <TextInput
          icon={SearchIcon}
          placeholder="Model adı ile ara (TR / EN)..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.currentTarget.value)
          }
          clearButton={searchQuery.length > 0}
          onClear={() => setSearchQuery('')}
          fontSize={2}
          padding={3}
          radius={2}
        />

        <Card padding={3} radius={2} shadow={1} tone={searchQuery ? 'caution' : 'primary'}>
          <Flex align="center" justify="space-between">
            <Text size={2} weight="semibold">
              {searchQuery
                ? `${filteredProducts.length} model bulundu (Toplam ${products.length} model)`
                : `Toplam ${products.length} model`}
            </Text>
            {searchQuery && (
              <Button
                mode="bleed"
                tone="critical"
                icon={CloseIcon}
                text="Filtreyi Temizle"
                fontSize={1}
                padding={2}
                onClick={() => setSearchQuery('')}
              />
            )}
          </Flex>
        </Card>

        {products.length === 0 ? (
          <Card padding={5} tone="transparent" border radius={2}>
            <Flex direction="column" align="center" gap={3}>
              <Text align="center" muted size={2}>
                Bu kategoriye henüz model eklenmemiş.
              </Text>
              <Button
                tone="primary"
                icon={AddIcon}
                text={creating ? 'Oluşturuluyor...' : 'Bu Kategoriye İlk Modeli Ekle'}
                loading={creating}
                disabled={creating}
                onClick={handleCreateModel}
                style={{cursor: 'pointer'}}
              />
            </Flex>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card padding={4} tone="transparent" border radius={2}>
            <Flex direction="column" align="center" gap={3}>
              <Text align="center" muted size={2}>
                "{searchQuery}" aramasına uygun model bulunamadı.
              </Text>
              <Button
                mode="ghost"
                tone="default"
                text="Tüm Modelleri Göster"
                onClick={() => setSearchQuery('')}
              />
            </Flex>
          </Card>
        ) : (
          <Stack space={2}>
            {filteredProducts.map((product: Product) => {
              const coverItem =
                product.media?.find((m: ProductMediaItem) => m.isCover) || product.media?.[0]
              const rawUrl =
                coverItem?.imageR2?.url ||
                coverItem?.imageDesktopR2?.url ||
                coverItem?.imageMobileR2?.url ||
                coverItem?.thumbnailR2?.url ||
                coverItem?.videoFileR2?.url ||
                coverItem?.videoFileDesktopR2?.url ||
                coverItem?.videoFileMobileR2?.url
              const previewUrl = getPreviewUrl(rawUrl)
              const isMirrored =
                (coverItem?.imageR2?.url && coverItem?.imageR2?.isMirrored) ||
                (coverItem?.imageDesktopR2?.url && coverItem?.imageDesktopR2?.isMirrored) ||
                (coverItem?.imageMobileR2?.url && coverItem?.imageMobileR2?.isMirrored) ||
                !!coverItem?.thumbnailR2?.isMirrored ||
                !!coverItem?.isMirrored

              return (
                <Card
                  key={product._id}
                  padding={3}
                  radius={2}
                  shadow={1}
                  tone="default"
                  as="button"
                  onClick={() => handleProductClick(product._id)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    width: '100%',
                    transition: 'all 0.2s',
                    background: 'var(--card-bg-color)',
                  }}
                >
                  <Flex align="center" gap={3}>
                    {previewUrl ? (
                      <Box
                        style={{
                          width: '60px',
                          height: '60px',
                          overflow: 'hidden',
                          borderRadius: '4px',
                          flexShrink: 0,
                          backgroundColor: '#f1f3f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt={product.name?.tr || ''}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                            transform: isMirrored ? 'scaleX(-1)' : 'none',
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '4px',
                          flexShrink: 0,
                          backgroundColor: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text>📦</Text>
                      </Box>
                    )}
                    <Stack space={1} flex={1}>
                      <Text size={2} weight="medium">
                        {product.name?.tr || product.name?.en || 'Ürün'}
                      </Text>
                      {product.name?.en && product.name?.tr !== product.name?.en && (
                        <Text size={1} muted>
                          {product.name.en}
                        </Text>
                      )}
                    </Stack>
                    <Text size={1} muted>
                      →
                    </Text>
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
