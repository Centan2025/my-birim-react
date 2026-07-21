import React from 'react'
import {InputProps} from 'sanity'
import {Card, Flex, Text, Box} from '@sanity/ui'

export default function CategoryDocumentInput(props: InputProps) {
  const {renderDefault, value} = props
  
  const categoryVal = value as Record<string, any> | undefined
  const categoryName = categoryVal?.name?.tr || categoryVal?.name?.en || 'Kategori Detay'

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

          <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 4px', color: '#8b949e'}}>
            📁 {categoryName} (Düzenle)
          </span>
        </Flex>
      </Card>

      <Box padding={4}>
        {renderDefault(props)}
      </Box>
    </Card>
  )
}
