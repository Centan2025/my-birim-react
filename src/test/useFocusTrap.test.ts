/**
 * useFocusTrap hook testleri
 */
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {renderHook} from '@testing-library/react'
import {useFocusTrap} from '../hooks/useFocusTrap'

describe('useFocusTrap', () => {
  let container: HTMLDivElement
  let button1: HTMLButtonElement
  let button2: HTMLButtonElement
  let button3: HTMLButtonElement
  let externalButton: HTMLButtonElement

  beforeEach(() => {
    document.body.innerHTML = ''

    externalButton = document.createElement('button')
    externalButton.id = 'external'
    document.body.appendChild(externalButton)

    container = document.createElement('div')
    container.id = 'trap-container'

    button1 = document.createElement('button')
    button1.id = 'btn-1'
    button2 = document.createElement('button')
    button2.id = 'btn-2'
    button3 = document.createElement('button')
    button3.id = 'btn-3'

    container.appendChild(button1)
    container.appendChild(button2)
    container.appendChild(button3)
    document.body.appendChild(container)
  })

  it('Escape tuşuna basıldığında onClose geri çağırımını tetiklemeli', () => {
    const onClose = vi.fn()
    renderHook(() => {
      const ref = useFocusTrap(true, onClose)
      Object.defineProperty(ref, 'current', {value: container, writable: true})
      return ref
    })

    const escapeEvent = new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})
    window.dispatchEvent(escapeEvent)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Tab ile son elemandan ilk elemana sarmalı', () => {
    renderHook(() => {
      const ref = useFocusTrap(true)
      Object.defineProperty(ref, 'current', {value: container, writable: true})
      return ref
    })

    button3.focus()
    expect(document.activeElement).toBe(button3)

    const tabEvent = new KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true})
    window.dispatchEvent(tabEvent)

    expect(document.activeElement).toBe(button1)
  })

  it('Shift+Tab ile ilk elemandan son elemana sarmalı', () => {
    renderHook(() => {
      const ref = useFocusTrap(true)
      Object.defineProperty(ref, 'current', {value: container, writable: true})
      return ref
    })

    button1.focus()
    expect(document.activeElement).toBe(button1)

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(shiftTabEvent)

    expect(document.activeElement).toBe(button3)
  })

  it('Kapatıldığında odağı açan dış elemana (Focus Restoration) geri vermeli', () => {
    externalButton.focus()
    expect(document.activeElement).toBe(externalButton)

    const {rerender} = renderHook(
      ({active}) => {
        const ref = useFocusTrap(active)
        Object.defineProperty(ref, 'current', {value: container, writable: true})
        return ref
      },
      {initialProps: {active: true}}
    )

    rerender({active: false})

    expect(document.activeElement).toBe(externalButton)
  })
})
