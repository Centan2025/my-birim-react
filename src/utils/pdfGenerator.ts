import {jsPDF} from 'jspdf'
import type {Product} from '../types'
import {getProductImageProps} from '../types/seckim'

interface GeneratePdfOptions {
  projectName?: string
  projectDescription?: string
  products: Product[]
  date?: string
  designerNamesMap?: Record<string, string>
  categoryNamesMap?: Record<string, string>
}

interface LoadedImageInfo {
  dataUrl: string
  aspect: number // width / height
}

// In-memory cache for fonts and logo so repeated downloads are instant
let cachedRegularFont: string | null = null
let cachedBoldFont: string | null = null
let cachedLogo: {dataUrl: string; aspect: number} | null = null

/**
 * Fetch a TTF font file from local /fonts/ directory and convert to base64 for jsPDF VFS.
 */
async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const len = bytes.byteLength
    const chunkSize = 8192
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len))
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    return window.btoa(binary)
  } catch (err) {
    console.warn('PDF font load notice:', err)
    return null
  }
}

/**
 * Loads the Birim black logo image for white PDF pages.
 */
async function loadLogo(): Promise<{dataUrl: string; aspect: number} | null> {
  if (cachedLogo) return cachedLogo

  return new Promise(resolve => {
    try {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || img.width
          const naturalH = img.naturalHeight || img.height
          const aspect = naturalW / naturalH

          // Target canvas size for high-DPI print clarity without bloating file size (max width 800)
          const targetW = Math.min(800, naturalW)
          const targetH = Math.round(targetW / aspect)

          const canvas = document.createElement('canvas')
          canvas.width = targetW
          canvas.height = targetH
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }
          ctx.drawImage(img, 0, 0, targetW, targetH)
          const dataUrl = canvas.toDataURL('image/png')
          cachedLogo = {dataUrl, aspect}
          resolve(cachedLogo)
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = '/logo-black.png'
    } catch {
      resolve(null)
    }
  })
}

/**
 * Loads a product image from URL, applies crop if defined, and converts to base64 JPEG
 * while preserving its natural aspect ratio to prevent stretching.
 */
async function loadProductImage(imageUrl: string, crop?: any): Promise<LoadedImageInfo | null> {
  if (!imageUrl) return null

  return new Promise(resolve => {
    try {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || img.width
          const naturalH = img.naturalHeight || img.height

          let sx = 0
          let sy = 0
          let sw = naturalW
          let sh = naturalH

          // Check if crop metadata is present (from Sanity / Cloudflare R2)
          if (crop && typeof crop === 'object') {
            let cx = 0
            let cy = 0
            let cw = 1
            let ch = 1

            if (crop.cropX !== undefined || crop.cropWidth !== undefined) {
              cx = Number(crop.cropX) || 0
              cy = Number(crop.cropY) || 0
              cw = Number(crop.cropWidth) || 1
              ch = Number(crop.cropHeight) || 1
            } else if (crop.x !== undefined || crop.width !== undefined) {
              cx = Number(crop.x) || 0
              cy = Number(crop.y) || 0
              cw = Number(crop.width) || 1
              ch = Number(crop.height) || 1
            } else if (
              crop.top !== undefined ||
              crop.left !== undefined ||
              crop.bottom !== undefined ||
              crop.right !== undefined
            ) {
              cx = Number(crop.left) || 0
              cy = Number(crop.top) || 0
              cw = Math.max(0.001, 1 - (Number(crop.left) || 0) - (Number(crop.right) || 0))
              ch = Math.max(0.001, 1 - (Number(crop.top) || 0) - (Number(crop.bottom) || 0))
            }

            if (cw <= 1 && ch <= 1 && (cw < 0.999 || ch < 0.999 || cx > 0.001 || cy > 0.001)) {
              sx = Math.round(cx * naturalW)
              sy = Math.round(cy * naturalH)
              sw = Math.max(1, Math.round(cw * naturalW))
              sh = Math.max(1, Math.round(ch * naturalH))
            }
          }

          // Target canvas (max 800px) for sharp print rendering
          const maxDimension = 800
          const scale = Math.min(1, maxDimension / Math.max(sw, sh))
          const canvasW = Math.max(1, Math.round(sw * scale))
          const canvasH = Math.max(1, Math.round(sh * scale))

          const canvas = document.createElement('canvas')
          canvas.width = canvasW
          canvas.height = canvasH
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }

          // Pure white background for furniture isolation
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvasW, canvasH)
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
          resolve({
            dataUrl,
            aspect: canvasW / canvasH,
          })
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = imageUrl
    } catch {
      resolve(null)
    }
  })
}

export async function generateSeckimPDF({
  projectName = 'PROJE SEÇTİKLERİ',
  projectDescription,
  products,
  date = new Date().toLocaleDateString('tr-TR', {year: 'numeric', month: 'long', day: 'numeric'}),
  designerNamesMap = {},
  categoryNamesMap = {},
}: GeneratePdfOptions): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // 1. Setup Inter Turkish font
  let activeFont = 'helvetica'
  try {
    if (!cachedRegularFont) {
      cachedRegularFont = await loadFontAsBase64('/fonts/Inter-Regular.ttf')
    }
    if (!cachedBoldFont) {
      cachedBoldFont = await loadFontAsBase64('/fonts/Inter-Bold.ttf')
    }

    if (cachedRegularFont) {
      doc.addFileToVFS('Inter-Regular.ttf', cachedRegularFont)
      doc.addFont('Inter-Regular.ttf', 'Inter', 'normal')
      activeFont = 'Inter'
    }
    if (cachedBoldFont) {
      doc.addFileToVFS('Inter-Bold.ttf', cachedBoldFont)
      doc.addFont('Inter-Bold.ttf', 'Inter', 'bold')
    }
  } catch (err) {
    console.warn('Font initialization warning:', err)
  }

  // 2. Pre-load logo and product images concurrently
  const [logoInfo, productImages] = await Promise.all([
    loadLogo(),
    Promise.all(
      products.map(p => {
        const imgProps = getProductImageProps(p)
        return imgProps.src ? loadProductImage(imgProps.src, imgProps.crop) : Promise.resolve(null)
      })
    ),
  ])

  const pageWidth = 210
  const pageHeight = 297
  const margin = 16
  const contentWidth = pageWidth - margin * 2

  let currentPage = 1
  const itemsPerPage = 3 // 3 items per page for generous architectural layout
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage))

  // Render Page Header
  const renderHeader = (pageNumber: number) => {
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Top horizontal divider
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.35)
    doc.line(margin, margin + 14, pageWidth - margin, margin + 14)

    // Brand Logo or Title
    if (logoInfo) {
      const logoH = 5.2
      const logoW = Math.min(48, logoH * logoInfo.aspect)
      try {
        doc.addImage(logoInfo.dataUrl, 'PNG', margin, margin + 2.5, logoW, logoH, undefined, 'FAST')
      } catch {
        doc.setFont(activeFont, 'bold')
        doc.setFontSize(15)
        doc.setTextColor(20, 20, 20)
        doc.text('BİRİM', margin, margin + 7.5)
      }

      doc.setFont(activeFont, 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(130, 130, 130)
      doc.text('|', margin + logoW + 3.5, margin + 6.8)
      doc.text('MİMARİ PROJE SEÇTİKLERİ', margin + logoW + 6.5, margin + 6.8)
    } else {
      doc.setFont(activeFont, 'bold')
      doc.setFontSize(15)
      doc.setTextColor(20, 20, 20)
      doc.text('BİRİM', margin, margin + 7.5)

      doc.setFont(activeFont, 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(130, 130, 130)
      doc.text('MİMARİ PROJE SEÇTİKLERİ', margin + 24, margin + 7)
    }

    // Top right: Date & Total Products
    doc.setFont(activeFont, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(110, 110, 110)
    doc.text(date, pageWidth - margin, margin + 6.8, {align: 'right'})

    // Project Name & Summary on Page 1
    if (pageNumber === 1) {
      doc.setFont(activeFont, 'bold')
      doc.setFontSize(16)
      doc.setTextColor(15, 15, 15)
      const projectTitle = projectName.toLocaleUpperCase('tr-TR')
      doc.text(projectTitle, margin, margin + 25)

      let currentHeaderY = margin + 31

      if (projectDescription) {
        doc.setFont(activeFont, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(90, 90, 90)
        const descLines = doc.splitTextToSize(projectDescription, contentWidth)
        doc.text(descLines, margin, currentHeaderY)
        currentHeaderY += descLines.length * 4.5 + 1.5
      }

      doc.setFont(activeFont, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(130, 130, 130)
      doc.text(`Toplam ${products.length} Ürün`, margin, currentHeaderY)
    }
  }

  // Render Page Footer
  const renderFooter = (pageNumber: number, total: number) => {
    doc.setDrawColor(225, 225, 225)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    doc.setFont(activeFont, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(140, 140, 140)
    doc.text('Birim Mobilya • www.birim.com • info@birim.com', margin, pageHeight - 7.5)
    doc.text(`${pageNumber} / ${total}`, pageWidth - margin, pageHeight - 7.5, {align: 'right'})
  }

  // Initial page 1 render
  renderHeader(1)

  // Calculate starting Y for products on Page 1
  let yOffset = margin + 38
  if (projectDescription) {
    const descLines = doc.splitTextToSize(projectDescription, contentWidth)
    yOffset = margin + 31 + descLines.length * 4.5 + 8
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const imgInfo = productImages[i]

    // Check if new page is needed
    const itemIndexOnPage = i % itemsPerPage
    if (i > 0 && itemIndexOnPage === 0) {
      renderFooter(currentPage, totalPages)
      doc.addPage()
      currentPage++
      renderHeader(currentPage)
      yOffset = margin + 22
    }

    const cardHeight = 68
    const cardY = yOffset

    // Border surrounding product row
    doc.setDrawColor(235, 235, 235)
    doc.setFillColor(252, 252, 252)
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 1.5, 1.5, 'FD')

    // Image container box (56mm x 56mm square)
    const imgBoxSize = 56
    const imgBoxX = margin + 6
    const imgBoxY = cardY + 6

    doc.setFillColor(246, 246, 246)
    doc.roundedRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 1, 1, 'F')

    // Render Product Image with Aspect Ratio Preservation (No stretching!)
    if (imgInfo) {
      try {
        const padding = 2
        const maxW = imgBoxSize - padding * 2
        const maxH = imgBoxSize - padding * 2

        let renderW = maxW
        let renderH = maxH

        if (imgInfo.aspect > 1) {
          // Wider than tall (sofa, desk, bed)
          renderH = renderW / imgInfo.aspect
          if (renderH > maxH) {
            renderH = maxH
            renderW = renderH * imgInfo.aspect
          }
        } else {
          // Taller than wide (chair, lamp, bookshelf) or square
          renderW = renderH * imgInfo.aspect
          if (renderW > maxW) {
            renderW = maxW
            renderH = renderW / imgInfo.aspect
          }
        }

        // Center inside the image box
        const posX = imgBoxX + (imgBoxSize - renderW) / 2
        const posY = imgBoxY + (imgBoxSize - renderH) / 2

        doc.addImage(imgInfo.dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST')
      } catch (e) {
        console.warn('PDF image render notice:', e)
      }
    } else {
      doc.setFont(activeFont, 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(170, 170, 170)
      doc.text('Görsel Yok', imgBoxX + imgBoxSize / 2, imgBoxY + imgBoxSize / 2, {align: 'center'})
    }

    // Product Information Section
    const infoX = imgBoxX + imgBoxSize + 10
    const infoMaxWidth = contentWidth - imgBoxSize - 20
    let textY = cardY + 12

    if (!product) continue

    // 1. Product Name (Turkish uppercase)
    let rawName = ''
    if (typeof product.name === 'string') {
      rawName = product.name
    } else if (product.name && typeof product.name === 'object') {
      rawName =
        (product.name as Record<string, string>)['tr'] ||
        (product.name as Record<string, string>)['en'] ||
        ''
    }
    const localizedTitle = rawName.toLocaleUpperCase('tr-TR')

    doc.setFont(activeFont, 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(20, 20, 20)

    const titleLines = doc.splitTextToSize(localizedTitle, infoMaxWidth)
    doc.text(titleLines, infoX, textY)
    textY += titleLines.length * 5.5 + 1.5

    // 2. Category & Year
    doc.setFont(activeFont, 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 100, 100)

    const prodRecord = product as unknown as Record<string, unknown>
    const categoryTitle =
      categoryNamesMap[product.categoryId] ||
      (prodRecord['category'] ? String(prodRecord['category']) : '')

    const catYearParts = [categoryTitle, product.year ? String(product.year) : ''].filter(Boolean)
    if (catYearParts.length > 0) {
      doc.text(catYearParts.join(' • '), infoX, textY)
      textY += 5.5
    }

    // 3. Designer
    const designer = designerNamesMap[product.designerId || ''] || ''
    if (designer) {
      doc.setFont(activeFont, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Tasarımcı: ${designer}`, infoX, textY)
      textY += 5
    }

    // 4. Dimensions (G x D x Y)
    const productDims = prodRecord['dimensions'] as
      | {width?: number; depth?: number; height?: number}
      | undefined

    if (productDims) {
      const dimParts = [
        productDims.width ? `G: ${productDims.width} cm` : '',
        productDims.depth ? `D: ${productDims.depth} cm` : '',
        productDims.height ? `Y: ${productDims.height} cm` : '',
      ].filter(Boolean)

      if (dimParts.length > 0) {
        doc.setFont(activeFont, 'normal')
        doc.setFontSize(8)
        doc.setTextColor(70, 70, 70)
        doc.text(`Ölçüler: ${dimParts.join('   ')}`, infoX, textY)
        textY += 5.5
      }
    }

    // 5. Product Code (SKU)
    doc.setFont(activeFont, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 150)
    const code =
      (product as any).sku || `BIRIM-${product.id.slice(0, 8).toLocaleUpperCase('tr-TR')}`
    doc.text(`Ürün Kodu: ${code}`, infoX, textY)

    yOffset += cardHeight + 7
  }

  // Footer for last page
  renderFooter(currentPage, totalPages)

  return doc.output('blob')
}
