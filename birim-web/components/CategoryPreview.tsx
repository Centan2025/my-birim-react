import React from 'react'
import {useRouter} from 'sanity/router'
import {Flex, Box} from '@sanity/ui'

export function CategoryPreview(props: any) {
  const router = useRouter()
  const docId = props.description || props._id || props.value?._id || props.id

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (docId) {
      const cleanId = docId.replace('drafts.', '')
      router.navigateUrl({path: `/structure/orderable-category;${cleanId},view=editor`})
    }
  }

  const {description, ...restProps} = props

  return (
    <Flex align="center" justify="space-between" style={{width: '100%', gap: '8px'}}>
      <Box style={{flex: 1, minWidth: 0}}>{props.renderDefault(restProps)}</Box>
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
