import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  ProductCardReveal,
  CategoryTitleReveal,
  getProductCardStaggerDelay,
} from '../components/ProductCardReveal'
import * as framerMotion from 'framer-motion'

// Mock framer-motion partially
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useInView: vi.fn(() => true),
    useReducedMotion: vi.fn(() => false),
  }
})

describe('ProductCardReveal', () => {
  it('renders children properly inside the masked container', () => {
    render(
      <ProductCardReveal delay={0.1}>
        <div data-testid="test-card">Product Card Content</div>
      </ProductCardReveal>
    )

    const card = screen.getByTestId('test-card')
    expect(card).toBeInTheDocument()
    expect(card.textContent).toBe('Product Card Content')
  })

  it('renders without animation when prefers-reduced-motion is active', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true)

    render(
      <ProductCardReveal>
        <div data-testid="reduced-motion-card">Static Card</div>
      </ProductCardReveal>
    )

    const card = screen.getByTestId('reduced-motion-card')
    expect(card).toBeInTheDocument()
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false)
  })

  describe('getProductCardStaggerDelay', () => {
    it('calculates organic pseudo-random delays for top rows within expected bounds', () => {
      for (let i = 0; i < 8; i++) {
        const delay = getProductCardStaggerDelay(i, 4, true)
        expect(delay).toBeGreaterThanOrEqual(0.04)
        expect(delay).toBeLessThanOrEqual(0.55)
      }

      // Check that delays are not all monotonically increasing (they are scattered)
      const d0 = getProductCardStaggerDelay(0, 4, true)
      const d1 = getProductCardStaggerDelay(1, 4, true)
      const d2 = getProductCardStaggerDelay(2, 4, true)
      const isStrictlyLinear = d0 < d1 && d1 < d2 && d2 - d1 === d1 - d0
      expect(isStrictlyLinear).toBe(false)
    })

    it('calculates progressive linear delays when randomize is false', () => {
      // Row 0
      expect(getProductCardStaggerDelay(0, 4, false)).toBeCloseTo(0.0)
      expect(getProductCardStaggerDelay(1, 4, false)).toBeCloseTo(0.1)
      expect(getProductCardStaggerDelay(2, 4, false)).toBeCloseTo(0.2)
      expect(getProductCardStaggerDelay(3, 4, false)).toBeCloseTo(0.3)

      // Row 1
      expect(getProductCardStaggerDelay(4, 4, false)).toBeCloseTo(0.14)
      expect(getProductCardStaggerDelay(5, 4, false)).toBeCloseTo(0.24)
      expect(getProductCardStaggerDelay(6, 4, false)).toBeCloseTo(0.34)
      expect(getProductCardStaggerDelay(7, 4, false)).toBeCloseTo(0.44)
    })
  })

  describe('CategoryTitleReveal', () => {
    it('renders category title content inside the masked container', () => {
      render(
        <CategoryTitleReveal>
          <h2>Sandalyeler</h2>
        </CategoryTitleReveal>
      )

      const title = screen.getByRole('heading', {name: 'Sandalyeler'})
      expect(title).toBeInTheDocument()
    })

    it('renders static content without animation when prefers-reduced-motion is active', () => {
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true)

      render(
        <CategoryTitleReveal>
          <h2>Koltuklar</h2>
        </CategoryTitleReveal>
      )

      const title = screen.getByRole('heading', {name: 'Koltuklar'})
      expect(title).toBeInTheDocument()
      vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false)
    })
  })
})
