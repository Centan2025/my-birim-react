import React, { useState, useCallback } from 'react'
import { Card, Stack, Text, Button, Box, Flex, useToast, Grid } from '@sanity/ui'
import { UploadIcon, FolderIcon, CheckmarkIcon, WarningOutlineIcon } from '@sanity/icons'
import { useClient } from 'sanity'
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
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

// Duplicate Key Prevention Helper
const uniqueKeyCache = new Set<string>()
const resolveKey = (item: any, prefix: string = 'item') => {
  if (item && item._key && !uniqueKeyCache.has(item._key)) {
    uniqueKeyCache.add(item._key)
    return item
  }
  const newKey = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  uniqueKeyCache.add(newKey)
  return { ...item, _key: newKey }
}

interface ProgressItem {
  type: 'category' | 'designer' | 'product' | 'project' | 'materialGroup' | 'materialBook' | 'news' | 'about'
  name: string
  status: 'pending' | 'scanning' | 'uploading' | 'success' | 'error' | 'warning'
  message?: string
  details?: string
}

interface ScanReport {
  totalFiles: number
  totalSize: number
  foundItems: {
    categories: Array<{ id: string; name: string; files: number; exists: boolean }>
    designers: Array<{ id: string; name: string; files: number; exists: boolean }>
    products: Array<{ id: string; name: string; files: number; exists: boolean; categoryId: string }>
    projects: Array<{ id: string; name: string; files: number; exists: boolean }>
    materials: Array<{ group: string; books: number; files: number; exists: boolean }>
  }
  issues: Array<{ type: 'error' | 'warning'; message: string; subtext?: string }>
}

interface ParsedData {
  categories: Map<string, string>
  categoryMedia: Array<{
    categoryId: string
    categoryName: string
    files: File[]
  }>
  designers: Array<{
    id: string
    name: string
    files: File[]
  }>
  products: Array<{
    categoryId: string
    categoryName: string
    modelId: string
    modelName: string
    media: Array<{
      file: File
      device: 'all' | 'desktop' | 'mobile'
      isCover?: boolean
    }>
    dimensionFiles: File[]
    extraImages: File[]
    drawingFiles: File[]
    modelFiles: File[]
  }>
  materialGroups: Array<{
    groupName: string
    books: Array<{
      bookName: string
      files: File[]
    }>
  }>
  projects: Array<{
    projectId: string
    projectName: string
    media: Array<{
      file: File
      device: 'all' | 'desktop' | 'mobile'
      isCover?: boolean
      contentBlock?: number
    }>
    files: File[]
  }>
  newsItems: Array<{
    newsId: string
    newsName: string
    files: File[]
  }>
  aboutPage: {
    hero: File[]
    history: File[]
    identity: File[]
    quality: File[]
  }
}

interface PreviewData {
  categories: number
  designers: number
  products: number
  projects: number
  materialGroups: number
  totalFiles: number
  fileDetails: Array<{
    path: string
    type: string
    size: number
    target: string
  }>
}

interface SummaryData {
  uploaded: number
  updated: number
  deleted: number
  skipped: number
  errors: number
  details: Array<{
    type: string
    name: string
    action: 'uploaded' | 'updated' | 'deleted' | 'skipped' | 'error'
    message?: string
  }>
}

// R2 Upload Helper
const uploadToR2 = async (
  file: File,
  path: string,
): Promise<{ url: string; width?: number; height?: number; hasResponsiveSizes?: boolean } | null> => {
  try {
    const isImage = isImageFile(file.name)
    let processedFile: File | Blob = file
    let isResponsive = false

    // WebP uzantısını ekle
    let fileName = file.name
    if (isImage && !file.name.toLowerCase().endsWith('.webp')) {
      fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
    }

    const key = `${path}/${fileName}`

    if (isImage) {
      isResponsive = true
      
      // 1. Görsel boyutlarını bir kez al
      const objectUrl = URL.createObjectURL(file)
      const dimensions: { width: number; height: number } = await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = () => resolve({ width: 0, height: 0 })
        img.src = objectUrl
      })
      URL.revokeObjectURL(objectUrl)

      const sizes = [
        { width: 2560, height: 1600, suffix: '', maxSizeMB: 2.5 },   // Ana görsel (Max: 2560x1600)
        { width: 1600, height: 1000, suffix: '-1600w', maxSizeMB: 1.2 },
        { width: 800, height: 500, suffix: '-800w', maxSizeMB: 0.5 },
        { width: 400, height: 250, suffix: '-400w', maxSizeMB: 0.2 },
      ]

      const uploadPromises = sizes.map(async (size) => {
        // KRİTİK: Eğer dosya zaten WebP ise, pikseline dokunmadan HAM olarak gönder (Byte-perfect copy).
        const isAlreadyWebP = file.name.toLowerCase().endsWith('.webp');
        
        // Ana görsel (suffix === '') için eğer zaten WebP ise asla işleme sokma
        const isAlreadyOptimized = 
          isAlreadyWebP && 
          (size.suffix === '' || (dimensions.width <= size.width && dimensions.height <= size.height));

        let compressedBlob: Blob;
        
        if (isAlreadyOptimized) {
          console.log(`   💎 Ham Veri Geçişi (${size.suffix || 'Orijinal'}): ${file.name} korundu.`)
          compressedBlob = file;
          if (size.suffix === '') processedFile = file;
        } else if (file.size < 500 * 1024) {
          // Küçük dosya ama WebP değilse veya alt varyasyon (800w/400w) ise: 
          // Çözünürlüğü hedef boyuta (size.width) getir, kaliteyi tavan yap.
          console.log(`   ⚡ Hızlı Dönüştürme (${size.suffix || 'Orijinal'}): ${file.name} (Kalite koruma + Boyutlandırma)`)
          const options = {
            maxSizeMB: size.maxSizeMB,
            maxWidthOrHeight: size.suffix === '' ? Math.max(dimensions.width, dimensions.height) : Math.max(size.width, size.height), 
            useWebWorker: true,
            fileType: 'image/webp' as any,
            initialQuality: 0.99, // En üst düzey kalite
          }
          compressedBlob = await compressImageChunk(file, options)
          if (size.suffix === '') processedFile = compressedBlob;
        } else {
          // Büyük dosyalar için standart kütüphane akışı
          const options = {
            maxSizeMB: size.maxSizeMB,
            maxWidthOrHeight: Math.max(size.width, size.height), 
            useWebWorker: true,
            fileType: 'image/webp' as any,
            initialQuality: size.suffix === '' ? 0.98 : 0.90,
          }
          console.log(`   📉 Standart Sıkıştırma (${size.suffix || 'Orijinal'}): ${file.name} -> ${size.width}x${size.height}`)
          compressedBlob = await compressImageChunk(file, options)
          if (size.suffix === '') processedFile = compressedBlob;
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

      await Promise.all(uploadPromises)
    } else {
      const arrayBuffer = await processedFile.arrayBuffer()
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: new Uint8Array(arrayBuffer),
          ContentType: file.type,
        }),
      )
    }

    // Görsel boyutlarını al
    let dimensions = {}
    if (isImage) {
      try {
        const img = new Image()
        img.src = URL.createObjectURL(processedFile)
        await new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
        dimensions = { width: img.width, height: img.height }
      } catch (e) {
        console.warn('Boyutlar alınamadı:', e)
      }
    }

    return {
      url: `${R2_DOMAIN}/${key}`,
      hasResponsiveSizes: isResponsive,
      ...dimensions,
    }
  } catch (error: any) {
    console.error('R2 Upload Error:', error)
    return null
  }
}

// Internal helper for multiple compressions
const compressImageChunk = async (file: File, options: any): Promise<File | Blob> => {
  if (!isImageFile(file.name) || file.type.includes('gif') || file.type.includes('svg')) {
    return file
  }
  try {
    return await imageCompression(file, options)
  } catch (error) {
    return file
  }
}

export default function MediaImportTool() {
  const client = useClient({ apiVersion: '2025-01-01' })
  const toast = useToast()
  
  // UI States
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [scanResult, setScanResult] = useState<ParsedData | null>(null)
  const [scanReport, setScanReport] = useState<ScanReport | null>(null)
  const [viewMode, setViewMode] = useState<'scan' | 'upload' | 'summary'>('scan')
  const [filterMode, setFilterMode] = useState<'all' | 'error' | 'success'>('all')
  const [importMode, setImportMode] = useState<'sync' | 'add'>('sync')
  
  // Data States
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [stats, setStats] = useState({
    categories: 0,
    designers: 0,
    products: 0,
    projects: 0,
    images: 0,
  })

  // Pre-flight check
  const preflight = {
    accountId: !!R2_ACCOUNT_ID,
    accessKey: !!R2_ACCESS_KEY_ID,
    secretKey: !!R2_SECRET_ACCESS_KEY,
    bucket: !!R2_BUCKET_NAME,
    domain: !!R2_DOMAIN,
    isAllOk: !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_DOMAIN)
  }

  // Klasör yapısını parse et
  const parseDirectory = useCallback((files: FileList): ParsedData => {
    const categories = new Map<string, string>()
    const categoryMediaMap = new Map<string, File[]>()
    const designerMap = new Map<string, File[]>()
    const productMap = new Map<
      string,
      {
        media: Array<{ file: File; device: 'all' | 'desktop' | 'mobile'; isCover?: boolean }>
        dimensionFiles: File[]
        extraImages: File[]
        drawingFiles: File[]
        modelFiles: File[]
      }
    >()
    const materialGroupMap = new Map<string, Map<string, File[]>>()
    const projectMap = new Map<
      string,
      {
        media: Array<{
          file: File
          device: 'all' | 'desktop' | 'mobile'
          isCover?: boolean
          contentBlock?: number
        }>
        files: File[]
      }
    >()
    const newsMap = new Map<string, File[]>()
    const aboutPageData = {
      hero: [] as File[],
      history: [] as File[],
      identity: [] as File[],
      quality: [] as File[],
    }

    Array.from(files).forEach((file) => {
      const path = file.webkitRelativePath || file.name
      const parts = path.split('/')

      // Debug: İlk 5 dosyayı logla
      if (Array.from(files).indexOf(file) < 5) {
        console.log('🔍 Dosya analizi:', {
          yol: path,
          parçalar: parts,
          uzantı: file.name.split('.').pop(),
          görselMi: isImageFile(file.name),
        })
      }

      // ürünler/kategori/model/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const urunIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('urunler') || key.includes('urun')
      })

      // Debug: İlk 3 dosya için detaylı log
      if (Array.from(files).indexOf(file) < 3) {
        console.log('🔍 Dosya #' + Array.from(files).indexOf(file), {
          yol: path,
          parts,
          urunIndex,
          partsLength: parts.length,
          gerekli: `urunIndex(${urunIndex}) + 4 = ${urunIndex + 4}`,
          kontrolSonucu: urunIndex !== -1 && parts.length >= urunIndex + 4,
          categoryFolder: urunIndex !== -1 ? parts[urunIndex + 1] : null,
          modelFolder: urunIndex !== -1 ? parts[urunIndex + 2] : null,
        })
      }

      if (urunIndex !== -1 && parts.length >= urunIndex + 4) {
        const categoryFolder = parts[urunIndex + 1]
        const modelFolder = parts[urunIndex + 2]

        // ÖLÇÜLER klasörünü kontrol et (ürünler/kategori/model/ÖLÇÜLER/dosya.jpg)
        // ÖLÇÜLER klasörü model klasöründen hemen sonra olmalı (index: urunIndex + 3)
        const olcuFolderIndex = urunIndex + 3
        const folderKey = slugify(parts[olcuFolderIndex] || '').replace(/-/g, '')
        const isOlcuFolder = folderKey.startsWith('olculer') || folderKey.startsWith('olcu')

        // İndirilebilir Dosyalar klasörü (ürünler/kategori/model/İndirilebilir Dosyalar/...)
        const isDownloadRoot =
          folderKey.includes('indirilebirdosyalar') ||
          folderKey.includes('indirilebilir') ||
          folderKey.includes('download')

        // ÖLÇÜLER klasöründeki dosyalar ayrı işlenecek
        // Dosya yolu: ürünler/kategori/model/ÖLÇÜLER/dosya.jpg (5 parça)
        const isDimensionFile = isOlcuFolder && parts.length >= urunIndex + 5

        // Debug: İlk eşleşme
        if (productMap.size === 0 || (isDimensionFile && productMap.size > 0)) {
          console.log('✅ Ürün dosyası bulundu!', {
            categoryFolder,
            modelFolder,
            dosya: file.name,
            olcuFolderName: parts[olcuFolderIndex],
            isOlcuFolder,
            isDimensionFile,
            partsLength: parts.length,
            requiredLength: urunIndex + 5,
          })
        }

        // Kategori adını çıkar: "01 - KANEPELER" -> "KANEPELER", ama "TAB - DRESUAR" -> "TAB - DRESUAR"
        let categoryName = categoryFolder.trim()
        if (categoryName.includes(' - ')) {
          const firstPart = categoryName.split(' - ')[0].trim()
          // Eğer ilk parça sadece rakam+nokta veya rakamsal bir diziyse split et, değilse tam ismi koru
          if (/^(\d+\.?)+$/.test(firstPart)) {
            categoryName = categoryName.split(' - ').slice(1).join(' - ').trim()
          }
        }
        const categoryId = slugify(categoryName)

        // Model adını çıkar: "TAB - DRESUAR" tam olarak korunmalı.
        let modelName = modelFolder.trim()
        if (modelName.includes(' - ')) {
          const firstPart = modelName.split(' - ')[0].trim()
          // Sadece sayısal ön ek varsa (Örn: "01 - ...") temizle, "TAB - ..." ise dokunma
          if (/^(\d+\.?)+$/.test(firstPart)) {
            modelName = modelName.split(' - ').slice(1).join(' - ').trim()
          }
        }
        
        const modelId = slugify(modelName)

        const productKey = `${categoryId}/${modelId}`
        if (productKey) {
          if (!productMap.has(productKey)) {
            productMap.set(productKey, {
              media: [],
              dimensionFiles: [],
              extraImages: [],
              drawingFiles: [],
              modelFiles: [],
            })
          }

          const productData = productMap.get(productKey)!

          // Hiyerarşi analizi
          const subPath = parts.slice(urunIndex + 3).map((p) => p.toLowerCase())
          const deviceType = subPath.includes('desktop')
            ? 'desktop'
            : subPath.includes('mobil')
              ? 'mobile'
              : 'all'

          if (subPath.includes('medya')) {
            const isCover = file.name.toLowerCase().includes('_kapak')
            productData.media.push({ file, device: deviceType, isCover })
          } else if (subPath.includes('olculer') || subPath.includes('olcu')) {
            productData.dimensionFiles.push(file)
          } else if (
            subPath.includes('indirilebirdosyalar') ||
            subPath.includes('indirilebilir') ||
            subPath.includes('download')
          ) {
            if (subPath.includes('ek') && subPath.includes('görsel'))
              productData.extraImages.push(file)
            else if (subPath.includes('teknik') || subPath.includes('çizim'))
              productData.drawingFiles.push(file)
            else if (subPath.includes('3d') || subPath.includes('model'))
              productData.modelFiles.push(file)
          } else {
            // Root seviyesindeki dosyalar veya bilinmeyen alt klasörler
            const isCover = file.name.toLowerCase().includes('_kapak')
            productData.media.push({ file, device: deviceType, isCover })
          }
        }
      }

      // tasarımcılar/tasarımcı-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const tasarimIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('tasarimcilar') || key.includes('tasarim')
      })

      // Debug: Tasarımcı bulunduğunda log
      if (
        tasarimIndex !== -1 &&
        parts.length >= tasarimIndex + 3 &&
        Array.from(files).indexOf(file) < 2
      ) {
        console.log('👤 Tasarımcı bulundu:', {
          parts,
          tasarimIndex,
          designerName: parts[tasarimIndex + 1],
        })
      }

      if (tasarimIndex !== -1 && parts.length >= tasarimIndex + 2) {
        const designerName = parts[tasarimIndex + 1]

        if (!designerMap.has(designerName)) {
          designerMap.set(designerName, [])
        }

        // Cihaz bazlı klasör yapısı desteği
        const subPath = parts.slice(tasarimIndex + 2).map(p => p.toLowerCase())
        if (subPath.includes('desktop')) {
          // Dosya adını sanitize etmeden önce cihaz bilgisini ekleyebiliriz (opsiyonel)
        }

        designerMap.get(designerName)!.push(file)
      }

      // malzemeler/grup-adı/kartela-adı/görsel.jpg (büyük/küçük harf duyarsız)
      const malzemeIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key === 'malzemeler' || key === 'malzeme'
      })

      if (malzemeIndex !== -1 && parts.length >= malzemeIndex + 4 && isMediaFile(file.name)) {
        const groupName = parts[malzemeIndex + 1]
        const bookName = parts[malzemeIndex + 2]

        if (!materialGroupMap.has(groupName)) {
          materialGroupMap.set(groupName, new Map())
        }

        const groupBooks = materialGroupMap.get(groupName)!
        if (!groupBooks.has(bookName)) {
          groupBooks.set(bookName, [])
        }

        groupBooks.get(bookName)!.push(file)

        // Debug: İlk malzeme bulunduğunda
        if (
          materialGroupMap.size === 1 &&
          groupBooks.size === 1 &&
          groupBooks.get(bookName)!.length === 1
        ) {
          console.log('🎨 İlk malzeme bulundu!', {
            groupName,
            bookName,
            dosya: file.name,
          })
        }
      }

      // projeler/proje-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const projeIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('projeler') || key.includes('proje') || key.includes('project')
      })

      if (projeIndex !== -1 && parts.length >= projeIndex + 2 && isMediaFile(file.name)) {
        const projectFolder = parts[projeIndex + 1]

        if (!projectMap.has(projectFolder)) {
          projectMap.set(projectFolder, {
            media: [],
            files: [],
          })
        }
        const projData = projectMap.get(projectFolder)!
        const subPath = parts.slice(projeIndex + 2).map((p) => p.toLowerCase())
        const deviceType = subPath.includes('desktop')
          ? 'desktop'
          : subPath.includes('mobil')
            ? 'mobile'
            : 'all'

        if (subPath.includes('medya')) {
          const isCover = file.name.toLowerCase().includes('_kapak')
          projData.media.push({ file, device: deviceType, isCover })
        } else if (subPath.includes('içerik blokları')) {
          const blokPart = subPath.find((p) => p.includes('blok'))
          const blokNum = blokPart ? parseInt(blokPart.replace(/[^0-9]/g, '')) : 1
          projData.media.push({ file, device: deviceType, contentBlock: blokNum })
        } else {
          const isCover = file.name.toLowerCase().includes('_kapak')
          projData.media.push({ file, device: deviceType, isCover })
        }
      }

      // kategoriler/kategori-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const kategoriIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('kategoriler') || key.includes('kategori') || key.includes('category')
      })

      if (kategoriIndex !== -1 && parts.length >= kategoriIndex + 3 && isMediaFile(file.name)) {
        const categoryFolder = parts[kategoriIndex + 1]
        let categoryName = categoryFolder.trim()
        if (categoryName.includes(' - ')) {
          const firstPart = categoryName.split(' - ')[0].trim()
          if (/^(\d+\.?)+$/.test(firstPart)) {
            categoryName = categoryName.split(' - ').slice(1).join(' - ').trim()
          }
        }
        const categoryId = slugify(categoryName)
        
        categories.set(categoryId, categoryName)

        if (!categoryMediaMap.has(categoryId)) {
          categoryMediaMap.set(categoryId, [])
        }
        categoryMediaMap.get(categoryId)!.push(file)

        // Debug: İlk kategori medyası bulunduğunda
        if (categoryMediaMap.size === 1 && categoryMediaMap.get(categoryId)!.length === 1) {
          console.log('📂 İlk kategori medyası bulundu!', {
            categoryName,
            dosya: file.name,
          })
        }
      }

      // haberler/haber-adı/görsel.jpg (büyük/küçük harf duyarsız)
      const haberIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('haberler') || key.includes('haber') || key.includes('news')
      })

      if (haberIndex !== -1 && parts.length >= haberIndex + 3 && isMediaFile(file.name)) {
        const newsFolder = parts[haberIndex + 1]
        if (!newsMap.has(newsFolder)) {
          newsMap.set(newsFolder, [])
        }
        newsMap.get(newsFolder)!.push(file)
      }

      // hakkimizda/bölüm-adı/görsel.jpg (büyük/küçük harf duyarsız)
      const hakkimizdaIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('hakkimizda') || key.includes('hakkimiz') || key.includes('about')
      })

      if (hakkimizdaIndex !== -1 && parts.length >= hakkimizdaIndex + 2 && isMediaFile(file.name)) {
        const subFolder = parts[hakkimizdaIndex + 1]?.toLowerCase() || ''
        if (subFolder.includes('hero')) aboutPageData.hero.push(file)
        else if (subFolder.includes('tarih') || subFolder.includes('history'))
          aboutPageData.history.push(file)
        else if (subFolder.includes('kimlik') || subFolder.includes('identity'))
          aboutPageData.identity.push(file)
        else if (subFolder.includes('kalite') || subFolder.includes('quality'))
          aboutPageData.quality.push(file)
        else if (parts.length === hakkimizdaIndex + 2) aboutPageData.hero.push(file) // Köktese hero kabul et
      }
    })

    // Map'leri dizilere çevir
    const designers = Array.from(designerMap.entries()).map(([name, files]) => ({
      id: slugify(name),
      name,
      files: files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
    }))

    const products = Array.from(productMap.entries()).map(([key, productData]) => {
      const [categoryId, modelId] = key.split('/')
      // Orijinal model adını bulmaya çalış (ilk dosyanın yolundan)
      const firstMedia = productData.media[0]?.file.webkitRelativePath || ''
      const pathParts = firstMedia.split('/')
      const modelIdx = pathParts.findIndex(p => slugify(p || '').replace(/-/g, '') === modelId.replace(/-/g, ''))
      const originalName = modelIdx !== -1 ? pathParts[modelIdx] : modelId.toUpperCase()

      return {
        categoryId,
        categoryName: categories.get(categoryId) || categoryId,
        modelId,
        modelName: originalName, // Slugified-uppercase yerine orijinal klasör adını kullan
        media: productData.media,
        dimensionFiles: productData.dimensionFiles.filter((f) => isMediaFile(f.name)),
        extraImages: productData.extraImages,
        drawingFiles: productData.drawingFiles,
        modelFiles: productData.modelFiles,
      }
    })

    const materialGroups = Array.from(materialGroupMap.entries()).map(([groupName, booksMap]) => ({
      groupName,
      books: Array.from(booksMap.entries()).map(([bookName, files]) => ({
        bookName,
        files: files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
      })),
    }))

    const projects = Array.from(projectMap.entries()).map(([projectFolder, projData]) => ({
      projectId: slugify(projectFolder),
      projectName: projectFolder,
      media: projData.media,
      files: projData.files.filter((f) => isMediaFile(f.name)),
    }))

    const categoryMedia = Array.from(categoryMediaMap.entries()).map(([categoryId, files]) => ({
      categoryId,
      categoryName: categories.get(categoryId) || categoryId,
      files: files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
    }))

    const newsItems = Array.from(newsMap.entries()).map(([newsFolder, files]) => ({
      newsId: slugify(newsFolder),
      newsName: newsFolder,
      files: files.filter((f) => isMediaFile(f.name)),
    }))

    return {
      categories,
      categoryMedia,
      designers,
      products,
      materialGroups,
      projects,
      newsItems,
      aboutPage: aboutPageData,
    }
  }, [])

  // Dosya yükleme handler'ı (Phase 1: SCAN)
  const handleFiles = useCallback(
    async (files: FileList) => {
      setIsProcessing(true)
      setProgress([])
      setScanResult(null)
      setScanReport(null)
      setViewMode('scan')

      try {
        console.log('📁 Tarama başlatılıyor, toplam dosya:', files.length)
        const data = parseDirectory(files)

        // Sanity'de bu kayıtlar var mı kontrol et (Pre-flight Scan)
        toast.push({
          status: 'info',
          title: 'Dökümanlar doğrulanıyor...',
          description: 'Klasör isimleri Sanity kayıtlarıyla eşleştiriliyor.'
        })

        const [allCategories, allDesigners, allProducts, allProjects, allMaterialGroups] = await Promise.all([
          client.fetch(`*[_type == "category"]{ _id, "slug": id.current, name }`),
          client.fetch(`*[_type == "designer"]{ _id, "slug": id.current, name }`),
          client.fetch(`*[_type == "product"]{ _id, "slug": id.current, name, "categorySlug": category->id.current }`),
          client.fetch(`*[_type == "project"]{ _id, "slug": id.current, name }`),
          client.fetch(`*[_type == "materialGroup"]{ _id, title, "nameTr": title.tr }`)
        ])

        // Sanity'de bu kayıtlar var mı kontrol et (Pre-flight Scan)
        
        const checkExists = (type: string, folderId: string, folderName: string, categoryId?: string) => {
          if (type === 'product') {
            const normalizedFolderName = normalizeForMatch(folderName)
            const superNormalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
            const superFolderId = superNormalize(folderId)

            const matches = allProducts.filter((p: any) => {
              // Süper Temizlik: Sadece a-z ve 0-9 arası karakterleri tut
              const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
              
              const sanityName = sanitize(p.name?.tr || p.name?.en || '')
              const sanitySlug = sanitize(p.slug || '')
              const folderClean = sanitize(folderId)
              const nameClean = sanitize(folderName)
              
              // 1. İsim veya Slug üzerinden tam temizlenmiş eşleşme
              return sanityName === nameClean || sanitySlug === folderClean || sanityName === folderClean
            })

            if (matches.length === 1) return true // Kesin eşleşme
            if (matches.length > 1) {
              // Birden fazla varsa kategoriye bak
              const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
              const targetCat = sanitize(categoryId || '')
              return matches.some((p: any) => sanitize(p.categorySlug) === targetCat || targetCat.includes(sanitize(p.categorySlug)))
            }
            return false

            if (matches.length === 1) return true // Sadece bir tane varsa, kategoriden bağımsız eşle
            if (matches.length > 1) {
              // Birden fazla varsa kategoriye bak
              return matches.some((p: any) => 
                p.categorySlug === categoryId || 
                p.categorySlug === normalizeText(categoryId || '') ||
                p.categorySlug?.includes(normalizeText(categoryId || ''))
              )
            }
            return false
          }
          if (type === 'category') {
            const normalized = normalizeForMatch(folderName)
            return allCategories.some((c: any) => 
              c.slug === folderId || 
              normalizeForMatch(c.name?.tr) === normalized || 
              normalizeForMatch(c.name?.en) === normalized
            )
          }
          if (type === 'designer') {
            const normalized = normalizeForMatch(folderName)
            return allDesigners.some((d: any) => 
              d.slug === folderId || 
              normalizeForMatch(d.name?.tr) === normalized || 
              normalizeForMatch(d.name?.en) === normalized
            )
          }
          if (type === 'project') {
            return allProjects.some((p: any) => p.slug === folderId || normalizeForMatch(p.name) === normalizeForMatch(folderName))
          }
          if (type === 'materialGroup') {
            const normalized = normalizeForMatch(folderName)
            return allMaterialGroups.some((g: any) => normalizeForMatch(g.nameTr) === normalized)
          }
          return false
        }

        const totalSize = Array.from(files).reduce((sum, f) => sum + f.size, 0)
        const totalMedia = 
          data.categoryMedia.reduce((sum, c) => sum + c.files.length, 0) +
          data.designers.reduce((sum, d) => sum + d.files.length, 0) +
          data.products.reduce((sum, p) => sum + p.media.length + p.dimensionFiles.length, 0) +
          data.projects.reduce((sum, p) => sum + p.media.length + p.files.length, 0) +
          data.aboutPage.hero.length + data.aboutPage.history.length + data.aboutPage.identity.length + data.aboutPage.quality.length +
          data.materialGroups.reduce((sum, g) => sum + g.books.reduce((bs, b) => bs + b.files.length, 0), 0)

        // Rapor oluştur
        const report: ScanReport = {
          totalFiles: files.length,
          totalSize,
          foundItems: {
            categories: data.categoryMedia.map(c => ({ 
              id: c.categoryId, 
              name: c.categoryName, 
              files: c.files.length, 
              exists: checkExists('category', c.categoryId, c.categoryName) 
            })),
            designers: data.designers.map(d => ({ 
              id: d.id, 
              name: d.name, 
              files: d.files.length, 
              exists: checkExists('designer', d.id, d.name) 
            })),
            products: data.products.map(p => ({ 
              id: p.modelId, 
              name: p.modelName, 
              files: p.media.length + p.dimensionFiles.length, 
              categoryId: p.categoryId, 
              exists: checkExists('product', p.modelId, p.modelName, p.categoryId) 
            })),
            projects: data.projects.map(p => ({ 
              id: p.projectId, 
              name: p.projectName, 
              files: p.media.length + p.files.length, 
              exists: checkExists('project', p.projectId, p.projectName) 
            })),
            materials: data.materialGroups.map(g => ({ 
              group: g.groupName, 
              books: g.books.length, 
              files: g.books.reduce((s, b) => s + b.files.length, 0), 
              exists: checkExists('materialGroup', '', g.groupName) 
            }))
          },
          issues: []
        }

        // Hataları ekle
        report.foundItems.products.forEach(p => {
          if (!p.exists) report.issues.push({ type: 'warning', message: `Eksik Ürün: ${p.name}`, subtext: 'Bu ürünü önce CMS\'den oluşturmalısınız.' })
        })
        report.foundItems.designers.forEach(d => {
          if (!d.exists) report.issues.push({ type: 'warning', message: `Eksik Tasarımcı: ${d.name}` })
        })

        setStats({
          categories: data.categoryMedia.length,
          designers: data.designers.length,
          products: data.products.length,
          projects: data.projects.length,
          images: totalMedia,
        })

        setScanResult(data)
        setScanReport(report)
        toast.push({
          status: 'success',
          title: 'Tarama tamamlandı',
          description: `Bulunan içerik hazır. Lütfen detayları inceleyip onaylayın.`
        })

      } catch (error: any) {
        console.error('Scan Error:', error)
        toast.push({ status: 'error', title: 'Tarama Hatası', description: error.message })
      } finally {
        setIsProcessing(false)
      }
    },
    [parseDirectory, toast, client],
  )

  // Sanity'ye yükleme (Phase 2: UPLOAD)
  const startUpload = async () => {
    if (!scanResult) return
    setIsProcessing(true)
    setViewMode('upload')
    setProgress([])
    
    try {
      await uploadToSanity(scanResult)
      setViewMode('summary')
      toast.push({ status: 'success', title: 'İşlem Başarıyla Tamamlandı!' })
    } catch (e: any) {
      toast.push({ status: 'error', title: 'Yükleme Hatası', description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const uploadToSanity = async (data: ParsedData) => {
    const newProgress: ProgressItem[] = []

    // Önce mevcut tasarımcıları ve ürünleri çek
    toast.push({
      status: 'info',
      title: 'Mevcut kayıtlar kontrol ediliyor...',
      description: "CMS'deki tasarımcılar ve ürünler sorgulanıyor",
    })

    const existingDesigners = await client.fetch(
      `*[_type == "designer"]{ _id, "slug": id.current, name }`,
    )
    const existingProducts = await client.fetch(`*[_type == "product"]{ 
      _id, 
      "slug": id.current, 
      name,
      "categorySlug": category->id.current,
      "categoryName": category->name
    }`)

    // Kategorileri de çek ve logla
    const existingCategories = await client.fetch(`*[_type == "category"]{ 
      _id, 
      "slug": id.current, 
      name 
    }`)

    console.log('📋 Mevcut kayıtlar:', {
      tasarımcılar: existingDesigners.length,
      ürünler: existingProducts.length,
      kategoriler: existingCategories.length,
    })

    console.log("📂 CMS'deki Kategoriler:")
    existingCategories.forEach((cat: any) => {
      console.log(`   - slug: "${cat.slug}" | ad: "${cat.name?.tr || cat.name?.en}"`)
    })

    // Kategori adından slug'a dönüşüm haritası oluştur
    const categoryNameToSlug = new Map<string, string>()
    existingCategories.forEach((cat: any) => {
      const nameTr = cat.name?.tr || ''
      const nameEn = cat.name?.en || ''
      if (nameTr) {
        // Hem normalize edilmiş hem de orijinal adı kaydet
        categoryNameToSlug.set(normalizeText(nameTr), cat.slug)
        categoryNameToSlug.set(nameTr.toLowerCase(), cat.slug)
      }
      if (nameEn) {
        categoryNameToSlug.set(normalizeText(nameEn), cat.slug)
        categoryNameToSlug.set(nameEn.toLowerCase(), cat.slug)
      }
    })

    console.log('🗺️ Kategori eşleme haritası:')
    categoryNameToSlug.forEach((slug, name) => {
      console.log(`   "${name}" -> "${slug}"`)
    })

    // 0. Kategori görsellerini yükle
    if (data.categoryMedia.length > 0) {
      toast.push({
        status: 'info',
        title: 'Kategori görselleri yükleniyor...',
        description: `${data.categoryMedia.length} kategori için görseller kontrol ediliyor`,
      })

      for (const categoryMedia of data.categoryMedia) {
        const item: ProgressItem = {
          type: 'category',
          name: categoryMedia.categoryName,
          status: 'uploading',
        }
        newProgress.push(item)
        setProgress([...newProgress])

        try {
          // Kategori adını CMS'deki slug'a çevir
          const normalizedCategoryName = normalizeText(categoryMedia.categoryName)
          const actualCategorySlug =
            categoryNameToSlug.get(normalizedCategoryName) ||
            categoryNameToSlug.get(categoryMedia.categoryName.toLowerCase()) ||
            categoryMedia.categoryId

          const matchingCategory = existingCategories.find(
            (c: any) =>
              c.slug === actualCategorySlug ||
              normalizeText(c.name?.tr || '') === normalizedCategoryName ||
              normalizeText(c.name?.en || '') === normalizedCategoryName,
          )

          if (matchingCategory) {
            await updateCategoryImages(client, matchingCategory._id, categoryMedia)
            item.status = 'success'
            item.message = 'Görseller güncellendi'
          } else {
            item.status = 'error'
            item.message = `CMS'de bulunamadı (${categoryMedia.categoryName}) - önce manuel oluşturun`
          }
        } catch (error: any) {
          item.status = 'error'
          item.message = error.message
        }
        setProgress([...newProgress])
      }
    }

    // 1. Tasarımcı görsellerini yükle (sadece görsel, kayıt oluşturmadan)
    for (const designer of data.designers) {
      const item: ProgressItem = {
        type: 'designer',
        name: designer.name,
        status: 'uploading',
      }
      newProgress.push(item)
      setProgress([...newProgress])

      try {
        // Mevcut tasarımcıyı bul
        const existing = existingDesigners.find(
          (d: any) =>
            d.slug === designer.id ||
            d.name?.tr?.toLowerCase() === designer.name.toLowerCase() ||
            d.name?.en?.toLowerCase() === designer.name.toLowerCase(),
        )

        if (existing) {
          await updateDesignerImages(client, existing._id, designer)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          item.status = 'error'
          item.message = "CMS'de bulunamadı - önce manuel oluşturun"
        }
      } catch (error: any) {
        item.status = 'error'
        item.message = error.message
      }
      setProgress([...newProgress])
    }

    // 2. Ürün görsellerini yükle (sadece görsel, kayıt oluşturmadan)
    for (const product of data.products) {
      const item: ProgressItem = {
        type: 'product',
        name: `${product.categoryName}/${product.modelName}`,
        status: 'uploading',
      }
      newProgress.push(item)
      setProgress([...newProgress])

      try {
        // Kategori adını CMS'deki slug'a çevir
        const normalizedCategoryName = normalizeText(product.categoryName)
        const actualCategorySlug =
          categoryNameToSlug.get(normalizedCategoryName) ||
          categoryNameToSlug.get(product.categoryName.toLowerCase()) ||
          product.categoryId

        console.log(
          `   🔍 ${product.categoryName}: "${product.categoryId}" -> "${actualCategorySlug}"`,
        )

        // Mevcut ürünü bul - Kategori ve model adı birlikte kontrol edilmeli
        const normalizedProductName = normalizeForMatch(product.modelName)
        const superNormalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
        const superFolderId = superNormalize(product.modelId)

        const matches = existingProducts.filter((p: any) => {
          const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
          const sanityName = sanitize(p.name?.tr || p.name?.en || '')
          const sanitySlug = sanitize(p.slug || '')
          const folderClean = sanitize(product.modelId)
          const nameClean = sanitize(product.modelName)

          return sanityName === nameClean || sanitySlug === folderClean || sanityName === folderClean
        })

        let existing = null
        if (matches.length === 1) {
          existing = matches[0]
        } else if (matches.length > 1) {
          const sanitize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
          const targetCat = sanitize(actualCategorySlug || '')
          existing = matches.find((p: any) => sanitize(p.categorySlug) === targetCat || targetCat.includes(sanitize(p.categorySlug)))
        }

        if (existing) {
          console.log(
            `   🎯 Eşleşme bulundu: ${existing.name?.tr} (Kategori: ${existing.categorySlug})`,
          )
          await updateProductImages(client, existing._id, product, importMode)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          console.log(`   ❌ Bulunamadı: ${product.categoryName}/${product.modelName}`)
          console.log(`   🔍 Aranan slug: "${productSlug}"`)
          console.log(
            `   🔍 Aranan categoryId: "${product.categoryId}", modelId: "${product.modelId}"`,
          )
          console.log(`   📊 CMS'deki benzer ürünler:`)
          existingProducts
            .filter((p: any) => {
              const nameMatch = normalizeForMatch(p.name?.tr) === normalizedProductName || 
                               normalizeForMatch(p.name?.en) === normalizedProductName
              return nameMatch
            })
            .forEach((p: any) => {
              console.log(
                `      - "${p.name?.tr}" | slug: "${p.slug}" | kategori: "${p.categorySlug}"`,
              )
            })
          item.status = 'error'
          item.message = `CMS'de bulunamadı (${product.categoryName}/${product.modelName}) - önce manuel oluşturun`
        }
      } catch (error: any) {
        console.error(`   ❌ Hata: ${product.categoryName}/${product.modelName}`, error)
        item.status = 'error'
        item.message = error.message
      }
      setProgress([...newProgress])
    }

    // Malzeme Grupları - CMS'deki mevcut grupları ve kartelaları bul ve eşleştir
    if (data.materialGroups.length > 0) {
      toast.push({
        status: 'info',
        title: 'Malzeme grupları kontrol ediliyor...',
        description: "CMS'deki malzeme grupları sorgulanıyor",
      })

      const existingMaterialGroups = await client.fetch(`*[_type == "materialGroup"]{ 
        _id, 
        title,
        books[]{ title, items }
      }`)

      for (const materialGroup of data.materialGroups) {
        const item: ProgressItem = {
          type: 'materialGroup',
          name: `${materialGroup.groupName}`,
          status: 'uploading',
        }
        newProgress.push(item)
        setProgress([...newProgress])

        try {
          // Grup adını normalize et ve karşılaştır
          const normalizedInputGroupName = normalizeText(materialGroup.groupName)

          const matchingGroup = existingMaterialGroups.find((g: any) => {
            const titleTr = normalizeText(g.title?.tr || '')
            const titleEn = normalizeText(g.title?.en || '')
            return titleTr === normalizedInputGroupName || titleEn === normalizedInputGroupName
          })

          if (!matchingGroup) {
            item.status = 'error'
            item.message = `CMS'de bu malzeme grubu bulunamadı - önce manuel oluşturun`
            console.log(`   ❌ Grup bulunamadı: ${materialGroup.groupName}`)
            setProgress([...newProgress])
            continue
          }

          console.log(`   🎨 Grup bulundu: ${matchingGroup.title?.tr}`)

          // Her kartela için
          for (const book of materialGroup.books) {
            const bookItem: ProgressItem = {
              type: 'materialBook',
              name: `${materialGroup.groupName} > ${book.bookName}`,
              status: 'uploading',
            }
            newProgress.push(bookItem)
            setProgress([...newProgress])

            try {
              // Kartela adını normalize et ve karşılaştır
              const normalizedInputBookName = normalizeText(book.bookName)

              const matchingBookIndex = (matchingGroup.books || []).findIndex((b: any) => {
                const titleTr = normalizeText(b.title?.tr || '')
                const titleEn = normalizeText(b.title?.en || '')
                return titleTr === normalizedInputBookName || titleEn === normalizedInputBookName
              })

              if (matchingBookIndex === -1) {
                bookItem.status = 'error'
                bookItem.message = `CMS'de bu kartela bulunamadı - önce manuel oluşturun`
                console.log(`   ❌ Kartela bulunamadı: ${book.bookName}`)
                setProgress([...newProgress])
                continue
              }

              console.log(
                `   📚 Kartela bulundu: ${matchingGroup.books[matchingBookIndex].title?.tr}`,
              )

              // Görselleri kartelaya ekle
              const existingItems = matchingGroup.books[matchingBookIndex].items || []
              const newItems = [...existingItems]

              let uploadedCount = 0
              for (const file of book.files) {
                try {
                  // R2'ye yükle
                  console.log(`   📸 Malzeme R2'ye yükleniyor: ${file.name}`)
                  const r2Url = await uploadToR2(
                    file,
                    `materials/${slugify(materialGroup.groupName)}/${slugify(book.bookName)}`,
                  )

                  // Dosya adından malzeme adını çıkar (uzantısız)
                  const materialName = file.name.replace(/\.[^/.]+$/, '')

                  const item: any = {
                    _type: 'productMaterial',
                    _key: `material-${Date.now()}-${Math.random()}`,
                    name: { tr: materialName, en: materialName },
                  }

                  if (r2Url) {
                    item.imageR2 = {
                      _type: 'r2Asset',
                      url: r2Url.url,
                      width: r2Url.width,
                      height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                    }
                  }

                  newItems.push(item)
                  uploadedCount++
                } catch (err: any) {
                  console.error(`   ❌ Görsel yüklenemedi: ${file.name}`, err)
                }
              }

              // Kartelayı güncelle
              if (uploadedCount > 0) {
                const updatedBooks = [...(matchingGroup.books || [])]
                updatedBooks[matchingBookIndex] = {
                  ...updatedBooks[matchingBookIndex],
                  items: newItems,
                }

                await client.patch(matchingGroup._id).set({ books: updatedBooks }).commit()
                bookItem.status = 'success'
                bookItem.message = `${uploadedCount} görsel eklendi`
                console.log(`   ✅ ${uploadedCount} görsel kartelaya eklendi`)
              } else {
                bookItem.status = 'error'
                bookItem.message = 'Hiçbir görsel yüklenemedi'
              }
            } catch (error: any) {
              console.error(`   ❌ Kartela hatası: ${book.bookName}`, error)
              bookItem.status = 'error'
              bookItem.message = error.message
            }
            setProgress([...newProgress])
          }

          item.status = 'success'
          item.message = `${materialGroup.books.length} kartela işlendi`
        } catch (error: any) {
          console.error(`   ❌ Grup hatası: ${materialGroup.groupName}`, error)
          item.status = 'error'
          item.message = error.message
        }
        setProgress([...newProgress])
      }
    }

    // 4. Proje görsellerini eşitle
    if (data.projects.length > 0) {
      toast.push({
        status: 'info',
        title: 'Projeler kontrol ediliyor...',
        description: "CMS'deki projeler sorgulanıyor",
      })

      const existingProjects = await client.fetch(`*[_type == "project"]{ 
        _id, 
        "slug": id.current, 
        "titleTr": title.tr,
        "titleEn": title.en
      }`)

      for (const project of data.projects) {
        const item: ProgressItem = {
          type: 'project',
          name: project.projectName,
          status: 'uploading',
        }
        newProgress.push(item)
        setProgress([...newProgress])

        try {
          // Proje adını normalize et ve karşılaştır
          const normalizedProjectName = normalizeText(project.projectName)

          const matchingProject = existingProjects.find((p: any) => {
            const titleTr = normalizeText(p.titleTr || '')
            const titleEn = normalizeText(p.titleEn || '')
            return (
              titleTr === normalizedProjectName ||
              titleEn === normalizedProjectName ||
              p.slug === project.projectId
            )
          })

          if (!matchingProject) {
            item.status = 'error'
            item.message = `CMS'de bu proje bulunamadı - önce manuel oluşturun`
            console.log(`   ❌ Proje bulunamadı: ${project.projectName}`)
            setProgress([...newProgress])
            continue
          }

          console.log(`   📁 Proje bulundu: ${matchingProject.titleTr || matchingProject.titleEn}`)

          // Proje medyasını eşitle
          await updateProjectMedia(client, matchingProject._id, project, importMode)

          item.status = 'success'
          item.message = 'Medya eşitlendi'
        } catch (error: any) {
          console.error(`   ❌ Proje hatası: ${project.projectName}`, error)
          item.status = 'error'
          item.message = error.message
        }
        setProgress([...newProgress])
      }
    }

    // 5. Haber medyalarını eşitle
    if (data.newsItems.length > 0) {
      toast.push({
        status: 'info',
        title: 'Haberler kontrol ediliyor...',
        description: "CMS'deki haberler sorgulanıyor",
      })

      const existingNews = await client.fetch(`*[_type == "newsItem"]{ 
        _id, 
        "slug": id.current, 
        "titleTr": title.tr
      }`)

      for (const news of data.newsItems) {
        const item: ProgressItem = {
          type: 'product',
          name: news.newsName,
          status: 'uploading',
        }
        newProgress.push(item)
        setProgress([...newProgress])

        try {
          const normalizedNewsName = normalizeText(news.newsName)
          const matchingNews = existingNews.find(
            (n: any) =>
              normalizeText(n.titleTr || '') === normalizedNewsName || n.slug === news.newsId,
          )

          if (matchingNews) {
            await updateNewsItemMedia(client, matchingNews._id, news)
            item.status = 'success'
            item.message = 'Görseller güncellendi'
          } else {
            item.status = 'error'
            item.message = "CMS'de bulunamadı"
          }
        } catch (error: any) {
          item.status = 'error'
          item.message = error.message
        }
        setProgress([...newProgress])
      }
    }

    // 6. Hakkımızda sayfası medyasını eşitle
    const hasAboutMedia =
      data.aboutPage.hero.length > 0 ||
      data.aboutPage.history.length > 0 ||
      data.aboutPage.identity.length > 0 ||
      data.aboutPage.quality.length > 0

    if (hasAboutMedia) {
      const item: ProgressItem = {
        type: 'category',
        name: 'Hakkımızda Sayfası',
        status: 'uploading',
      }
      newProgress.push(item)
      setProgress([...newProgress])

      try {
        const aboutDoc = await client.fetch(`*[_type == "aboutPage"][0]{ _id }`)
        if (aboutDoc) {
          await updateAboutPageMedia(client, aboutDoc._id, data.aboutPage)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          item.status = 'error'
          item.message = 'Hakkımızda sayfası dökümanı bulunamadı'
        }
      } catch (error: any) {
        item.status = 'error'
        item.message = error.message
      }
      setProgress([...newProgress])
    }

    const successCount = newProgress.filter((p) => p.status === 'success').length
    const errorCount = newProgress.filter((p) => p.status === 'error').length

    toast.push({
      status: successCount > 0 ? 'success' : 'warning',
      title: 'Yükleme tamamlandı!',
      description: `✅ ${successCount} başarılı, ❌ ${errorCount} hata`,
    })
  }

  /**
   * CMS'de referansı olmayan R2 dosyalarını temizle
   */
  const handleCleanup = async () => {
    if (
      !confirm(
        'CMS dökümanlarında kullanılmayan TÜM R2 dosyaları kalıcı olarak silinecektir.\n\nBu işlem geri alınamaz! Devam etmek istiyor musunuz?',
      )
    ) {
      return
    }

    setIsCleaning(true)
    try {
      // 1. Sanity'den kullanılan tüm R2 URL'lerini topla
      const query = `*[defined(imageR2.url) || defined(videoFileR2.url) || defined(fileR2.url) || defined(r2Asset.url) || defined(imageMobileR2.url) || defined(imageDesktopR2.url)] {
        imageR2,
        videoFileR2,
        fileR2,
        r2Asset,
        imageMobileR2,
        imageDesktopR2,
        videoFileMobileR2,
        videoFileDesktopR2,
        "mediaUrls": media[].imageR2.url,
        "mediaVideoUrls": media[].videoFileR2.url,
        "bottomMediaImageUrls": bottomMedia[].imageR2.url,
        "bottomMediaVideoUrls": bottomMedia[].videoFileR2.url,
        "exclusiveImageUrls": exclusiveContent.images[].r2Asset.url,
        "exclusiveDrawingUrls": exclusiveContent.drawings[].fileR2.url,
        "exclusiveModelUrls": exclusiveContent.models3d[].fileR2.url,
        "materialUrls": books[].items[].imageR2.url,
        "aboutHeroUrls": hero[].imageR2.url
      }`

      const docs = await client.fetch(query)
      const usedUrls = new Set<string>()

      const extractUrls = (val: any) => {
        if (!val) return
        if (typeof val === 'string') {
          usedUrls.add(val)
        } else if (Array.isArray(val)) {
          val.forEach(extractUrls)
        } else if (typeof val === 'object') {
          if (val.url) usedUrls.add(val.url)
          // Alt objeleri de tara (responsive versions vb.)
          Object.values(val).forEach(extractUrls)
        }
      }

      docs.forEach((doc: any) => {
        Object.values(doc).forEach(extractUrls)
      })

      console.log(`🔍 CMS'de kullanılan ${usedUrls.size} benzersiz medya dosyası bulundu.`)

      // 2. R2'deki tüm dosyaları listele
      let allObjects: any[] = []
      let continuationToken: string | undefined = undefined

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          ContinuationToken: continuationToken,
        })
        const response = await r2Client.send(listCommand)
        if (response.Contents) {
          allObjects = [...allObjects, ...response.Contents]
        }
        continuationToken = response.NextContinuationToken
      } while (continuationToken)

      console.log(`📦 R2'de toplam ${allObjects.length} dosya bulundu.`)

      // 3. Yetim dosyaları tespit et
      const orphanedKeys: string[] = []
      
      for (const obj of allObjects) {
        if (!obj.Key) continue
        const fullUrl = `${R2_DOMAIN}/${obj.Key}`
        
        // Eğer bu dosyanın tam hali kullanılıyorsa koru
        let isUsed = usedUrls.has(fullUrl)
        
        if (!isUsed) {
          // Eğer bir responsive varyasyon ise, ana dosyanın kullanılıp kullanılmadığına bak
          const variantSuffixes = ['-1600w.webp', '-800w.webp', '-400w.webp']
          const matchingSuffix = variantSuffixes.find(s => obj.Key.endsWith(s))
          
          if (matchingSuffix) {
            const mainKey = obj.Key.replace(matchingSuffix, '.webp')
            const mainUrl = `${R2_DOMAIN}/${mainKey}`
            if (usedUrls.has(mainUrl)) {
              isUsed = true
            }
          }
        }

        if (!isUsed) {
          orphanedKeys.push(obj.Key)
        }
      }

      if (orphanedKeys.length === 0) {
        toast.push({
          status: 'info',
          title: 'Temizlik Gerekli Değil',
          description: 'R2 üzerindeki tüm dosyalar CMS dökümanları tarafından kullanılmaktadır.',
        })
        return
      }

      if (!confirm(`${orphanedKeys.length} adet kullanılmayan dosya bulundu. Silinsin mi?`)) {
        setIsCleaning(false)
        return
      }

      // 4. Yetim dosyaları sil (1000'erli gruplar halinde)
      console.log(`🗑️ ${orphanedKeys.length} adet yetim dosya siliniyor...`)
      
      for (let i = 0; i < orphanedKeys.length; i += 1000) {
        const chunk = orphanedKeys.slice(i, i + 1000)
        await r2Client.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: {
              Objects: chunk.map(key => ({ Key: key })),
              Quiet: true
            }
          })
        )
      }

      toast.push({
        status: 'success',
        title: 'Temizlik Tamamlandı',
        description: `${orphanedKeys.length} adet kullanılmayan dosya R2'den silindi.`,
      })
    } catch (error: any) {
      console.error('Cleanup Error:', error)
      toast.push({
        status: 'critical',
        title: 'Temizlik Hatası',
        description: error.message,
      })
    } finally {
      setIsCleaning(false)
    }
  }

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const items = e.dataTransfer.items
      if (items && items.length > 0) {
        const item = items[0]
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry()
          if (entry && entry.isDirectory) {
            // Klasör bırakıldı
            readDirectory(entry as any).then((files) => {
              const fileList = createFileList(files)
              handleFiles(fileList)
            })
          }
        }
      }
    },
    [handleFiles],
  )

  // Klasör seçme butonu
  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles],
  )

  // Dahili yardımcı: Log ekle
  const addLog = (type: ProgressItem['type'], name: string, status: ProgressItem['status'], message?: string) => {
    setProgress(prev => [{ type, name, status, message, details: new Date().toLocaleTimeString() }, ...prev])
  }

  // UI RENDER: DASHBOARD
  return (
    <Card padding={4} tone="transparent">
      <Stack space={4}>
        {/* HEADER SECTION */}
        <Card padding={4} radius={3} shadow={1} tone="default">
          <Flex justify="space-between" align="center">
            <Stack space={3}>
              <Flex align="center" gap={3}>
                <Box style={{ fontSize: '2rem' }}>🚀</Box>
                <Stack space={2}>
                  <Text size={4} weight="bold">Medya İçe Aktarma Merkezi</Text>
                  <Text size={1} muted>Cloudflare R2 & Sanity Native Eşitleme Paneli</Text>
                </Stack>
              </Flex>
            </Stack>
            
            <Flex gap={3} align="center">
              {/* Import Mode Toggle */}
              <Card padding={1} radius={2} border tone="default">
                <Flex align="center">
                  <Button
                    size={1}
                    text="Eşitleme (Sync)"
                    mode={importMode === 'sync' ? 'default' : 'bleed'}
                    tone={importMode === 'sync' ? 'primary' : 'default'}
                    onClick={() => setImportMode('sync')}
                  />
                  <Button
                    size={1}
                    text="Sadece Ekle (Add)"
                    mode={importMode === 'add' ? 'default' : 'bleed'}
                    tone={importMode === 'add' ? 'primary' : 'default'}
                    onClick={() => setImportMode('add')}
                  />
                </Flex>
              </Card>

              {/* Pre-flight Indicator */}
              <Card padding={2} radius={2} tone={preflight.isAllOk ? 'positive' : 'critical'} border>
                <Flex align="center" gap={2}>
                  <Box style={{ fontSize: '1rem' }}>{preflight.isAllOk ? '✅' : '❌'}</Box>
                  <Text size={1} weight="semibold">R2 Bağlantısı: {preflight.isAllOk ? 'Hazır' : 'Hatalı'}</Text>
                </Flex>
              </Card>
              
              <Button
                fontSize={2}
                padding={3}
                text={isCleaning ? 'Temizleniyor...' : 'Gereksiz Dosyaları Temizle'}
                tone="critical"
                onClick={handleCleanup}
                disabled={isProcessing || isCleaning}
                loading={isCleaning}
                mode="ghost"
              />
            </Flex>
          </Flex>
        </Card>

        {/* MAIN AREA */}
        <Grid columns={[1, 1, 1, 12]} gap={4}>
          {/* LEFT COLUMN: SCAN & STATS (8 columns) */}
          <Box column={[1, 1, 1, 8]}>
            <Stack space={4}>
              {/* DROPZONE */}
              <Card
                padding={5}
                radius={3}
                shadow={isDragging ? 3 : 1}
                tone={isDragging ? 'primary' : 'default'}
                style={{
                  border: isDragging ? '2px dashed #2276fc' : '2px dashed #ccc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? 'rgba(34, 118, 252, 0.05)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Stack space={4}>
                  <Flex justify="center" style={{ fontSize: '3rem' }}>
                    {isProcessing ? '⌛' : (scanReport ? '📋' : '📁')}
                  </Flex>
                  <Stack space={2}>
                    <Text size={3} weight="bold">
                      {isProcessing ? 'Taranıyor...' : (scanReport ? 'Tarama Tamamlandı' : 'Klasörünüzü buraya bırakın')}
                    </Text>
                    <Text size={1} muted>
                      {scanReport ? `${scanReport.totalFiles} dosya bulundu (~${(scanReport.totalSize / 1024 / 1024).toFixed(1)} MB)` : 'Ürünler, Tasarımcılar ve Projeler içeren medya klasörü'}
                    </Text>
                  </Stack>
                  <Flex justify="center" gap={2}>
                    <Button
                      text={scanReport ? "Yeni Klasör Seç" : "Klasör Seç"}
                      icon={FolderIcon}
                      tone="primary"
                      onClick={() => document.getElementById('folder-input')?.click()}
                      disabled={isProcessing}
                      mode={scanReport ? 'outline' : 'default'}
                    />
                    {scanReport && !isProcessing && (
                      <Button
                        text="YÜKLEMEYİ BAŞLAT"
                        icon={UploadIcon}
                        tone="positive"
                        fontSize={3}
                        padding={4}
                        onClick={startUpload}
                        disabled={!preflight.isAllOk}
                      />
                    )}
                  </Flex>
                  <input id="folder-input" type="file" {...{ webkitdirectory: '', directory: '' }} multiple style={{ display: 'none' }} onChange={handleFolderSelect} />
                </Stack>
              </Card>

              {/* STAT CARDS (Only after scan) */}
              {scanReport && (
                <Grid columns={4} gap={3}>
                  <Card padding={3} radius={2} border>
                    <Stack space={2}>
                      <Text size={1} muted>📂 Kategoriler</Text>
                      <Text size={3} weight="bold">{stats.categories}</Text>
                    </Stack>
                  </Card>
                  <Card padding={3} radius={2} border>
                    <Stack space={2}>
                      <Text size={1} muted>👤 Tasarımcılar</Text>
                      <Text size={3} weight="bold">{stats.designers}</Text>
                    </Stack>
                  </Card>
                  <Card padding={3} radius={2} border>
                    <Stack space={2}>
                      <Text size={1} muted>📦 Ürünler</Text>
                      <Text size={3} weight="bold">{stats.products}</Text>
                    </Stack>
                  </Card>
                  <Card padding={3} radius={2} border>
                    <Stack space={2}>
                      <Text size={1} muted>🖼️ Medya</Text>
                      <Text size={3} weight="bold">{stats.images}</Text>
                    </Stack>
                  </Card>
                </Grid>
              )}

              {/* LOGS / PROGRESS */}
              {progress.length > 0 && (
                <Card padding={4} radius={3} shadow={1} border>
                  <Stack space={4}>
                    <Flex justify="space-between" align="center">
                      <Text size={2} weight="bold">🚀 Canlı İşlem Günlüğü</Text>
                      <Flex gap={1}>
                        <Button size={1} text="Tümü" mode={filterMode === 'all' ? 'default' : 'bleed'} onClick={() => setFilterMode('all')} />
                        <Button size={1} text="Hatalar" tone="critical" mode={filterMode === 'error' ? 'default' : 'bleed'} onClick={() => setFilterMode('error')} />
                        <Button size={1} text="Başarılı" tone="positive" mode={filterMode === 'success' ? 'default' : 'bleed'} onClick={() => setFilterMode('success')} />
                      </Flex>
                    </Flex>
                    <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Stack space={2}>
                        {progress
                          .filter(p => filterMode === 'all' || (filterMode === 'error' && p.status === 'error') || (filterMode === 'success' && p.status === 'success'))
                          .map((item, idx) => (
                          <Card key={idx} padding={2} radius={2} tone={item.status === 'error' ? 'critical' : (item.status === 'success' ? 'positive' : 'default')} border>
                            <Flex align="center" justify="space-between">
                              <Flex align="center" gap={3}>
                                <Box style={{ fontSize: '1.2rem' }}>
                                  {item.status === 'success' ? '✅' : (item.status === 'error' ? '❌' : (item.status === 'warning' ? '⚠️' : '⏳'))}
                                </Box>
                                <Stack space={2}>
                                  <Text size={1} weight="bold">
                                    {item.type.toUpperCase()}: {item.name}
                                  </Text>
                                  {item.message && <Text size={0} muted>{item.message}</Text>}
                                </Stack>
                              </Flex>
                              <Text size={0} muted>{item.details}</Text>
                            </Flex>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Box>

          {/* RIGHT COLUMN: PRE-SCAN REPORT & GUIDE (4 columns) */}
          <Box column={[1, 1, 1, 4]}>
            <Stack space={4}>
              {/* PRE-FLIGHT ISSUES */}
              {scanReport && scanReport.issues.length > 0 && (
                <Card padding={4} radius={3} tone="caution" shadow={1} border>
                  <Stack space={3}>
                    <Text size={2} weight="bold">⚠️ Dikkat Edilmesi Gerekenler ({scanReport.issues.length})</Text>
                    <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <Stack space={2}>
                        {scanReport.issues.slice(0, 50).map((issue, i) => (
                          <Stack key={i} space={1} style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Text size={1} weight="semibold" tone={issue.type === 'error' ? 'critical' : 'caution'}>
                              {issue.message}
                            </Text>
                            {issue.subtext && <Text size={0} muted>{issue.subtext}</Text>}
                          </Stack>
                        ))}
                        {scanReport.issues.length > 50 && <Text size={0} muted>...ve {scanReport.issues.length - 50} daha fazla uyarı.</Text>}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              )}

              {/* R2 CONFIG CHECK */}
              {!preflight.isAllOk && (
                <Card padding={4} radius={3} tone="critical" shadow={1} border>
                  <Stack space={3}>
                    <Text size={2} weight="bold">❌ Eksik Yapılandırma</Text>
                    <Text size={1}>R2 bağlantısı için .env dosyasındaki şu alanları kontrol edin:</Text>
                    <Stack space={2}>
                      {!preflight.accountId && <Text size={1} style={{ color: 'red' }}>• R2_ACCOUNT_ID</Text>}
                      {!preflight.accessKey && <Text size={1} style={{ color: 'red' }}>• R2_ACCESS_KEY_ID</Text>}
                      {!preflight.secretKey && <Text size={1} style={{ color: 'red' }}>• R2_SECRET_ACCESS_KEY</Text>}
                      {!preflight.bucket && <Text size={1} style={{ color: 'red' }}>• R2_BUCKET_NAME</Text>}
                      {!preflight.domain && <Text size={1} style={{ color: 'red' }}>• R2_DOMAIN</Text>}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* GUIDE */}
              <Card padding={4} radius={3} tone="transparent" shadow={0} border style={{ borderStyle: 'dashed' }}>
                <Stack space={3}>
                  <Text size={2} weight="bold">ℹ️ Nasıl Çalışır?</Text>
                  <Text size={1} style={{ lineHeight: '1.6' }}>
                    1. **Tara:** Klasörü bırakın, sistem dökümanları eşleştirsin.<br/>
                    2. **İncele:** Eksik dökümanları veya hatalı isimleri rapor panelinden kontrol edin.<br/>
                    3. **Onayla:** Her şey hazırsa yüklemeyi başlatın.
                  </Text>
                  <Box style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }} />
                  <Text size={1} weight="semibold">İsimlendirme İpucu:</Text>
                  <Text size={1} muted>
                    Ürün kapakları için dosya sonuna <b>_kapak</b> ekleyin. Mobil versiyonlar için <b>_mobil</b> etiketini kullanın.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Box>
        </Grid>
      </Stack>
    </Card>
  )
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i', // Türkçe noktasız I -> i
    İ: 'i',
    i: 'i', // Türkçe noktalı İ -> i
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
  // Türkçe karakterleri düzleştir, harf/rakam ve "_" dışındaki her şeyi "-" yap
  // Böylece "PUF_1" -> "puf_1" olur, alt çizgi korunur
  return result
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '-') // "_" izinli, diğer özel karakterler "-"
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Karşılaştırma için normalize et (tireler ve boşluklar olmadan)
const normalizeForMatch = (str: string) => slugify(str || '').replace(/-/g, '')

function normalizeText(text: string): string {
  return normalizeForMatch(text).replace(/\s+/g, '')
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '')
}

function isVideoFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext || '')
}

function isMediaFile(filename: string): boolean {
  return isImageFile(filename) || isVideoFile(filename)
}

async function readDirectory(entry: any): Promise<File[]> {
  const files: File[] = []

  async function readEntries(dirEntry: any, path = ''): Promise<void> {
    return new Promise((resolve) => {
      const reader = dirEntry.createReader()
      reader.readEntries(async (entries: any[]) => {
        for (const entry of entries) {
          if (entry.isFile) {
            const file: File = await new Promise((res) => entry.file(res))
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + entry.name,
            })
            files.push(file)
          } else if (entry.isDirectory) {
            await readEntries(entry, path + entry.name + '/')
          }
        }
        resolve()
      })
    })
  }

  await readEntries(entry, entry.name + '/')
  return files
}

function createFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer()
  files.forEach((file) => dataTransfer.items.add(file))
  return dataTransfer.files
}

// ============================================================================
// SANITY UPLOAD FONKSİYONLARI (SADECE GÖRSEL GÜNCELLEMESİ)
// ============================================================================

/**
 * Tasarımcı için mevcut görselleri kontrol et
 */
async function checkExistingDesignerAssets(client: any, designerId: string) {
  const designer = await client.fetch(
    `*[_id == $designerId][0]{
    image{asset->{_id, originalFilename, sha1hash}},
    imageMobile{asset->{_id, originalFilename, sha1hash}},
    imageDesktop{asset->{_id, originalFilename, sha1hash}},
    imageR2, imageMobileR2, imageDesktopR2
  }`,
    { designerId },
  )

  const existingHashes = new Set<string>()
  const existingFilenames = new Set<string>()

  if (designer?.image?.asset) {
    if (designer.image.asset.sha1hash) existingHashes.add(designer.image.asset.sha1hash)
    if (designer.image.asset.originalFilename)
      existingFilenames.add(designer.image.asset.originalFilename)
  }
  if (designer?.imageMobile?.asset) {
    if (designer.imageMobile.asset.sha1hash) existingHashes.add(designer.imageMobile.asset.sha1hash)
    if (designer.imageMobile.asset.originalFilename)
      existingFilenames.add(designer.imageMobile.asset.originalFilename)
  }
  if (designer?.imageDesktop?.asset) {
    if (designer.imageDesktop.asset.sha1hash)
      existingHashes.add(designer.imageDesktop.asset.sha1hash)
    if (designer.imageDesktop.asset.originalFilename)
      existingFilenames.add(designer.imageDesktop.asset.originalFilename)
  }

  return { existingHashes, existingFilenames, designer }
}

/**
 * Sadece tasarımcı görsellerini günceller (yeni kayıt oluşturmaz)
 */
async function updateDesignerImages(
  client: any,
  designerId: string,
  designer: { id: string; name: string; files: File[] },
) {
  // Mevcut görselleri kontrol et
  const designerData = await checkExistingDesignerAssets(client, designerId)

  const generalImage = designer.files.find(
    (f) => !f.name.toLowerCase().includes('_mobil') && !f.name.toLowerCase().includes('_desktop'),
  )
  const mobileImage = designer.files.find(
    (f) => f.name.toLowerCase().includes('_mobil') && !f.name.toLowerCase().includes('_desktop'),
  )
  const desktopImage = designer.files.find((f) => f.name.toLowerCase().includes('_desktop'))

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  if (generalImage) {
    // Eğer R2 görseli yoksa VEYA Sanity görseli hala duruyorsa yükle/migrate et
    if (!designerData.designer?.imageR2 || designerData.designer?.image) {
      console.log(`   📤 Genel görsel R2'ye yükleniyor: ${generalImage.name}`)
      const r2Url = await uploadToR2(generalImage, `designers/${slugify(designer.name)}`)

      if (r2Url) {
        updates.imageR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('image') // Sanitydeki görseli kaldır
        hasChanges = true
      }
    }
  }

  if (mobileImage) {
    if (!designerData.designer?.imageMobileR2 || designerData.designer?.imageMobile) {
      console.log(`   📱 Mobil görsel R2'ye yükleniyor: ${mobileImage.name}`)
      const r2Url = await uploadToR2(mobileImage, `designers/${slugify(designer.name)}`)

      if (r2Url) {
        updates.imageMobileR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('imageMobile')
        hasChanges = true
      }
    }
  }

  if (desktopImage) {
    if (!designerData.designer?.imageDesktopR2 || designerData.designer?.imageDesktop) {
      console.log(`   💻 Desktop görsel R2'ye yükleniyor: ${desktopImage.name}`)
      const r2Url = await uploadToR2(desktopImage, `designers/${slugify(designer.name)}`)

      if (r2Url) {
        updates.imageDesktopR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('imageDesktop')
        hasChanges = true
      }
    }
  }

  // Sadece görselleri güncelle
  if (hasChanges) {
    const patch = client.patch(designerId).set(updates)
    if (unsetFields.length > 0) {
      patch.unset(unsetFields).commit()
    } else {
      patch.commit()
    }
    console.log(`   ✅ R2'ye taşındı ve Sanity temizlendi`)
  } else {
    console.log(`   ℹ️ Tüm görseller zaten mevcut, güncelleme yapılmadı`)
  }
}

/**
 * Sanity'deki mevcut görselleri kontrol et
 */
async function checkExistingAssets(client: any, productId: string) {
  const product = await client.fetch(
    `*[_id == $productId][0]{
    mainImage{asset->{_id, originalFilename, sha1hash}},
    mainImageR2,
    mainImageMobile{asset->{_id, originalFilename, sha1hash}},
    mainImageMobileR2,
    mainImageDesktop{asset->{_id, originalFilename, sha1hash}},
    mainImageDesktopR2,
    dimensionImages[]{
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      imageMobile{asset->{_id, originalFilename, sha1hash}},
      imageMobileR2,
      imageDesktop{asset->{_id, originalFilename, sha1hash}},
      imageDesktopR2
    },
    media[]{
      ...,
      type,
      isCover,
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      imageMobile{asset->{_id, originalFilename, sha1hash}},
      imageMobileR2,
      imageDesktop{asset->{_id, originalFilename, sha1hash}},
      imageDesktopR2,
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileR2,
      videoFileMobile{asset->{_id, originalFilename, sha1hash}},
      videoFileMobileR2,
      videoFileDesktop{asset->{_id, originalFilename, sha1hash}},
      videoFileDesktopR2
    },
    exclusiveContent{
      images[]{
        asset->{_id, originalFilename, sha1hash},
        r2Asset
      },
      drawings[]{
        name,
        file{asset->{_id, originalFilename, sha1hash}},
        fileR2
      },
      models3d[]{
        name,
        file{asset->{_id, originalFilename, sha1hash}},
        fileR2
      }
    },
    bottomMedia[]{
      ...,
      type,
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      imageMobile{asset->{_id, originalFilename, sha1hash}},
      imageMobileR2,
      imageDesktop{asset->{_id, originalFilename, sha1hash}},
      imageDesktopR2,
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileR2,
      videoFileMobile{asset->{_id, originalFilename, sha1hash}},
      videoFileMobileR2,
      videoFileDesktop{asset->{_id, originalFilename, sha1hash}},
      videoFileDesktopR2
    }
  }`,
    { productId },
  )

  const existingHashes = new Set<string>()
  const existingFilenames = new Set<string>()

  if (product?.mainImage?.asset) {
    if (product.mainImage.asset.sha1hash) existingHashes.add(product.mainImage.asset.sha1hash)
    if (product.mainImage.asset.originalFilename)
      existingFilenames.add(product.mainImage.asset.originalFilename)
  }
  if (product?.mainImageMobile?.asset) {
    if (product.mainImageMobile.asset.sha1hash)
      existingHashes.add(product.mainImageMobile.asset.sha1hash)
    if (product.mainImageMobile.asset.originalFilename)
      existingFilenames.add(product.mainImageMobile.asset.originalFilename)
  }
  if (product?.mainImageDesktop?.asset) {
    if (product.mainImageDesktop.asset.sha1hash)
      existingHashes.add(product.mainImageDesktop.asset.sha1hash)
    if (product.mainImageDesktop.asset.originalFilename)
      existingFilenames.add(product.mainImageDesktop.asset.originalFilename)
  }

  // Mevcut dimensionImages array'ini koru
  const existingDimensionImages: any[] = []
  if (product?.dimensionImages) {
    product.dimensionImages.forEach((item: any) => {
      if (item?.image?.asset) {
        if (item.image.asset.sha1hash) existingHashes.add(item.image.asset.sha1hash)
        if (item.image.asset.originalFilename)
          existingFilenames.add(item.image.asset.originalFilename)
      }
      if (item?.imageMobile?.asset) {
        if (item.imageMobile.asset.sha1hash) existingHashes.add(item.imageMobile.asset.sha1hash)
        if (item.imageMobile.asset.originalFilename)
          existingFilenames.add(item.imageMobile.asset.originalFilename)
      }
      if (item?.imageDesktop?.asset) {
        if (item.imageDesktop.asset.sha1hash) existingHashes.add(item.imageDesktop.asset.sha1hash)
        if (item.imageDesktop.asset.originalFilename)
          existingFilenames.add(item.imageDesktop.asset.originalFilename)
      }
      existingDimensionImages.push(item)
    })
  }

  // Mevcut media array'ini koru
  const existingMediaArray: any[] = []
  if (product?.media) {
    product.media.forEach((item: any) => {
      if (item?.image?.asset) {
        if (item.image.asset.sha1hash) existingHashes.add(item.image.asset.sha1hash)
        if (item.image.asset.originalFilename)
          existingFilenames.add(item.image.asset.originalFilename)
      }
      if (item?.imageMobile?.asset) {
        if (item.imageMobile.asset.sha1hash) existingHashes.add(item.imageMobile.asset.sha1hash)
        if (item.imageMobile.asset.originalFilename)
          existingFilenames.add(item.imageMobile.asset.originalFilename)
      }
      if (item?.imageDesktop?.asset) {
        if (item.imageDesktop.asset.sha1hash) existingHashes.add(item.imageDesktop.asset.sha1hash)
        if (item.imageDesktop.asset.originalFilename)
          existingFilenames.add(item.imageDesktop.asset.originalFilename)
      }
      if (item?.videoFile?.asset) {
        if (item.videoFile.asset.sha1hash) existingHashes.add(item.videoFile.asset.sha1hash)
        if (item.videoFile.asset.originalFilename)
          existingFilenames.add(item.videoFile.asset.originalFilename)
      }
      if (item?.videoFileMobile?.asset) {
        if (item.videoFileMobile.asset.sha1hash)
          existingHashes.add(item.videoFileMobile.asset.sha1hash)
        if (item.videoFileMobile.asset.originalFilename)
          existingFilenames.add(item.videoFileMobile.asset.originalFilename)
      }
      if (item?.videoFileDesktop?.asset) {
        if (item.videoFileDesktop.asset.sha1hash)
          existingHashes.add(item.videoFileDesktop.asset.sha1hash)
        if (item.videoFileDesktop.asset.originalFilename)
          existingFilenames.add(item.videoFileDesktop.asset.originalFilename)
      }
      existingMediaArray.push(item)
    })
  }

  // Mevcut exclusiveContent alanlarını koru
  const existingExclusiveImages: any[] = []
  const existingDrawings: any[] = []
  const existingModels3d: any[] = []

  if (product?.exclusiveContent) {
    // Ek Görseller (sadece görseller)
    if (product.exclusiveContent.images) {
      product.exclusiveContent.images.forEach((img: any) => {
        if (img?.asset) {
          if (img.asset.sha1hash) existingHashes.add(img.asset.sha1hash)
          if (img.asset.originalFilename) existingFilenames.add(img.asset.originalFilename)
        }
        existingExclusiveImages.push(img)
      })
    }

    // Teknik Çizimler (indirilebilir dosya)
    if (product.exclusiveContent.drawings) {
      product.exclusiveContent.drawings.forEach((item: any) => {
        if (item?.file?.asset) {
          if (item.file.asset.sha1hash) existingHashes.add(item.file.asset.sha1hash)
          if (item.file.asset.originalFilename)
            existingFilenames.add(item.file.asset.originalFilename)
        }
        existingDrawings.push(item)
      })
    }

    // 3D Modeller (indirilebilir dosya)
    if (product.exclusiveContent.models3d) {
      product.exclusiveContent.models3d.forEach((item: any) => {
        if (item?.file?.asset) {
          if (item.file.asset.sha1hash) existingHashes.add(item.file.asset.sha1hash)
          if (item.file.asset.originalFilename)
            existingFilenames.add(item.file.asset.originalFilename)
        }
        existingModels3d.push(item)
      })
    }
  }

  // Mevcut bottomMedia array'ini koru
  const existingBottomMedia: any[] = []
  if (product?.bottomMedia) {
    product.bottomMedia.forEach((item: any) => {
      const checkAsset = (asset: any) => {
        if (asset) {
          if (asset.sha1hash) existingHashes.add(asset.sha1hash)
          if (asset.originalFilename) existingFilenames.add(asset.originalFilename)
        }
      }
      checkAsset(item?.image?.asset)
      checkAsset(item?.imageMobile?.asset)
      checkAsset(item?.imageDesktop?.asset)
      checkAsset(item?.videoFile?.asset)
      checkAsset(item?.videoFileMobile?.asset)
      checkAsset(item?.videoFileDesktop?.asset)
      existingBottomMedia.push(item)
    })
  }

  return {
    existingHashes,
    existingFilenames,
    existingDimensionImages,
    existingMediaArray,
    existingBottomMedia,
    existingExclusiveImages,
    existingDrawings,
    existingModels3d,
    product,
  }
}

/**
 * Dosya hash'ini hesapla
 */
async function getFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Görselin daha önce yüklenip yüklenmediğini kontrol et
 */
async function isAssetAlreadyUploaded(
  client: any,
  file: File,
  existingHashes: Set<string>,
  existingFilenames: Set<string>,
): Promise<boolean> {
  // Önce dosya adına bak (hızlı kontrol)
  if (existingFilenames.has(file.name)) {
    console.log(`   ⏭️ Atlandı (zaten var): ${file.name}`)
    return true
  }

  // Hash hesapla ve kontrol et (daha güvenilir)
  const hash = await getFileHash(file)
  if (existingHashes.has(hash)) {
    console.log(`   ⏭️ Atlandı (hash eşleşti): ${file.name}`)
    return true
  }

  return false
}

/**
 * Ürün görsellerini klasörle eşitler (sync)
 * - Klasörde olmayan CMS görsellerini siler
 * - CMS'de olmayan klasör görsellerini ekler
 * - Her ikisinde de olan görselleri korur
 */
async function updateProductImages(client: any, productId: string, product: any, mode: 'sync' | 'add' = 'sync') {
  // Mevcut görselleri kontrol et
  const productData = await checkExistingAssets(client, productId)
  const {
    existingHashes,
    existingFilenames,
    existingDimensionImages,
    existingMediaArray,
    existingBottomMedia,
    existingExclusiveImages,
    existingDrawings,
    existingModels3d,
    product: cmsProduct,
  } = productData

  // Ölçü görselleri: ÖLÇÜLER klasöründeki dosyalar
  const dimensionImages = product.dimensionFiles || []

  // İndirilebilir içerikler: İndirilebilir Dosyalar klasöründen
  const extraImagesFiles: File[] = product.extraImages || []
  const drawingFiles: File[] = product.drawingFiles || []
  const modelFiles: File[] = product.modelFiles || []

  // Medya (hem görsel hem video)
  const allMedia = product.media || []
  const panelMedia: File[] = []
  const incomingMedia: typeof allMedia = []

  allMedia.forEach((m) => {
    if (m.file.name.toLowerCase().includes('_panel')) {
      panelMedia.push(m.file)
    } else {
      incomingMedia.push(m)
    }
  })

  const updates: any = {}
  const unsetFields: string[] = mode === 'sync' ? ['mainImage', 'mainImageR2', 'mainImageMobile', 'mainImageMobileR2', 'mainImageDesktop', 'mainImageDesktopR2', 'alternativeMedia'] : []
  let hasChanges = false

  // ============================================
  // 1. MEDYAYI EŞİTLE (Görsel + Video + Cover)
  // ============================================

  const folderMediaHashes = new Set<string>()
  const folderMediaMap = new Map<string, { file: File; isVideo: boolean; device: string; isCover: boolean }>()

  console.log(`   🖼️ ${incomingMedia.length} klasör medyası hash'leniyor...`)
  for (const media of incomingMedia) {
    try {
      const hash = await getFileHash(media.file)
      folderMediaHashes.add(hash)
      folderMediaMap.set(hash, {
        file: media.file,
        isVideo: isVideoFile(media.file.name),
        device: media.device,
        isCover: !!media.isCover
      })
    } catch (error) {
      console.error(`   ❌ Hash hesaplanamadı: ${media.file.name}`, error)
    }
  }

  // CMS'deki medyanın hash'lerini topla
  const cmsMediaHashes = new Set<string>()
  const cmsMediaMap = new Map<string, any>()

  for (const mediaItem of existingMediaArray) {
    let hash: string | null = null
    if (mediaItem?.image?.asset?.sha1hash) hash = mediaItem.image.asset.sha1hash
    if (mediaItem?.videoFile?.asset?.sha1hash) hash = mediaItem.videoFile.asset.sha1hash
    if (mediaItem?.imageR2?.url) {
       // R2 asset'lerde hash yoksa filename veya url bazlı eşleşme denenebilir ama hash en iyisi
       // Zaten R2'ye yüklenirken orjinal hash Sanity'de saklanmıyor (R2 asset tipi basit)
       // Bu yüzden hash set'ine orjinal dosya adı/boyut kombinasyonu gibi bir şey eklesek iyi olurdu
    }
    if (hash) {
      cmsMediaHashes.add(hash)
      cmsMediaMap.set(hash, mediaItem)
    }
  }

  const syncedMedia: any[] = []

  // 1. Klasördeki medyayı ekle
  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo, device, isCover } = mediaInfo

    if (cmsMediaHashes.has(hash)) {
      // Her ikisinde de var - koru ve isCover durumunu güncelle eğer değişmişse
      const existingItem = cmsMediaMap.get(hash)
      const updatedItem = { ...existingItem, isCover }
      
      // Eğer görsel ise ve R2 alanı yoksa migrate et
      const isImg = !isVideo && (updatedItem.type === 'image' || updatedItem.image)
      const isVid = isVideo && (updatedItem.type === 'video' || updatedItem.videoFile)

      if ((isImg && !updatedItem.imageR2) || (isVid && !updatedItem.videoFileR2)) {
          console.log(`   🔄 Mevcut ${isVideo ? 'video' : 'görsel'} R2'ye taşınıyor: ${file.name}`)
          const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}`)
          if (r2Url) {
              if (isVideo) {
                  updatedItem.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
                  updatedItem.videoFile = null
              } else {
                  updatedItem.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height, hasResponsiveSizes: r2Url.hasResponsiveSizes }
                  updatedItem.image = null
              }
          }
      }

      syncedMedia.push(resolveKey(updatedItem))
      if (existingItem.isCover !== isCover) hasChanges = true
    } else {
      // Klasörde var ama CMS'de yok - ekle
      console.log(`   ✅ ${isVideo ? 'Video' : 'Görsel'} R2'ye yükleniyor: ${file.name} ${isCover ? '(KAPAK)' : ''}`)
      const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}`)
      if (r2Url) {
        const item: any = {
          _type: 'productSimpleMediaItem',
          _key: `media-${Date.now()}-${Math.random()}`,
          type: isVideo ? 'video' : 'image',
          isCover,
        }

        if (isVideo) {
          if (device === 'mobile') item.videoFileMobileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
          else if (device === 'desktop') item.videoFileDesktopR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
          else item.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
        } else {
          const r2Asset = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height, hasResponsiveSizes: r2Url.hasResponsiveSizes }
          if (device === 'mobile') item.imageMobileR2 = r2Asset
          else if (device === 'desktop') item.imageDesktopR2 = r2Asset
          else item.imageR2 = r2Asset
        }
        syncedMedia.push(item)
        hasChanges = true
      }
    }
  }

  // 2. CMS'de olan ama klasörde olmayan medyayı say (silinecek)
  if (mode === 'sync') {
    const toDelete = Array.from(cmsMediaHashes).filter((hash) => !folderMediaHashes.has(hash))
    if (toDelete.length > 0) {
      console.log(`   🗑️ ${toDelete.length} medya dökümanda var ama klasörde yok, eşitleme için CMS'den temizleniyor`)
      hasChanges = true
    }
    updates.media = syncedMedia
  } else {
    // ADD MODE: Mevcutların üzerine ekle
    const newOnly = syncedMedia.filter(m => !cmsMediaHashes.has(m.image?.asset?.sha1hash || m.imageR2?.url))
    if (newOnly.length > 0) {
      updates.media = [...existingMediaArray, ...newOnly]
      hasChanges = true
    }
  }

  // ============================================
  // 3. ÖLÇÜ GÖRSELLERİNİ EŞİTLE
  // ============================================

  if (dimensionImages.length > 0) {
    console.log(`   📐 ${dimensionImages.length} ölçü görseli işleniyor (ÖLÇÜLER klasöründen)...`)

    // Ölçü görsellerini grupla (numara ile veya dosya adından)
    const dimensionGroups = new Map<number, { main?: File; mobile?: File; desktop?: File }>()

    for (const file of dimensionImages) {
      const name = file.name.toLowerCase()
      // Dosya adından numara çıkar (olcu_1.jpg, olcu1.jpg, 1.jpg, vs.)
      let match = name.match(/[_-]?(\d+)/)
      let index = match ? parseInt(match[1]) : 1

      // Eğer numara bulunamazsa, dosya adının sonundaki numarayı kullan
      if (!match) {
        match = name.match(/(\d+)(?:\.[^.]+)?$/)
        index = match ? parseInt(match[1]) : 1
      }

      // Eğer hala numara bulunamazsa, sıralı numara ver
      if (!match && dimensionGroups.size > 0) {
        index = Math.max(...Array.from(dimensionGroups.keys())) + 1
      }

      if (!dimensionGroups.has(index)) {
        dimensionGroups.set(index, {})
      }

      const group = dimensionGroups.get(index)!
      if (name.includes('_mobil') && !name.includes('_desktop')) {
        group.mobile = file
      } else if (name.includes('_desktop')) {
        group.desktop = file
      } else {
        group.main = file
      }
    }

    const syncedDimensionImages: any[] = []

    for (const [index, group] of dimensionGroups.entries()) {
      const dimItem: any = {
        _type: 'productDimensionImage',
        _key: `dimension-${index}-${Date.now()}`,
      }

      if (group.main) {
        const hash = await getFileHash(group.main)
        const existing = existingDimensionImages.find(
          (item: any) => item?.image?.asset?.sha1hash === hash,
        )

        if (existing && existing.imageR2 && !existing.image) {
          syncedDimensionImages.push(resolveKey(existing))
          console.log(`   ✓ Ölçü görseli korundu (R2): ${group.main.name}`)
        } else {
          console.log(`   ✅ Ölçü görseli R2'ye yükleniyor: ${group.main.name}`)
          const r2Url = await uploadToR2(
            group.main,
            `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`,
          )

          if (r2Url) {
            dimItem.imageR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            }
            hasChanges = true
          }
        }
      }

      if (group.mobile) {
        const hash = await getFileHash(group.mobile)
        const existing = existingDimensionImages.find(
          (item: any) => item?.imageMobile?.asset?.sha1hash === hash,
        )

        // Eğer mevcut değilse veya R2 alanı yoksa yükle
        if (!existing || !existing.imageMobileR2) {
          console.log(`   ✅ Mobil ölçü görseli R2'ye yükleniyor: ${group.mobile.name}`)
          const r2Url = await uploadToR2(
            group.mobile,
            `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`,
          )

          if (r2Url) {
            dimItem.imageMobileR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            }
            hasChanges = true
            console.log(`   ✅ Mobil ölçü görseli R2'ye yüklendi: ${group.mobile.name}`)
          }
        } else if (existing?.imageMobileR2) {
          dimItem.imageMobileR2 = existing.imageMobileR2
        }
      }

      if (group.desktop) {
        const hash = await getFileHash(group.desktop)
        const existing = existingDimensionImages.find(
          (item: any) => item?.imageDesktop?.asset?.sha1hash === hash,
        )

        if (!existing || !existing.imageDesktopR2) {
          console.log(`   ✅ Desktop ölçü görseli R2'ye yükleniyor: ${group.desktop.name}`)
          const r2Url = await uploadToR2(
            group.desktop,
            `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`,
          )

          if (r2Url) {
            dimItem.imageDesktopR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            }
            hasChanges = true
            console.log(`   ✅ Desktop ölçü görseli R2'ye yüklendi: ${group.desktop.name}`)
          }
        } else if (existing?.imageDesktopR2) {
          dimItem.imageDesktopR2 = existing.imageDesktopR2
        }
      }

      // En az bir görseli varsa ekle
      if (dimItem.imageR2 || dimItem.imageMobileR2 || dimItem.imageDesktopR2) {
        syncedDimensionImages.push(dimItem)
      }
    }

    updates.dimensionImages = syncedDimensionImages
    console.log(`   ✅ ${syncedDimensionImages.length} ölçü görseli eşitlendi`)
  } else {
    // Klasörde ölçü görseli yok - CMS'deki ölçü görsellerini sil (eşitleme)
    if (existingDimensionImages.length > 0) {
      console.log(`   🗑️ Klasörde ölçü görseli yok, CMS'deki ölçü görselleri siliniyor (eşitleme)`)
      updates.dimensionImages = []
      hasChanges = true
    }
  }

  // ============================================
  // 4. ALT MEDYA PANELLERİNİ EŞİTLE
  // ============================================

  if (panelMedia.length > 0) {
    console.log(`   🎬 ${panelMedia.length} alt medya paneli işleniyor...`)

    // Alt medya panellerini grupla (numara ile)
    const panelGroups = new Map<
      number,
      Array<{ file: File; isVideo: boolean; isMobile: boolean; isDesktop: boolean }>
    >()

    for (const file of panelMedia) {
      const name = file.name.toLowerCase()
      const match = name.match(/_panel[_-]?(\d+)/)
      const index = match ? parseInt(match[1]) : 1

      if (!panelGroups.has(index)) {
        panelGroups.set(index, [])
      }

      const isVideo = isVideoFile(file.name)
      const isMobile = name.includes('_mobil') && !name.includes('_desktop')
      const isDesktop = name.includes('_desktop')

      panelGroups.get(index)!.push({ file, isVideo, isMobile, isDesktop })
    }

    const syncedMedia: any[] = []

    for (const [index, files] of panelGroups.entries()) {
      // Her panel için ana görsel/video bul
      const mainFile = files.find((f) => !f.isMobile && !f.isDesktop)

      if (mainFile) {
        const hash = await getFileHash(mainFile.file)
        const existing = existingBottomMedia.find((item: any) => {
          if (mainFile.isVideo) {
            return item?.videoFile?.asset?.sha1hash === hash
          } else {
            return item?.image?.asset?.sha1hash === hash
          }
        })

        if (
          existing &&
          ((mainFile.isVideo && existing.videoFileR2 && !existing.videoFile) ||
            (!mainFile.isVideo && existing.imageR2 && !existing.image))
        ) {
          syncedMedia.push(resolveKey(existing))
          console.log(`   ✓ Alt medya paneli korundu (R2): ${mainFile.file.name}`)
        } else {
          const panelItem: any = {
            _type: 'productPanelMediaItem',
            _key: `panel-${index}-${Date.now()}`,
            type: mainFile.isVideo ? 'video' : 'image',
          }

          if (mainFile.isVideo) {
            console.log(`   🎬 Alt medya videosu R2'ye yükleniyor: ${mainFile.file.name}`)
            const r2Url = await uploadToR2(
              mainFile.file,
              `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
            )
            if (r2Url) {
              panelItem.videoFileR2 = {
                _type: 'r2Asset',
                url: r2Url.url,
                hasResponsiveSizes: r2Url.hasResponsiveSizes,
              }
            }
          } else {
            console.log(`   📸 Alt medya görseli R2'ye yükleniyor: ${mainFile.file.name}`)
            const r2Url = await uploadToR2(
              mainFile.file,
              `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
            )
            if (r2Url) {
              panelItem.imageR2 = {
                _type: 'r2Asset',
                url: r2Url.url,
                width: r2Url.width,
                height: r2Url.height,
                hasResponsiveSizes: r2Url.hasResponsiveSizes,
              }
            }
          }

          // Mobil ve desktop versiyonları
          const mobileFile = files.find((f) => f.isMobile && f.isVideo === mainFile.isVideo)
          const desktopFile = files.find((f) => f.isDesktop && f.isVideo === mainFile.isVideo)

          if (mobileFile) {
            if (mainFile.isVideo) {
              console.log(`   🎬 Mobil alt medya videosu R2'ye yükleniyor: ${mobileFile.file.name}`)
              const r2Url = await uploadToR2(
                mobileFile.file,
                `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
              )
              if (r2Url) {
                panelItem.videoFileMobileR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  hasResponsiveSizes: r2Url.hasResponsiveSizes,
                }
              }
            } else {
              console.log(`   📸 Mobil alt medya görseli R2'ye yükleniyor: ${mobileFile.file.name}`)
              const r2Url = await uploadToR2(
                mobileFile.file,
                `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
              )
              if (r2Url) {
                panelItem.imageMobileR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  width: r2Url.width,
                  height: r2Url.height,
                  hasResponsiveSizes: r2Url.hasResponsiveSizes,
                }
              }
            }
          }

          if (desktopFile) {
            if (mainFile.isVideo) {
              console.log(
                `   🎬 Desktop alt medya videosu R2'ye yükleniyor: ${desktopFile.file.name}`,
              )
              const r2Url = await uploadToR2(
                desktopFile.file,
                `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
              )
              if (r2Url) {
                panelItem.videoFileDesktopR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  hasResponsiveSizes: r2Url.hasResponsiveSizes,
                }
              }
            } else {
              console.log(
                `   📸 Desktop alt medya görseli R2'ye yükleniyor: ${desktopFile.file.name}`,
              )
              const r2Url = await uploadToR2(
                desktopFile.file,
                `products/${slugify(product.categoryName)}/${product.modelId}/panels`,
              )
              if (r2Url) {
                panelItem.imageDesktopR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  width: r2Url.width,
                  height: r2Url.height,
                  hasResponsiveSizes: r2Url.hasResponsiveSizes,
                }
              }
            }
          }

          syncedMedia.push(panelItem)
          hasChanges = true
          console.log(`   ✅ Alt medya paneli R2'ye yüklendi: ${mainFile.file.name}`)
        }
      }
    }

    updates.bottomMedia = syncedMedia
    console.log(`   ✅ ${syncedMedia.length} alt medya paneli eşitlendi`)
  } else {
    // Klasörde alt medya paneli yok - CMS'deki alt medya panellerini sil (eşitleme)
    if (existingBottomMedia.length > 0) {
      console.log(
        `   🗑️ Klasörde alt medya paneli yok, CMS'deki alt medya panelleri siliniyor (eşitleme)`,
      )
      updates.bottomMedia = []
      hasChanges = true
    }
  }

  // ============================================
  // 5. İNDİRİLEBİLİR İÇERİKLERİ EŞİTLE
  //    - Ek Görseller (exclusiveContent.images)
  //    - Teknik Çizimler (exclusiveContent.drawings)
  //    - 3D Modeller (exclusiveContent.models3d)
  // ============================================

  let syncedExclusiveImages: any[] = existingExclusiveImages
  let syncedDrawings: any[] = existingDrawings
  let syncedModels3d: any[] = existingModels3d
  let hasExclusiveChanges = false

  // 5.1 Ek Görseller
  const extraImageMedia = extraImagesFiles.filter((f) => isImageFile(f.name))
  if (extraImageMedia.length > 0) {
    const folderMap = new Map<string, File>()
    for (const file of extraImageMedia) {
      const hash = await getFileHash(file)
      folderMap.set(hash, file)
    }

    const cmsMap = new Map<string, any>()
    existingExclusiveImages.forEach((img: any) => {
      const hash = img?.asset?.sha1hash
      if (hash) cmsMap.set(hash, img)
    })

    const newImages: any[] = []
    for (const [hash, file] of folderMap.entries()) {
      const existing = cmsMap.get(hash)
      if (existing && existing.r2Asset && !existing.asset) {
        newImages.push(resolveKey(existing))
      } else {
        console.log(`   ✅ Ek görsel R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(
          file,
          `products/${slugify(product.categoryName)}/${product.modelId}/extras`,
        )
        if (r2Url) {
          newImages.push({
            _type: 'image',
            _key: `extra-${Date.now()}-${Math.random()}`,
            r2Asset: {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            },
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newImages.push(resolveKey(existing))
        }
      }
    }
    syncedExclusiveImages = newImages
  } else if (existingExclusiveImages.length > 0) {
    syncedExclusiveImages = []
    hasExclusiveChanges = true
  }

  // 5.2 Teknik Çizimler
  if (drawingFiles.length > 0) {
    const folderMap = new Map<string, File>()
    for (const file of drawingFiles) {
      const hash = await getFileHash(file)
      folderMap.set(hash, file)
    }

    const cmsMap = new Map<string, any>()
    existingDrawings.forEach((item: any) => {
      const hash = item?.file?.asset?.sha1hash
      if (hash) cmsMap.set(hash, item)
    })

    const newDrawings: any[] = []
    for (const [hash, file] of folderMap.entries()) {
      const existing = cmsMap.get(hash)
      if (existing && existing.fileR2 && !existing.file) {
        newDrawings.push(resolveKey(existing))
      } else {
        console.log(`   ✅ Teknik çizim R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(
          file,
          `products/${slugify(product.categoryName)}/${product.modelId}/drawings`,
        )
        if (r2Url) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          newDrawings.push({
            _type: 'downloadableItem',
            _key: `drawing-${Date.now()}-${Math.random()}`,
            name: { tr: baseName, en: baseName },
            fileR2: {
              _type: 'r2Asset',
              url: r2Url.url,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            },
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newDrawings.push(resolveKey(existing))
        }
      }
    }
    syncedDrawings = newDrawings
  } else if (existingDrawings.length > 0) {
    syncedDrawings = []
    hasExclusiveChanges = true
  }

  // 5.3 3D Modeller
  if (modelFiles.length > 0) {
    const folderMap = new Map<string, File>()
    for (const file of modelFiles) {
      const hash = await getFileHash(file)
      folderMap.set(hash, file)
    }

    const cmsMap = new Map<string, any>()
    existingModels3d.forEach((item: any) => {
      const hash = item?.file?.asset?.sha1hash
      if (hash) cmsMap.set(hash, item)
    })

    const newModels: any[] = []
    for (const [hash, file] of folderMap.entries()) {
      const existing = cmsMap.get(hash)
      if (existing && existing.fileR2 && !existing.file) {
        newModels.push(resolveKey(existing))
      } else {
        console.log(`   ✅ 3D model R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(
          file,
          `products/${slugify(product.categoryName)}/${product.modelId}/models`,
        )
        if (r2Url) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          newModels.push({
            _type: 'downloadableItem',
            _key: `model-${Date.now()}-${Math.random()}`,
            name: { tr: baseName, en: baseName },
            fileR2: {
              _type: 'r2Asset',
              url: r2Url.url,
              hasResponsiveSizes: r2Url.hasResponsiveSizes,
            },
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newModels.push(resolveKey(existing))
        }
      }
    }
    syncedModels3d = newModels
  } else if (existingModels3d.length > 0) {
    syncedModels3d = []
    hasExclusiveChanges = true
  }

  if (hasExclusiveChanges) {
    updates.exclusiveContent = {
      images: syncedExclusiveImages,
      drawings: syncedDrawings,
      models3d: syncedModels3d,
    }
  }

  // ============================================
  // 6. GÜNCELLEMELERİ UYGULA
  // ============================================

  if (
    hasChanges ||
    hasExclusiveChanges ||
    syncedMedia.length !== existingMediaArray.length
  ) {
    let patch = client.patch(productId)
    if (Object.keys(updates).length > 0) {
      patch = patch.set(updates)
    }
    if (unsetFields.length > 0) {
      patch = patch.unset(unsetFields)
    }
    await patch.commit()
    console.log(`   ✅ Eşitleme tamamlandı (${syncedMedia.length} medya)`)
  } else {
    console.log(`   ℹ️ Eşitleme gerekmedi, tüm medya zaten eşleşiyor`)
  }
}

/**
 * Proje medyasını klasörle eşitler (sync)
 */
async function updateProjectMedia(client: any, projectId: string, project: any, mode: 'sync' | 'add' = 'sync') {
  // Mevcut medyayı kontrol et
  const projectData = await client.fetch(
    `*[_id == $projectId][0]{
    media[]{
      ...,
      type,
      isCover,
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileR2
    }
  }`,
    { projectId },
  )

  const existingMedia: any[] = projectData?.media || []
  const updates: any = {}
  const unsetFields: string[] = ['cover', 'coverR2', 'coverMobile', 'coverMobileR2', 'coverDesktop', 'coverDesktopR2']
  let hasChanges = false

  const incomingMedia = project.media || []
  const folderMediaMap = new Map<string, { file: File; isVideo: boolean; device: string; isCover: boolean }>()

  for (const media of incomingMedia) {
    const hash = await getFileHash(media.file)
    folderMediaMap.set(hash, {
      file: media.file,
      isVideo: isVideoFile(media.file.name),
      device: media.device,
      isCover: !!media.isCover
    })
  }

  const cmsMediaMap = new Map<string, any>()
  for (const mediaItem of existingMedia) {
    let hash: string | null = null
    if (mediaItem?.image?.asset?.sha1hash) hash = mediaItem.image.asset.sha1hash
    if (mediaItem?.videoFile?.asset?.sha1hash) hash = mediaItem.videoFile.asset.sha1hash
    if (hash) cmsMediaMap.set(hash, mediaItem)
  }

  const syncedMedia: any[] = []

  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo, device, isCover } = mediaInfo
    const existing = cmsMediaMap.get(hash)

    if (existing) {
      const updatedItem = { ...existing, isCover }
      syncedMedia.push(resolveKey(updatedItem))
      if (existing.isCover !== isCover) hasChanges = true
    } else {
      console.log(`   ✅ ${isVideo ? 'Video' : 'Görsel'} R2'ye yükleniyor: ${file.name} ${isCover ? '(KAPAK)' : ''}`)
      const r2Url = await uploadToR2(file, `projects/${slugify(project.projectName)}`)
      if (r2Url) {
        const item: any = {
          _type: 'productSimpleMediaItem',
          _key: `proj-${Date.now()}-${Math.random()}`,
          type: isVideo ? 'video' : 'image',
          isCover,
        }

        if (isVideo) {
          item.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
        } else {
          item.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height }
        }
        syncedMedia.push(item)
        hasChanges = true
      }
    }
  }

  if (hasChanges || syncedMedia.length !== existingMedia.length) {
    if (mode === 'sync') {
      updates.media = syncedMedia
    } else {
      const newOnly = syncedMedia.filter(m => !cmsMediaMap.has(m._key))
      updates.media = [...existingMedia, ...newOnly]
    }
    await client.patch(projectId).set(updates).unset(mode === 'sync' ? unsetFields : []).commit()
    console.log(`   ✅ Proje medyası güncellendi (Mode: ${mode})`)
  }
}

/**
 * Kategori görsellerini klasörle eşitler (sync)
 * - heroImage: hero.jpg veya kapak.jpg gibi dosyalar
 * - menuImage: menu.jpg veya menü.jpg gibi dosyalar
 */
async function updateCategoryImages(
  client: any,
  categoryId: string,
  categoryMedia: { categoryId: string; categoryName: string; files: File[] },
) {
  const categoryData = await client.fetch(
    `*[_id == $categoryId][0]{
    heroImage,
    heroImageR2,
    menuImage,
    menuImageR2
  }`,
    { categoryId },
  )

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  // Hero görseli bul (hero.jpg, kapak.jpg veya ilk görsel)
  const heroFile =
    categoryMedia.files.find((f: File) => {
      const name = f.name.toLowerCase()
      return isImageFile(f.name) && (name.includes('hero') || name.includes('kapak'))
    }) || categoryMedia.files.find((f: File) => isImageFile(f.name))

  // Menü görseli bul (menu.jpg, menü.jpg)
  const menuFile = categoryMedia.files.find((f: File) => {
    const name = f.name.toLowerCase()
    return isImageFile(f.name) && (name.includes('menu') || name.includes('menü'))
  })

  if (heroFile) {
    if (!categoryData?.heroImageR2 || categoryData?.heroImage) {
      console.log(`   📸 Hero görseli R2'ye yükleniyor: ${heroFile.name}`)
      const r2Url = await uploadToR2(heroFile, `categories/${slugify(categoryMedia.categoryName)}`)

      if (r2Url) {
        updates.heroImageR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('heroImage')
        hasChanges = true
      }
    }
  } else if (categoryData?.heroImageR2 || categoryData?.heroImage) {
    unsetFields.push('heroImage', 'heroImageR2')
    hasChanges = true
  }

  if (menuFile) {
    if (!categoryData?.menuImageR2 || categoryData?.menuImage) {
      console.log(`   🎨 Menü görseli R2'ye yükleniyor: ${menuFile.name}`)
      const r2Url = await uploadToR2(menuFile, `categories/${slugify(categoryMedia.categoryName)}`)

      if (r2Url) {
        updates.menuImageR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('menuImage')
        hasChanges = true
      }
    }
  } else if (categoryData?.menuImageR2 || categoryData?.menuImage) {
    unsetFields.push('menuImage', 'menuImageR2')
    hasChanges = true
  }

  if (hasChanges) {
    let patch = client.patch(categoryId).set(updates)
    if (unsetFields.length > 0) patch = patch.unset(unsetFields)
    await patch.commit()
    console.log(`   ✅ Kategori görselleri güncellendi`)
  } else {
    console.log(`   ℹ️ Kategori görselleri zaten güncel`)
  }
}

/**
 * Haber medyasını klasörle eşitler (sync)
 */
async function updateNewsItemMedia(client: any, newsId: string, news: any) {
  const newsData = await client.fetch(
    `*[_id == $newsId][0]{
    media[]{
      ...,
      type,
      isCover,
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileR2
    }
  }`,
    { newsId },
  )

  const existingMedia: any[] = newsData?.media || []
  const updates: any = {}
  const unsetFields: string[] = ['mainImage', 'mainImageR2', 'mainImageMobile', 'mainImageMobileR2', 'mainImageDesktop', 'mainImageDesktopR2']
  let hasChanges = false

  const folderMediaMap = new Map<string, { file: File; isVideo: boolean; isCover: boolean }>()
  for (const file of news.files) {
    const hash = await getFileHash(file)
    const isCover = file.name.toLowerCase().includes('_kapak')
    folderMediaMap.set(hash, { file, isVideo: isVideoFile(file.name), isCover })
  }

  if (!Array.from(folderMediaMap.values()).some(m => m.isCover)) {
    const firstImg = Array.from(folderMediaMap.entries()).find(([h, m]) => !m.isVideo)
    if (firstImg) folderMediaMap.get(firstImg[0])!.isCover = true
  }

  const syncedMedia: any[] = []
  const cmsMediaMap = new Map<string, any>()
  for (const item of existingMedia) {
    let hash: string | null = item?.image?.asset?.sha1hash || item?.videoFile?.asset?.sha1hash
    if (hash) cmsMediaMap.set(hash, item)
  }

  for (const [hash, info] of folderMediaMap.entries()) {
    const existing = cmsMediaMap.get(hash)
    if (existing) {
      const updatedItem = { ...existing, isCover: info.isCover }
      syncedMedia.push(resolveKey(updatedItem))
      if (existing.isCover !== info.isCover) hasChanges = true
    } else {
      console.log(`   ✅ Haber medyası R2'ye yükleniyor: ${info.file.name} ${info.isCover ? '(KAPAK)' : ''}`)
      const r2Url = await uploadToR2(info.file, `news/${news.newsId}`)
      if (r2Url) {
        const item: any = {
          _type: 'newsMedia',
          _key: `news-${Date.now()}`,
          type: info.isVideo ? 'video' : 'image',
          isCover: info.isCover,
        }
        if (info.isVideo) item.videoFileR2 = { _type: 'r2Asset', url: r2Url.url }
        else item.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height }
        syncedMedia.push(item)
        hasChanges = true
      }
    }
  }

  if (hasChanges || syncedMedia.length !== existingMedia.length) {
    updates.media = syncedMedia
    await client.patch(newsId).set(updates).unset(unsetFields).commit()
    console.log(`   ✅ Haber medyası eşitlendi`)
  }
}

/**
 * Hakkımızda sayfası medyasını eşitler (sync)
 */
async function updateAboutPageMedia(client: any, aboutId: string, aboutData: any) {
  const doc = await client.fetch(`*[_id == $aboutId][0]`, { aboutId })

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  // Hero
  if (aboutData.hero.length > 0) {
    const file = aboutData.hero[0]
    if (!doc.heroImageR2 || doc.heroImage) {
      const r2Url = await uploadToR2(file, 'about/hero')
      if (r2Url) {
        updates.heroImageR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
          hasResponsiveSizes: r2Url.hasResponsiveSizes,
        }
        unsetFields.push('heroImage')
        hasChanges = true
      }
    }
  }

  // Sections
  const syncSection = async (sectionName: string, files: File[]) => {
    const section = doc[sectionName] || {}
    if (files.length > 0) {
      const mainFile = files[0]
      if (!section.imageR2 || section.image) {
        console.log(`   📸 Hakkımızda ${sectionName} R2'ye yükleniyor: ${mainFile.name}`)
        const r2Url = await uploadToR2(mainFile, `about/${sectionName}`)
        if (r2Url) {
          updates[`${sectionName}.imageR2`] = {
            _type: 'r2Asset',
            url: r2Url.url,
            width: r2Url.width,
            height: r2Url.height,
            hasResponsiveSizes: r2Url.hasResponsiveSizes,
          }
          unsetFields.push(`${sectionName}.image`)
          hasChanges = true
        }
      }
    }
  }

  await syncSection('historySection', aboutData.history)
  await syncSection('identitySection', aboutData.identity)
  await syncSection('qualitySection', aboutData.quality)

  if (hasChanges) {
    let patch = client.patch(aboutId).set(updates)
    if (unsetFields.length > 0) patch = patch.unset(unsetFields)
    await patch.commit()
    console.log(`   ✅ Hakkımızda sayfası güncellendi`)
  }
}
