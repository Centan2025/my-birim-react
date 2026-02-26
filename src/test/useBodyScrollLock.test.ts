/**
 * useBodyScrollLock hook testleri
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

describe('useBodyScrollLock', () => {
    beforeEach(() => {
        // Body style'larını temizle
        document.body.style.position = ''
        document.body.style.overflow = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
    })

    afterEach(() => {
        document.body.style.position = ''
        document.body.style.overflow = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
    })

    it('isLocked=true olduğunda body position fixed yapılmalı', () => {
        renderHook(() => useBodyScrollLock(true))
        expect(document.body.style.position).toBe('fixed')
        expect(document.body.style.overflow).toBe('hidden')
    })

    it('isLocked=false olduğunda body style temiz olmalı', () => {
        renderHook(() => useBodyScrollLock(false))
        expect(document.body.style.position).toBe('')
        expect(document.body.style.overflow).toBe('')
    })

    it('true→false geçişinde body serbest bırakılmalı', () => {
        const { rerender } = renderHook(({ locked }: { locked: boolean }) => useBodyScrollLock(locked), {
            initialProps: { locked: true },
        })

        expect(document.body.style.position).toBe('fixed')

        rerender({ locked: false })

        expect(document.body.style.position).toBe('')
        expect(document.body.style.overflow).toBe('')
    })

    it('kilitleme sırasında width: 100% ayarlanmalı', () => {
        renderHook(() => useBodyScrollLock(true))
        expect(document.body.style.width).toBe('100%')
    })
})
