import React, {useCallback, useState, useRef, useEffect} from 'react'
import {Box, Button, Card, Flex, Stack, Text, useToast, Inline, Spinner, Dialog} from '@sanity/ui'
import {UploadIcon, TrashIcon, CheckmarkIcon, EditIcon, CropIcon, CloseIcon} from '@sanity/icons'
import {ObjectInputProps, set, unset, useFormValue} from 'sanity'
import imageCompression from 'browser-image-compression'
import styled from 'styled-components'
import ReactCrop, {
  type Crop,
  type PixelCrop,
  type PercentCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// R2 Configuration from Environment Variables (only R2_DOMAIN is needed for rewrite URLs)
const R2_DOMAIN = process.env.SANITY_STUDIO_R2_DOMAIN || process.env.R2_DOMAIN

interface AspectRatioOption {
  label: string
  value: number | undefined
  isRecommended?: boolean
  recommendationReason?: string
}

function getAspectRatioPresets(
  path: (string | number | {_key: string})[] = [],
  document: any,
): AspectRatioOption[] {
  const pathStr = (path || [])
    .map((p) => (typeof p === 'object' && p !== null && '_key' in p ? (p as any)._key : String(p)))
    .join('.')
    .toLowerCase()

  let recommendedValue: number | undefined = undefined
  let reason = ''

  // 1. Panel görselleri kontrolü (imagePanels veya panels)
  if (pathStr.includes('imagepanels') || pathStr.includes('panel')) {
    recommendedValue = 4 / 5
    reason = 'Paneller için 4:5 oranı önerilir'
  }
  // 2. Mobil görseller kontrolü (Mobile/mobileR2)
  else if (pathStr.includes('mobile')) {
    recommendedValue = 9 / 16
    reason = 'Mobil görünüm için 9:16 önerilir'
  }
  // 3. Masaüstü görseller kontrolü (Desktop/desktopR2)
  else if (pathStr.includes('desktop')) {
    recommendedValue = 16 / 9
    reason = 'Masaüstü görünüm için 16:9 önerilir'
  }
  // 4. Ürün dokümanı veya ürün medyaları
  else if (document?._type === 'product' || pathStr.includes('product')) {
    recommendedValue = 1 / 1
    reason = 'Ürün görselleri için 1:1 kare oranı önerilir'
  }
  // 5. Kategori / Tasarımcı / Haber görselleri
  else if (document?._type === 'category' || document?._type === 'designer') {
    recommendedValue = 4 / 3
    reason = 'Kategori / Tasarımcı kartları için 4:3 önerilir'
  }
  // 6. Genel içerik blokları
  else if (pathStr.includes('contentblocks')) {
    recommendedValue = 16 / 9
    reason = 'İçerik bloğu görseli için 16:9 önerilir'
  }

  const basePresets: {label: string; value: number | undefined}[] = [
    {label: 'Serbest', value: undefined},
    {label: '4:5 (Panel)', value: 4 / 5},
    {label: '3:4 (Panel)', value: 3 / 4},
    {label: '1:1 (Kare)', value: 1},
    {label: '16:9 (Geniş)', value: 16 / 9},
    {label: '9:16 (Hikaye)', value: 9 / 16},
    {label: '4:3 (Standart)', value: 4 / 3},
  ]

  return basePresets.map((preset) => {
    const isRecommended =
      recommendedValue !== undefined &&
      preset.value !== undefined &&
      Math.abs(preset.value - recommendedValue) < 0.01

    return {
      ...preset,
      isRecommended,
      recommendationReason: isRecommended ? reason : undefined,
    }
  })
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspectRatio: number,
): PercentCrop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspectRatio,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const DropZone = styled(Card)<{$isDragging: boolean; $hasValue: boolean}>`
  border: 2px dashed
    ${(props) => (props.$isDragging ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)')};
  border-radius: 8px;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: ${(props) => (props.$hasValue ? 'auto' : '150px')};
  background: ${(props) => (props.$isDragging ? 'var(--card-accent-bg-color)' : 'transparent')};

  &:hover {
    border-color: var(--card-focus-ring-color);
  }
`

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  margin: 0 auto;
  border-radius: 4px;
  display: block;
  user-select: none;
`

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

const generateVideoPoster = (
  videoFile: File,
): Promise<{blob: Blob; width: number; height: number}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(videoFile)
    video.muted = true
    video.playsInline = true

    let isResolved = false

    const cleanup = () => {
      URL.revokeObjectURL(video.src)
    }

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration / 2 || 0)
    }

    video.onseeked = () => {
      if (isResolved) return
      isResolved = true
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              cleanup()
              if (blob) {
                resolve({blob, width: canvas.width, height: canvas.height})
              } else {
                reject(new Error('Canvas blob generation failed'))
              }
            },
            'image/webp',
            0.85,
          )
        } else {
          cleanup()
          reject(new Error('Canvas context unavailable'))
        }
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    video.onerror = (err) => {
      cleanup()
      reject(err)
    }
  })
}

const HotspotIndicator = styled.div<{$left: string; $top: string}>`
  position: absolute;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  width: 20px;
  height: 20px;
  background-color: rgba(240, 62, 47, 0.8);
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
`

const ImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #f4f4f4;
  cursor: crosshair;
`

const TipMessage = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0.8;
  z-index: 5;
`

const CropOverlayCSS = styled.div`
  display: flex;
  justify-content: center;
  .ReactCrop {
    max-height: 70vh;
  }
  .ReactCrop__image {
    max-height: 70vh;
    max-width: 100%;
    width: auto;
    height: auto;
    display: block;
  }
`

// Helper: Slugify (copied from MediaImportTool)
function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i',
    İ: 'i',
    i: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  }
  let result = text
  Object.entries(turkishMap).forEach(([tr, en]) => {
    result = result.replace(new RegExp(tr, 'g'), en)
  })
  return result
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.]+/g, '-') // Noktayı (.) koru
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const getApiUrl = (path: string): string => {
  if (typeof window === 'undefined') return path
  const hostname = window.location.hostname
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.endsWith('.local')

  if (isLocal) {
    const protocol = window.location.protocol || 'http:'
    return `${protocol}//${hostname}:3002${path}`
  }
  return `https://birim-web-antigravity.vercel.app${path}`
}

async function uploadFileViaPresignedUrl(
  blob: Blob | File,
  key: string,
  contentType: string,
): Promise<string> {
  const lastSlash = key.lastIndexOf('/')
  const folder = key.substring(0, lastSlash)
  const filename = key.substring(lastSlash + 1)

  // 1. Get Presigned URL (production endpoint first for 100% availability in Sanity Studio)
  let res: Response
  try {
    res = await fetch('https://birim-web-antigravity.vercel.app/api/media/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        contentType,
        folder,
      }),
    })
  } catch {
    try {
      res = await fetch(getApiUrl('/api/media/presigned-url'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          contentType,
          folder,
        }),
      })
    } catch {
      throw new Error(
        'Media API sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
      )
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error || `Presigned URL isteği başarısız: ${res.statusText}`)
  }

  const {uploadUrl, fileUrl} = await res.json()

  // 2. Upload file to R2 using Presigned URL
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  })

  if (!uploadRes.ok) {
    throw new Error(`R2'ye yükleme başarısız: ${uploadRes.statusText}`)
  }

  return fileUrl
}

export default function R2AssetInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const toast = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Crop state
  const [crop, setCrop] = useState<Crop>()
  const [aspect, setAspect] = useState<number | undefined>(undefined)

  const handleAspectSelect = useCallback((selectedAspect: number | undefined) => {
    setAspect(selectedAspect)
    if (selectedAspect && modalImageRef.current) {
      const {width, height, naturalWidth, naturalHeight} = modalImageRef.current
      const w = width || naturalWidth
      const h = height || naturalHeight
      if (w > 0 && h > 0) {
        const newCrop = centerAspectCrop(w, h, selectedAspect)
        setCrop(newCrop)
      }
    }
  }, [])

  // Ref for image click calculation
  const imageRef = useRef<HTMLImageElement>(null)
  const modalImageRef = useRef<HTMLImageElement>(null)

  // Get full document to determine upload path
  const sanityDocument = useFormValue([]) as any
  const docType = sanityDocument?._type

  const asset = value as any
  const hasValue = !!asset?.url
  const isMirrored = !!asset?.isMirrored

  // Rewrite .r2.dev preview URLs to Worker CDN for fast loading
  const rewritePreviewUrl = (url: string | undefined): string => {
    if (!url) return ''
    const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
    const domain = r2Domain || 'https://assets.birim.com'
    if (domain && (url.includes('.r2.dev') || url.includes('.workers.dev'))) {
      try {
        const parsed = new URL(url)
        // Eğer domain olarak workers verildiyse karışmasını engelle
        if (domain.includes(parsed.hostname)) return url

        let path = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname

        // Hardening: Add migration prefix for known folders if missing
        const r2Folders = [
          'uploads/',
          'bulk-uploads/',
          'products/',
          'designers/',
          'projects/',
          'news/',
        ]
        if (!path.startsWith('migration/')) {
          const folder = r2Folders.find((f) => path.startsWith(f))
          if (folder) {
            path = `migration/${path}`
          }
        }

        return `${domain}/${path}`
      } catch {
        return url
      }
    }
    return url
  }
  const previewUrl = rewritePreviewUrl(asset?.url)

  // Check if uploaded file is a video
  const isVideo = asset?.mimeType?.startsWith('video/')

  const hotspotX = asset?.hotspotX
  const hotspotY = asset?.hotspotY
  const hasHotspot = typeof hotspotX === 'number' && typeof hotspotY === 'number'

  const cropX = asset?.cropX
  const cropY = asset?.cropY
  const cropWidth = asset?.cropWidth
  const cropHeight = asset?.cropHeight
  const hasCrop = typeof cropX === 'number' && cropWidth > 0

  // Contextual Aspect Ratio presets based on schema path and document type
  const presets = React.useMemo(
    () => getAspectRatioPresets(props.path, sanityDocument),
    [props.path, sanityDocument],
  )
  const recommendedPreset = React.useMemo(() => presets.find((p) => p.isRecommended), [presets])

  // Init crop state from asset
  useEffect(() => {
    if (isEditMode) {
      if (hasCrop) {
        // Restore existing crop
        setCrop({
          unit: '%',
          x: cropX * 100,
          y: cropY * 100,
          width: cropWidth * 100,
          height: cropHeight * 100,
        })
        setAspect(undefined)
      } else {
        // No crop exists, start clean without an automatic crop selection
        setCrop(undefined)
        setAspect(undefined)
      }
    }
  }, [isEditMode]) // Only run when edit mode toggles

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return

      setIsUploading(true)
      try {
        // 1. File Type Detection
        let processedFile: File | Blob = file
        const isTiff =
          file.type === 'image/tiff' ||
          file.type === 'image/tif' ||
          /\.(tif|tiff)$/i.test(file.name)
        const isImage = file.type.startsWith('image/') || isTiff
        const isProcessableImage =
          isImage && !file.type.includes('gif') && !file.type.includes('svg') && !isTiff
        let isResponsive = false

        if (isTiff) {
          toast.push({
            status: 'error',
            title: 'TIFF Formatı Desteklenmiyor',
            description:
              'TIFF formatındaki görseller yüksek disk alanı kapladığı ve web tarayıcılarında görüntülenemediği için yüklenemez. Lütfen dosyayı JPG, PNG veya WebP formatına dönüştürüp tekrar deneyin.',
          })
          setIsUploading(false)
          setIsDragging(false)
          return
        }

        // 2. Determine R2 Path
        let folderPath = 'migration/uploads'
        if (docType === 'product') {
          const modelId = sanityDocument?.id?.current || 'unknown-product'
          folderPath = `migration/products/${modelId}`
        } else if (docType === 'designer') {
          const designerId =
            sanityDocument?.id?.current || slugify(sanityDocument?.name?.tr || 'unknown-designer')
          folderPath = `migration/designers/${designerId}`
        } else if (docType === 'project') {
          const projectId =
            sanityDocument?.id?.current || slugify(sanityDocument?.title?.tr || 'unknown-project')
          folderPath = `migration/projects/${projectId}`
        } else if (docType === 'newsItem') {
          const newsId =
            sanityDocument?.id?.current || slugify(sanityDocument?.title?.tr || 'unknown-news')
          folderPath = `migration/news/${newsId}`
        } else if (docType === 'materialGroup') {
          folderPath = `migration/materials/${slugify(sanityDocument?.title?.tr || 'unknown-group')}`
        } else if (docType === 'homePage') {
          folderPath = `migration/home/panels`
        }

        // 3. Prepare Filename
        let fileName = file.name
        if (isProcessableImage && !file.name.toLowerCase().endsWith('.webp')) {
          fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
        }
        const cleanFileName = fileName
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_.-]/g, '_')
        const key = `${folderPath}/${Date.now()}-${cleanFileName}`

        const isVideo = file.type.startsWith('video/')

        // Video Uyarısı ve Format Kontrolü
        if (isVideo) {
          if (file.size > 50 * 1024 * 1024) {
            toast.push({
              status: 'warning',
              title: 'Büyük Video Uyarısı',
              description:
                'Video 50MB üzerindedir. Mobil performans için 50MB altı videolar önerilir.',
            })
          }
          if (!file.type.includes('mp4')) {
            toast.push({
              status: 'info',
              title: 'Video Format Bilgisi',
              description:
                'Tüm tarayıcılarda (iOS Safari, Chrome, Edge) tam uyumluluk için MP4 (H.264) önerilir.',
            })
          }
        }

        let posterUrl: string | undefined = undefined
        let posterWidth: number | undefined = undefined
        let posterHeight: number | undefined = undefined

        // 4. Upload to R2
        if (isProcessableImage) {
          isResponsive = true
          const sizes = [
            {width: 2560, suffix: '', maxSizeMB: 1.5},
            {width: 1600, suffix: '-1600w', maxSizeMB: 0.8},
            {width: 800, suffix: '-800w', maxSizeMB: 0.4},
            {width: 400, suffix: '-400w', maxSizeMB: 0.2},
          ]

          // Zaten .webp olan veya 1.5MB altındaki dosyaları ana görsel için sıkıştırma (kalite kaybını önle)
          const isAlreadyWebP =
            file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')
          const isSmallFile = file.size < 1.5 * 1024 * 1024

          const uploadPromises = sizes.map(async (size) => {
            let blobToUpload: Blob | File = file

            if (size.suffix === '') {
              // Ana orijinal görsel: Zaten WebP veya küçükse orijinal dosyayı direkt yükle
              if (isAlreadyWebP || isSmallFile) {
                blobToUpload = file
              } else {
                try {
                  const options = {
                    maxSizeMB: size.maxSizeMB,
                    maxWidthOrHeight: size.width,
                    useWebWorker: false,
                    fileType: 'image/webp' as unknown as string,
                    initialQuality: 0.92,
                  }
                  blobToUpload = await imageCompression(file, options)
                } catch {
                  blobToUpload = file
                }
              }
              processedFile = blobToUpload
            } else {
              // Alt çözünürlükler (-1600w, -800w, -400w)
              try {
                const options = {
                  maxSizeMB: size.maxSizeMB,
                  maxWidthOrHeight: size.width,
                  useWebWorker: false,
                  fileType: 'image/webp' as unknown as string,
                  initialQuality: 0.9,
                }
                blobToUpload = await imageCompression(file, options)
              } catch {
                blobToUpload = file
              }
            }

            const currentKey = size.suffix ? key.replace(/\.webp$/, `${size.suffix}.webp`) : key
            const mime =
              size.suffix === '' && (isAlreadyWebP || isSmallFile)
                ? file.type || 'image/webp'
                : 'image/webp'
            return uploadFileViaPresignedUrl(blobToUpload, currentKey, mime)
          })

          await Promise.all(uploadPromises)
        } else {
          await uploadFileViaPresignedUrl(
            processedFile,
            key,
            file.type || 'application/octet-stream',
          )

          // Videolar için otomatik kapak görseli (poster) üret
          if (isVideo) {
            try {
              const {blob, width: pW, height: pH} = await generateVideoPoster(file)
              const posterKey = `${folderPath}/${Date.now()}-poster.webp`
              await uploadFileViaPresignedUrl(blob, posterKey, 'image/webp')
              const r2DomainNoProtocol = R2_DOMAIN?.startsWith('http')
                ? R2_DOMAIN
                : `https://${R2_DOMAIN}`
              posterUrl = `${r2DomainNoProtocol}/${posterKey}`
              posterWidth = pW
              posterHeight = pH
            } catch (err) {
              console.warn('Video kapak görseli oluşturulamadı:', err)
            }
          }
        }

        const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`
        const finalUrl = `${r2Domain}/${key}`

        // 5. Get Dimensions
        let width, height
        if (isImage && !isTiff) {
          try {
            const img = new Image()
            const objectUrl = URL.createObjectURL(processedFile)
            img.src = objectUrl
            await new Promise((resolve) => {
              img.onload = () => {
                width = img.width
                height = img.height
                URL.revokeObjectURL(objectUrl)
                resolve(null)
              }
              img.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                resolve(null)
              }
            })
          } catch {
            /* ignore dimension read error */
          }
        } else if (isVideo && posterWidth && posterHeight) {
          width = posterWidth
          height = posterHeight
        }

        // 6. Update Sanity
        const assetValue = {
          ...asset,
          _type: 'r2Asset',
          url: finalUrl,
          path: key,
          width,
          height,
          mimeType: isProcessableImage ? 'image/webp' : file.type || 'image/tiff',
          alt: file.name.replace(/\.[^/.]+$/, ''),
          posterUrl,
          thumbnailUrl: posterUrl,
          // Default center hotspot
          hotspotX: 0.5,
          hotspotY: 0.5,
          hasResponsiveSizes: isResponsive,
        }

        onChange(set(assetValue))

        toast.push({
          status: 'success',
          title: 'Yüklendi',
          description: `R2'ye başarıyla yüklendi: ${fileName}`,
        })
      } catch (error: unknown) {
        console.error('R2 Upload Error:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : (error as {message?: string})?.message || 'Görsel yüklenirken bir hata oluştu.'
        toast.push({
          status: 'error',
          title: 'Yükleme Hatası',
          description: errorMessage,
        })
      } finally {
        setIsUploading(false)
        setIsDragging(false)
      }
    },
    [docType, sanityDocument, onChange, toast],
  )

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current || !hasValue) return
      if (isEditMode) return // Don't set hotspot in edit mode

      // Sadece sol tık ile çalışsın
      if (e.button !== 0) return

      const rect = imageRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Normalize coordinates (0-1)
      const relativeX = Math.max(0, Math.min(1, x / rect.width))
      const relativeY = Math.max(0, Math.min(1, y / rect.height))

      // Update Sanity value directly
      onChange(
        set({
          ...asset,
          hotspotX: Number(relativeX.toFixed(4)),
          hotspotY: Number(relativeY.toFixed(4)),
        }),
      )

      toast.push({
        status: 'info',
        title: 'Odaklandı',
        description: `Odak noktası güncellendi: ${relativeX.toFixed(2)}, ${relativeY.toFixed(2)}`,
      })

      e.stopPropagation()
    },
    [asset, hasValue, onChange, toast, isEditMode],
  )

  const handleSaveCrop = () => {
    if (crop) {
      onChange(
        set({
          ...asset,
          cropX: Number((crop.x / 100).toFixed(4)),
          cropY: Number((crop.y / 100).toFixed(4)),
          cropWidth: Number((crop.width / 100).toFixed(4)),
          cropHeight: Number((crop.height / 100).toFixed(4)),
        }),
      )
      toast.push({status: 'success', title: 'Kırpma Kaydedildi'})
    } else {
      // Clear crop
      const {cropX, cropY, cropWidth, cropHeight, ...rest} = asset
      // ... same clear logic ...
      onChange([unset(['cropX']), unset(['cropY']), unset(['cropWidth']), unset(['cropHeight'])])
      toast.push({status: 'info', title: 'Kırpma Sıfırlandı'})
    }
    setIsEditMode(false)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return

      let pastedFile: File | null = null
      if (clipboardData.files && clipboardData.files.length > 0) {
        pastedFile = clipboardData.files[0]
      } else if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i]
          if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
            const file = item.getAsFile()
            if (file) {
              pastedFile = file
              break
            }
          }
        }
      }

      if (pastedFile) {
        e.preventDefault()
        e.stopPropagation()
        handleUpload(pastedFile)
      }
    },
    [handleUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      window.confirm(
        "Bu görseli kaldırmak istediğinize emin misiniz? (R2'den silinmez, sadece kaydı temizlenir)",
      )
    ) {
      onChange(unset())
    }
  }

  return (
    <Stack space={3}>
      <DropZone
        padding={hasValue ? 2 : 4}
        tabIndex={0}
        $isDragging={isDragging}
        $hasValue={hasValue}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={(e) => {
          if (!hasValue && !isUploading && !isEditMode) {
            document.getElementById(props.id)?.click()
          }
        }}
      >
        <HiddenInput
          id={props.id}
          name={props.id}
          type="file"
          autoComplete="off"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          aria-label="Dosya Seç"
        />

        {isUploading ? (
          <Flex align="center" justify="center" direction="column" padding={4} gap={3}>
            <Spinner size={3} />
            <Text size={1} muted>
              R2'ye yükleniyor...
            </Text>
          </Flex>
        ) : hasValue ? (
          <Box style={{position: 'relative'}}>
            {isVideo ? (
              // Video Preview
              <Box
                style={{
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <video
                  src={previewUrl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    display: 'block',
                    borderRadius: '4px',
                  }}
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </Box>
            ) : (
              // Image Preview with Crop/Hotspot
              <ImageContainer onClick={handleImageClick} onDoubleClick={(e) => e.stopPropagation()}>
                <PreviewImage
                  ref={imageRef}
                  src={previewUrl}
                  alt={asset.alt}
                  draggable={false}
                  style={{
                    // Apply crop preview if cropped
                    clipPath:
                      hasCrop && !isEditMode
                        ? `inset(${cropY * 100}% ${100 - (cropX + cropWidth) * 100}% ${100 - (cropY + cropHeight) * 100}% ${cropX * 100}%)`
                        : undefined,
                    transform: isMirrored ? 'scaleX(-1)' : 'none',
                    transition: 'transform 0.3s ease-in-out',
                  }}
                />

                {hasHotspot && !isEditMode && (
                  <HotspotIndicator $left={`${hotspotX * 100}%`} $top={`${hotspotY * 100}%`} />
                )}

                {!isEditMode && (
                  <TipMessage>Kırpmak için "Düzenle", odaklamak için tıklayın</TipMessage>
                )}
              </ImageContainer>
            )}

            {/* Toolbar */}
            <Box style={{position: 'absolute', top: 8, right: 8, zIndex: 20}}>
              <Inline space={2}>
                {/* Only show Edit button for images */}
                {!isVideo && (
                  <>
                    <Button
                      icon={CropIcon}
                      mode="ghost"
                      tone="primary"
                      fontSize={1}
                      padding={2}
                      text="Düzenle"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditMode(true)
                      }}
                    />
                    <Button
                      mode={isMirrored ? 'default' : 'ghost'}
                      tone={isMirrored ? 'positive' : 'default'}
                      fontSize={1}
                      padding={2}
                      text={isMirrored ? '↔️ Aynalandı' : '🔄 Aynala'}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(set(!isMirrored, ['isMirrored']))
                      }}
                    />
                  </>
                )}
                <Button
                  icon={TrashIcon}
                  tone="critical"
                  fontSize={1}
                  padding={2}
                  onClick={handleClear}
                  title="Kaldır"
                />
              </Inline>
            </Box>

            <Box padding={2}>
              <Stack space={2}>
                <Flex align="center" gap={2}>
                  <CheckmarkIcon style={{color: 'green'}} />
                  <Text size={1} weight="semibold" style={{color: 'green'}}>
                    R2 Üzerinde Yayında
                  </Text>
                  {!isVideo && hasCrop && (
                    <Text size={1} muted>
                      | ✂️ Kırpıldı
                    </Text>
                  )}
                  {!isVideo && hasHotspot && (
                    <Text size={1} muted>
                      | 🎯 Odak: %{(hotspotX * 100).toFixed(0)}, %{(hotspotY * 100).toFixed(0)}
                    </Text>
                  )}
                  {isVideo && (
                    <Text size={1} muted>
                      | 🎬 Video
                    </Text>
                  )}
                </Flex>
              </Stack>
            </Box>
          </Box>
        ) : (
          <Flex
            align="center"
            justify="center"
            direction="column"
            gap={3}
            style={{pointerEvents: 'none'}}
          >
            <Text size={4}>
              <UploadIcon />
            </Text>
            <Stack space={2} style={{textAlign: 'center'}}>
              <Text weight="bold" size={2}>
                {isDragging
                  ? 'Buraya Bırakın'
                  : 'Görseli Sürükleyin, Seçin veya Yapıştırın (Ctrl + V)'}
              </Text>
              <Text size={1} muted>
                Dosya otomatik olarak WebP'ye dönüştürülüp R2'ye yüklenecektir.
              </Text>
            </Stack>
          </Flex>
        )}
      </DropZone>

      {/* Edit Modal */}
      {isEditMode && (
        <Dialog
          header="Görsel Düzenle (Kırp)"
          id="crop-dialog"
          onClose={() => setIsEditMode(false)}
          width={2}
          zOffset={1000}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1} muted>
                Kırpmak istediğiniz alanı seçin. Değişiklikler R2 dosyasını etkilemez, sadece
                gösterimi değiştirir.
              </Text>

              {/* Oranlı Seçim Araçları */}
              <Stack space={2}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                  <Text size={1} weight="bold">
                    Oranlı Seçim Araçları (Aspect Ratio):
                  </Text>
                  {recommendedPreset?.recommendationReason ? (
                    <Card tone="positive" padding={2} radius={2}>
                      <Text size={1} weight="semibold">
                        ⭐ {recommendedPreset.recommendationReason}
                      </Text>
                    </Card>
                  ) : aspect ? (
                    <Text size={1} muted>
                      Sabit Oran: {aspect.toFixed(2)}
                    </Text>
                  ) : null}
                </Flex>
                <Flex gap={2} wrap="wrap">
                  {presets.map((preset) => {
                    const isSelected = aspect === preset.value
                    return (
                      <Button
                        key={preset.label}
                        size={1}
                        text={preset.isRecommended ? `⭐ ${preset.label}` : preset.label}
                        mode={isSelected ? 'default' : 'outline'}
                        tone={
                          isSelected ? 'primary' : preset.isRecommended ? 'positive' : 'default'
                        }
                        onClick={() => handleAspectSelect(preset.value)}
                      />
                    )
                  })}
                </Flex>
              </Stack>

              <Box
                style={{
                  background: '#000',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CropOverlayCSS>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    aspect={aspect}
                  >
                    <img
                      ref={modalImageRef}
                      src={previewUrl}
                      alt="Crop Preview"
                      onLoad={() => {
                        // Keep image loaded without forcing automatic crop box
                      }}
                      style={{maxHeight: '70vh', maxWidth: '100%'}}
                    />
                  </ReactCrop>
                </CropOverlayCSS>
              </Box>

              <Flex justify="flex-end" gap={3}>
                <Button text="İptal" mode="ghost" onClick={() => setIsEditMode(false)} />
                <Button
                  text="Kırpmayı Sıfırla"
                  mode="ghost"
                  tone="critical"
                  onClick={() => {
                    setCrop(undefined)
                    setAspect(undefined)
                  }}
                />
                <Button text="Kaydet ve Uygula" tone="primary" onClick={handleSaveCrop} />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
