import {R2ImageMetadata} from '../../types'

export type MediaItem = {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
}

export interface FullscreenMediaViewerProps {
  items: MediaItem[]
  initialIndex?: number
  onClose: () => void
}
