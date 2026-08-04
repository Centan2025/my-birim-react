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
      const hasStorage = localStorage.getItem('debug_media_crop') === 'true'
      this.isEnabled = hasParam || hasStorage
      this.showOverlay = this.isEnabled
      this.showVisualOutlines = localStorage.getItem('debug_media_crop_outlines') === 'true'
      ;(window as unknown as Record<string, unknown>)['__DEBUG_MEDIA_CROP__'] = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        toggleOverlay: () => this.toggleOverlay(),
        toggleVisualOutlines: () => this.toggleVisualOutlines(),
        getReport: () => this.getReport(),
        logAll: () => this.logAll(),
      }

      window.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault()
          this.toggleOverlay()
        }
      })
    }
  }

  public enable() {
    this.isEnabled = true
    this.showOverlay = true
    localStorage.setItem('debug_media_crop', 'true')
    console.log(
      '🔍 [MediaCropDebugger] Aktifleştirildi (Ctrl+Shift+D ile overlay açılıp kapatılabilir).'
    )
    this.notify()
  }

  public disable() {
    this.isEnabled = false
    this.showOverlay = false
    localStorage.setItem('debug_media_crop', 'false')
    console.log('🚫 [MediaCropDebugger] Deaktife edildi.')
    this.notify()
  }

  public toggleOverlay() {
    this.showOverlay = !this.showOverlay
    this.isEnabled = this.showOverlay
    localStorage.setItem('debug_media_crop', this.showOverlay ? 'true' : 'false')
    this.notify()
  }

  public toggleVisualOutlines() {
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

  public record(info: MediaCropDebugInfo) {
    this.records.set(info.id, info)

    if (this.isEnabled) {
      const screenType = window.innerWidth <= 1023 ? '📱 MOBİL (<1023px)' : '💻 DESKTOP (>=1024px)'
      console.groupCollapsed(
        `🖼️ [MediaCrop] ${info.componentName || 'OptimizedImage'} (${screenType}) - ${info.id.substring(0, 8)}`
      )
      console.log('🔗 URL (Src):', info.src)
      if (info.srcMobile) console.log('📱 URL (Mobile):', info.srcMobile)
      if (info.srcDesktop) console.log('💻 URL (Desktop):', info.srcDesktop)
      console.log('📐 Masaüstü Crop:', info.cropDesktop || 'YOK (Tam Görsel)')
      console.log('📐 Mobil Crop:', info.cropMobile || 'YOK (Masaüstü/Tam Görsel)')
      console.log('⚙️ Mod:', {
        isCoverMode: info.isCoverMode,
        useClientCrop: info.useClientCrop,
        activeClientCrop: info.activeClientCrop,
      })
      if (info.computedStyle) {
        console.table(info.computedStyle)
      }
      console.groupEnd()
    }
    this.notify()
  }

  public getReport(): MediaCropDebugInfo[] {
    return Array.from(this.records.values())
  }

  public logAll() {
    console.table(
      Array.from(this.records.values()).map(r => ({
        Bileşen: r.componentName || 'OptimizedImage',
        Src: r.src.substring(0, 40) + '...',
        MobilSrc: r.srcMobile ? 'EVET' : 'HAYIR',
        DesktopCrop: r.cropDesktop
          ? `${r.cropDesktop.width.toFixed(2)}x${r.cropDesktop.height.toFixed(2)}`
          : 'YOK',
        MobileCrop: r.cropMobile
          ? `${r.cropMobile.width.toFixed(2)}x${r.cropMobile.height.toFixed(2)}`
          : 'YOK',
        CoverModu: r.isCoverMode ? 'EVET' : 'HAYIR',
        ActiveCrop: r.activeClientCrop ? 'AKTİF' : 'PASİF',
      }))
    )
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(l => l())
  }
}

export const mediaCropDebugger = new MediaCropDebugger()
