export interface MediaCropDebugInfo {
  id: string
  componentName?: string
  src: string
  srcMobile?: string
  srcDesktop?: string
  cropDesktop?: {x: number; y: number; width: number; height: number}
  cropMobile?: {x: number; y: number; width: number; height: number}
  naturalWidth?: number
  naturalHeight?: number
  containerWidth?: number
  containerHeight?: number
  isCoverMode: boolean
  useClientCrop: boolean
  activeClientCrop: boolean
  hasMissingCropMobileProp?: boolean
  computedStyle?: {
    scaleXDesk?: string
    scaleYDesk?: string
    leftDesk?: string
    topDesk?: string
    scaleXMob?: string
    scaleYMob?: string
    leftMob?: string
    topMob?: string
    objPosDesk?: string
    objPosMob?: string
  }
}

class MediaCropDebugger {
  private isEnabled: boolean = false
  private showOverlay: boolean = false
  private showVisualOutlines: boolean = false
  private records: Map<string, MediaCropDebugInfo> = new Map()
  private listeners: Set<() => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const hasParam = urlParams.get('debugMedia') === 'true' || urlParams.get('debug') === 'media'
      const isDev = Boolean(import.meta.env.DEV)

      // Canlı (PROD) ortamda URL'de debug parametresi yoksa localStorage verilerini temizle ve varsayılan kapalı tut
      if (!isDev && !hasParam) {
        try {
          localStorage.removeItem('debug_media_crop')
          localStorage.removeItem('debug_media_crop_outlines')
        } catch {
          // ignore storage errors
        }
      }

      const hasStorage = isDev ? localStorage.getItem('debug_media_crop') === 'true' : false
      this.isEnabled = hasParam || hasStorage
      this.showOverlay = this.isEnabled
      this.showVisualOutlines = isDev
        ? localStorage.getItem('debug_media_crop_outlines') === 'true'
        : false
      ;(window as unknown as Record<string, unknown>)['__DEBUG_MEDIA_CROP__'] = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        toggleOverlay: () => this.toggleOverlay(),
        toggleVisualOutlines: () => this.toggleVisualOutlines(),
        getReport: () => this.getReport(),
        logAll: () => this.logAll(),
      }

      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault()
          this.toggleOverlay()
        }
      })
    }
  }

  public enable(): void {
    this.isEnabled = true
    this.showOverlay = true
    localStorage.setItem('debug_media_crop', 'true')
    this.notify()
  }

  public disable(): void {
    this.isEnabled = false
    this.showOverlay = false
    localStorage.setItem('debug_media_crop', 'false')
    this.notify()
  }

  public toggleOverlay(): void {
    this.showOverlay = !this.showOverlay
    this.isEnabled = this.showOverlay
    localStorage.setItem('debug_media_crop', this.showOverlay ? 'true' : 'false')
    this.notify()
  }

  public toggleVisualOutlines(): void {
    this.showVisualOutlines = !this.showVisualOutlines
    localStorage.setItem('debug_media_crop_outlines', this.showVisualOutlines ? 'true' : 'false')
    this.notify()
  }

  public isOverlayActive(): boolean {
    return this.isEnabled && this.showOverlay
  }

  public isVisualOutlinesActive(): boolean {
    return this.showVisualOutlines
  }

  public record(info: MediaCropDebugInfo): void {
    this.records.set(info.id, info)
    this.notify()
  }

  public getReport(): MediaCropDebugInfo[] {
    return Array.from(this.records.values())
  }

  public logAll(): void {
    const list = Array.from(this.records.values())
    if (typeof console !== 'undefined' && console.table) {
      console.table(list)
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    this.listeners.forEach(l => l())
  }
}

export const mediaCropDebugger = new MediaCropDebugger()
