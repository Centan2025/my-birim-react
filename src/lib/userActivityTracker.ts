/**
 * User Activity Tracker
 *
 * Tracks logged-in user engagement:
 * - Session start & end
 * - Page views & exact dwell duration (time spent on page)
 * - Asset downloads (2D CAD, 3D models, PDF catalogs, spec sheets)
 * - Device, platform, OS, browser, referrer
 */

export interface ActivityEvent {
  user_id: string
  user_email?: string
  session_id: string
  activity_type: 'session_start' | 'page_view' | 'page_dwell' | 'download' | 'session_end'
  page_url?: string
  page_title?: string
  duration_seconds?: number
  download_file_name?: string
  download_file_type?: string
  platform?: string
  os?: string
  browser?: string
  referrer?: string
  metadata?: Record<string, unknown>
}

class UserActivityTracker {
  private sessionId: string | null = null
  private currentUser: {id: string; email?: string} | null = null
  private currentPage: {url: string; title: string; enteredAt: number} | null = null
  private isInitialized = false
  private eventQueue: ActivityEvent[] = []
  private flushTimer: number | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Retrieve or initialize session
    try {
      let sId = sessionStorage.getItem('birim_activity_session_id')
      if (!sId) {
        sId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        sessionStorage.setItem('birim_activity_session_id', sId)
      }
      this.sessionId = sId
    } catch {
      this.sessionId = `sess_${Date.now()}`
    }

    // Visibility change listener (tab minimize / background)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.recordCurrentPageDwell(false)
      } else if (document.visibilityState === 'visible' && this.currentPage) {
        // Reset enter time when coming back to tab
        this.currentPage.enteredAt = Date.now()
      }
    })

    // Unload listener for zero data loss
    window.addEventListener('beforeunload', () => {
      this.recordCurrentPageDwell(true)
      if (this.currentUser && this.sessionId) {
        this.queueEvent({
          user_id: this.currentUser.id,
          user_email: this.currentUser.email,
          session_id: this.sessionId,
          activity_type: 'session_end',
          page_url: window.location.pathname,
          page_title: document.title,
          duration_seconds: 0,
          ...this.getDeviceInfo(),
        })
      }
      this.flushBeacon()
    })
  }

  public setUser(user: {id: string; email?: string} | null) {
    const prevUser = this.currentUser
    this.currentUser = user

    // Trigger session start if user just logged in or identified
    if (user && (!prevUser || prevUser.id !== user.id)) {
      this.queueEvent({
        user_id: user.id,
        user_email: user.email,
        session_id: this.getSessionId(),
        activity_type: 'session_start',
        page_url: window.location.pathname,
        page_title: document.title,
        duration_seconds: 0,
        referrer: document.referrer || 'Direct',
        ...this.getDeviceInfo(),
      })
    }
  }

  public getSessionId(): string {
    if (!this.sessionId && typeof window !== 'undefined') {
      this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }
    return this.sessionId || `sess_${Date.now()}`
  }

  /**
   * Called when router transitions to a new page
   */
  public trackPageView(path: string, title?: string) {
    if (typeof window === 'undefined') return

    // Record dwell time on previous page before recording new one
    this.recordCurrentPageDwell(false)

    const pageTitle = title || document.title || path
    this.currentPage = {
      url: path,
      title: pageTitle,
      enteredAt: Date.now(),
    }

    if (!this.currentUser) return

    this.queueEvent({
      user_id: this.currentUser.id,
      user_email: this.currentUser.email,
      session_id: this.getSessionId(),
      activity_type: 'page_view',
      page_url: path,
      page_title: pageTitle,
      duration_seconds: 0,
      referrer: document.referrer || 'Direct',
      ...this.getDeviceInfo(),
    })
  }

  /**
   * Record time spent on current page
   */
  private recordCurrentPageDwell(isExiting: boolean = false) {
    if (!this.currentPage || !this.currentUser) return

    const now = Date.now()
    const elapsedMs = now - this.currentPage.enteredAt
    const durationSeconds = Math.max(1, Math.round(elapsedMs / 1000))

    // Only record dwell if stayed at least 1 second
    if (durationSeconds >= 1) {
      this.queueEvent({
        user_id: this.currentUser.id,
        user_email: this.currentUser.email,
        session_id: this.getSessionId(),
        activity_type: 'page_dwell',
        page_url: this.currentPage.url,
        page_title: this.currentPage.title,
        duration_seconds: durationSeconds,
        metadata: {
          isExiting,
          elapsedMs,
        },
        ...this.getDeviceInfo(),
      })
    }
  }

  /**
   * Track asset download (CAD, DWG, 3D, Catalog, etc.)
   */
  public trackDownload(params: {
    fileName: string
    fileType: 'cad_2d' | '3d_model' | 'catalog' | 'spec_sheet' | 'image' | 'press_kit' | 'other'
    productSlug?: string
    productName?: string
  }) {
    if (!this.currentUser) return

    this.queueEvent({
      user_id: this.currentUser.id,
      user_email: this.currentUser.email,
      session_id: this.getSessionId(),
      activity_type: 'download',
      page_url: window.location.pathname,
      page_title: document.title,
      duration_seconds: 0,
      download_file_name: params.fileName,
      download_file_type: params.fileType,
      metadata: {
        productSlug: params.productSlug,
        productName: params.productName,
      },
      ...this.getDeviceInfo(),
    })

    // Immediate flush for download events
    this.flush()
  }

  /**
   * Queue event and schedule batched flush
   */
  private queueEvent(event: ActivityEvent) {
    this.eventQueue.push(event)

    if (!this.flushTimer) {
      this.flushTimer = window.setTimeout(() => {
        this.flushTimer = null
        this.flush()
      }, 4000)
    }
  }

  /**
   * Send queued events to API
   */
  public async flush() {
    if (this.eventQueue.length === 0) return

    const toSend = [...this.eventQueue]
    this.eventQueue = []

    try {
      const endpoint = '/api/analytics/activity'
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toSend),
        keepalive: true,
      })
    } catch {
      // Re-queue on network error up to reasonable limit
      if (this.eventQueue.length < 50) {
        this.eventQueue.unshift(...toSend)
      }
    }
  }

  /**
   * Send remaining events using sendBeacon when page unloads
   */
  private flushBeacon() {
    if (this.eventQueue.length === 0) return
    const toSend = [...this.eventQueue]
    this.eventQueue = []

    try {
      const endpoint = '/api/analytics/activity'
      const payload = JSON.stringify(toSend)
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], {type: 'application/json'})
        navigator.sendBeacon(endpoint, blob)
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Parse device, platform, OS and browser from User-Agent
   */
  private getDeviceInfo(): {platform: string; os: string; browser: string} {
    if (typeof window === 'undefined') {
      return {platform: 'Unknown', os: 'Unknown', browser: 'Unknown'}
    }

    const ua = navigator.userAgent || ''

    // Platform
    let platform = 'Desktop'
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      platform = 'Tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
      platform = 'Mobile'
    }

    // OS
    let os = 'Other'
    if (/windows/i.test(ua)) os = 'Windows'
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
    else if (/android/i.test(ua)) os = 'Android'
    else if (/linux/i.test(ua)) os = 'Linux'

    // Browser
    let browser = 'Other'
    if (/edg/i.test(ua)) browser = 'Edge'
    else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Chrome'
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari'
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
    else if (/opr|opera/i.test(ua)) browser = 'Opera'

    return {platform, os, browser}
  }
}

export const userActivityTracker = new UserActivityTracker()
