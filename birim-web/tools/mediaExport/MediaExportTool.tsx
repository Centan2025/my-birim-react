import React, {useState, useCallback, useRef} from 'react'
import {
  Card,
  Stack,
  Text,
  Heading,
  Button,
  Box,
  Flex,
  Grid,
  Badge,
  Checkbox,
  Spinner,
  useToast,
} from '@sanity/ui'
import {
  DownloadIcon,
  FolderIcon,
  CheckmarkIcon,
  WarningOutlineIcon,
  RefreshIcon,
  CloseIcon,
} from '@sanity/icons'
import {useClient} from 'sanity'
import JSZip from 'jszip'

// Dosya adlarında geçersiz karakterleri temizleyen yardımcı fonksiyon
function sanitizeName(name: string): string {
  if (!name) return 'adsiz'
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    .trim()
}

// Slug / model adından dosya ön eki üreten yardımcı
function slugify(text: string): string {
  if (!text) return 'medya'
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '') || 'medya'
  )
}

// URL ve MIME tipine göre dosya uzantısını bulan yardımcı
function getExtension(url: string, mimeType?: string): string {
  if (url) {
    const cleanUrl = url.split('?')[0].split('#')[0]
    const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]{2,5})$/)
    if (extMatch && extMatch[1]) {
      return `.${extMatch[1].toLowerCase()}`
    }
  }
  if (mimeType) {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/avif': '.avif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
      'application/zip': '.zip',
    }
    if (map[mimeType.toLowerCase()]) {
      return map[mimeType.toLowerCase()]
    }
  }
  return '.webp'
}

// İndirilen ikili verinin (Blob) gerçek dosya biçimini magic byte'lardan tespit eden yardımcı
async function detectBlobExtension(blob: Blob): Promise<string> {
  try {
    const slice = blob.slice(0, 16)
    const buf = new Uint8Array(await slice.arrayBuffer())

    // JPEG: FF D8 FF
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return '.jpg'
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    ) {
      return '.png'
    }
    // GIF: 47 49 46 38
    if (
      buf.length >= 4 &&
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38
    ) {
      return '.gif'
    }
    // WebP: RIFF....WEBP
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return '.webp'
    }
    // AVIF / MP4: ....ftyp
    if (buf.length >= 12) {
      const brand = String.fromCharCode(...buf.slice(4, 12))
      if (brand.includes('ftypavif') || brand.includes('ftypavis')) {
        return '.avif'
      }
      if (brand.includes('ftyp')) {
        return '.mp4'
      }
    }
    // WebM: 1A 45 DF A3
    if (
      buf.length >= 4 &&
      buf[0] === 0x1a &&
      buf[1] === 0x45 &&
      buf[2] === 0xdf &&
      buf[3] === 0xa3
    ) {
      return '.webm'
    }
    // PDF: %PDF (25 50 44 46)
    if (
      buf.length >= 4 &&
      buf[0] === 0x25 &&
      buf[1] === 0x50 &&
      buf[2] === 0x44 &&
      buf[3] === 0x46
    ) {
      return '.pdf'
    }
    // ZIP: PK (50 4B 03 04)
    if (
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      buf[2] === 0x03 &&
      buf[3] === 0x04
    ) {
      return '.zip'
    }
  } catch (e) {
    console.warn('detectBlobExtension hatası:', e)
  }

  // Fallback: blob.type
  if (blob.type) {
    const t = blob.type.toLowerCase()
    if (t.includes('jpeg') || t.includes('jpg')) return '.jpg'
    if (t.includes('png')) return '.png'
    if (t.includes('webp')) return '.webp'
    if (t.includes('gif')) return '.gif'
    if (t.includes('avif')) return '.avif'
    if (t.includes('mp4')) return '.mp4'
    if (t.includes('webm')) return '.webm'
    if (t.includes('pdf')) return '.pdf'
  }

  return ''
}

interface ExportItem {
  url: string
  folderPath: string[] // örn: ['ürünler', '01 - KANEPELER', 'SU']
  fileName: string // örn: 'su_kapak.webp'
  mimeType?: string
}

interface ScanSummary {
  totalFiles: number
  productsCount: number
  designersCount: number
  projectsCount: number
  categoriesCount: number
  materialsCount: number
  newsCount: number
}

interface ExportScope {
  products: boolean
  designers: boolean
  projects: boolean
  categories: boolean
  materials: boolean
  news: boolean
}

export default function MediaExportTool() {
  const client = useClient({apiVersion: '2025-01-01'})
  const toast = useToast()

  const [scope, setScope] = useState<ExportScope>({
    products: true,
    designers: true,
    projects: true,
    categories: true,
    materials: true,
    news: false,
  })

  const [isScanning, setIsScanning] = useState(false)
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null)
  const [plannedItems, setPlannedItems] = useState<ExportItem[]>([])
  const [failedItems, setFailedItems] = useState<ExportItem[]>([])

  const [isExporting, setIsExporting] = useState(false)
  const [exportMethod, setExportMethod] = useState<'zip' | 'directory' | null>(null)
  const [progress, setProgress] = useState({current: 0, total: 0, currentFile: ''})
  const [logs, setLogs] = useState<Array<{type: 'info' | 'success' | 'error'; message: string}>>([])

  const cancelRef = useRef(false)

  const handleToggleScope = (key: keyof ExportScope) => {
    setScope((prev) => ({...prev, [key]: !prev[key]}))
    setScanSummary(null)
    setPlannedItems([])
    setFailedItems([])
  }

  // Sanity Studio veritabanını tarayarak tüm medya dosyalarını haritalar
  const handleScan = useCallback(async () => {
    setIsScanning(true)
    setScanSummary(null)
    setPlannedItems([])
    setFailedItems([])
    setLogs([])

    try {
      const items: ExportItem[] = []
      let productsCount = 0
      let designersCount = 0
      let projectsCount = 0
      let categoriesCount = 0
      let materialsCount = 0
      let newsCount = 0

      // 1. Kategoriler (Categories)
      if (scope.categories || scope.products) {
        const categories = await client.fetch<
          Array<{
            _id: string
            name?: {tr?: string; en?: string}
            sortOrder?: number
            heroImageR2?: {url?: string; mimeType?: string}
            menuImageR2?: {url?: string; mimeType?: string}
          }>
        >(`*[_type == "category"] | order(sortOrder asc, name.tr asc) {
          _id,
          name,
          sortOrder,
          heroImageR2,
          menuImageR2
        }`)

        const categoryMap = new Map<string, string>()
        categories.forEach((cat, idx) => {
          const rawName = cat.name?.tr || cat.name?.en || 'Diger'
          const prefix = cat.sortOrder
            ? `${String(cat.sortOrder).padStart(2, '0')} - `
            : `${String(idx + 1).padStart(2, '0')} - `
          const folderName = sanitizeName(`${prefix}${rawName}`)
          categoryMap.set(cat._id, folderName)

          if (scope.categories) {
            if (cat.heroImageR2?.url) {
              items.push({
                url: cat.heroImageR2.url,
                folderPath: ['kategoriler', folderName],
                fileName: `hero${getExtension(cat.heroImageR2.url, cat.heroImageR2.mimeType)}`,
                mimeType: cat.heroImageR2.mimeType,
              })
            }
            if (cat.menuImageR2?.url) {
              items.push({
                url: cat.menuImageR2.url,
                folderPath: ['kategoriler', folderName],
                fileName: `menu${getExtension(cat.menuImageR2.url, cat.menuImageR2.mimeType)}`,
                mimeType: cat.menuImageR2.mimeType,
              })
            }
            categoriesCount++
          }
        })

        // 2. Ürünler (Products)
        if (scope.products) {
          const products = await client.fetch<
            Array<{
              _id: string
              name?: {tr?: string; en?: string}
              sku?: string
              category?: {_ref: string}
              sortOrder?: number
              media?: Array<{
                type?: string
                isCover?: boolean
                imageR2?: {url?: string; mimeType?: string}
                imageMobileR2?: {url?: string; mimeType?: string}
                imageDesktopR2?: {url?: string; mimeType?: string}
                videoFileR2?: {url?: string; mimeType?: string}
                videoFileMobileR2?: {url?: string; mimeType?: string}
                videoFileDesktopR2?: {url?: string; mimeType?: string}
              }>
              dimensionImages?: Array<{
                imageR2?: {url?: string; mimeType?: string}
                imageMobileR2?: {url?: string; mimeType?: string}
                imageDesktopR2?: {url?: string; mimeType?: string}
              }>
              bottomMedia?: Array<{
                type?: string
                imageR2?: {url?: string; mimeType?: string}
                imageMobileR2?: {url?: string; mimeType?: string}
                imageDesktopR2?: {url?: string; mimeType?: string}
                videoFileR2?: {url?: string; mimeType?: string}
                videoFileMobileR2?: {url?: string; mimeType?: string}
                videoFileDesktopR2?: {url?: string; mimeType?: string}
              }>
              exclusiveContent?: {
                images?: Array<{url?: string; mimeType?: string}>
                files?: Array<{
                  name?: {tr?: string; en?: string}
                  fileR2?: {url?: string; mimeType?: string}
                }>
              }
            }>
          >(`*[_type == "product"] | order(sortOrder asc, name.tr asc) {
            _id,
            name,
            sku,
            category,
            sortOrder,
            media,
            dimensionImages,
            bottomMedia,
            exclusiveContent
          }`)

          products.forEach((prod) => {
            const catFolder = prod.category?._ref
              ? categoryMap.get(prod.category._ref) || 'GENEL'
              : 'GENEL'
            const rawModelName = prod.name?.tr || prod.name?.en || 'Urun'
            const modelCode = prod.sku ? `${prod.sku} - ` : ''
            const productFolder = sanitizeName(`${modelCode}${rawModelName}`)
            const modelSlug = slugify(rawModelName)

            const prodBasePath = ['ürünler', catFolder, productFolder]
            productsCount++

            // Medya (Kapak ve Alternatif)
            let altCounter = 1
            prod.media?.forEach((m) => {
              const isCover = !!m.isCover
              const prefix = isCover ? `${modelSlug}_kapak` : `${modelSlug}_${altCounter++}`

              // Image
              if (m.imageR2?.url) {
                items.push({
                  url: m.imageR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}${getExtension(m.imageR2.url, m.imageR2.mimeType)}`,
                  mimeType: m.imageR2.mimeType,
                })
              }
              if (m.imageMobileR2?.url) {
                items.push({
                  url: m.imageMobileR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_mobil${getExtension(m.imageMobileR2.url, m.imageMobileR2.mimeType)}`,
                  mimeType: m.imageMobileR2.mimeType,
                })
              }
              if (m.imageDesktopR2?.url) {
                items.push({
                  url: m.imageDesktopR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_desktop${getExtension(m.imageDesktopR2.url, m.imageDesktopR2.mimeType)}`,
                  mimeType: m.imageDesktopR2.mimeType,
                })
              }

              // Video
              if (m.videoFileR2?.url) {
                items.push({
                  url: m.videoFileR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}${getExtension(m.videoFileR2.url, m.videoFileR2.mimeType)}`,
                  mimeType: m.videoFileR2.mimeType,
                })
              }
              if (m.videoFileMobileR2?.url) {
                items.push({
                  url: m.videoFileMobileR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_mobil${getExtension(m.videoFileMobileR2.url, m.videoFileMobileR2.mimeType)}`,
                  mimeType: m.videoFileMobileR2.mimeType,
                })
              }
              if (m.videoFileDesktopR2?.url) {
                items.push({
                  url: m.videoFileDesktopR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_desktop${getExtension(m.videoFileDesktopR2.url, m.videoFileDesktopR2.mimeType)}`,
                  mimeType: m.videoFileDesktopR2.mimeType,
                })
              }
            })

            // Ölçü Görselleri (ÖLÇÜLER/)
            prod.dimensionImages?.forEach((dim, idx) => {
              const dimIdx = idx + 1
              const dimPath = [...prodBasePath, 'ÖLÇÜLER']
              if (dim.imageR2?.url) {
                items.push({
                  url: dim.imageR2.url,
                  folderPath: dimPath,
                  fileName: `olcu_${dimIdx}${getExtension(dim.imageR2.url, dim.imageR2.mimeType)}`,
                  mimeType: dim.imageR2.mimeType,
                })
              }
              if (dim.imageMobileR2?.url) {
                items.push({
                  url: dim.imageMobileR2.url,
                  folderPath: dimPath,
                  fileName: `olcu_${dimIdx}_mobil${getExtension(dim.imageMobileR2.url, dim.imageMobileR2.mimeType)}`,
                  mimeType: dim.imageMobileR2.mimeType,
                })
              }
              if (dim.imageDesktopR2?.url) {
                items.push({
                  url: dim.imageDesktopR2.url,
                  folderPath: dimPath,
                  fileName: `olcu_${dimIdx}_desktop${getExtension(dim.imageDesktopR2.url, dim.imageDesktopR2.mimeType)}`,
                  mimeType: dim.imageDesktopR2.mimeType,
                })
              }
            })

            // Alt Medya Panelleri
            prod.bottomMedia?.forEach((panel, idx) => {
              const panelIdx = idx + 1
              const prefix = `${modelSlug}_panel_${panelIdx}`
              if (panel.imageR2?.url) {
                items.push({
                  url: panel.imageR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}${getExtension(panel.imageR2.url, panel.imageR2.mimeType)}`,
                  mimeType: panel.imageR2.mimeType,
                })
              }
              if (panel.imageMobileR2?.url) {
                items.push({
                  url: panel.imageMobileR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_mobil${getExtension(panel.imageMobileR2.url, panel.imageMobileR2.mimeType)}`,
                  mimeType: panel.imageMobileR2.mimeType,
                })
              }
              if (panel.imageDesktopR2?.url) {
                items.push({
                  url: panel.imageDesktopR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}_desktop${getExtension(panel.imageDesktopR2.url, panel.imageDesktopR2.mimeType)}`,
                  mimeType: panel.imageDesktopR2.mimeType,
                })
              }
              if (panel.videoFileR2?.url) {
                items.push({
                  url: panel.videoFileR2.url,
                  folderPath: prodBasePath,
                  fileName: `${prefix}${getExtension(panel.videoFileR2.url, panel.videoFileR2.mimeType)}`,
                  mimeType: panel.videoFileR2.mimeType,
                })
              }
            })

            // Ek Görseller
            prod.exclusiveContent?.images?.forEach((img, idx) => {
              if (img.url) {
                items.push({
                  url: img.url,
                  folderPath: [...prodBasePath, 'EK_GORSELLER'],
                  fileName: `${modelSlug}_ek_${idx + 1}${getExtension(img.url, img.mimeType)}`,
                  mimeType: img.mimeType,
                })
              }
            })

            // İndirilebilir Dosyalar
            prod.exclusiveContent?.files?.forEach((f, idx) => {
              if (f.fileR2?.url) {
                const rawFileName = f.name?.tr || f.name?.en || `dosya_${idx + 1}`
                items.push({
                  url: f.fileR2.url,
                  folderPath: [...prodBasePath, 'DOSYALAR'],
                  fileName: `${sanitizeName(rawFileName)}${getExtension(f.fileR2.url, f.fileR2.mimeType)}`,
                  mimeType: f.fileR2.mimeType,
                })
              }
            })
          })
        }
      }

      // 3. Tasarımcılar (Designers)
      if (scope.designers) {
        const designers = await client.fetch<
          Array<{
            name?: {tr?: string; en?: string}
            imageR2?: {url?: string; mimeType?: string}
            imageMobileR2?: {url?: string; mimeType?: string}
            imageDesktopR2?: {url?: string; mimeType?: string}
          }>
        >(`*[_type == "designer"] | order(name.tr asc) {
          name,
          imageR2,
          imageMobileR2,
          imageDesktopR2
        }`)

        designers.forEach((des) => {
          const designerName = sanitizeName(des.name?.tr || des.name?.en || 'Tasarimci')
          const basePath = ['tasarımcılar', designerName]
          designersCount++

          if (des.imageR2?.url) {
            items.push({
              url: des.imageR2.url,
              folderPath: basePath,
              fileName: `profil${getExtension(des.imageR2.url, des.imageR2.mimeType)}`,
              mimeType: des.imageR2.mimeType,
            })
          }
          if (des.imageMobileR2?.url) {
            items.push({
              url: des.imageMobileR2.url,
              folderPath: basePath,
              fileName: `profil_mobil${getExtension(des.imageMobileR2.url, des.imageMobileR2.mimeType)}`,
              mimeType: des.imageMobileR2.mimeType,
            })
          }
          if (des.imageDesktopR2?.url) {
            items.push({
              url: des.imageDesktopR2.url,
              folderPath: basePath,
              fileName: `profil_desktop${getExtension(des.imageDesktopR2.url, des.imageDesktopR2.mimeType)}`,
              mimeType: des.imageDesktopR2.mimeType,
            })
          }
        })
      }

      // 4. Projeler (Projects)
      if (scope.projects) {
        const projects = await client.fetch<
          Array<{
            title?: {tr?: string; en?: string}
            media?: Array<{
              isCover?: boolean
              imageR2?: {url?: string; mimeType?: string}
              imageMobileR2?: {url?: string; mimeType?: string}
              imageDesktopR2?: {url?: string; mimeType?: string}
              videoFileR2?: {url?: string; mimeType?: string}
              videoFileMobileR2?: {url?: string; mimeType?: string}
              videoFileDesktopR2?: {url?: string; mimeType?: string}
            }>
          }>
        >(`*[_type == "project"] | order(sortOrder asc, title.tr asc) {
          title,
          media
        }`)

        projects.forEach((proj) => {
          const projectName = sanitizeName(proj.title?.tr || proj.title?.en || 'Proje')
          const basePath = ['projeler', projectName]
          projectsCount++

          let mediaCounter = 1
          proj.media?.forEach((m) => {
            const isCover = !!m.isCover
            const prefix = isCover ? 'proje_kapak' : `proje_${mediaCounter++}`

            if (m.imageR2?.url) {
              items.push({
                url: m.imageR2.url,
                folderPath: basePath,
                fileName: `${prefix}${getExtension(m.imageR2.url, m.imageR2.mimeType)}`,
                mimeType: m.imageR2.mimeType,
              })
            }
            if (m.imageMobileR2?.url) {
              items.push({
                url: m.imageMobileR2.url,
                folderPath: basePath,
                fileName: `${prefix}_mobil${getExtension(m.imageMobileR2.url, m.imageMobileR2.mimeType)}`,
                mimeType: m.imageMobileR2.mimeType,
              })
            }
            if (m.imageDesktopR2?.url) {
              items.push({
                url: m.imageDesktopR2.url,
                folderPath: basePath,
                fileName: `${prefix}_desktop${getExtension(m.imageDesktopR2.url, m.imageDesktopR2.mimeType)}`,
                mimeType: m.imageDesktopR2.mimeType,
              })
            }
            if (m.videoFileR2?.url) {
              items.push({
                url: m.videoFileR2.url,
                folderPath: basePath,
                fileName: `${prefix}${getExtension(m.videoFileR2.url, m.videoFileR2.mimeType)}`,
                mimeType: m.videoFileR2.mimeType,
              })
            }
          })
        })
      }

      // 5. Malzemeler (Materials & Swatch Books)
      if (scope.materials) {
        const materialGroups = await client.fetch<
          Array<{
            title?: {tr?: string; en?: string}
            books?: Array<{
              title?: {tr?: string; en?: string}
              items?: Array<{
                name?: {tr?: string; en?: string}
                imageR2?: {url?: string; mimeType?: string}
              }>
            }>
          }>
        >(`*[_type == "materialGroup"] {
          title,
          books
        }`)

        materialGroups.forEach((grp) => {
          const groupTitle = sanitizeName(grp.title?.tr || grp.title?.en || 'Grup')
          materialsCount++

          grp.books?.forEach((book) => {
            const bookTitle = sanitizeName(book.title?.tr || book.title?.en || 'Kartela')
            const basePath = ['malzemeler', groupTitle, bookTitle]

            book.items?.forEach((item, idx) => {
              if (item.imageR2?.url) {
                const itemName = sanitizeName(
                  item.name?.tr || item.name?.en || `malzeme_${idx + 1}`,
                )
                items.push({
                  url: item.imageR2.url,
                  folderPath: basePath,
                  fileName: `${itemName}${getExtension(item.imageR2.url, item.imageR2.mimeType)}`,
                  mimeType: item.imageR2.mimeType,
                })
              }
            })
          })
        })
      }

      // 6. Haberler (News) (Opsiyonel)
      if (scope.news) {
        const newsItems = await client.fetch<
          Array<{
            title?: {tr?: string; en?: string}
            mainImageR2?: {url?: string; mimeType?: string}
            mainImageMobileR2?: {url?: string; mimeType?: string}
            mainImageDesktopR2?: {url?: string; mimeType?: string}
          }>
        >(`*[_type == "newsItem"] {
          title,
          mainImageR2,
          mainImageMobileR2,
          mainImageDesktopR2
        }`)

        newsItems.forEach((n) => {
          const newsTitle = sanitizeName(n.title?.tr || n.title?.en || 'Haber')
          const basePath = ['haberler', newsTitle]
          newsCount++

          if (n.mainImageR2?.url) {
            items.push({
              url: n.mainImageR2.url,
              folderPath: basePath,
              fileName: `kapak${getExtension(n.mainImageR2.url, n.mainImageR2.mimeType)}`,
              mimeType: n.mainImageR2.mimeType,
            })
          }
          if (n.mainImageMobileR2?.url) {
            items.push({
              url: n.mainImageMobileR2.url,
              folderPath: basePath,
              fileName: `kapak_mobil${getExtension(n.mainImageMobileR2.url, n.mainImageMobileR2.mimeType)}`,
              mimeType: n.mainImageMobileR2.mimeType,
            })
          }
          if (n.mainImageDesktopR2?.url) {
            items.push({
              url: n.mainImageDesktopR2.url,
              folderPath: basePath,
              fileName: `kapak_desktop${getExtension(n.mainImageDesktopR2.url, n.mainImageDesktopR2.mimeType)}`,
              mimeType: n.mainImageDesktopR2.mimeType,
            })
          }
        })
      }

      setPlannedItems(items)
      setScanSummary({
        totalFiles: items.length,
        productsCount,
        designersCount,
        projectsCount,
        categoriesCount,
        materialsCount,
        newsCount,
      })

      toast.push({
        status: 'success',
        title: 'Tarama Tamamlandı',
        description: `Toplam ${items.length} adet medya dosyası tespit edildi.`,
      })
    } catch (err: any) {
      toast.push({
        status: 'error',
        title: 'Tarama Hatası',
        description: err?.message || 'Veritabanı taranırken hata oluştu.',
      })
    } finally {
      setIsScanning(false)
    }
  }, [client, scope, toast])

  // Dosya indirme fonksiyonu (Blob döner)
  const fetchBlob = async (url: string): Promise<Blob | null> => {
    try {
      // CDN / tarayıcı önbelleğini atlamak ve en güncel R2 dosyasını almak için cache buster
      const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
      const res = await fetch(cacheBustUrl, {cache: 'no-cache'})
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.blob()
    } catch (err) {
      console.warn(`Dosya indirilemedi: ${url}`, err)
      return null
    }
  }

  // Yöntem 1: ZIP Olarak İndirme
  const handleExportZip = async (itemsToExport?: ExportItem[]) => {
    const items = Array.isArray(itemsToExport) ? itemsToExport : plannedItems
    if (items.length === 0) return
    setIsExporting(true)
    setExportMethod('zip')
    cancelRef.current = false
    setLogs([])

    const zip = new JSZip()
    const total = items.length
    let successCount = 0
    let failCount = 0
    const currentFailed: ExportItem[] = []

    try {
      for (let i = 0; i < total; i++) {
        if (cancelRef.current) {
          setLogs((prev) => [
            ...prev,
            {type: 'info', message: 'Dışa aktarma kullanıcı tarafından iptal edildi.'},
          ])
          break
        }

        const item = items[i]
        const filePath = [...item.folderPath, item.fileName].join('/')
        setProgress({current: i + 1, total, currentFile: filePath})

        const blob = await fetchBlob(item.url)
        if (blob) {
          const realExt = await detectBlobExtension(blob)
          const actualFileName = realExt
            ? item.fileName.replace(/\.[a-zA-Z0-9]+$/, realExt)
            : item.fileName
          const actualFilePath = [...item.folderPath, actualFileName].join('/')
          zip.file(actualFilePath, blob)
          successCount++
        } else {
          failCount++
          currentFailed.push(item)
          setLogs((prev) => [
            ...prev,
            {type: 'error', message: `İndirilemedi: ${filePath} (${item.url})`},
          ])
        }

        if (i % 10 === 0) {
          await new Promise((r) => setTimeout(r, 5))
        }
      }

      setFailedItems(currentFailed)

      if (!cancelRef.current) {
        setProgress((prev) => ({...prev, currentFile: 'ZIP arşivi oluşturuluyor...'}))
        const zipBlob = await zip.generateAsync({type: 'blob'})

        const now = new Date().toISOString().slice(0, 10)
        const downloadUrl = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `birim-medya-export-${now}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)

        toast.push({
          status: 'success',
          title: 'Dışa Aktarma Başarılı',
          description: `${successCount} dosya ZIP olarak indirildi. ${failCount > 0 ? `(${failCount} dosya atlandı)` : ''}`,
        })
      }
    } catch (err: any) {
      toast.push({
        status: 'error',
        title: 'ZIP Oluşturma Hatası',
        description: err?.message || 'Bilinmeyen bir hata oluştu.',
      })
    } finally {
      setIsExporting(false)
      setExportMethod(null)
    }
  }

  // Yöntem 2: Doğrudan Klasöre Yazma (File System Access API)
  const handleExportDirectory = async (itemsToExport?: ExportItem[]) => {
    const items = Array.isArray(itemsToExport) ? itemsToExport : plannedItems
    if (items.length === 0) return

    if (!('showDirectoryPicker' in window)) {
      toast.push({
        status: 'warning',
        title: 'Desteklenmiyor',
        description:
          'Tarayıcınız doğrudan klasör seçimini desteklemiyor. Lütfen Chrome, Edge kullanın veya "ZIP Olarak İndir" seçeneğini kullanın.',
      })
      return
    }

    try {
      // @ts-ignore - showDirectoryPicker modern Chromium API
      const rootHandle = await window.showDirectoryPicker({
        id: 'birim-media-export',
        mode: 'readwrite',
      })

      setIsExporting(true)
      setExportMethod('directory')
      cancelRef.current = false
      setLogs([])

      const total = items.length
      let successCount = 0
      let failCount = 0
      const currentFailed: ExportItem[] = []

      // Alt klasör cache'i (aynı klasörü tekrar tekrar arayıp oluşturmamak için)
      const dirCache = new Map<string, FileSystemDirectoryHandle>()
      dirCache.set('', rootHandle)

      const getDir = async (
        pathParts: string[],
        forceFresh = false,
      ): Promise<FileSystemDirectoryHandle> => {
        let currentPath = ''
        let currentHandle = rootHandle

        for (const part of pathParts) {
          const nextPath = currentPath ? `${currentPath}/${part}` : part
          if (!forceFresh && dirCache.has(nextPath)) {
            currentHandle = dirCache.get(nextPath)!
          } else {
            currentHandle = await currentHandle.getDirectoryHandle(part, {create: true})
            dirCache.set(nextPath, currentHandle)
          }
          currentPath = nextPath
        }
        return currentHandle
      }

      // Dosyayı diske yazan ve Windows Defender / kilit / state uyumsuzluğu durumunda retry yapan fonksiyon
      const writeFileWithRetry = async (
        item: ExportItem,
        blob: Blob,
        maxRetries = 3,
      ): Promise<void> => {
        let lastError: any = null
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // İlk denemede cache kullan, sonraki denemelerde taze handle al
            const dirHandle = await getDir(item.folderPath, attempt > 1)

            // Tekrar denemelerde önceden kilitli/bozuk kalmış dosyayı temizlemeyi dene
            if (attempt > 1) {
              try {
                await dirHandle.removeEntry(item.fileName)
              } catch {
                // Silme başarısız olsa da devam et
              }
              // Windows Defender / Gezgin kilidinin kalkması için bekle
              await new Promise((r) => setTimeout(r, 150 * attempt))
            }

            const fileHandle = await dirHandle.getFileHandle(item.fileName, {create: true})
            const writable = await fileHandle.createWritable({keepExistingData: false})
            await writable.write(blob)
            await writable.close()
            return // Başarıyla yazıldı
          } catch (err: any) {
            lastError = err
            // Cache'deki ilgili klasör handle'ını temizle
            const dirKey = item.folderPath.join('/')
            dirCache.delete(dirKey)

            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 200 * attempt))
            }
          }
        }
        throw lastError
      }

      for (let i = 0; i < total; i++) {
        if (cancelRef.current) {
          setLogs((prev) => [
            ...prev,
            {type: 'info', message: 'Dışa aktarma kullanıcı tarafından iptal edildi.'},
          ])
          break
        }

        const item = items[i]
        const filePath = [...item.folderPath, item.fileName].join('/')
        setProgress({current: i + 1, total, currentFile: filePath})

        const blob = await fetchBlob(item.url)
        if (blob) {
          try {
            const realExt = await detectBlobExtension(blob)
            const actualFileName = realExt
              ? item.fileName.replace(/\.[a-zA-Z0-9]+$/, realExt)
              : item.fileName
            const actualItem =
              actualFileName !== item.fileName ? {...item, fileName: actualFileName} : item
            await writeFileWithRetry(actualItem, blob, 3)
            successCount++
          } catch (writeErr: any) {
            failCount++
            currentFailed.push(item)
            setLogs((prev) => [
              ...prev,
              {
                type: 'error',
                message: `Yazma hatası: ${filePath} (${writeErr?.message || writeErr})`,
              },
            ])
          }
        } else {
          failCount++
          currentFailed.push(item)
          setLogs((prev) => [
            ...prev,
            {type: 'error', message: `İndirilemedi: ${filePath} (${item.url})`},
          ])
        }

        // Windows I/O kuyruğuna ve UI render döngüsüne nefes payı bırak
        if (i % 5 === 0) {
          await new Promise((r) => setTimeout(r, 15))
        }
      }

      setFailedItems(currentFailed)

      if (!cancelRef.current) {
        toast.push({
          status: failCount === 0 ? 'success' : 'warning',
          title:
            failCount === 0
              ? 'Klasöre Aktarma Tamamlandı'
              : 'Klasöre Aktarma Tamamlandı (Bazı Dosyalar Atlandı)',
          description: `${successCount} dosya seçtiğiniz klasöre kaydedildi. ${failCount > 0 ? `(${failCount} dosya atlandı)` : ''}`,
        })
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.push({
          status: 'error',
          title: 'Klasör Hatası',
          description: err?.message || 'Klasör seçiminde hata oluştu.',
        })
      }
    } finally {
      setIsExporting(false)
      setExportMethod(null)
    }
  }

  const handleCancel = () => {
    cancelRef.current = true
  }

  return (
    <Box padding={[4, 5, 6]} style={{maxWidth: 1100, margin: '0 auto'}}>
      <Stack space={5}>
        {/* Başlık Kartı */}
        <Card padding={5} radius={3} shadow={1} tone="primary">
          <Flex align="center" gap={4}>
            <Box style={{fontSize: '2.5rem', lineHeight: 1}}>📦</Box>
            <Stack space={2}>
              <Heading size={3}>Medya Dışa Aktar (Media Export Tool)</Heading>
              <Text size={2} muted>
                CMS'deki ürün, tasarımcı, proje, kategori ve malzeme medyalarını{' '}
                <strong>Medya İçe Aktar (Media Import)</strong> klasör hiyerarşisiyle tam uyumlu
                olarak bilgisayarınıza indirin veya doğrudan klasöre aktarın.
              </Text>
            </Stack>
          </Flex>
        </Card>

        {/* Kapsam Seçimi */}
        <Card padding={5} radius={3} shadow={1}>
          <Stack space={4}>
            <Flex justify="space-between" align="center">
              <Heading size={2}>1. Dışa Aktarılacak Kapsamı Seçin</Heading>
              <Badge tone="primary">Media Import Formatı</Badge>
            </Flex>

            <Grid columns={[1, 2, 3]} gap={3}>
              <Card padding={3} radius={2} border tone={scope.products ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.products}
                    onChange={() => handleToggleScope('products')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Ürünler
                    </Text>
                    <Text size={1} muted>
                      Kapak, alternatifler, paneller ve ölçüler
                    </Text>
                  </Stack>
                </Flex>
              </Card>

              <Card padding={3} radius={2} border tone={scope.designers ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.designers}
                    onChange={() => handleToggleScope('designers')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Tasarımcılar
                    </Text>
                    <Text size={1} muted>
                      Profil ve cihaz görselleri
                    </Text>
                  </Stack>
                </Flex>
              </Card>

              <Card padding={3} radius={2} border tone={scope.projects ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.projects}
                    onChange={() => handleToggleScope('projects')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Projeler
                    </Text>
                    <Text size={1} muted>
                      Kapak ve galeri medyaları
                    </Text>
                  </Stack>
                </Flex>
              </Card>

              <Card padding={3} radius={2} border tone={scope.categories ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.categories}
                    onChange={() => handleToggleScope('categories')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Kategoriler
                    </Text>
                    <Text size={1} muted>
                      Hero ve menü görselleri
                    </Text>
                  </Stack>
                </Flex>
              </Card>

              <Card padding={3} radius={2} border tone={scope.materials ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.materials}
                    onChange={() => handleToggleScope('materials')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Malzemeler & Kartelalar
                    </Text>
                    <Text size={1} muted>
                      Kartela kumaş/kaplama görselleri
                    </Text>
                  </Stack>
                </Flex>
              </Card>

              <Card padding={3} radius={2} border tone={scope.news ? 'positive' : 'default'}>
                <Flex align="center" gap={3}>
                  <Checkbox
                    checked={scope.news}
                    onChange={() => handleToggleScope('news')}
                    disabled={isExporting || isScanning}
                  />
                  <Stack space={1}>
                    <Text weight="semibold" size={2}>
                      Haberler (Opsiyonel)
                    </Text>
                    <Text size={1} muted>
                      Haber kapak görselleri
                    </Text>
                  </Stack>
                </Flex>
              </Card>
            </Grid>

            {/* Tarama Butonu */}
            <Flex gap={3} align="center">
              <Button
                icon={isScanning ? Spinner : RefreshIcon}
                text={isScanning ? 'Medyalar Taranıyor...' : 'Medyaları Tara ve Listele'}
                tone="primary"
                onClick={handleScan}
                disabled={isScanning || isExporting}
              />
              {plannedItems.length > 0 && (
                <Badge tone="positive" size={2}>
                  {plannedItems.length} Medya Dosyası Hazır
                </Badge>
              )}
            </Flex>
          </Stack>
        </Card>

        {/* Tarama Özeti */}
        {scanSummary && (
          <Card padding={5} radius={3} shadow={1} tone="inherit" border>
            <Stack space={4}>
              <Heading size={2}>2. Tarama Özeti</Heading>
              <Grid columns={[2, 3, 6]} gap={3}>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Toplam Medya
                    </Text>
                    <Heading size={3}>{scanSummary.totalFiles}</Heading>
                  </Stack>
                </Card>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Ürün Sayısı
                    </Text>
                    <Heading size={3}>{scanSummary.productsCount}</Heading>
                  </Stack>
                </Card>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Tasarımcı
                    </Text>
                    <Heading size={3}>{scanSummary.designersCount}</Heading>
                  </Stack>
                </Card>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Proje
                    </Text>
                    <Heading size={3}>{scanSummary.projectsCount}</Heading>
                  </Stack>
                </Card>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Kategori
                    </Text>
                    <Heading size={3}>{scanSummary.categoriesCount}</Heading>
                  </Stack>
                </Card>
                <Card
                  padding={3}
                  radius={2}
                  tone="transparent"
                  style={{background: 'rgba(0,0,0,0.03)'}}
                >
                  <Stack space={1}>
                    <Text size={1} muted>
                      Malzeme Grubu
                    </Text>
                    <Heading size={3}>{scanSummary.materialsCount}</Heading>
                  </Stack>
                </Card>
              </Grid>

              {/* Dışa Aktarma Eylemleri */}
              <Flex gap={3} wrap="wrap">
                <Button
                  icon={FolderIcon}
                  text="Klasör Seç ve Doğrudan Diske Yaz"
                  tone="positive"
                  onClick={() => handleExportDirectory()}
                  disabled={isExporting || plannedItems.length === 0}
                />
                <Button
                  icon={DownloadIcon}
                  text="ZIP Arşivi Olarak İndir (.zip)"
                  tone="primary"
                  onClick={() => handleExportZip()}
                  disabled={isExporting || plannedItems.length === 0}
                />
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Aktarım Süreci & İlerleme */}
        {isExporting && (
          <Card padding={5} radius={3} shadow={2} tone="primary">
            <Stack space={4}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={3}>
                  <Spinner />
                  <Heading size={2}>
                    {exportMethod === 'zip'
                      ? 'ZIP Paketi Hazırlanıyor...'
                      : 'Klasöre Dosyalar Yazılıyor...'}
                  </Heading>
                </Flex>
                <Button
                  icon={CloseIcon}
                  text="İptal Et"
                  tone="critical"
                  mode="ghost"
                  onClick={handleCancel}
                />
              </Flex>

              {/* Progress Bar */}
              <Box
                style={{
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  height: 16,
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    background: '#22c55e',
                    height: '100%',
                    width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                    transition: 'width 0.2s ease',
                  }}
                />
              </Box>

              <Flex justify="space-between">
                <Text size={1} weight="semibold">
                  İşlenen: {progress.current} / {progress.total} (
                  {progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%)
                </Text>
                <Text
                  size={1}
                  muted
                  style={{
                    maxWidth: 450,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {progress.currentFile}
                </Text>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Hata ve Bilgi Logları */}
        {logs.length > 0 && (
          <Card padding={4} radius={3} tone="caution" border>
            <Stack space={3}>
              <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
                <Flex align="center" gap={2}>
                  <WarningOutlineIcon />
                  <Text weight="semibold" size={2}>
                    Uyarılar ve Atlanan Dosyalar ({logs.length})
                  </Text>
                </Flex>
                {failedItems.length > 0 && !isExporting && (
                  <Flex gap={2} wrap="wrap">
                    <Button
                      size={1}
                      tone="positive"
                      icon={FolderIcon}
                      text={`Hatalı Dosyaları Tekrar Klasöre Yaz (${failedItems.length})`}
                      onClick={() => handleExportDirectory(failedItems)}
                    />
                    <Button
                      size={1}
                      tone="primary"
                      icon={DownloadIcon}
                      text={`Hatalı Dosyaları ZIP İndir (${failedItems.length})`}
                      onClick={() => handleExportZip(failedItems)}
                    />
                  </Flex>
                )}
              </Flex>
              <Box style={{maxHeight: 180, overflowY: 'auto'}}>
                <Stack space={1}>
                  {logs.map((log, idx) => (
                    <Text
                      key={idx}
                      size={1}
                      style={{color: log.type === 'error' ? '#ef4444' : '#eab308'}}
                    >
                      • {log.message}
                    </Text>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Card>
        )}

        {/* Klasör Hiyerarşisi Bilgi Kutusu */}
        <Card
          padding={5}
          radius={3}
          tone="transparent"
          border
          style={{background: 'rgba(0,0,0,0.02)'}}
        >
          <Stack space={3}>
            <Heading size={1}>📂 Üretilen Klasör Yapısı (Media Import Uyumlu)</Heading>
            <Text size={1} muted>
              Dışa aktarılan dosyalar tam olarak aşağıdaki hiyerarşik yapıda oluşturulur:
            </Text>
            <Box
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '12px',
                background: '#1e1e1e',
                color: '#d4d4d4',
                borderRadius: '6px',
                whiteSpace: 'pre',
                overflowX: 'auto',
              }}
            >
              {`Medya-Export/
├── ürünler/
│   └── 01 - KANEPELER/
│       └── 0101 - SU/
│           ├── su_kapak.webp          ← Ana kapak
│           ├── su_kapak_mobil.webp    ← Mobil kapak
│           ├── su_kapak_desktop.webp  ← Desktop kapak
│           ├── su_1.webp              ← Alternatif görsel
│           ├── su_panel_1.webp        ← Alt medya paneli
│           └── ÖLÇÜLER/               ← Ölçü görselleri
│               └── olcu_1.webp
├── tasarımcılar/
│   └── Ahmet Yılmaz/
│       ├── profil.webp
│       └── profil_mobil.webp
├── projeler/
│   └── Proje Adı/
│       ├── proje_kapak.webp
│       └── proje_1.webp
├── kategoriler/
│   └── KANEPELER/
│       ├── hero.webp
│       └── menu.webp
└── malzemeler/
    └── KUMAŞ/
        └── KARTELA-1/
            └── Kumas-01.webp`}
            </Box>
          </Stack>
        </Card>
      </Stack>
    </Box>
  )
}
