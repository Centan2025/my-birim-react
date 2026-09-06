import {describe, it, expect} from 'vitest'
import {isChunkLoadError} from '@/utils/lazyWithRetry'

describe('lazyWithRetry', () => {
  it('identifies chunk load errors correctly', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(
      true
    )
    expect(isChunkLoadError(new Error('Importing a module script failed'))).toBe(true)
    expect(
      isChunkLoadError(new Error('error loading dynamically imported module /assets/foo.js'))
    ).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 4 failed'))).toBe(true)
    expect(isChunkLoadError({name: 'ChunkLoadError', message: 'Chunk failed'})).toBe(true)
  })

  it('identifies non-chunk errors as false', () => {
    expect(isChunkLoadError(new Error('Syntax error'))).toBe(false)
    expect(isChunkLoadError(new Error('Network offline'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})
