/**
 * useLightbox hook testleri
 */
import {describe, it, expect} from 'vitest'
import {renderHook, act} from '@testing-library/react'
import {useLightbox} from '../hooks/useLightbox'

const images = [
  {url: '/img/1.jpg', type: 'image'},
  {url: '/img/2.jpg', type: 'image'},
  {url: '/img/3.jpg', type: 'image'},
]

describe('useLightbox', () => {
  it('başlangıçta kapalı olmalı', () => {
    const {result} = renderHook(() => useLightbox())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.images).toHaveLength(0)
    expect(result.current.currentIndex).toBe(0)
  })

  it('open() çağrısıyla açılmalı ve doğru indexi ayarlamalı', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 1)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.images).toHaveLength(3)
    expect(result.current.currentIndex).toBe(1)
  })

  it('close() çağrısıyla kapanmalı', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 0)
    })
    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('next() sonraki resme geçmeli', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 0)
    })
    act(() => {
      result.current.next()
    })

    expect(result.current.currentIndex).toBe(1)
  })

  it('next() son resimdeyken wrap-around yapmalı (0. resme dönmeli)', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 2)
    }) // son resim (index 2)
    act(() => {
      result.current.next()
    })

    expect(result.current.currentIndex).toBe(0) // wrap-around
  })

  it('prev() önceki resme geçmeli', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 2)
    })
    act(() => {
      result.current.prev()
    })

    expect(result.current.currentIndex).toBe(1)
  })

  it('prev() ilk resimdeyken wrap-around yapmalı (son resme dönmeli)', () => {
    const {result} = renderHook(() => useLightbox())

    act(() => {
      result.current.open(images, 0)
    }) // ilk resim
    act(() => {
      result.current.prev()
    })

    expect(result.current.currentIndex).toBe(2) // wrap-around
  })

  it('open() farklı resimlerle tekrar çağrıldığında state güncellenmeli', () => {
    const {result} = renderHook(() => useLightbox())
    const newImages = [{url: '/other.jpg', type: 'image'}]

    act(() => {
      result.current.open(images, 1)
    })
    act(() => {
      result.current.open(newImages, 0)
    })

    expect(result.current.images).toHaveLength(1)
    expect(result.current.currentIndex).toBe(0)
  })
})
