import {describe, it, expect, vi, beforeEach} from 'vitest'

// Mock react-ga4 before importing analytics
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
  },
}))

import ReactGA from 'react-ga4'
import {analytics} from '../lib/analytics'

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Force initialization for testing
    ;(analytics as any).googleAnalyticsId = 'UA-TEST-123'
    ;(analytics as any).isInitialized = true
    // Mock window.location for safe side effects
    vi.stubGlobal('location', {origin: 'http://localhost'})
  })

  it('pageview tetiklendiğinde ReactGA.send çağrılmalı', () => {
    analytics.pageview('/test-path', 'Test Title')
    expect(ReactGA.send).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: 'pageview',
        page: '/test-path',
        title: 'Test Title',
      })
    )
  })

  it('event tetiklendiğinde ReactGA.event çağrılmalı', () => {
    analytics.event({action: 'click', category: 'button', label: 'test', value: 10})
    expect(ReactGA.event).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'click',
        category: 'button',
        label: 'test',
        value: 10,
      })
    )
  })
})
