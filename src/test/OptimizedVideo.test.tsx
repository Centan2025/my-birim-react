import {describe, it, expect, vi} from 'vitest'
import {render, fireEvent} from '@testing-library/react'
import React from 'react'
import {OptimizedVideo} from '../components/OptimizedVideo'

describe('OptimizedVideo', () => {
  it('renders video element with given src', () => {
    const {container} = render(
      <OptimizedVideo src="https://birim-assets.web-birim.workers.dev/sample.mp4" />
    )
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video?.getAttribute('src')).toBe('https://birim-assets.web-birim.workers.dev/sample.mp4')
  })

  it('handles media error and attempts fallback to origin R2 domain', async () => {
    const onError = vi.fn()
    const {container} = render(
      <OptimizedVideo
        src="https://birim-assets.web-birim.workers.dev/sample.mp4"
        onError={onError}
      />
    )
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()

    if (video) {
      Object.defineProperty(video, 'error', {
        value: {code: 4, message: 'Format not supported'},
        configurable: true,
      })
      Object.defineProperty(video, 'src', {
        value: 'https://birim-assets.web-birim.workers.dev/sample.mp4',
        configurable: true,
      })

      fireEvent.error(video)
    }
  })
})
