import React, {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Text, Spinner, Box, Flex, Heading} from '@sanity/ui'
import {useRouter} from 'sanity/router'

export function CategoryProductsView(props: any) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const client = useClient({apiVersion: '2024-01-01'})
  const categoryId = props.document.displayed._id
  const router = useRouter()

  useEffect(() => {
    // Draft ve published versiyonlar için ID'leri hazırla
    const cleanId = categoryId.replace('drafts.', '')
    const draftId = `drafts.${cleanId}`

    const query = `*[_type == "product" && (category._ref == $categoryId || category._ref == $draftId || category._ref == $cleanId)] | order(name.tr asc) {
      _id,
      name,
      "imageUrl": mainImage.asset->url
    }`
    client
      .fetch(query, {categoryId, draftId, cleanId})
      .then((data: any) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((err: any) => {
        console.error('Error fetching products:', err)
        setLoading(false)
      })
  }, [categoryId, client])

  const handleProductClick = (productId: string) => {
    router.navigateIntent('edit', {id: productId, type: 'product'})
  }

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
        <Heading size={2}>Bu Kategorideki Modeller</Heading>
        <Card padding={3} radius={2} shadow={1} tone="primary">
          <Text size={2} weight="semibold">
            Toplam {products.length} model
          </Text>
        </Card>
        {products.length === 0 ? (
          <Card padding={4} tone="transparent" border radius={2}>
            <Text align="center" muted size={2}>
              Bu kategoriye henüz model eklenmemiş.
              <br />
              Yeni model eklemek için sol menüden "Tüm Modeller" bölümüne gidin.
            </Text>
          </Card>
        ) : (
          <Stack space={2}>
            {products.map((product: any) => (
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
                  {product.imageUrl ? (
                    <Box
                      style={{
                        width: '60px',
                        height: '60px',
                        overflow: 'hidden',
                        borderRadius: '4px',
                        flexShrink: 0,
                        backgroundColor: '#f1f3f4',
                      }}
                    >
                      <img
                        src={`${product.imageUrl}?w=120&h=120&fit=crop`}
                        alt={product.name?.tr || ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
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
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
