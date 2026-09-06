import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {TextMaskReveal} from '../components/TextMaskReveal'
import * as framerMotion from 'framer-motion'

// Partially mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useInView: vi.fn(() => true),
    useReducedMotion: vi.fn(() => false),
  }
})

describe('TextMaskReveal', () => {
  it('renders children properly inside masked overflow container', () => {
    render(
      <TextMaskReveal delay={100}>
        <h2 data-testid="test-heading">Lüks Koltuk Başlığı</h2>
      </TextMaskReveal>
    )

    const heading = screen.getByTestId('test-heading')
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toBe('Lüks Koltuk Başlığı')
  })

  it('renders text with custom className and display', () => {
    const {container} = render(
      <TextMaskReveal className="custom-class" display="inline-block" delay={0.2}>
        <span>Inline Masked Text</span>
      </TextMaskReveal>
    )

    const maskContainer = container.querySelector('.custom-class')
    expect(maskContainer).toBeInTheDocument()
    expect(maskContainer).toHaveClass('inline-block')
    expect(maskContainer).toHaveClass('overflow-hidden')
  })

  it('renders static content without animation when prefers-reduced-motion is true', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true)

    render(
      <TextMaskReveal>
        <p data-testid="reduced-motion-text">Erişilebilir Metin</p>
      </TextMaskReveal>
    )

    const text = screen.getByTestId('reduced-motion-text')
    expect(text).toBeInTheDocument()
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false)
  })
})
