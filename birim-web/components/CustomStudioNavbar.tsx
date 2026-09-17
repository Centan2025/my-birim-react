import React from 'react'
import type {NavbarProps} from 'sanity'
import {Card, Flex} from '@sanity/ui'
import StudioLanguageBar from './StudioLanguageBar'

// Prevent Chrome Blink native "WebSocket is closed before the connection is established" warning
// when Sanity Presence or Tasks unsubscribes during React mount/unmount or hot-reload.
if (
  typeof window !== 'undefined' &&
  window.WebSocket &&
  !(window.WebSocket as any).__patchedClose
) {
  const originalClose = window.WebSocket.prototype.close
  ;(window.WebSocket as any).__patchedClose = true
  window.WebSocket.prototype.close = function (this: WebSocket, code?: number, reason?: string) {
    if (this.readyState === 0 /* WebSocket.CONNECTING */) {
      const onOpen = () => {
        try {
          originalClose.call(this, code, reason)
        } catch {}
      }
      this.addEventListener('open', onOpen, {once: true})
      this.addEventListener('error', () => {}, {once: true})
      return
    }
    return originalClose.call(this, code, reason)
  }
}

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
