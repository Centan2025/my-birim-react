import React, { useState, useCallback } from 'react'
import { Card, Stack, Text, Button, Box, Flex, useToast } from '@sanity/ui'
import { UploadIcon, FolderIcon, CheckmarkIcon, WarningOutlineIcon } from '@sanity/icons'
import { useClient } from 'sanity'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

// Image Compression Helper
const compressImage = async (file: File): Promise<File | Blob> => {
  if (!file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
    return file
  }

  const options = {
    maxSizeMB: 0.8, // 800KB limit
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    fileType: 'image/webp' as any, // Convert to webp
  }

  try {
    console.log(`   📉 Sıkıştırılıyor: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    const compressedFile = await imageCompression(file, options)
    console.log(`   ✨ Sıkıştırma tamam: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)
    return compressedFile
  } catch (error) {
    console.error('Sıkıştırma hatası:', error)
    return file
  }
}

interface ProgressItem {
  type: 'category' | 'designer' | 'product' | 'project' | 'materialGroup' | 'materialBook'
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
  details?: string
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
    files: File[]
    dimensionFiles: File[] // ÖLÇÜLER klasöründeki dosyalar
    extraImages: File[] // İndirilebilir Dosyalar/Ek Görseller
    drawingFiles: File[] // İndirilebilir Dosyalar/Teknik Çizimler
    modelFiles: File[] // İndirilebilir Dosyalar/3D Modeller
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
const uploadToR2 = async (file: File, path: string): Promise<{ url: string; width?: number; height?: number; hasResponsiveSizes?: boolean } | null> => {
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
      const sizes = [
        { width: 2560, suffix: '', maxSizeMB: 0.8 },
        { width: 1600, suffix: '-1600w', maxSizeMB: 0.5 },
        { width: 800, suffix: '-800w', maxSizeMB: 0.2 },
        { width: 400, suffix: '-400w', maxSizeMB: 0.1 },
      ]

      const uploadPromises = sizes.map(async (size) => {
        const options = {
          maxSizeMB: size.maxSizeMB,
          maxWidthOrHeight: size.width,
          useWebWorker: true,
          fileType: 'image/webp' as any,
        }
        const compressedBlob = await compressImageChunk(file, options)
        if (size.suffix === '') {
          processedFile = compressedBlob
        }

        const currentKey = size.suffix ? key.replace(/\.webp$/, `${size.suffix}.webp`) : key
        const arrayBuffer = await compressedBlob.arrayBuffer()
        return r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: currentKey,
            Body: new Uint8Array(arrayBuffer),
            ContentType: 'image/webp',
          })
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
        })
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
      ...dimensions
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
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [stats, setStats] = useState({
    categories: 0,
    designers: 0,
    products: 0,
    projects: 0,
    images: 0,
  })

  // Klasör yapısını parse et
  const parseDirectory = useCallback((files: FileList): ParsedData => {
    const categories = new Map<string, string>()
    const categoryMediaMap = new Map<string, File[]>()
    const designerMap = new Map<string, File[]>()
    const productMap = new Map<
      string,
      {
        files: File[]
        dimensionFiles: File[]
        extraImages: File[]
        drawingFiles: File[]
        modelFiles: File[]
      }
    >()
    const materialGroupMap = new Map<string, Map<string, File[]>>()
    const projectMap = new Map<string, File[]>()
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

        // Kategori adını çıkar: "01 - KANEPELER" -> "KANEPELER"
        const categoryName = categoryFolder.split(' - ').pop()?.trim() || categoryFolder
        const categoryId = slugify(categoryName)

        // Model adını çıkar: "01 - 0203 - SU" -> "SU"
        const modelName = modelFolder.split(' - ').pop()?.trim() || modelFolder
        const modelId = slugify(modelName)

        categories.set(categoryId, categoryName)

        const productKey = `${categoryId}/${modelId}`
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            files: [],
            dimensionFiles: [],
            extraImages: [],
            drawingFiles: [],
            modelFiles: [],
          })
        }

        const productData = productMap.get(productKey)!

        // İndirilebilir Dosyalar alt klasörleri
        if (isDownloadRoot && parts.length >= urunIndex + 5) {
          const subFolder = (parts[olcuFolderIndex + 1] || '').toLowerCase()

          const isExtraImages =
            subFolder.includes('ek') && (subFolder.includes('görsel') || subFolder.includes('gorsel'))
          const isDrawings =
            subFolder.includes('teknik') || subFolder.includes('çizim') || subFolder.includes('cizim')
          const isModels =
            subFolder.includes('3d') || subFolder.includes('3-b') || subFolder.includes('model')

          if (isExtraImages && isMediaFile(file.name)) {
            productData.extraImages.push(file)
          } else if (isDrawings) {
            productData.drawingFiles.push(file)
          } else if (isModels) {
            productData.modelFiles.push(file)
          }
          // Bu dosyalar ana ürün görsellerine eklenmez, sadece indirilebilir içerik için kullanılır
        } else if (isDimensionFile) {
          productData.dimensionFiles.push(file)
        } else {
          productData.files.push(file)
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

      if (tasarimIndex !== -1 && parts.length >= tasarimIndex + 3) {
        const designerName = parts[tasarimIndex + 1]

        if (!designerMap.has(designerName)) {
          designerMap.set(designerName, [])
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

      if (projeIndex !== -1 && parts.length >= projeIndex + 3 && isMediaFile(file.name)) {
        const projectFolder = parts[projeIndex + 1]

        if (!projectMap.has(projectFolder)) {
          projectMap.set(projectFolder, [])
        }
        projectMap.get(projectFolder)!.push(file)

        // Debug: İlk proje bulunduğunda
        if (projectMap.size === 1 && projectMap.get(projectFolder)!.length === 1) {
          console.log('📁 İlk proje bulundu!', {
            projectFolder,
            dosya: file.name,
          })
        }
      }

      // kategoriler/kategori-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const kategoriIndex = parts.findIndex((p) => {
        const key = slugify(p || '').replace(/-/g, '')
        return key.includes('kategoriler') || key.includes('kategori') || key.includes('category')
      })

      if (kategoriIndex !== -1 && parts.length >= kategoriIndex + 3 && isMediaFile(file.name)) {
        const categoryFolder = parts[kategoriIndex + 1]
        const categoryName = categoryFolder.split(' - ').pop()?.trim() || categoryFolder
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
        else if (subFolder.includes('tarih') || subFolder.includes('history')) aboutPageData.history.push(file)
        else if (subFolder.includes('kimlik') || subFolder.includes('identity')) aboutPageData.identity.push(file)
        else if (subFolder.includes('kalite') || subFolder.includes('quality')) aboutPageData.quality.push(file)
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
      return {
        categoryId,
        categoryName: categories.get(categoryId) || categoryId,
        modelId,
        modelName: modelId.toUpperCase(),
        files: productData.files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
        dimensionFiles: productData.dimensionFiles.filter((f) => isMediaFile(f.name)), // ÖLÇÜLER klasöründeki dosyalar
        extraImages: productData.extraImages, // İndirilebilir / Ek Görseller (her türlü uzantı, filtreyi sonra yapacağız)
        drawingFiles: productData.drawingFiles, // İndirilebilir / Teknik Çizimler
        modelFiles: productData.modelFiles, // İndirilebilir / 3D Modeller
      }
    })

    const materialGroups = Array.from(materialGroupMap.entries()).map(([groupName, booksMap]) => ({
      groupName,
      books: Array.from(booksMap.entries()).map(([bookName, files]) => ({
        bookName,
        files: files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
      })),
    }))

    const projects = Array.from(projectMap.entries()).map(([projectFolder, files]) => ({
      projectId: slugify(projectFolder),
      projectName: projectFolder,
      files: files.filter((f) => isMediaFile(f.name)), // Görsel ve video dosyaları
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

  // Dosya yükleme handler'ı
  const handleFiles = useCallback(
    async (files: FileList) => {
      setIsProcessing(true)
      setProgress([])

      try {
        // Debug: Tüm dosyaları logla
        console.log('📁 Toplam dosya sayısı:', files.length)
        console.log(
          '📄 İlk 10 dosya:',
          Array.from(files)
            .slice(0, 10)
            .map((f) => f.webkitRelativePath || f.name),
        )

        const data = parseDirectory(files)

        // Debug: Parse sonuçları
        console.log('📊 Parse sonuçları:', {
          kategoriler: data.categories.size,
          tasarımcılar: data.designers.length,
          ürünler: data.products.length,
          malzemeGrupları: data.materialGroups.length,
          tasarımcı_detay: data.designers.map((d) => ({ isim: d.name, dosya: d.files.length })),
          ürün_detay: data.products.map((p) => ({ isim: p.modelName, dosya: p.files.length })),
          malzeme_detay: data.materialGroups.map((g) => ({
            grup: g.groupName,
            kartelaSayısı: g.books.length,
            toplamGörsel: g.books.reduce((sum, b) => sum + b.files.length, 0),
          })),
        })

        // İstatistikler (görsel + video)
        const totalMedia =
          data.categoryMedia.reduce((sum, c) => sum + c.files.length, 0) +
          data.designers.reduce((sum, d) => sum + d.files.length, 0) +
          data.products.reduce((sum, p) => sum + p.files.length, 0) +
          data.projects.reduce((sum, p) => sum + p.files.length, 0) +
          data.newsItems.reduce((sum, n) => sum + n.files.length, 0) +
          data.aboutPage.hero.length +
          data.aboutPage.history.length +
          data.aboutPage.identity.length +
          data.aboutPage.quality.length +
          data.materialGroups.reduce(
            (sum, g) => sum + g.books.reduce((bookSum, b) => bookSum + b.files.length, 0),
            0,
          )

        setStats({
          categories: data.categoryMedia.length,
          designers: data.designers.length,
          products: data.products.length,
          projects: data.projects.length,
          images: totalMedia,
        })

        // Uyarı: Medya bulunamadıysa
        if (totalMedia === 0) {
          toast.push({
            status: 'warning',
            title: '⚠️ Medya bulunamadı!',
            description:
              'Klasörlerin içinde .jpg, .png, .mp4 gibi görsel veya video dosyaları yok. Lütfen medya dosyalarını ekleyip tekrar deneyin.',
          })
          setIsProcessing(false)
          return
        }

        const materialSummary =
          data.materialGroups.length > 0 ? `, ${data.materialGroups.length} malzeme grubu` : ''
        const projectSummary = data.projects.length > 0 ? `, ${data.projects.length} proje` : ''
        const newsSummary = data.newsItems.length > 0 ? `, ${data.newsItems.length} haber` : ''
        const aboutSummary =
          (data.aboutPage.hero.length + data.aboutPage.history.length + data.aboutPage.identity.length + data.aboutPage.quality.length) > 0
            ? ', Hakkımızda sayfası medyası' : ''

        toast.push({
          status: 'info',
          title: 'Tarama tamamlandı',
          description: `${data.categoryMedia.length} kategori, ${data.designers.length} tasarımcı, ${data.products.length} ürün${projectSummary}${newsSummary}${aboutSummary}${materialSummary} bulundu`,
        })

        // Yükleme başlasın mı diye sor
        const parts: string[] = []
        if (data.categoryMedia.length > 0) parts.push(`${data.categoryMedia.length} kategori`)
        if (data.designers.length > 0) parts.push(`${data.designers.length} tasarımcı`)
        if (data.products.length > 0) parts.push(`${data.products.length} ürün`)
        if (data.projects.length > 0) parts.push(`${data.projects.length} proje`)
        if (data.newsItems.length > 0) parts.push(`${data.newsItems.length} haber`)
        if (aboutSummary) parts.push('Hakkımızda sayfası')
        if (data.materialGroups.length > 0) parts.push(`${data.materialGroups.length} malzeme grubu`)

        const confirmMsg = `${parts.join(', ')} yüklenecek. Devam edilsin mi?`

        if (confirm(confirmMsg)) {
          await uploadToSanity(data)
        }
      } catch (error: any) {
        console.error('Hata:', error)
        toast.push({
          status: 'error',
          title: 'Hata oluştu',
          description: error.message,
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [parseDirectory, toast],
  )

  // Sanity'ye yükleme
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
        const productSlug = `${actualCategorySlug}-${product.modelId}`
        const existing = existingProducts.find((p: any) => {
          // Önce slug ile kontrol et (en güvenilir)
          if (p.slug === productSlug) return true

          // Slug yoksa, kategori + model adı ile kontrol et
          // Türkçe karakterler için normalize edilmiş karşılaştırma
          const normalizeForComparison = (str: string) => {
            return slugify(str).replace(/-/g, '')
          }

          const normalizedProductName = normalizeForComparison(product.modelName)
          const modelNameMatch =
            normalizeForComparison(p.name?.tr || '') === normalizedProductName ||
            normalizeForComparison(p.name?.en || '') === normalizedProductName

          const categoryMatch = p.categorySlug === actualCategorySlug

          // HEM model adı HEM kategori eşleşmeli
          return modelNameMatch && categoryMatch
        })

        if (existing) {
          console.log(
            `   🎯 Eşleşme bulundu: ${existing.name?.tr} (Kategori: ${existing.categoryName?.tr})`,
          )
          await updateProductImages(client, existing._id, product)
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
              const normalizeForComparison = (str: string) => slugify(str).replace(/-/g, '')
              const normalizedProductName = normalizeForComparison(product.modelName)
              return (
                normalizeForComparison(p.name?.tr || '') === normalizedProductName ||
                normalizeForComparison(p.name?.en || '') === normalizedProductName
              )
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
                  const r2Url = await uploadToR2(file, `materials/${slugify(materialGroup.groupName)}/${slugify(book.bookName)}`)

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
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
          await updateProjectMedia(client, matchingProject._id, project)

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
          const matchingNews = existingNews.find((n: any) =>
            normalizeText(n.titleTr || '') === normalizedNewsName || n.slug === news.newsId
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
        status: 'uploading'
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
          item.message = "Hakkımızda sayfası dökümanı bulunamadı"
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

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Text size={3} weight="bold">
            📦 Medya İçe Aktarma
          </Text>
          <Text size={1} muted style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
            Bu araç, ürün, tasarımcı, proje ve malzeme görsellerinizi CMS'e yüklemek için
            kullanılır. Medya klasörünüzü sürükle-bırak yapabilir veya "Klasör Seç" butonu ile
            seçebilirsiniz.
            <strong>ÖNEMLİ:</strong> Bu araç sadece görselleri yükler; tasarımcılar, ürünler,
            projeler ve malzeme grupları CMS'de önceden oluşturulmuş olmalıdır. Klasör yapınızın
            doğru formatta olması gerekmektedir (örnek yapı aşağıda gösterilmiştir).
          </Text>
        </Box>

        {/* Sürükle-bırak alanı */}
        <Card
          padding={5}
          radius={3}
          shadow={isDragging ? 3 : 1}
          tone={isDragging ? 'primary' : 'default'}
          style={{
            border: isDragging
              ? '2px dashed var(--card-focus-ring-color)'
              : '2px dashed var(--card-border-color)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Stack space={3}>
            <Flex justify="center">
              <Text size={5}>{isDragging ? '📥' : '📁'}</Text>
            </Flex>
            <Text size={2} weight="semibold">
              {isDragging ? 'Klasörü buraya bırakın' : 'Medya klasörünüzü buraya sürükleyin'}
            </Text>
            <Text size={1} muted>
              veya
            </Text>
            <Flex justify="center">
              <Button
                text="Klasör Seç"
                icon={FolderIcon}
                tone="primary"
                onClick={() => document.getElementById('folder-input')?.click()}
                disabled={isProcessing}
              />
              <input
                id="folder-input"
                type="file"
                {...{ webkitdirectory: '', directory: '' }}
                multiple
                style={{ display: 'none' }}
                onChange={handleFolderSelect}
              />
            </Flex>
          </Stack>
        </Card>

        {/* İstatistikler */}
        {(stats.categories > 0 || stats.designers > 0 || stats.products > 0) && (
          <Card padding={3} tone="positive" radius={2}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                📊 Bulunan İçerik:
              </Text>
              <Flex gap={3}>
                <Text size={1}>📂 {stats.categories} Kategori</Text>
                <Text size={1}>👤 {stats.designers} Tasarımcı</Text>
                <Text size={1}>📦 {stats.products} Ürün</Text>
                <Text size={1}>📁 {stats.projects} Proje</Text>
                <Text size={1}>🖼️ {stats.images} Medya (Görsel + Video)</Text>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Sadece Hatalar */}
        {progress.filter((p) => p.status === 'error').length > 0 && (
          <Card
            padding={3}
            tone="critical"
            radius={2}
            style={{ maxHeight: '300px', overflow: 'auto' }}
          >
            <Stack space={2}>
              <Flex align="center" gap={2}>
                <WarningOutlineIcon style={{ color: 'red' }} />
                <Text size={2} weight="bold" style={{ color: 'red' }}>
                  ❌ Hatalar ({progress.filter((p) => p.status === 'error').length})
                </Text>
              </Flex>
              {progress
                .filter((p) => p.status === 'error')
                .map((item, idx) => (
                  <Card key={idx} padding={2} tone="default" radius={2}>
                    <Stack space={1}>
                      <Text size={1} weight="semibold">
                        {item.type === 'category' && '📂'}
                        {item.type === 'designer' && '👤'}
                        {item.type === 'product' && '📦'}
                        {item.type === 'project' && '📁'}
                        {item.type === 'materialGroup' && '🎨'}
                        {item.type === 'materialBook' && '📚'} {item.name}
                      </Text>
                      {item.message && (
                        <Text size={1} muted style={{ wordBreak: 'break-word' }}>
                          {item.message}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
            </Stack>
          </Card>
        )}

        {/* Tüm İşlemler */}
        {progress.length > 0 && (
          <Card
            padding={3}
            tone="transparent"
            radius={2}
            style={{ maxHeight: '400px', overflow: 'auto' }}
          >
            <Stack space={2}>
              <Text size={1} weight="semibold">
                ⏳ Tüm İşlemler:
              </Text>
              {progress.map((item, idx) => (
                <Flex key={idx} align="center" gap={2}>
                  <Box>
                    {item.status === 'success' && <CheckmarkIcon style={{ color: 'green' }} />}
                    {item.status === 'error' && <WarningOutlineIcon style={{ color: 'red' }} />}
                    {item.status === 'uploading' && <Text>⏳</Text>}
                  </Box>
                  <Text size={1}>
                    {item.type === 'category' && '📂'}
                    {item.type === 'designer' && '👤'}
                    {item.type === 'product' && '📦'}
                    {item.type === 'project' && '📁'}
                    {item.type === 'materialGroup' && '🎨'}
                    {item.type === 'materialBook' && '📚'} {item.name}
                    {item.message && ` - ${item.message}`}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}

        {/* Yardım */}
        <Card padding={4} tone="caution" radius={2}>
          <Stack space={3}>
            <Text size={2} weight="bold">
              ⚠️ ÖNEMLİ:
            </Text>
            <Text size={1} style={{ lineHeight: '1.6' }}>
              Bu araç <strong>sadece görselleri yükler</strong>. Tasarımcılar, ürünler, projeler,
              malzeme grupları ve kartelalar CMS'de önceden oluşturulmuş olmalıdır!
            </Text>
            <Box padding={2} style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Kullanım Adımları:
                </Text>
                <Text size={1} style={{ lineHeight: '1.6' }}>
                  1️⃣ Önce CMS'de tasarımcı/ürün/proje/malzeme grubu/kartela oluşturun
                  <br />
                  2️⃣ Sonra bu araçla görsellerini yükleyin
                  <br />
                  3️⃣ Klasör yapınızın doğru formatta olduğundan emin olun
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Card>

        <Card padding={3} tone="transparent" radius={2}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              💡 Örnek Klasör Yapısı:
            </Text>
            <Text size={1} style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
              {`MedyaKlasoru/
├── ÜRÜNLER/
│   └── KANEPELER/                ← Kategori adı (CMS'teki kategori ile aynı)
│       └── PUF_1/                ← Ürün adı (CMS'teki ürün AD/ID ile aynı)
│           ├── puf_1_kapak.jpg   ← (opsiyonel) Ana kapak
│           ├── puf_1_01.jpg      ← Diğer ürün görselleri
│           ├── puf_1_02.jpg
│           ├── ÖLÇÜLER/          ← Ölçü görselleri (dimensionImages)
│           │   ├── olcu_1.jpg
│           │   └── olcu_2.jpg
│           └── İndirilebilir Dosyalar/
│               ├── Ek Görseller/
│               │   ├── katalog_1.jpg
│               │   └── katalog_2.jpg
│               ├── Teknik Çizimler/
│               │   ├── 0203_SU.pdf
│               │   └── teknik_2.dwg
│               └── 3D Modeller/
│                   ├── model_1.obj
│                   └── model_2.fbx
├── TASARIMCILAR/                 ← Tasarımcı görselleri (sadece görsel)
│   └── Ahmet Yılmaz/
│       ├── ahmet_kapak.jpg
│       └── ahmet_mobil.jpg
└── MALZEMELER/                   ← Malzeme kartelaları
    └── KUMAŞ/
        └── KARTELA-1/
            ├── malzeme1.jpg
            └── malzeme2.jpg`}
            </Text>
            <Text size={0} muted>
              ℹ️ Klasör / kategori / ürün / tasarımcı / malzeme grup ve kartela isimleri CMS'deki
              isimlerle mümkün olduğunca bire bir aynı olmalıdır.
            </Text>
          </Stack>
        </Card>
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
function normalizeText(text: string): string {
  return slugify(text).replace(/-/g, '').replace(/\s+/g, '')
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
        updates.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
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
        updates.imageMobileR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
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
        updates.imageDesktopR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
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
  }
  else {
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
    alternativeMedia[]{
      ...,
      type,
      image{asset->{_id, originalFilename, sha1hash}},
      imageMobile{asset->{_id, originalFilename, sha1hash}},
      imageDesktop{asset->{_id, originalFilename, sha1hash}},
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileMobile{asset->{_id, originalFilename, sha1hash}},
      videoFileDesktop{asset->{_id, originalFilename, sha1hash}}
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

  // Mevcut media (alt medya panelleri) array'ini koru
  const existingMedia: any[] = []
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
      existingMedia.push(item)
    })
  }

  // Mevcut alternativeMedia array'ini koru (hem görsel hem video)
  const existingAlternativeMedia: any[] = []
  if (product?.alternativeMedia) {
    product.alternativeMedia.forEach((item: any) => {
      // Görsel medya
      if (item?.image?.asset) {
        if (item.image.asset.sha1hash) existingHashes.add(item.image.asset.sha1hash)
        if (item.image.asset.originalFilename)
          existingFilenames.add(item.image.asset.originalFilename)
        existingAlternativeMedia.push(item)
      }
      // Video medya
      if (item?.videoFile?.asset) {
        if (item.videoFile.asset.sha1hash) existingHashes.add(item.videoFile.asset.sha1hash)
        if (item.videoFile.asset.originalFilename)
          existingFilenames.add(item.videoFile.asset.originalFilename)
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
      existingAlternativeMedia.push(item)
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

  return {
    existingHashes,
    existingFilenames,
    existingAlternativeMedia,
    existingDimensionImages,
    existingMedia,
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
async function updateProductImages(client: any, productId: string, product: any) {
  // Mevcut görselleri kontrol et (mevcut alternativeMedia'yı da al)
  const productData = await checkExistingAssets(client, productId)
  const {
    existingHashes,
    existingFilenames,
    existingAlternativeMedia,
    existingDimensionImages,
    existingMedia,
    existingExclusiveImages,
    existingDrawings,
    existingModels3d,
    product: cmsProduct,
  } = productData

  // Kapak görselleri sadece görsel olabilir (video olamaz)
  const coverMain = product.files.find(
    (f: File) =>
      isImageFile(f.name) &&
      f.name.toLowerCase().includes('_kapak') &&
      !f.name.toLowerCase().includes('_mobil') &&
      !f.name.toLowerCase().includes('_desktop'),
  )
  const coverMobile = product.files.find(
    (f: File) =>
      isImageFile(f.name) &&
      f.name.toLowerCase().includes('_kapak_mobil') &&
      !f.name.toLowerCase().includes('_desktop'),
  )
  const coverDesktop = product.files.find(
    (f: File) => isImageFile(f.name) && f.name.toLowerCase().includes('_kapak_desktop'),
  )

  // Ölçü görselleri: ÖLÇÜLER klasöründeki dosyalar
  const dimensionImages = product.dimensionFiles || []

  // İndirilebilir içerikler: İndirilebilir Dosyalar klasöründen
  const extraImagesFiles: File[] = product.extraImages || []
  const drawingFiles: File[] = product.drawingFiles || []
  const modelFiles: File[] = product.modelFiles || []

  // Alt medya panelleri: _panel etiketi ile
  const panelMedia = product.files.filter((f: File) => f.name.toLowerCase().includes('_panel'))

  // Alternatif medya: hem görsel hem video olabilir (_kapak, _panel içermemeli)
  const regularMedia = product.files.filter(
    (f: File) =>
      !f.name.toLowerCase().includes('_kapak') && !f.name.toLowerCase().includes('_panel'),
  )

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  // ============================================
  // 1. KAPAK GÖRSELLERİNİ EŞİTLE
  // ============================================

  // Ana kapak görseli - Eşitleme mantığı
  if (coverMain) {
    // Eğer R2 görseli yoksa VEYA Sanity görseli hala duruyorsa yükle/migrate et
    if (!cmsProduct?.mainImageR2 || cmsProduct?.mainImage) {
      console.log(`   📸 Ana kapak R2'ye yükleniyor: ${coverMain.name}`)
      const r2Url = await uploadToR2(coverMain, `products/${slugify(product.categoryName)}/${product.modelId}`)

      if (r2Url) {
        updates.mainImageR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
        }
        unsetFields.push('mainImage')
        hasChanges = true
      }
    } else {
      console.log(`   ✓ Ana kapak zaten eşleşiyor (R2): ${coverMain.name}`)
    }
  } else {
    // Kapak görseli yok - ilk görseli (video değil) kapak olarak kullan
    const firstImage = regularMedia.find((f: File) => isImageFile(f.name))
    if (firstImage) {
      // Eğer R2 görseli yoksa VEYA Sanity görseli hala duruyorsa yükle/migrate et
      if (!cmsProduct?.mainImageR2 || cmsProduct?.mainImage) {
        console.log(`   ⚠️ Kapak yok, ilk görsel R2 kapak olarak kullanılıyor: ${firstImage.name}`)
        const r2Url = await uploadToR2(firstImage, `products/${slugify(product.categoryName)}/${product.modelId}`)

        if (r2Url) {
          updates.mainImageR2 = {
            _type: 'r2Asset',
            url: r2Url.url,
            width: r2Url.width,
            height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
          }
          unsetFields.push('mainImage')
          hasChanges = true
        }
      }
    } else {
      // Klasörde hiç görsel yok - CMS'deki kapak görselini sil (eşitleme)
      if (cmsProduct?.mainImage || cmsProduct?.mainImageR2) {
        console.log(`   🗑️ Klasörde görsel yok, CMS'deki kapak siliniyor (eşitleme)`)
        unsetFields.push('mainImage')
        unsetFields.push('mainImageR2')
        hasChanges = true
      }
    }
  }

  if (coverMobile) {
    if (!cmsProduct?.mainImageMobileR2 || cmsProduct?.mainImageMobile) {
      console.log(`   📱 Mobil kapak R2'ye yükleniyor: ${coverMobile.name}`)
      const r2Url = await uploadToR2(coverMobile, `products/${slugify(product.categoryName)}/${product.modelId}`)

      if (r2Url) {
        updates.mainImageMobileR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
        }
        unsetFields.push('mainImageMobile')
        hasChanges = true
      }
    } else {
      console.log(`   ✓ Mobil kapak zaten eşleşiyor (R2): ${coverMobile.name}`)
    }
  } else {
    if (cmsProduct?.mainImageMobile || cmsProduct?.mainImageMobileR2) {
      console.log(`   🗑️ Klasörde mobil kapak yok, CMS'deki mobil kapak siliniyor (eşitleme)`)
      unsetFields.push('mainImageMobile')
      unsetFields.push('mainImageMobileR2')
      hasChanges = true
    }
  }

  if (coverDesktop) {
    if (!cmsProduct?.mainImageDesktopR2 || cmsProduct?.mainImageDesktop) {
      console.log(`   💻 Desktop kapak R2'ye yükleniyor: ${coverDesktop.name}`)
      const r2Url = await uploadToR2(coverDesktop, `products/${slugify(product.categoryName)}/${product.modelId}`)

      if (r2Url) {
        updates.mainImageDesktopR2 = {
          _type: 'r2Asset',
          url: r2Url.url,
          width: r2Url.width,
          height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
        }
        unsetFields.push('mainImageDesktop')
        hasChanges = true
      }
    } else {
      console.log(`   ✓ Desktop kapak zaten eşleşiyor (R2): ${coverDesktop.name}`)
    }
  } else {
    if (cmsProduct?.mainImageDesktop || cmsProduct?.mainImageDesktopR2) {
      console.log(`   🗑️ Klasörde desktop kapak yok, CMS'deki desktop kapak siliniyor (eşitleme)`)
      unsetFields.push('mainImageDesktop')
      unsetFields.push('mainImageDesktopR2')
      hasChanges = true
    }
  }

  // ============================================
  // 2. ALTERNATİF MEDYAYI EŞİTLE (Görsel + Video)
  // ============================================

  // Klasördeki alternatif medyayı hash'le eşleştir
  // NOT: Kapak görseli olarak kullanılan görseli alternatif medyadan çıkar
  let mediaToSync: File[] = []
  if (coverMain) {
    // Kapak görseli varsa, tüm regularMedia'yı kullan
    mediaToSync = regularMedia
  } else {
    // Kapak yoksa, ilk görsel kapak olarak kullanıldı, alternatif medyadan çıkar
    const firstImage = regularMedia.find((f: File) => isImageFile(f.name))
    if (firstImage) {
      mediaToSync = regularMedia.filter((f: File) => f !== firstImage)
    } else {
      mediaToSync = regularMedia
    }
  }

  const folderMediaHashes = new Set<string>()
  const folderMediaMap = new Map<string, { file: File; isVideo: boolean }>() // hash -> {file, isVideo}

  console.log(`   🖼️ ${mediaToSync.length} klasör medyası hash'leniyor...`)
  for (const media of mediaToSync) {
    try {
      const hash = await getFileHash(media)
      folderMediaHashes.add(hash)
      folderMediaMap.set(hash, { file: media, isVideo: isVideoFile(media.name) })
    } catch (error) {
      console.error(`   ❌ Hash hesaplanamadı: ${media.name}`, error)
    }
  }

  // CMS'deki medyanın hash'lerini topla (hem görsel hem video)
  // NOT: Kapak görsellerinin hash'lerini alternatif medyadan çıkar
  const cmsMediaHashes = new Set<string>()
  const cmsMediaMap = new Map<string, any>() // hash -> mediaItem

  // Mevcut kapak görsellerinin hash'lerini al (bunlar alternatif medyada olmamalı)
  const coverHashes = new Set<string>()
  if (cmsProduct?.mainImage?.asset?.sha1hash) {
    coverHashes.add(cmsProduct.mainImage.asset.sha1hash)
  }
  if (cmsProduct?.mainImageMobile?.asset?.sha1hash) {
    coverHashes.add(cmsProduct.mainImageMobile.asset.sha1hash)
  }

  // Alternatif medyayı topla (kapak görselleri hariç, hem görsel hem video)
  for (const mediaItem of existingAlternativeMedia) {
    let hash: string | null = null
    // Görsel medya
    if (mediaItem?.image?.asset?.sha1hash) {
      hash = mediaItem.image.asset.sha1hash
    }
    // Video medya
    if (mediaItem?.videoFile?.asset?.sha1hash) {
      hash = mediaItem.videoFile.asset.sha1hash
    }

    if (hash && !coverHashes.has(hash)) {
      // Kapak görseli değilse alternatif medyaya ekle
      cmsMediaHashes.add(hash)
      cmsMediaMap.set(hash, mediaItem)
    }
  }

  const imageCount = Array.from(folderMediaMap.values()).filter((m) => !m.isVideo).length
  const videoCount = Array.from(folderMediaMap.values()).filter((m) => m.isVideo).length
  console.log(
    `   📊 Klasör: ${imageCount} görsel, ${videoCount} video | CMS: ${cmsMediaHashes.size} medya`,
  )

  // Eşitleme: Klasördeki medyayla CMS'deki medyayı birleştir
  const syncedAlternativeMedia: any[] = []

  // 1. Klasördeki medyayı ekle (CMS'de yoksa yükle, varsa koru)
  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo } = mediaInfo

    if (cmsMediaHashes.has(hash)) {
      // Her ikisinde de var - koru veya R2'ye migrate et
      const existingItem = cmsMediaMap.get(hash)

      // Eğer görsel ise ve R2 alanı yoksa VEYA asset alanı hala duruyorsa migrate et
      const isImg = !isVideo && (existingItem.type === 'image' || existingItem.image)
      const isVid = isVideo && (existingItem.type === 'video' || existingItem.videoFile)

      if ((isImg && (!existingItem.imageR2 || existingItem.image)) ||
        (isVid && (!existingItem.videoFileR2 || existingItem.videoFile))) {
        console.log(`   🔄 Mevcut ${isVideo ? 'video' : 'görsel'} R2'ye taşınıyor: ${file.name}`)
        const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}`)

        if (r2Url) {
          const updatedItem = { ...existingItem }
          if (isVideo) {
            updatedItem.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
            // Eski asset alanlarını temizle
            updatedItem.videoFile = null
          } else {
            updatedItem.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
            updatedItem.image = null
          }
          syncedAlternativeMedia.push(updatedItem)
          hasChanges = true
        } else {
          syncedAlternativeMedia.push(existingItem)
        }
      } else {
        syncedAlternativeMedia.push(existingItem)
        console.log(`   ✓ Korundu (R2): ${file.name} (${isVideo ? 'video' : 'görsel'})`)
      }
    } else {
      // Klasörde var ama CMS'de yok - ekle
      try {
        if (isVideo) {
          console.log(`   ✅ Video R2'ye yükleniyor: ${file.name}`)
          const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}`)

          if (r2Url) {
            syncedAlternativeMedia.push({
              _type: 'productSimpleMediaItem',
              _key: `alt-vid-${Date.now()}-${Math.random()}`,
              type: 'video',
              videoFileR2: {
                _type: 'r2Asset',
                url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes
              }
            })
          }
        } else {
          console.log(`   ✅ Görsel R2'ye yükleniyor: ${file.name}`)
          const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}`)

          if (r2Url) {
            syncedAlternativeMedia.push({
              _type: 'productSimpleMediaItem',
              _key: `alt-img-${Date.now()}-${Math.random()}`,
              type: 'image',
              imageR2: {
                _type: 'r2Asset',
                url: r2Url.url,
                width: r2Url.width,
                height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
              }
            })
          }
        }
        hasChanges = true
      } catch (error) {
        console.error(`   ❌ Yüklenemedi: ${file.name}`, error)
      }
    }
  }

  // 2. CMS'de olan ama klasörde olmayan medyayı say (silinecek)
  const toDelete = Array.from(cmsMediaHashes).filter((hash) => !folderMediaHashes.has(hash))
  if (toDelete.length > 0) {
    console.log(`   🗑️ ${toDelete.length} medya klasörde yok, CMS'den siliniyor`)
    hasChanges = true
  }

  // Sonuç: Sadece klasördeki görseller kalacak (eşitleme tamamlandı)
  updates.alternativeMedia = syncedAlternativeMedia

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
          syncedDimensionImages.push(existing)
          console.log(`   ✓ Ölçü görseli korundu (R2): ${group.main.name}`)
        } else {
          console.log(`   ✅ Ölçü görseli R2'ye yükleniyor: ${group.main.name}`)
          const r2Url = await uploadToR2(group.main, `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`)

          if (r2Url) {
            dimItem.imageR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
          const r2Url = await uploadToR2(group.mobile, `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`)

          if (r2Url) {
            dimItem.imageMobileR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
          const r2Url = await uploadToR2(group.desktop, `products/${slugify(product.categoryName)}/${product.modelId}/dimensions`)

          if (r2Url) {
            dimItem.imageDesktopR2 = {
              _type: 'r2Asset',
              url: r2Url.url,
              width: r2Url.width,
              height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
        const existing = existingMedia.find((item: any) => {
          if (mainFile.isVideo) {
            return item?.videoFile?.asset?.sha1hash === hash
          } else {
            return item?.image?.asset?.sha1hash === hash
          }
        })

        if (existing && ((mainFile.isVideo && existing.videoFileR2 && !existing.videoFile) || (!mainFile.isVideo && existing.imageR2 && !existing.image))) {
          syncedMedia.push(existing)
          console.log(`   ✓ Alt medya paneli korundu (R2): ${mainFile.file.name}`)
        } else {
          const panelItem: any = {
            _type: 'productPanelMediaItem',
            _key: `panel-${index}-${Date.now()}`,
            type: mainFile.isVideo ? 'video' : 'image',
          }

          if (mainFile.isVideo) {
            console.log(`   🎬 Alt medya videosu R2'ye yükleniyor: ${mainFile.file.name}`)
            const r2Url = await uploadToR2(mainFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
            if (r2Url) {
              panelItem.videoFileR2 = {
                _type: 'r2Asset',
                url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes
              }
            }
          } else {
            console.log(`   📸 Alt medya görseli R2'ye yükleniyor: ${mainFile.file.name}`)
            const r2Url = await uploadToR2(mainFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
            if (r2Url) {
              panelItem.imageR2 = {
                _type: 'r2Asset',
                url: r2Url.url,
                width: r2Url.width,
                height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
              }
            }
          }

          // Mobil ve desktop versiyonları
          const mobileFile = files.find((f) => f.isMobile && f.isVideo === mainFile.isVideo)
          const desktopFile = files.find((f) => f.isDesktop && f.isVideo === mainFile.isVideo)

          if (mobileFile) {
            if (mainFile.isVideo) {
              console.log(`   🎬 Mobil alt medya videosu R2'ye yükleniyor: ${mobileFile.file.name}`)
              const r2Url = await uploadToR2(mobileFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
              if (r2Url) {
                panelItem.videoFileMobileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
              }
            } else {
              console.log(`   📸 Mobil alt medya görseli R2'ye yükleniyor: ${mobileFile.file.name}`)
              const r2Url = await uploadToR2(mobileFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
              if (r2Url) {
                panelItem.imageMobileR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  width: r2Url.width,
                  height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
                }
              }
            }
          }

          if (desktopFile) {
            if (mainFile.isVideo) {
              console.log(`   🎬 Desktop alt medya videosu R2'ye yükleniyor: ${desktopFile.file.name}`)
              const r2Url = await uploadToR2(desktopFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
              if (r2Url) {
                panelItem.videoFileDesktopR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
              }
            } else {
              console.log(`   📸 Desktop alt medya görseli R2'ye yükleniyor: ${desktopFile.file.name}`)
              const r2Url = await uploadToR2(desktopFile.file, `products/${slugify(product.categoryName)}/${product.modelId}/panels`)
              if (r2Url) {
                panelItem.imageDesktopR2 = {
                  _type: 'r2Asset',
                  url: r2Url.url,
                  width: r2Url.width,
                  height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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

    updates.media = syncedMedia
    console.log(`   ✅ ${syncedMedia.length} alt medya paneli eşitlendi`)
  } else {
    // Klasörde alt medya paneli yok - CMS'deki alt medya panellerini sil (eşitleme)
    if (existingMedia.length > 0) {
      console.log(
        `   🗑️ Klasörde alt medya paneli yok, CMS'deki alt medya panelleri siliniyor (eşitleme)`,
      )
      updates.media = []
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
        newImages.push(existing)
      } else {
        console.log(`   ✅ Ek görsel R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}/extras`)
        if (r2Url) {
          newImages.push({
            _type: 'image',
            _key: `extra-${Date.now()}-${Math.random()}`,
            r2Asset: { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newImages.push(existing)
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
        newDrawings.push(existing)
      } else {
        console.log(`   ✅ Teknik çizim R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}/drawings`)
        if (r2Url) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          newDrawings.push({
            _type: 'downloadableItem',
            _key: `drawing-${Date.now()}-${Math.random()}`,
            name: { tr: baseName, en: baseName },
            fileR2: { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newDrawings.push(existing)
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
        newModels.push(existing)
      } else {
        console.log(`   ✅ 3D model R2'ye yükleniyor: ${file.name}`)
        const r2Url = await uploadToR2(file, `products/${slugify(product.categoryName)}/${product.modelId}/models`)
        if (r2Url) {
          const baseName = file.name.replace(/\.[^/.]+$/, '')
          newModels.push({
            _type: 'downloadableItem',
            _key: `model-${Date.now()}-${Math.random()}`,
            name: { tr: baseName, en: baseName },
            fileR2: { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
          })
          hasExclusiveChanges = true
        } else if (existing) {
          newModels.push(existing)
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

  if (hasChanges || hasExclusiveChanges || syncedAlternativeMedia.length !== existingAlternativeMedia.length) {
    let patch = client.patch(productId)
    if (Object.keys(updates).length > 0) {
      patch = patch.set(updates)
    }
    if (unsetFields.length > 0) {
      patch = patch.unset(unsetFields)
    }
    await patch.commit()
    console.log(`   ✅ Eşitleme tamamlandı (Toplam: ${syncedAlternativeMedia.length} alternatif medya)`)
  } else {
    console.log(`   ℹ️ Eşitleme gerekmedi, tüm medya zaten eşleşiyor`)
  }
}

/**
 * Proje medyasını klasörle eşitler (sync)
 * - Klasörde olmayan CMS medyasını siler
 * - CMS'de olmayan klasör medyasını ekler
 * - Her ikisinde de olan medyayı korur
 * - _kapak.*** dosyası kapak medyası olur
 */
async function updateProjectMedia(client: any, projectId: string, project: any) {
  // Mevcut medyayı kontrol et
  const projectData = await client.fetch(
    `*[_id == $projectId][0]{
    cover{asset->{_id, originalFilename, sha1hash}},
    coverR2,
    coverMobile{asset->{_id, originalFilename, sha1hash}},
    coverMobileR2,
    coverDesktop{asset->{_id, originalFilename, sha1hash}},
    coverDesktopR2,
    media[]{
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
    { projectId },
  )

  const existingHashes = new Set<string>()
  const existingMedia: any[] = []

  // Kapak görsellerini hash'le (mevcutları takip etmek için)
  if (projectData?.cover?.asset?.sha1hash) existingHashes.add(projectData.cover.asset.sha1hash)
  if (projectData?.coverMobile?.asset?.sha1hash) existingHashes.add(projectData.coverMobile.asset.sha1hash)
  if (projectData?.coverDesktop?.asset?.sha1hash) existingHashes.add(projectData.coverDesktop.asset.sha1hash)

  // Mevcut medyayı topla
  if (projectData?.media) {
    for (const mediaItem of projectData.media) {
      if (mediaItem?.image?.asset?.sha1hash) existingHashes.add(mediaItem.image.asset.sha1hash)
      if (mediaItem?.videoFile?.asset?.sha1hash) existingHashes.add(mediaItem.videoFile.asset.sha1hash)
      existingMedia.push(mediaItem)
    }
  }

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  // Kapak görseli bul (_kapak.***) - sadece görsel dosyalar
  const coverFile = project.files.find(
    (f: File) =>
      isImageFile(f.name) &&
      f.name.toLowerCase().includes('_kapak') &&
      !f.name.toLowerCase().includes('_mobil') &&
      !f.name.toLowerCase().includes('_desktop'),
  )
  const coverMobileFile = project.files.find(
    (f: File) =>
      isImageFile(f.name) &&
      f.name.toLowerCase().includes('_kapak_mobil') &&
      !f.name.toLowerCase().includes('_desktop'),
  )
  const coverDesktopFile = project.files.find(
    (f: File) => isImageFile(f.name) && f.name.toLowerCase().includes('_kapak_desktop'),
  )

  console.log(`   🔍 Proje medya analizi: ${project.files.length} dosya bulundu`)
  if (coverFile) {
    console.log(`   📸 Kapak dosyası bulundu: ${coverFile.name}`)
  } else {
    console.log(`   ⚠️ Kapak dosyası bulunamadı, ilk görsel aranıyor...`)
  }

  let otherMedia: File[] = []
  if (coverFile) {
    otherMedia = project.files.filter((f: File) => !f.name.toLowerCase().includes('_kapak'))
  } else {
    otherMedia = project.files
  }

  // 1. Kapak görseli eşitleme
  if (coverFile) {
    if (!projectData?.coverR2 || projectData?.cover) {
      console.log(`   📸 Kapak görseli R2'ye yükleniyor: ${coverFile.name}`)
      const r2Url = await uploadToR2(coverFile, `projects/${slugify(project.projectName)}`)
      if (r2Url) {
        updates.coverR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('cover')
        hasChanges = true
      }
    } else {
      console.log(`   ✓ Kapak görseli zaten eşleşiyor (R2): ${coverFile.name}`)
    }
  } else {
    // Kapak yoksa ilk görseli kullan
    const allImages = project.files.filter((f: File) => isImageFile(f.name))
    if (allImages.length > 0) {
      const firstImage = allImages[0]
      if (!projectData?.coverR2 || projectData?.cover) {
        console.log(`   ⚠️ Kapak yok, ilk görsel R2 kapak olarak kullanılıyor: ${firstImage.name}`)
        const r2Url = await uploadToR2(firstImage, `projects/${slugify(project.projectName)}`)
        if (r2Url) {
          updates.coverR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
          unsetFields.push('cover')
          hasChanges = true
        }
      }
      otherMedia = otherMedia.filter((f: File) => f !== firstImage)
    } else if (projectData?.coverR2 || projectData?.cover) {
      unsetFields.push('cover', 'coverR2')
      hasChanges = true
    }
  }

  // 2. Mobil kapak görseli
  if (coverMobileFile) {
    if (!projectData?.coverMobileR2 || projectData?.coverMobile) {
      console.log(`   📱 Mobil kapak görseli R2'ye yükleniyor: ${coverMobileFile.name}`)
      const r2Url = await uploadToR2(coverMobileFile, `projects/${slugify(project.projectName)}`)
      if (r2Url) {
        updates.coverMobileR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('coverMobile')
        hasChanges = true
      }
    }
  } else if (projectData?.coverMobileR2 || projectData?.coverMobile) {
    unsetFields.push('coverMobile', 'coverMobileR2')
    hasChanges = true
  }

  // 3. Desktop kapak görseli
  if (coverDesktopFile) {
    if (!projectData?.coverDesktopR2 || projectData?.coverDesktop) {
      console.log(`   💻 Desktop kapak görseli R2'ye yükleniyor: ${coverDesktopFile.name}`)
      const r2Url = await uploadToR2(coverDesktopFile, `projects/${slugify(project.projectName)}`)
      if (r2Url) {
        updates.coverDesktopR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('coverDesktop')
        hasChanges = true
      }
    }
  } else if (projectData?.coverDesktopR2 || projectData?.coverDesktop) {
    unsetFields.push('coverDesktop', 'coverDesktopR2')
    hasChanges = true
  }

  // 4. Alternatif medya eşitleme
  const folderMediaMap = new Map<string, { file: File; isVideo: boolean }>()
  for (const media of otherMedia) {
    const hash = await getFileHash(media)
    folderMediaMap.set(hash, { file: media, isVideo: isVideoFile(media.name) })
  }

  const cmsMediaMap = new Map<string, any>()
  const coverHashes = new Set<string>()
  if (projectData?.cover?.asset?.sha1hash) coverHashes.add(projectData.cover.asset.sha1hash)
  if (projectData?.coverMobile?.asset?.sha1hash) coverHashes.add(projectData.coverMobile.asset.sha1hash)
  if (projectData?.coverDesktop?.asset?.sha1hash) coverHashes.add(projectData.coverDesktop.asset.sha1hash)

  for (const mediaItem of existingMedia) {
    let hash: string | null = null
    if (mediaItem?.image?.asset?.sha1hash) hash = mediaItem.image.asset.sha1hash
    if (mediaItem?.videoFile?.asset?.sha1hash) hash = mediaItem.videoFile.asset.sha1hash
    if (hash && !coverHashes.has(hash)) cmsMediaMap.set(hash, mediaItem)
  }

  const syncedMedia: any[] = []
  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo } = mediaInfo
    const existing = cmsMediaMap.get(hash)

    if (existing && ((isVideo && existing.videoFileR2 && !existing.videoFile) || (!isVideo && existing.imageR2 && !existing.image))) {
      syncedMedia.push(existing)
      console.log(`   ✓ Korundu (R2): ${file.name}`)
    } else {
      console.log(`   ✅ ${isVideo ? 'Video' : 'Görsel'} R2'ye yükleniyor: ${file.name}`)
      const r2Url = await uploadToR2(file, `projects/${slugify(project.projectName)}`)
      if (r2Url) {
        const item: any = {
          _type: 'object',
          _key: `proj-${Date.now()}-${Math.random()}`,
          type: isVideo ? 'video' : 'image',
        }
        if (isVideo) {
          item.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
        } else {
          item.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        }
        syncedMedia.push(item)
        hasChanges = true
      }
    }
  }

  // Sonuç: Sadece klasördeki medya kalacak (eşitleme tamamlandı)
  updates.media = syncedMedia

  // Güncellemeleri uygula
  if (hasChanges || syncedMedia.length !== existingMedia.length) {
    let patch = client.patch(projectId)
    if (Object.keys(updates).length > 0) {
      patch = patch.set(updates)
    }
    if (unsetFields.length > 0) {
      patch = patch.unset(unsetFields)
    }
    await patch.commit()
    console.log(`   ✅ Eşitleme tamamlandı (Toplam: ${syncedMedia.length} medya)`)
  } else {
    console.log(`   ℹ️ Eşitleme gerekmedi, tüm medya zaten eşleşiyor`)
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
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
                      hasResponsiveSizes: r2Url.hasResponsiveSizes
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
    mainImage,
    mainImageR2,
    mainImageMobile,
    mainImageMobileR2,
    mainImageDesktop,
    mainImageDesktopR2,
    media[]{
      ...,
      image{asset->{_id, originalFilename, sha1hash}},
      imageR2,
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileR2
    }
  }`,
    { newsId },
  )

  const updates: any = {}
  const unsetFields: string[] = []
  let hasChanges = false

  const coverMain = news.files.find((f: File) =>
    isImageFile(f.name) && f.name.toLowerCase().includes('_kapak') && !f.name.toLowerCase().includes('_mobil') && !f.name.toLowerCase().includes('_desktop')
  ) || news.files.find((f: File) => isImageFile(f.name))

  const coverMobile = news.files.find((f: File) =>
    isImageFile(f.name) && f.name.toLowerCase().includes('_kapak_mobil')
  )
  const coverDesktop = news.files.find((f: File) =>
    isImageFile(f.name) && f.name.toLowerCase().includes('_kapak_desktop')
  )

  // 1. Kapak görselleri
  if (coverMain) {
    if (!newsData?.mainImageR2 || newsData?.mainImage) {
      console.log(`   📸 Haber kapak R2'ye yükleniyor: ${coverMain.name}`)
      const r2Url = await uploadToR2(coverMain, `news/${news.newsId}`)
      if (r2Url) {
        updates.mainImageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('mainImage')
        hasChanges = true
      }
    }
  }

  if (coverMobile) {
    if (!newsData?.mainImageMobileR2 || newsData?.mainImageMobile) {
      console.log(`   📱 Haber mobil kapak R2'ye yükleniyor: ${coverMobile.name}`)
      const r2Url = await uploadToR2(coverMobile, `news/${news.newsId}`)
      if (r2Url) {
        updates.mainImageMobileR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('mainImageMobile')
        hasChanges = true
      }
    }
  } else if (newsData?.mainImageMobileR2 || newsData?.mainImageMobile) {
    unsetFields.push('mainImageMobile', 'mainImageMobileR2')
    hasChanges = true
  }

  if (coverDesktop) {
    if (!newsData?.mainImageDesktopR2 || newsData?.mainImageDesktop) {
      console.log(`   💻 Haber desktop kapak R2'ye yükleniyor: ${coverDesktop.name}`)
      const r2Url = await uploadToR2(coverDesktop, `news/${news.newsId}`)
      if (r2Url) {
        updates.mainImageDesktopR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        unsetFields.push('mainImageDesktop')
        hasChanges = true
      }
    }
  } else if (newsData?.mainImageDesktopR2 || newsData?.mainImageDesktop) {
    unsetFields.push('mainImageDesktop', 'mainImageDesktopR2')
    hasChanges = true
  }

  // 2. Diğer medya dosyaları
  const otherMedia = news.files.filter((f: File) => !f.name.toLowerCase().includes('_kapak'))
  const folderMediaMap = new Map<string, File>()
  for (const f of otherMedia) {
    const hash = await getFileHash(f)
    folderMediaMap.set(hash, f)
  }

  const cmsMediaMap = new Map<string, any>()
  if (newsData?.media) {
    newsData.media.forEach((item: any) => {
      const hash = item?.image?.asset?.sha1hash || item?.videoFile?.asset?.sha1hash
      if (hash) cmsMediaMap.set(hash, item)
    })
  }

  const syncedMedia: any[] = []
  for (const [hash, file] of folderMediaMap.entries()) {
    const existing = cmsMediaMap.get(hash)
    const isVid = isVideoFile(file.name)

    if (existing && ((isVid && existing.videoFileR2 && !existing.videoFile) || (!isVid && existing.imageR2 && !existing.image))) {
      syncedMedia.push(existing)
    } else {
      console.log(`   ✅ Haber medyası R2'ye yükleniyor: ${file.name}`)
      const r2Url = await uploadToR2(file, `news/${news.newsId}`)
      if (r2Url) {
        const item: any = {
          _type: 'object',
          _key: `news-${Date.now()}-${Math.random()}`,
          type: isVid ? 'video' : 'image',
        }
        if (isVid) {
          item.videoFileR2 = { _type: 'r2Asset', url: r2Url.url, hasResponsiveSizes: r2Url.hasResponsiveSizes }
        } else {
          item.imageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
        }
        syncedMedia.push(item)
        hasChanges = true
      }
    }
  }

  if (hasChanges || (newsData?.media?.length || 0) !== syncedMedia.length) {
    updates.media = syncedMedia
    let patch = client.patch(newsId).set(updates)
    if (unsetFields.length > 0) patch = patch.unset(unsetFields)
    await patch.commit()
    console.log(`   ✅ Haber medyası güncellendi`)
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
        updates.heroImageR2 = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
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
          updates[`${sectionName}.imageR2`] = { _type: 'r2Asset', url: r2Url.url, width: r2Url.width, height: r2Url.height,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes,
                      hasResponsiveSizes: r2Url.hasResponsiveSizes }
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
