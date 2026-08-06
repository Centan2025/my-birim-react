import {describe, it, expect} from 'vitest'
import {render} from '@testing-library/react'
import {OptimizedImage} from '../components/OptimizedImage'
import {mapR2Metadata} from '../services/sanity/client'

describe('OptimizedImage Mobile Crop & Metadata', () => {
  it('mapR2Metadata parses mobile crop and mobile dimensions correctly', () => {
    const rawImage = {
      imageR2: {
        url: 'https://r2.dev/desktop.jpg',
        width: 1920,
        height: 1080,
        crop: {top: 0.1, bottom: 0.1, left: 0, right: 0},
      },
      cropMobile: {
        x: 0.2,
        y: 0.1,
        width: 0.6,
        height: 0.8,
      },
      widthMobile: 1000,
      heightMobile: 1000,
    }

    const meta = mapR2Metadata(rawImage)
    expect(meta.cropMobile).toEqual({
      x: 0.2,
      y: 0.1,
      width: 0.6,
      height: 0.8,
    })
    expect(meta.origWidthMobile).toBe(1000)
    expect(meta.origHeightMobile).toBe(1000)
  })

  it('renders OptimizedImage with mobile crop without double crop shift', () => {
    const cropDesktop = {x: 0.1, y: 0.1, width: 0.8, height: 0.8}
    const cropMobile = {x: 0.2, y: 0.1, width: 0.5, height: 0.5}

    const {container} = render(
      <OptimizedImage
        src="https://r2.dev/test.jpg"
        alt="Test"
        crop={cropDesktop}
        cropMobile={cropMobile}
        origWidth={1000}
        origHeight={1000}
        origWidthMobile={1000}
        origHeightMobile={1000}
      />
    )

    const cropWrapper = container.querySelector('.responsive-crop-wrapper')
    expect(cropWrapper).toBeInTheDocument()

    const styleAttr = cropWrapper?.getAttribute('style') || ''
    expect(styleAttr).toContain('--crop-scale-x-mobile: 200.0000%')
    expect(styleAttr).toContain('--crop-left-mobile: -40.0000%')
  })

  it('renders uncropped full image on mobile when cropMobile is undefined', () => {
    const cropDesktop = {x: 0, y: 0.3, width: 1.0, height: 0.4}

    const {container} = render(
      <OptimizedImage
        src="https://r2.dev/test.jpg"
        alt="Test"
        crop={cropDesktop}
        origWidth={1000}
        origHeight={1500}
      />
    )

    const cropWrapper = container.querySelector('.responsive-crop-wrapper')
    expect(cropWrapper).toBeInTheDocument()

    const styleAttr = cropWrapper?.getAttribute('style') || ''
    expect(styleAttr).toContain('--crop-scale-x-mobile: 100.0000%')
    expect(styleAttr).toContain('--crop-left-mobile: 0.0000%')
    expect(styleAttr).toContain('--crop-aspect-mobile: 1.6667')
  })

  it('generates uncropped Sanity CDN URL for mobile source when cropMobile is undefined', () => {
    const cropDesktop = {x: 0, y: 0.2, width: 1.0, height: 0.6}
    const sanityUrl = 'https://cdn.sanity.io/images/proj/dataset/abc-1000x800.jpg'

    const {container} = render(
      <OptimizedImage
        src={sanityUrl}
        srcDesktop={sanityUrl}
        srcMobile={sanityUrl}
        alt="Sanity Test"
        crop={cropDesktop}
        cropMobile={null}
        origWidth={1000}
        origHeight={800}
      />
    )

    const mobileSource = container.querySelector('source[media="(max-width: 1023px)"]')
    expect(mobileSource).toBeInTheDocument()
    const mobileSrcSet = mobileSource?.getAttribute('srcset') || ''
    expect(mobileSrcSet).not.toContain('rect=')

    const desktopSource = container.querySelector('source[media="(min-width: 1024px)"]')
    expect(desktopSource).toBeInTheDocument()
    const desktopSrcSet = desktopSource?.getAttribute('srcset') || ''
    expect(desktopSrcSet).toContain('rect=0,160,1000,480')
  })
})
