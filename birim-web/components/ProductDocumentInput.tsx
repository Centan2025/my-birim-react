import React, {useEffect, useState, useMemo} from 'react'
import {InputProps, useClient} from 'sanity'
import {Card, Flex, Text, Box, Badge, Button, Stack} from '@sanity/ui'
import StudioLanguageBar from './StudioLanguageBar'
import {getProductReadiness} from '../utils/productReadiness'

export default function ProductDocumentInput(props: InputProps) {
  const {renderDefault, value} = props
  const client = useClient({apiVersion: '2024-01-01'})

  const productVal = value as Record<string, any> | undefined
  const productName = productVal?.name?.tr || productVal?.name?.en || 'Ürün Detay'
  const categoryRef = productVal?.category?._ref

  const [categoryName, setCategoryName] = useState<string>('')
  const [showReadinessDetails, setShowReadinessDetails] = useState<boolean>(false)

  // Real-time readiness calculation (zero database writes)
  const readiness = useMemo(() => getProductReadiness(productVal), [productVal])

  useEffect(() => {
    if (categoryRef) {
      const cleanId = categoryRef.replace('drafts.', '')
      client
        .fetch(`*[_type == "category" && _id in [$cleanId, "drafts." + $cleanId]][0]{_id, name}`, {
          cleanId,
        })
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

  const statusTone =
    readiness.status === 'READY'
      ? 'positive'
      : readiness.status === 'NEEDS_ATTENTION'
        ? 'caution'
        : 'default'

  return (
    <Card style={{position: 'relative'}}>
      {/* Breadcrumbs & Language Bar */}
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
        <Flex align="center" justify="space-between" gap={2} style={{flexWrap: 'wrap'}}>
          <Flex
            align="center"
            gap={1}
            style={{fontSize: '13px', fontWeight: 500, color: '#8b949e'}}
          >
            <span
              style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 4px'}}
            >
              🪑 Ürünler
            </span>

            <span style={{color: '#484f58', userSelect: 'none'}}>›</span>

            {categoryName ? (
              <>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '2px 4px',
                    fontWeight: 600,
                    color: '#c9d1d9',
                  }}
                >
                  📁 {categoryName}
                </span>
                <span style={{color: '#484f58', userSelect: 'none'}}>›</span>
              </>
            ) : null}

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 4px',
                color: '#8b949e',
              }}
            >
              📄 {productName}
            </span>
          </Flex>

          <StudioLanguageBar size="small" showAllOption showLabel={false} />
        </Flex>
      </Card>

      {/* Commerce Readiness Real-time Inspector Banner */}
      <Card
        padding={3}
        borderBottom
        tone={statusTone}
        style={{
          background:
            readiness.status === 'READY'
              ? 'rgba(46, 160, 67, 0.08)'
              : readiness.status === 'NEEDS_ATTENTION'
                ? 'rgba(210, 153, 34, 0.08)'
                : 'rgba(110, 118, 129, 0.06)',
        }}
      >
        <Flex align="center" justify="space-between" gap={3} style={{flexWrap: 'wrap'}}>
          <Flex align="center" gap={3}>
            <Badge
              tone={statusTone}
              mode="outline"
              fontSize={1}
              style={{letterSpacing: '0.04em', textTransform: 'uppercase'}}
            >
              {readiness.status === 'READY'
                ? '● Commerce Ready'
                : readiness.status === 'NEEDS_ATTENTION'
                  ? '▲ Needs Attention'
                  : readiness.status === 'NOT_FOR_SALE'
                    ? '○ Katalog (Satışa Kapalı)'
                    : '○ Eksik Veri'}
            </Badge>

            <Text size={1} style={{color: '#8b949e'}}>
              {readiness.summary}
              {productVal?.sales_mode ? ` · Mod: ${productVal.sales_mode}` : ''}
              {productVal?.sku ? ` · SKU: ${productVal.sku}` : ''}
            </Text>
          </Flex>

          {(readiness.blockers.length > 0 || readiness.warnings.length > 0) && (
            <Button
              mode="bleed"
              tone={statusTone}
              fontSize={1}
              padding={2}
              text={showReadinessDetails ? 'Detayları Gizle ▲' : 'Detayları İncele ▼'}
              onClick={() => setShowReadinessDetails((prev) => !prev)}
            />
          )}
        </Flex>

        {showReadinessDetails && (
          <Box paddingTop={3}>
            <Stack space={2}>
              {readiness.blockers.map((b, idx) => (
                <Flex key={`blocker-${idx}`} align="center" gap={2}>
                  <Text size={1} style={{color: '#f85149', fontWeight: 600}}>
                    ✕
                  </Text>
                  <Text size={1} style={{color: '#f85149'}}>
                    {b}
                  </Text>
                </Flex>
              ))}

              {readiness.warnings.map((w, idx) => (
                <Flex key={`warning-${idx}`} align="center" gap={2}>
                  <Text size={1} style={{color: '#d29922', fontWeight: 600}}>
                    !
                  </Text>
                  <Text size={1} style={{color: '#8b949e'}}>
                    {w}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Box>
        )}
      </Card>

      {/* Default Form Rendering */}
      <Box padding={4}>{renderDefault(props)}</Box>
    </Card>
  )
}
