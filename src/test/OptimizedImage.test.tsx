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

  it('activates client crop on mobile when only cropMobile is cropped and desktop is full frame', () => {
    const cropDesktop = {x: 0, y: 0, width: 1.0, height: 1.0}
    const cropMobile = {x: 0.2891, y: 0, width: 0.4234, height: 1.0}
    const hotspotMobile = {x: 0.3952, y: 0.5006}

    const {container} = render(
      <OptimizedImage
        src="https://r2.dev/test.jpg"
        alt="Mobile Crop Test"
        crop={cropDesktop}
        cropMobile={cropMobile}
        hotspot={{x: 0.5, y: 0.5}}
        hotspotMobile={hotspotMobile}
        origWidth={2432}
        origHeight={1368}
        origWidthMobile={2432}
        origHeightMobile={1368}
      />
    )

    const cropWrapper = container.querySelector('.responsive-crop-wrapper')
    expect(cropWrapper).toBeInTheDocument()

    const styleAttr = cropWrapper?.getAttribute('style') || ''
    expect(styleAttr).toContain('--obj-pos-mobile: 39.52% 50.06%')
    expect(styleAttr).toContain('--crop-scale-x-mobile: 236.1833%')
    expect(styleAttr).toContain('--crop-left-mobile: -68.2806%')
  })

  it('adds is-portrait-crop-mobile and has-mobile-crop for portrait mobile crops (like Tau Büfe & Flux Büfe)', () => {
    // Tau Büfe: cropX=0.363, cropY=0, cropWidth=0.265, cropHeight=1.0, dims=2432x1368 -> aspectMob = 0.470
    const cropMobileTau = {x: 0.363, y: 0, width: 0.265, height: 1.0}

    const {container} = render(
      <OptimizedImage
        src="https://r2.dev/tau.jpg"
        alt="Tau Büfe"
        cropMobile={cropMobileTau}
        origWidth={2432}
        origHeight={1368}
        origWidthMobile={2432}
        origHeightMobile={1368}
        fitAuto={true}
        className="w-full h-full transform transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
      />
    )

    const cropWrapper = container.querySelector('.responsive-crop-wrapper')
    expect(cropWrapper).toBeInTheDocument()
    expect(cropWrapper).toHaveClass('is-portrait-crop-mobile')
    expect(cropWrapper).toHaveClass('has-mobile-crop')

    const styleAttr = cropWrapper?.getAttribute('style') || ''
    expect(styleAttr).toContain('--crop-aspect-mobile: 0.4711')
    expect(styleAttr).toContain('--crop-scale-x-mobile: 377.3585%')
    expect(styleAttr).toContain('--crop-left-mobile: -136.9811%')
  })

  it('renders Tayra (tk0251-tayra) mobile crop with correct portrait scaling', () => {
    // Tayra in Sanity: cropX=0.306, cropY=0, cropWidth=0.3897, cropHeight=1.0, dims=6042x3402 -> aspectMob = 0.6921
    const cropMobileTayra = {x: 0.306, y: 0, width: 0.3897, height: 1.0}

    const {container} = render(
      <OptimizedImage
        src="https://birim-assets.web-birim.workers.dev/migration/products/tk0251-tayra/1785758162137-tayra-katalog-site1.webp"
        srcMobile="https://birim-assets.web-birim.workers.dev/migration/products/tk0251-tayra/1786364424281-1785758162137-tayra-katalog-site1.webp"
        alt="Tayra"
        cropMobile={cropMobileTayra}
        origWidth={6042}
        origHeight={3402}
        origWidthMobile={6042}
        origHeightMobile={3402}
        fitAuto={true}
        className="w-full h-full transform transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
      />
    )

    const cropWrapper = container.querySelector('.responsive-crop-wrapper')
    expect(cropWrapper).toBeInTheDocument()
    expect(cropWrapper).toHaveClass('is-portrait-crop-mobile')
    expect(cropWrapper).toHaveClass('has-mobile-crop')

    const styleAttr = cropWrapper?.getAttribute('style') || ''
    expect(styleAttr).toContain('--crop-aspect-mobile: 0.6921')
    expect(styleAttr).toContain('--crop-scale-x-mobile: 256.6076%')
    expect(styleAttr).toContain('--crop-left-mobile: -78.5219%')
  })
})
