import React from 'react'
import type {NavbarProps} from 'sanity'
import {Card, Flex} from '@sanity/ui'
import StudioLanguageBar from './StudioLanguageBar'

export default function CustomStudioNavbar(props: NavbarProps) {
  return (
    <div>
      {props.renderDefault(props)}
      <Card
        padding={2}
        borderBottom
        tone="default"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'var(--card-bg-color)',
          paddingRight: '1rem',
          paddingLeft: '1rem',
          zIndex: 50,
        }}
      >
        <StudioLanguageBar size="small" showAllOption showLabel />
      </Card>
    </div>
  )
}
