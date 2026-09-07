import {describe, it, expect, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {TextLineReveal} from '../components/TextLineReveal'
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

describe('TextLineReveal', () => {
  it('renders text properly inside specified HTML tag', () => {
    render(
      <TextLineReveal
        as="h2"
        text="Minimalist Koltuk Serisi"
        delay={60}
        stagger={70}
        className="test-class"
      />
    )

    const heading = screen.getByRole('heading', {level: 2})
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Minimalist Koltuk Serisi')
    expect(heading).toHaveAttribute('aria-label', 'Minimalist Koltuk Serisi')
  })

  it('renders paragraph tag for description and has masked container', () => {
    const {container} = render(
      <TextLineReveal
        as="p"
        text="Tasarım ve konforun buluştuğu eşsiz bir deneyim."
        className="description-class"
      />
    )

    const p = container.querySelector('p.description-class')
    expect(p).toBeInTheDocument()
    expect(p).toHaveTextContent('Tasarım ve konforun buluştuğu eşsiz bir deneyim.')

    // Checks that line masks with overflow-hidden exist
    const maskedLines = container.querySelectorAll('.overflow-hidden')
    expect(maskedLines.length).toBeGreaterThan(0)
  })

  it('renders static content without animation when prefers-reduced-motion is true', () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true)

    const {container} = render(
      <TextLineReveal as="p" text="Erişilebilir sade metin." className="accessible-class" />
    )

    const p = container.querySelector('p.accessible-class')
    expect(p).toBeInTheDocument()
    expect(p).toHaveTextContent('Erişilebilir sade metin.')
    // In reduced motion mode, it shouldn't render animated motion containers
    expect(container.querySelectorAll('.overflow-hidden').length).toBe(0)

    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false)
  })

  it('handles empty or blank text gracefully', () => {
    const {container} = render(<TextLineReveal text="" />)
    expect(container.firstChild).toBeNull()
  })
})
