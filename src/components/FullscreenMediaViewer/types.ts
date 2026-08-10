import {R2ImageMetadata} from '../../types'

export type MediaItem = {
  type: 'image' | 'video' | 'youtube'
  url: string
  urlMobile?: string
  urlDesktop?: string
  crop?: R2ImageMetadata['crop']
  cropMobile?: R2ImageMetadata['crop']
  cropDesktop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  hotspotMobile?: R2ImageMetadata['hotspot']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  origWidthMobile?: number
  origHeightMobile?: number
  origWidthDesktop?: number
  origHeightDesktop?: number
  isMirrored?: boolean
  isMirroredMobile?: boolean
  isMirroredDesktop?: boolean
}

export interface FullscreenMediaViewerProps {
  items: MediaItem[]
  initialIndex?: number
  onClose: () => void
}
