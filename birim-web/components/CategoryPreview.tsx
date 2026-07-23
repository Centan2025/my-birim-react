import React from 'react'
import {useRouter} from 'sanity/router'
import {Flex, Box} from '@sanity/ui'
import type {PreviewProps} from 'sanity'

export function CategoryPreview(props: PreviewProps) {
  const router = useRouter()
  const rawProps = props as unknown as Record<string, unknown>
  const docId =
    (typeof rawProps['description'] === 'string' ? rawProps['description'] : undefined) ||
    (typeof rawProps['_id'] === 'string' ? rawProps['_id'] : undefined) ||
    ((rawProps['value'] as Record<string, unknown>)?._id as string | undefined) ||
    (typeof rawProps['id'] === 'string' ? rawProps['id'] : undefined)

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (docId) {
      const cleanId = String(docId).replace('drafts.', '')
      router.navigateUrl({path: `/structure/orderable-category;${cleanId},view=editor`})
    }
  }

  return (
    <Flex align="center" justify="space-between" style={{width: '100%', gap: '8px'}}>
      <Box style={{flex: 1, minWidth: 0}}>{props.renderDefault(props)}</Box>
      <button
        onClick={handleEditClick}
        title="Kategoriyi Düzenle"
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          border: 'none',
          borderRadius: '4px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3b82f6'
          e.currentTarget.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
          e.currentTarget.style.color = '#3b82f6'
        }}
      >
        ✏️
      </button>
    </Flex>
  )
}
