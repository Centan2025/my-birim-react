import React, {useCallback, useState, useRef} from 'react'
import {
  ArrayOfObjectsInputProps,
  useClient,
  useFormValue,
  setIfMissing,
  insert,
  PatchEvent,
} from 'sanity'
import {Box, Button, Card, Flex, Stack, Text, useToast, Spinner, Inline} from '@sanity/ui'
import {UploadIcon} from '@sanity/icons'
import imageCompression from 'browser-image-compression'

// R2 Configuration (only domain needed for URL generation)
const R2_DOMAIN = process.env.SANITY_STUDIO_R2_DOMAIN

// Helper: Slugify
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

const isVideoFile = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)
}

const isImageFile = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
}

// Dosyanın gerçekten WebP olup olmadığını dosya başlığından (Magic Bytes) kontrol eder
async function isGenuineWebP(file: File | Blob): Promise<boolean> {
  try {
    const slice = file.slice(0, 12)
    const buf = new Uint8Array(await slice.arrayBuffer())
    return (
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    )
  } catch {
    return false
  }
}

function getImageDimensions(file: File | Blob): Promise<{width: number; height: number}> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({width: img.naturalWidth || img.width, height: img.naturalHeight || img.height})
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({width: 0, height: 0})
    }
    img.src = url
  })
}

export default function BulkMediaUploadInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault, onChange, schemaType} = props
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toast = useToast()
  const sanityDocument = useFormValue([]) as any
  const docType = sanityDocument?._type

  const processFiles = useCallback(
    async (fileArray: File[]) => {
      if (!fileArray || fileArray.length === 0) return

      setIsUploading(true)
      setUploadProgress(`0/${fileArray.length} başladı...`)

      try {
        const uploadResults = await Promise.all(
          fileArray.map(async (file, index) => {
            const isTiff =
              file.type === 'image/tiff' ||
              file.type === 'image/tif' ||
              /\.(tif|tiff)$/i.test(file.name)
            const isImage = isImageFile(file.name) || isTiff
            const isProcessableImage =
              isImage && !file.type.includes('gif') && !file.type.includes('svg') && !isTiff
            const isVideo = isVideoFile(file.name)

            if (isTiff) {
              toast.push({
                status: 'error',
                title: 'TIFF Formatı Desteklenmiyor',
                description: `${file.name} (TIFF) yüklenemez. Lütfen dosyayı JPG, PNG veya WebP formatına dönüştürün.`,
              })
              return null
            }

            let folderPath = 'migration/bulk-uploads'
            const docId = sanityDocument?.id?.current || sanityDocument?._id || 'unknown'

            if (docType === 'product') {
              folderPath = `migration/products/${docId}/media`
            } else if (docType === 'project') {
              folderPath = `migration/projects/${docId}/media`
            } else if (docType === 'newsItem') {
              folderPath = `migration/news/${docId}/media`
            } else if (docType === 'homePage') {
              folderPath = `migration/home/panels`
            } else if (docType === 'factoryPage') {
              folderPath = `migration/factory/gallery`
            } else if (docType === 'materialGroup') {
              folderPath = `migration/materials/${docId}/swatches`
            }

            const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`

            let fileName = file.name
            if (isProcessableImage && !file.name.toLowerCase().endsWith('.webp')) {
              fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            }
            const key = `${folderPath}/${Date.now()}-${slugify(fileName)}`

            let r2Asset: Record<string, unknown> | null = null

            if (isProcessableImage) {
              const sizes = [
                {width: 2560, suffix: '', maxSizeMB: 1.5},
                {width: 1600, suffix: '-1600w', maxSizeMB: 0.8},
                {width: 800, suffix: '-800w', maxSizeMB: 0.4},
                {width: 400, suffix: '-400w', maxSizeMB: 0.2},
              ]

              const dimensions = await getImageDimensions(file)
              const isAlreadyWebP = await isGenuineWebP(file)
              const isSmallFile = file.size < 1.5 * 1024 * 1024

              const sizePromises = sizes.map(async (size) => {
                let blobToUpload: Blob | File = file

                if (size.suffix === '') {
                  if (isAlreadyWebP && isSmallFile) {
                    // Zaten fiziksel olarak gerçek WebP ve boyutu uygun (<1.5MB): Baytlarına dokunmadan doğrudan yükle
                    blobToUpload = file
                  } else if (isSmallFile) {
                    // Boyut uygun (<1.5MB) ama WebP değil: Çözünürlüğü ve %100 kaliteyi koruyarak WebP'ye çevir
                    try {
                      const options = {
                        maxSizeMB: Math.max(file.size / (1024 * 1024), 3.0),
                        maxWidthOrHeight: Math.max(dimensions.width, dimensions.height) || 2560,
                        useWebWorker: false,
                        fileType: 'image/webp' as unknown as string,
                        initialQuality: 1.0, // %100 kalite
                      }
                      blobToUpload = await imageCompression(file, options)
                    } catch {
                      blobToUpload = file
                    }
                  } else {
                    // Boyutu büyük (>1.5MB): WebP olsa dahi web standardına uygun optimize et (max 2560px, yüksek kalite)
                    try {
                      const options = {
                        maxSizeMB: size.maxSizeMB,
                        maxWidthOrHeight: Math.min(
                          Math.max(dimensions.width, dimensions.height) || 2560,
                          2560,
                        ),
                        useWebWorker: false,
                        fileType: 'image/webp' as unknown as string,
                        initialQuality: 0.95,
                      }
                      blobToUpload = await imageCompression(file, options)
                    } catch {
                      blobToUpload = file
                    }
                  }
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
                return uploadFileViaPresignedUrl(blobToUpload, currentKey, 'image/webp')
              })

              await Promise.all(sizePromises)
              r2Asset = {
                _type: 'r2Asset',
                url: `${r2Domain}/${key}`,
                path: key,
                hasResponsiveSizes: true,
                width: dimensions.width,
                height: dimensions.height,
                mimeType: 'image/webp',
                alt: file.name.replace(/\.[^/.]+$/, ''),
                hotspotX: 0.5,
                hotspotY: 0.5,
              }
            } else {
              await uploadFileViaPresignedUrl(file, key, file.type || 'application/octet-stream')
              r2Asset = {
                _type: 'r2Asset',
                url: `${r2Domain}/${key}`,
                path: key,
                hasResponsiveSizes: false,
                mimeType: file.type || 'image/tiff',
                alt: file.name.replace(/\.[^/.]+$/, ''),
              }
            }

            setUploadProgress(`${index + 1}/${fileArray.length}: ${file.name}`)

            const itemType = schemaType.of[0].name
            let item: any

            if (itemType === 'r2Asset') {
              item = {
                ...r2Asset,
                _key: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              }
            } else if (itemType === 'productMaterial') {
              item = {
                _type: 'productMaterial',
                _key: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: {
                  tr: file.name.replace(/\.[^/.]+$/, ''),
                  en: file.name.replace(/\.[^/.]+$/, ''),
                },
                imageR2: r2Asset,
              }
            } else {
              item = {
                _type: itemType,
                _key: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: isVideo ? 'video' : 'image',
                isCover: false,
              }

              if (itemType === 'newsMedia') {
                item.caption = {tr: '', en: ''}
              } else if (itemType !== 'r2Asset') {
                item.title = {tr: '', en: ''}
              }

              if (isVideo) {
                item.videoFileR2 = r2Asset
              } else {
                item.imageR2 = r2Asset
              }
            }

            return item
          }),
        )

        const newItems = uploadResults.filter(Boolean)

        if (newItems.length > 0) {
          onChange(PatchEvent.from([setIfMissing([]), insert(newItems, 'after', [-1])]))
          toast.push({
            status: 'success',
            title: 'Yükleme Tamamlandı',
            description: `${newItems.length} medya başarıyla eklendi.`,
          })
        }
      } catch (error: any) {
        console.error('Bulk Upload Error:', error)
        toast.push({
          status: 'error',
          title: 'Yükleme Hatası',
          description: error.message,
        })
      } finally {
        setIsUploading(false)
        setIsDragging(false)
        setUploadProgress('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [docType, sanityDocument, onChange, toast, schemaType.of],
  )

  const handleBulkUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return
      await processFiles(Array.from(files))
    },
    [processFiles],
  )

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
      processFiles(Array.from(files))
    }
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const clipboardData = e.clipboardData
      if (!clipboardData) return

      const pastedFiles: File[] = []
      if (clipboardData.files && clipboardData.files.length > 0) {
        pastedFiles.push(...Array.from(clipboardData.files))
      } else if (clipboardData.items && clipboardData.items.length > 0) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i]
          if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
            const file = item.getAsFile()
            if (file) pastedFiles.push(file)
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        processFiles(pastedFiles)
      }
    },
    [processFiles],
  )

  return (
    <Stack space={3}>
      {renderDefault(props)}

      <Card
        padding={3}
        border
        radius={2}
        tabIndex={0}
        tone={isDragging ? 'primary' : 'transparent'}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        style={{
          transition: 'all 0.2s ease',
          borderStyle: isDragging ? 'dashed' : 'solid',
          outline: 'none',
        }}
      >
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Text size={1} weight="bold">
                Toplu Medya Yükleme (R2)
              </Text>
              <Text size={1} muted>
                Dosya sürükleyin, seçin veya kopyaladığınız görselleri Ctrl + V / Yapıştır ile
                buraya ekleyin.
              </Text>
            </Stack>
            <Box>
              <input
                id={props.id}
                name={props.id}
                type="file"
                autoComplete="off"
                multiple
                accept="image/*,video/*"
                ref={fileInputRef}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: '0',
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: '0',
                }}
                onChange={handleBulkUpload}
                disabled={isUploading}
                aria-label="Toplu Medya Yükleme"
              />
              <Button
                text={isUploading ? 'Yükleniyor...' : 'Toplu Dosya Seç ve Yükle'}
                icon={isUploading ? Spinner : UploadIcon}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                tone="primary"
              />
            </Box>
          </Flex>

          {isUploading && (
            <Card padding={2} tone="caution" radius={1}>
              <Inline space={2}>
                <Spinner />
                <Text size={1}>İşleniyor: {uploadProgress}</Text>
              </Inline>
            </Card>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
