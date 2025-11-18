import React, { useState, useCallback } from 'react'
import { Card, Stack, Text, Button, Box, Flex, useToast } from '@sanity/ui'
import { UploadIcon, FolderIcon, CheckmarkIcon, WarningOutlineIcon } from '@sanity/icons'
import { useClient } from 'sanity'

interface ProgressItem {
  type: 'category' | 'designer' | 'product'
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
}

interface ParsedData {
  categories: Map<string, string>
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
  }>
}

export default function MediaImportTool() {
  const client = useClient({ apiVersion: '2025-01-01' })
  const toast = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [stats, setStats] = useState({ categories: 0, designers: 0, products: 0, images: 0 })

  // Klasör yapısını parse et
  const parseDirectory = useCallback((files: FileList): ParsedData => {
    const categories = new Map<string, string>()
    const designerMap = new Map<string, File[]>()
    const productMap = new Map<string, File[]>()

    Array.from(files).forEach(file => {
      const path = file.webkitRelativePath || file.name
      const parts = path.split('/')
      
      // Debug: İlk 5 dosyayı logla
      if (Array.from(files).indexOf(file) < 5) {
        console.log('🔍 Dosya analizi:', { 
          yol: path, 
          parçalar: parts, 
          uzantı: file.name.split('.').pop(),
          görselMi: isImageFile(file.name)
        })
      }

      // ürünler/kategori/model/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const urunIndex = parts.findIndex(p => {
        const lower = p?.toLowerCase() || ''
        return lower.includes('urun') || lower.includes('ürün')
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
        
        // Debug: İlk eşleşme
        if (productMap.size === 0) {
          console.log('✅ İlk ürün bulundu!', {
            categoryFolder,
            modelFolder,
            dosya: file.name
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
          productMap.set(productKey, [])
        }
        productMap.get(productKey)!.push(file)
      }
      
      // tasarımcılar/tasarımcı-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const tasarimIndex = parts.findIndex(p => {
        const lower = p?.toLowerCase() || ''
        return lower.includes('tasarim') || lower.includes('tasarım')
      })
      
      // Debug: Tasarımcı bulunduğunda log
      if (tasarimIndex !== -1 && parts.length >= tasarimIndex + 3 && Array.from(files).indexOf(file) < 2) {
        console.log('👤 Tasarımcı bulundu:', { 
          parts, 
          tasarimIndex,
          designerName: parts[tasarimIndex + 1]
        })
      }
      
      if (tasarimIndex !== -1 && parts.length >= tasarimIndex + 3) {
        const designerName = parts[tasarimIndex + 1]
        
        if (!designerMap.has(designerName)) {
          designerMap.set(designerName, [])
        }
        designerMap.get(designerName)!.push(file)
      }
    })

    // Map'leri dizilere çevir
    const designers = Array.from(designerMap.entries()).map(([name, files]) => ({
      id: slugify(name),
      name,
      files: files.filter(f => isImageFile(f.name))
    }))

    const products = Array.from(productMap.entries()).map(([key, files]) => {
      const [categoryId, modelId] = key.split('/')
      return {
        categoryId,
        categoryName: categories.get(categoryId) || categoryId,
        modelId,
        modelName: modelId.toUpperCase(),
        files: files.filter(f => isImageFile(f.name))
      }
    })

    return { categories, designers, products }
  }, [])

  // Dosya yükleme handler'ı
  const handleFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true)
    setProgress([])
    
    try {
      // Debug: Tüm dosyaları logla
      console.log('📁 Toplam dosya sayısı:', files.length)
      console.log('📄 İlk 10 dosya:', Array.from(files).slice(0, 10).map(f => f.webkitRelativePath || f.name))
      
      const data = parseDirectory(files)
      
      // Debug: Parse sonuçları
      console.log('📊 Parse sonuçları:', {
        kategoriler: data.categories.size,
        tasarımcılar: data.designers.length,
        ürünler: data.products.length,
        tasarımcı_detay: data.designers.map(d => ({ isim: d.name, dosya: d.files.length })),
        ürün_detay: data.products.map(p => ({ isim: p.modelName, dosya: p.files.length }))
      })
      
      // İstatistikler
      const totalImages = 
        data.designers.reduce((sum, d) => sum + d.files.length, 0) +
        data.products.reduce((sum, p) => sum + p.files.length, 0)
      
      setStats({
        categories: data.categories.size,
        designers: data.designers.length,
        products: data.products.length,
        images: totalImages
      })

      // Uyarı: Görsel bulunamadıysa
      if (totalImages === 0) {
        toast.push({
          status: 'warning',
          title: '⚠️ Görsel bulunamadı!',
          description: 'Klasörlerin içinde .jpg, .png gibi görsel dosyaları yok. Lütfen görselleri ekleyip tekrar deneyin.'
        })
        setIsProcessing(false)
        return
      }

      toast.push({
        status: 'info',
        title: 'Tarama tamamlandı',
        description: `${data.categories.size} kategori, ${data.designers.length} tasarımcı, ${data.products.length} ürün bulundu`
      })

      // Yükleme başlasın mı diye sor
      if (confirm(`${data.categories.size} kategori, ${data.designers.length} tasarımcı ve ${data.products.length} ürün yüklenecek. Devam edilsin mi?`)) {
        await uploadToSanity(data)
      }
    } catch (error: any) {
      console.error('Hata:', error)
      toast.push({
        status: 'error',
        title: 'Hata oluştu',
        description: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }, [parseDirectory, toast])

  // Sanity'ye yükleme
  const uploadToSanity = async (data: ParsedData) => {
    const newProgress: ProgressItem[] = []
    
    // Önce mevcut tasarımcıları ve ürünleri çek
    toast.push({
      status: 'info',
      title: 'Mevcut kayıtlar kontrol ediliyor...',
      description: 'CMS\'deki tasarımcılar ve ürünler sorgulanıyor'
    })
    
    const existingDesigners = await client.fetch(`*[_type == "designer"]{ _id, "slug": id.current, name }`)
    const existingProducts = await client.fetch(`*[_type == "product"]{ _id, "slug": id.current, name }`)
    
    console.log('📋 Mevcut kayıtlar:', {
      tasarımcılar: existingDesigners.length,
      ürünler: existingProducts.length
    })
    
    // 1. Tasarımcı görsellerini yükle (sadece görsel, kayıt oluşturmadan)
    for (const designer of data.designers) {
      const item: ProgressItem = {
        type: 'designer',
        name: designer.name,
        status: 'uploading'
      }
      newProgress.push(item)
      setProgress([...newProgress])
      
      try {
        // Mevcut tasarımcıyı bul
        const existing = existingDesigners.find((d: any) => 
          d.slug === designer.id || 
          d.name?.tr?.toLowerCase() === designer.name.toLowerCase() ||
          d.name?.en?.toLowerCase() === designer.name.toLowerCase()
        )
        
        if (existing) {
          await updateDesignerImages(client, existing._id, designer)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          item.status = 'error'
          item.message = 'CMS\'de bulunamadı - önce manuel oluşturun'
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
        status: 'uploading'
      }
      newProgress.push(item)
      setProgress([...newProgress])
      
      try {
        // Mevcut ürünü bul
        const productSlug = `${product.categoryId}-${product.modelId}`
        const existing = existingProducts.find((p: any) => 
          p.slug === productSlug ||
          p.name?.tr?.toLowerCase() === product.modelName.toLowerCase() ||
          p.name?.en?.toLowerCase() === product.modelName.toLowerCase()
        )
        
        if (existing) {
          await updateProductImages(client, existing._id, product)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          item.status = 'error'
          item.message = 'CMS\'de bulunamadı - önce manuel oluşturun'
        }
      } catch (error: any) {
        item.status = 'error'
        item.message = error.message
      }
      setProgress([...newProgress])
    }

    const successCount = newProgress.filter(p => p.status === 'success').length
    const errorCount = newProgress.filter(p => p.status === 'error').length
    
    toast.push({
      status: successCount > 0 ? 'success' : 'warning',
      title: 'Yükleme tamamlandı!',
      description: `✅ ${successCount} başarılı, ❌ ${errorCount} hata`
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const items = e.dataTransfer.items
    if (items && items.length > 0) {
      const item = items[0]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry && entry.isDirectory) {
          // Klasör bırakıldı
          readDirectory(entry as any).then(files => {
            const fileList = createFileList(files)
            handleFiles(fileList)
          })
        }
      }
    }
  }, [handleFiles])

  // Klasör seçme butonu
  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Text size={3} weight="bold">
            📦 Medya İçe Aktarma
          </Text>
          <Text size={1} muted style={{ marginTop: '0.5rem' }}>
            Ürün ve tasarımcı görsellerinizi sürükle-bırak yapın veya klasör seçin
          </Text>
        </Box>

        {/* Sürükle-bırak alanı */}
        <Card
          padding={5}
          radius={3}
          shadow={isDragging ? 3 : 1}
          tone={isDragging ? 'primary' : 'default'}
          style={{
            border: isDragging ? '2px dashed var(--card-focus-ring-color)' : '2px dashed var(--card-border-color)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Stack space={3}>
            <Flex justify="center">
              <Text size={5}>
                {isDragging ? '📥' : '📁'}
              </Text>
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
                webkitdirectory=""
                directory=""
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
              <Text size={1} weight="semibold">📊 Bulunan İçerik:</Text>
              <Flex gap={3}>
                <Text size={1}>📂 {stats.categories} Kategori</Text>
                <Text size={1}>👤 {stats.designers} Tasarımcı</Text>
                <Text size={1}>📦 {stats.products} Ürün</Text>
                <Text size={1}>🖼️ {stats.images} Görsel</Text>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Progress */}
        {progress.length > 0 && (
          <Card padding={3} tone="transparent" radius={2} style={{ maxHeight: '400px', overflow: 'auto' }}>
            <Stack space={2}>
              <Text size={1} weight="semibold">⏳ İşlem Durumu:</Text>
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
                    {' '}
                    {item.name}
                    {item.message && ` - ${item.message}`}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}

        {/* Yardım */}
        <Card padding={3} tone="caution" radius={2}>
          <Stack space={2}>
            <Text size={1} weight="semibold">⚠️ ÖNEMLİ:</Text>
            <Text size={1}>
              Bu araç <strong>sadece görselleri yükler</strong>. Tasarımcılar ve ürünler CMS'de önceden oluşturulmuş olmalı!
            </Text>
            <Text size={0} muted>
              1️⃣ Önce CMS'de tasarımcı/ürün oluşturun<br />
              2️⃣ Sonra bu araçla görsellerini yükleyin
            </Text>
          </Stack>
        </Card>
        
        <Card padding={3} tone="transparent" radius={2}>
          <Stack space={2}>
            <Text size={1} weight="semibold">💡 Klasör Yapısı:</Text>
            <Text size={1} style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
{`Klasör/
├── ürünler/ (veya ÜRÜNLER)
│   └── 01 - KANEPELER/
│       └── 01 - SU/
│           ├── su_kapak.jpg
│           └── su_1.jpg
└── tasarımcılar/ (veya TASARIMCILAR)
    └── Ahmet Yılmaz/
        └── profil.jpg`}
            </Text>
            <Text size={0} muted>
              ℹ️ Klasör/tasarımcı isimleri CMS'deki isimlerle eşleşmeli
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
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  }
  let result = text
  Object.entries(turkishMap).forEach(([tr, en]) => {
    result = result.replace(new RegExp(tr, 'g'), en)
  })
  return result.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '')
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
              value: path + entry.name
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
  files.forEach(file => dataTransfer.items.add(file))
  return dataTransfer.files
}

// ============================================================================
// SANITY UPLOAD FONKSİYONLARI (SADECE GÖRSEL GÜNCELLEMESİ)
// ============================================================================

/**
 * Sadece tasarımcı görsellerini günceller (yeni kayıt oluşturmaz)
 */
async function updateDesignerImages(client: any, designerId: string, designer: { id: string; name: string; files: File[] }) {
  const generalImage = designer.files.find(f => !f.name.toLowerCase().includes('_mobil'))
  const mobileImage = designer.files.find(f => f.name.toLowerCase().includes('_mobil'))

  const updates: any = {}

  if (generalImage) {
    console.log(`   📤 Genel görsel yükleniyor: ${generalImage.name}`)
    const asset = await client.assets.upload('image', generalImage)
    updates.image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  }

  if (mobileImage) {
    console.log(`   📱 Mobil görsel yükleniyor: ${mobileImage.name}`)
    const asset = await client.assets.upload('image', mobileImage)
    updates.imageMobile = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  }

  // Sadece görselleri güncelle
  if (Object.keys(updates).length > 0) {
    await client.patch(designerId).set(updates).commit()
  }
}

/**
 * Sadece ürün görsellerini günceller (yeni kayıt oluşturmaz)
 */
async function updateProductImages(client: any, productId: string, product: any) {
  const coverMain = product.files.find((f: File) => f.name.toLowerCase().includes('_kapak') && !f.name.toLowerCase().includes('_mobil'))
  const coverMobile = product.files.find((f: File) => f.name.toLowerCase().includes('_kapak_mobil'))
  const regularImages = product.files.filter((f: File) => 
    !f.name.toLowerCase().includes('_kapak')
  )

  const updates: any = {}

  // Ana kapak görseli
  if (coverMain) {
    console.log(`   📸 Ana kapak yükleniyor: ${coverMain.name}`)
    const asset = await client.assets.upload('image', coverMain)
    updates.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } else if (regularImages.length > 0) {
    console.log(`   ⚠️ Kapak yok, ilk görsel kullanılıyor: ${regularImages[0].name}`)
    const asset = await client.assets.upload('image', regularImages[0])
    updates.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  }

  // Mobil kapak görseli
  if (coverMobile) {
    console.log(`   📱 Mobil kapak yükleniyor: ${coverMobile.name}`)
    const asset = await client.assets.upload('image', coverMobile)
    updates.mainImageMobile = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  }

  // Alternatif görseller
  const alternativeAssets = []
  const imagesToUpload = coverMain ? regularImages : regularImages.slice(1)
  
  if (imagesToUpload.length > 0) {
    console.log(`   🖼️ ${imagesToUpload.length} alternatif görsel yükleniyor...`)
  }
  
  for (const img of imagesToUpload) {
    try {
      const asset = await client.assets.upload('image', img)
      alternativeAssets.push({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } })
    } catch (error) {
      console.error(`   ❌ Görsel yüklenemedi: ${img.name}`)
    }
  }

  if (alternativeAssets.length > 0) {
    updates.alternativeImages = alternativeAssets
  }

  // Sadece görselleri güncelle
  if (Object.keys(updates).length > 0) {
    await client.patch(productId).set(updates).commit()
  }
}

