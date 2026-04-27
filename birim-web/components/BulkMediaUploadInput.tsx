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
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import imageCompression from 'browser-image-compression'

// R2 Configuration
const R2_ACCOUNT_ID = process.env.SANITY_STUDIO_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.SANITY_STUDIO_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.SANITY_STUDIO_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.SANITY_STUDIO_R2_BUCKET_NAME || 'birim-web'
const R2_DOMAIN = process.env.SANITY_STUDIO_R2_DOMAIN

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

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

const isVideoFile = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)
}

const isImageFile = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
}

export default function BulkMediaUploadInput(props: ArrayOfObjectsInputProps) {
  const {renderDefault, onChange, schemaType} = props
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toast = useToast()
  const sanityDocument = useFormValue([]) as any
  const docType = sanityDocument?._type
  const handleBulkUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      setIsUploading(true)
      const fileArray = Array.from(files)
      setUploadProgress(`0/${fileArray.length} başladı...`)

      try {
        // Dosyaları paralel işle (concurrency kontrolü isteğe bağlı, şimdilik Promise.all)
        const uploadResults = await Promise.all(
          fileArray.map(async (file, index) => {
            const isImage = isImageFile(file.name)
            const isVideo = isVideoFile(file.name)

            // 1. Path belirle
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
            }
            
            // R2 Domain Temizliği
            const r2Domain = R2_DOMAIN?.startsWith('http') ? R2_DOMAIN : `https://${R2_DOMAIN}`

            // 2. Filename
            let fileName = file.name
            if (isImage && !file.name.toLowerCase().endsWith('.webp')) {
              fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            }
            // Key oluştururken slugify artık noktayı koruyor (.webp kalacak)
            const key = `${folderPath}/${Date.now()}-${slugify(fileName)}`

            let r2Asset: any = null

            // 3. Upload
            if (isImage && !file.type.includes('gif') && !file.type.includes('svg')) {
              const sizes = [
                {width: 2560, suffix: '', maxSizeMB: 1.0},
                {width: 1600, suffix: '-1600w', maxSizeMB: 0.6},
                {width: 800, suffix: '-800w', maxSizeMB: 0.3},
                {width: 400, suffix: '-400w', maxSizeMB: 0.15},
              ]

              let dimensions = {width: 0, height: 0}

              const sizePromises = sizes.map(async (size) => {
                const options = {
                  maxSizeMB: size.maxSizeMB,
                  maxWidthOrHeight: size.width,
                  useWebWorker: false, // CSP eval hatasını önlemek için false
                  fileType: 'image/webp' as any,
                }
                const compressedBlob = await imageCompression(file, options)

                if (size.suffix === '') {
                  try {
                    const img = new Image()
                    img.src = URL.createObjectURL(compressedBlob)
                    await new Promise((resolve) => {
                      img.onload = () => {
                        dimensions = {width: img.width, height: img.height}
                        resolve(null)
                      }
                      img.onerror = () => resolve(null)
                    })
                  } catch (e) {}
                }

                const currentKey = size.suffix ? key.replace(/\.webp$/, `${size.suffix}.webp`) : key
                const arrayBuffer = await compressedBlob.arrayBuffer()
                return r2Client.send(
                  new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: currentKey,
                    Body: new Uint8Array(arrayBuffer),
                    ContentType: 'image/webp',
                  }),
                )
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
              const arrayBuffer = await file.arrayBuffer()
              await r2Client.send(
                new PutObjectCommand({
                  Bucket: R2_BUCKET_NAME,
                  Key: key,
                  Body: new Uint8Array(arrayBuffer),
                  ContentType: file.type,
                }),
              )
              r2Asset = {
                _type: 'r2Asset',
                url: `${r2Domain}/${key}`,
                path: key,
                hasResponsiveSizes: false,
                mimeType: file.type,
                alt: file.name.replace(/\.[^/.]+$/, ''),
              }
            }

            // Progress update (yaklaşık)
            setUploadProgress(`${index + 1}/${fileArray.length}: ${file.name}`)

            // 4. Parçayı oluştur
            const itemType = schemaType.of[0].name
            let item: any

            if (itemType === 'r2Asset') {
              item = {
                ...r2Asset,
                _key: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

        // 5. Sanity'ye ekle
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
        setUploadProgress('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [docType, sanityDocument, onChange, toast, schemaType.of],
  )

  return (
    <Stack space={3}>
      {renderDefault(props)}

      <Card padding={3} border radius={2} tone="transparent">
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Text size={1} weight="bold">
                Toplu Medya Yükleme (R2)
              </Text>
              <Text size={1} muted>
                Birden fazla görsel veya video seçip tek seferde R2'ye yükleyebilirsiniz.
              </Text>
            </Stack>
            <Box>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                ref={fileInputRef}
                style={{display: 'none'}}
                onChange={handleBulkUpload}
                disabled={isUploading}
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
