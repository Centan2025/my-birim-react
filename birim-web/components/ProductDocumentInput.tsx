import React, {useEffect, useState} from 'react'
import {InputProps, useClient} from 'sanity'
import {Card, Flex, Text, Box} from '@sanity/ui'

export default function ProductDocumentInput(props: InputProps) {
  const {renderDefault, value} = props
  const client = useClient({apiVersion: '2024-01-01'})
  
  const productVal = value as Record<string, any> | undefined
  const productName = productVal?.name?.tr || productVal?.name?.en || 'Ürün Detay'
  const categoryRef = productVal?.category?._ref

  const [categoryName, setCategoryName] = useState<string>('')

  useEffect(() => {
    if (categoryRef) {
      const cleanId = categoryRef.replace('drafts.', '')
      client
        .fetch(`*[_type == "category" && _id in [$cleanId, "drafts." + $cleanId]][0]{_id, name}`, {cleanId})
        .then((res) => {
          if (res) {
            setCategoryName(res.name?.tr || res.name?.en || 'Kategori')
          }
        })
        .catch((err) => {
          console.error('Error fetching category for breadcrumbs:', err)
        })
    }
  }, [categoryRef, client])

  return (
    <Card style={{position: 'relative'}}>
      {/* Breadcrumbs Bar */}
      <Card
        padding={3}
        borderBottom
        tone="transparent"
        style={{
          background: 'var(--card-bg-color)',
          zIndex: 10,
          position: 'sticky',
          top: 0,
        }}
      >
        <Flex align="center" gap={1} style={{fontSize: '13px', fontWeight: 500, color: '#8b949e'}}>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 4px'}}>
            🪑 Ürünler
          </span>

          <span style={{color: '#484f58', userSelect: 'none'}}>›</span>

          {categoryName ? (
            <>
              <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 4px', fontWeight: 600, color: '#c9d1d9'}}>
                📁 {categoryName}
              </span>
              <span style={{color: '#484f58', userSelect: 'none'}}>›</span>
            </>
          ) : null}

          <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 4px', color: '#8b949e'}}>
            📄 {productName}
          </span>
        </Flex>
      </Card>

      {/* Default Form Rendering */}
      <Box padding={4}>
        {renderDefault(props)}
      </Box>
    </Card>
  )
}
