import React, { useState, useCallback } from 'react'
import { Card, Stack, Text, Button, Box, Flex, useToast } from '@sanity/ui'
import { UploadIcon, FolderIcon, CheckmarkIcon, WarningOutlineIcon } from '@sanity/icons'
import { useClient } from 'sanity'

interface ProgressItem {
  type: 'category' | 'designer' | 'product' | 'project' | 'materialGroup' | 'materialBook'
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
}

export default function MediaImportTool() {
  const client = useClient({ apiVersion: '2025-01-01' })
  const toast = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [stats, setStats] = useState({ categories: 0, designers: 0, products: 0, projects: 0, images: 0 })

  // Klasör yapısını parse et
  const parseDirectory = useCallback((files: FileList): ParsedData => {
    const categories = new Map<string, string>()
    const designerMap = new Map<string, File[]>()
    const productMap = new Map<string, File[]>()
    const materialGroupMap = new Map<string, Map<string, File[]>>()
    const projectMap = new Map<string, File[]>()

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
      
      // malzemeler/grup-adı/kartela-adı/görsel.jpg (büyük/küçük harf duyarsız)
      const malzemeIndex = parts.findIndex(p => {
        const lower = p?.toLowerCase() || ''
        return lower === 'malzemeler' || lower === 'malzeme'
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
        if (materialGroupMap.size === 1 && groupBooks.size === 1 && groupBooks.get(bookName)!.length === 1) {
          console.log('🎨 İlk malzeme bulundu!', {
            groupName,
            bookName,
            dosya: file.name
          })
        }
      }
      
      // projeler/proje-adı/görsel.jpg (büyük/küçük harf duyarsız, Türkçe karakter destekli)
      const projeIndex = parts.findIndex(p => {
        const lower = p?.toLowerCase() || ''
        return lower.includes('proje') || lower.includes('project')
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
            dosya: file.name
          })
        }
      }
    })

    // Map'leri dizilere çevir
    const designers = Array.from(designerMap.entries()).map(([name, files]) => ({
      id: slugify(name),
      name,
      files: files.filter(f => isMediaFile(f.name)) // Görsel ve video dosyaları
    }))

    const products = Array.from(productMap.entries()).map(([key, files]) => {
      const [categoryId, modelId] = key.split('/')
      return {
        categoryId,
        categoryName: categories.get(categoryId) || categoryId,
        modelId,
        modelName: modelId.toUpperCase(),
        files: files.filter(f => isMediaFile(f.name)) // Görsel ve video dosyaları
      }
    })

    const materialGroups = Array.from(materialGroupMap.entries()).map(([groupName, booksMap]) => ({
      groupName,
      books: Array.from(booksMap.entries()).map(([bookName, files]) => ({
        bookName,
        files: files.filter(f => isMediaFile(f.name)) // Görsel ve video dosyaları
      }))
    }))

    const projects = Array.from(projectMap.entries()).map(([projectFolder, files]) => ({
      projectId: slugify(projectFolder),
      projectName: projectFolder,
      files: files.filter(f => isMediaFile(f.name)) // Görsel ve video dosyaları
    }))

    return { categories, designers, products, materialGroups, projects }
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
        malzemeGrupları: data.materialGroups.length,
        tasarımcı_detay: data.designers.map(d => ({ isim: d.name, dosya: d.files.length })),
        ürün_detay: data.products.map(p => ({ isim: p.modelName, dosya: p.files.length })),
        malzeme_detay: data.materialGroups.map(g => ({ 
          grup: g.groupName, 
          kartelaSayısı: g.books.length,
          toplamGörsel: g.books.reduce((sum, b) => sum + b.files.length, 0)
        }))
      })
      
      // İstatistikler (görsel + video)
      const totalMedia = 
        data.designers.reduce((sum, d) => sum + d.files.length, 0) +
        data.products.reduce((sum, p) => sum + p.files.length, 0) +
        data.projects.reduce((sum, p) => sum + p.files.length, 0) +
        data.materialGroups.reduce((sum, g) => 
          sum + g.books.reduce((bookSum, b) => bookSum + b.files.length, 0), 0)
      
      setStats({
        categories: data.categories.size,
        designers: data.designers.length,
        products: data.products.length,
        projects: data.projects.length,
        images: totalMedia // Görsel + video toplamı
      })

      // Uyarı: Medya bulunamadıysa
      if (totalMedia === 0) {
        toast.push({
          status: 'warning',
          title: '⚠️ Medya bulunamadı!',
          description: 'Klasörlerin içinde .jpg, .png, .mp4 gibi görsel veya video dosyaları yok. Lütfen medya dosyalarını ekleyip tekrar deneyin.'
        })
        setIsProcessing(false)
        return
      }

      const materialSummary = data.materialGroups.length > 0 
        ? `, ${data.materialGroups.length} malzeme grubu` 
        : ''
      const projectSummary = data.projects.length > 0 
        ? `, ${data.projects.length} proje` 
        : ''
      
      toast.push({
        status: 'info',
        title: 'Tarama tamamlandı',
        description: `${data.categories.size} kategori, ${data.designers.length} tasarımcı, ${data.products.length} ürün${projectSummary}${materialSummary} bulundu`
      })

      // Yükleme başlasın mı diye sor
      const parts: string[] = []
      if (data.categories.size > 0) parts.push(`${data.categories.size} kategori`)
      if (data.designers.length > 0) parts.push(`${data.designers.length} tasarımcı`)
      if (data.products.length > 0) parts.push(`${data.products.length} ürün`)
      if (data.projects.length > 0) parts.push(`${data.projects.length} proje`)
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
      kategoriler: existingCategories.length
    })
    
    console.log('📂 CMS\'deki Kategoriler:')
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
        // Kategori adını CMS'deki slug'a çevir
        const normalizedCategoryName = normalizeText(product.categoryName)
        const actualCategorySlug = categoryNameToSlug.get(normalizedCategoryName) || 
                                   categoryNameToSlug.get(product.categoryName.toLowerCase()) ||
                                   product.categoryId
        
        console.log(`   🔍 ${product.categoryName}: "${product.categoryId}" -> "${actualCategorySlug}"`)
        
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
          console.log(`   🎯 Eşleşme bulundu: ${existing.name?.tr} (Kategori: ${existing.categoryName?.tr})`)
          await updateProductImages(client, existing._id, product)
          item.status = 'success'
          item.message = 'Görseller güncellendi'
        } else {
          console.log(`   ❌ Bulunamadı: ${product.categoryName}/${product.modelName}`)
          console.log(`   🔍 Aranan slug: "${productSlug}"`)
          console.log(`   🔍 Aranan categoryId: "${product.categoryId}", modelId: "${product.modelId}"`)
          console.log(`   📊 CMS'deki benzer ürünler:`)
          existingProducts
            .filter((p: any) => {
              const normalizeForComparison = (str: string) => slugify(str).replace(/-/g, '')
              const normalizedProductName = normalizeForComparison(product.modelName)
              return normalizeForComparison(p.name?.tr || '') === normalizedProductName ||
                     normalizeForComparison(p.name?.en || '') === normalizedProductName
            })
            .forEach((p: any) => {
              console.log(`      - "${p.name?.tr}" | slug: "${p.slug}" | kategori: "${p.categorySlug}"`)
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
        description: 'CMS\'deki malzeme grupları sorgulanıyor'
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
          status: 'uploading'
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
              status: 'uploading'
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
              
              console.log(`   📚 Kartela bulundu: ${matchingGroup.books[matchingBookIndex].title?.tr}`)
              
              // Görselleri kartelaya ekle
              const existingItems = matchingGroup.books[matchingBookIndex].items || []
              const newItems = [...existingItems]
              
              let uploadedCount = 0
              for (const file of book.files) {
                try {
                  console.log(`   📸 Görsel yükleniyor: ${file.name}`)
                  const asset = await client.assets.upload('image', file)
                  
                  // Dosya adından malzeme adını çıkar (uzantısız)
                  const materialName = file.name.replace(/\.[^/.]+$/, '')
                  
                  newItems.push({
                    _type: 'productMaterial',
                    _key: `material-${Date.now()}-${Math.random()}`,
                    name: { tr: materialName, en: materialName },
                    image: {
                      _type: 'image',
                      asset: {
                        _type: 'reference',
                        _ref: asset._id
                      }
                    }
                  })
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
                  items: newItems
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
        description: 'CMS\'deki projeler sorgulanıyor'
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
          status: 'uploading'
        }
        newProgress.push(item)
        setProgress([...newProgress])
        
        try {
          // Proje adını normalize et ve karşılaştır
          const normalizedProjectName = normalizeText(project.projectName)
          
          const matchingProject = existingProjects.find((p: any) => {
            const titleTr = normalizeText(p.titleTr || '')
            const titleEn = normalizeText(p.titleEn || '')
            return titleTr === normalizedProjectName || titleEn === normalizedProjectName || p.slug === project.projectId
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
            Ürün, tasarımcı ve proje görsellerinizi sürükle-bırak yapın veya klasör seçin
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
                <Text size={1}>📁 {stats.projects} Proje</Text>
                <Text size={1}>🖼️ {stats.images} Medya (Görsel + Video)</Text>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Sadece Hatalar */}
        {progress.filter(p => p.status === 'error').length > 0 && (
          <Card padding={3} tone="critical" radius={2} style={{ maxHeight: '300px', overflow: 'auto' }}>
            <Stack space={2}>
              <Flex align="center" gap={2}>
                <WarningOutlineIcon style={{ color: 'red' }} />
                <Text size={2} weight="bold" style={{ color: 'red' }}>
                  ❌ Hatalar ({progress.filter(p => p.status === 'error').length})
                </Text>
              </Flex>
              {progress.filter(p => p.status === 'error').map((item, idx) => (
                <Card key={idx} padding={2} tone="default" radius={2}>
                  <Stack space={1}>
                    <Text size={1} weight="semibold">
                      {item.type === 'category' && '📂'}
                      {item.type === 'designer' && '👤'}
                      {item.type === 'product' && '📦'}
                      {item.type === 'project' && '📁'}
                      {item.type === 'materialGroup' && '🎨'}
                      {item.type === 'materialBook' && '📚'}
                      {' '}
                      {item.name}
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
          <Card padding={3} tone="transparent" radius={2} style={{ maxHeight: '400px', overflow: 'auto' }}>
            <Stack space={2}>
              <Text size={1} weight="semibold">⏳ Tüm İşlemler:</Text>
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
                    {item.type === 'materialBook' && '📚'}
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
              Bu araç <strong>sadece görselleri yükler</strong>. Tasarımcılar, ürünler, malzeme grupları ve kartelalar CMS'de önceden oluşturulmuş olmalı!
            </Text>
            <Text size={0} muted>
              1️⃣ Önce CMS'de tasarımcı/ürün/malzeme grubu/kartela oluşturun<br />
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
├── tasarımcılar/ (veya TASARIMCILAR)
│   └── Ahmet Yılmaz/
│       └── profil.jpg
└── MALZEMELER/
    └── KUMAŞ/
        └── KARTELA-1/
            ├── malzeme1.jpg
            └── malzeme2.jpg`}
            </Text>
            <Text size={0} muted>
              ℹ️ Klasör/tasarımcı/malzeme grup/kartela isimleri CMS'deki isimlerle eşleşmeli
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
    'ç': 'c', 'Ç': 'c', 
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i',  // Türkçe noktasız I -> i
    'İ': 'i', 'i': 'i',  // Türkçe noktalı İ -> i
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's', 
    'ü': 'u', 'Ü': 'u',
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
 * Tasarımcı için mevcut görselleri kontrol et
 */
async function checkExistingDesignerAssets(client: any, designerId: string) {
  const designer = await client.fetch(`*[_id == $designerId][0]{
    image{asset->{_id, originalFilename, sha1hash}},
    imageMobile{asset->{_id, originalFilename, sha1hash}}
  }`, { designerId })
  
  const existingHashes = new Set<string>()
  const existingFilenames = new Set<string>()
  
  if (designer?.image?.asset) {
    if (designer.image.asset.sha1hash) existingHashes.add(designer.image.asset.sha1hash)
    if (designer.image.asset.originalFilename) existingFilenames.add(designer.image.asset.originalFilename)
  }
  if (designer?.imageMobile?.asset) {
    if (designer.imageMobile.asset.sha1hash) existingHashes.add(designer.imageMobile.asset.sha1hash)
    if (designer.imageMobile.asset.originalFilename) existingFilenames.add(designer.imageMobile.asset.originalFilename)
  }
  
  return { existingHashes, existingFilenames }
}

/**
 * Sadece tasarımcı görsellerini günceller (yeni kayıt oluşturmaz)
 */
async function updateDesignerImages(client: any, designerId: string, designer: { id: string; name: string; files: File[] }) {
  // Mevcut görselleri kontrol et
  const { existingHashes, existingFilenames } = await checkExistingDesignerAssets(client, designerId)
  
  const generalImage = designer.files.find(f => !f.name.toLowerCase().includes('_mobil'))
  const mobileImage = designer.files.find(f => f.name.toLowerCase().includes('_mobil'))

  const updates: any = {}

  if (generalImage) {
    const alreadyExists = await isAssetAlreadyUploaded(client, generalImage, existingHashes, existingFilenames)
    if (!alreadyExists) {
      console.log(`   📤 Genel görsel yükleniyor: ${generalImage.name}`)
      const asset = await client.assets.upload('image', generalImage)
      updates.image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
    }
  }

  if (mobileImage) {
    const alreadyExists = await isAssetAlreadyUploaded(client, mobileImage, existingHashes, existingFilenames)
    if (!alreadyExists) {
      console.log(`   📱 Mobil görsel yükleniyor: ${mobileImage.name}`)
      const asset = await client.assets.upload('image', mobileImage)
      updates.imageMobile = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
    }
  }

  // Sadece görselleri güncelle
  if (Object.keys(updates).length > 0) {
    await client.patch(designerId).set(updates).commit()
    console.log(`   ✅ ${Object.keys(updates).length} alan güncellendi`)
  } else {
    console.log(`   ℹ️ Tüm görseller zaten mevcut, güncelleme yapılmadı`)
  }
}

/**
 * Sanity'deki mevcut görselleri kontrol et
 */
async function checkExistingAssets(client: any, productId: string) {
  const product = await client.fetch(`*[_id == $productId][0]{
    mainImage{asset->{_id, originalFilename, sha1hash}},
    mainImageMobile{asset->{_id, originalFilename, sha1hash}},
    alternativeMedia[]{
      ...,
      type,
      image{asset->{_id, originalFilename, sha1hash}},
      videoFile{asset->{_id, originalFilename, sha1hash}}
    }
  }`, { productId })
  
  const existingHashes = new Set<string>()
  const existingFilenames = new Set<string>()
  
  if (product?.mainImage?.asset) {
    if (product.mainImage.asset.sha1hash) existingHashes.add(product.mainImage.asset.sha1hash)
    if (product.mainImage.asset.originalFilename) existingFilenames.add(product.mainImage.asset.originalFilename)
  }
  if (product?.mainImageMobile?.asset) {
    if (product.mainImageMobile.asset.sha1hash) existingHashes.add(product.mainImageMobile.asset.sha1hash)
    if (product.mainImageMobile.asset.originalFilename) existingFilenames.add(product.mainImageMobile.asset.originalFilename)
  }
  
  // Mevcut alternativeMedia array'ini koru (hem görsel hem video)
  const existingAlternativeMedia: any[] = []
  if (product?.alternativeMedia) {
    product.alternativeMedia.forEach((item: any) => {
      // Görsel medya
      if (item?.image?.asset) {
        if (item.image.asset.sha1hash) existingHashes.add(item.image.asset.sha1hash)
        if (item.image.asset.originalFilename) existingFilenames.add(item.image.asset.originalFilename)
        existingAlternativeMedia.push(item)
      }
      // Video medya
      if (item?.videoFile?.asset) {
        if (item.videoFile.asset.sha1hash) existingHashes.add(item.videoFile.asset.sha1hash)
        if (item.videoFile.asset.originalFilename) existingFilenames.add(item.videoFile.asset.originalFilename)
        existingAlternativeMedia.push(item)
      }
    })
  }
  
  return { existingHashes, existingFilenames, existingAlternativeMedia }
}

/**
 * Dosya hash'ini hesapla
 */
async function getFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Görselin daha önce yüklenip yüklenmediğini kontrol et
 */
async function isAssetAlreadyUploaded(
  client: any, 
  file: File, 
  existingHashes: Set<string>, 
  existingFilenames: Set<string>
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
  const { existingHashes, existingFilenames, existingAlternativeMedia } = await checkExistingAssets(client, productId)
  
  // Kapak görselleri sadece görsel olabilir (video olamaz)
  const coverMain = product.files.find((f: File) => 
    isImageFile(f.name) && 
    f.name.toLowerCase().includes('_kapak') && 
    !f.name.toLowerCase().includes('_mobil')
  )
  const coverMobile = product.files.find((f: File) => 
    isImageFile(f.name) && 
    f.name.toLowerCase().includes('_kapak_mobil')
  )
  // Alternatif medya: hem görsel hem video olabilir
  const regularMedia = product.files.filter((f: File) => 
    !f.name.toLowerCase().includes('_kapak')
  )

  const updates: any = {}
  let hasChanges = false

  // ============================================
  // 1. KAPAK GÖRSELLERİNİ EŞİTLE
  // ============================================
  
  // Ana kapak görseli - Eşitleme mantığı
  if (coverMain) {
    // Klasörde kapak var - hash kontrolü yap
    const coverMainHash = await getFileHash(coverMain)
    const existingMainHash = Array.from(existingHashes).find(h => h === coverMainHash)
    
    if (!existingMainHash) {
      // Klasörde var ama CMS'de yok veya farklı - güncelle
      console.log(`   📸 Ana kapak güncelleniyor: ${coverMain.name}`)
      const asset = await client.assets.upload('image', coverMain)
      updates.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      existingHashes.add(asset.sha1hash)
      existingFilenames.add(asset.originalFilename)
      hasChanges = true
    } else {
      console.log(`   ✓ Ana kapak zaten eşleşiyor: ${coverMain.name}`)
    }
  } else {
    // Kapak görseli yok - ilk görseli (video değil) kapak olarak kullan
    const firstImage = regularMedia.find(f => isImageFile(f.name))
    if (firstImage) {
      const firstImageHash = await getFileHash(firstImage)
      const existingMainHash = Array.from(existingHashes).find(h => h === firstImageHash)
      
      if (!existingMainHash) {
        console.log(`   ⚠️ Kapak yok, ilk görsel kapak olarak kullanılıyor: ${firstImage.name}`)
        const asset = await client.assets.upload('image', firstImage)
        updates.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
        existingHashes.add(asset.sha1hash)
        existingFilenames.add(asset.originalFilename)
        hasChanges = true
      }
    } else {
      // Klasörde hiç görsel yok - CMS'deki kapak görselini sil (eşitleme)
      console.log(`   🗑️ Klasörde görsel yok, CMS'deki kapak siliniyor (eşitleme)`)
      updates.mainImage = null
      hasChanges = true
    }
  }

  // Mobil kapak görseli - Eşitleme mantığı
  if (coverMobile) {
    // Klasörde mobil kapak var - hash kontrolü yap
    const coverMobileHash = await getFileHash(coverMobile)
    const existingMobileHash = Array.from(existingHashes).find(h => h === coverMobileHash)
    
    if (!existingMobileHash) {
      // Klasörde var ama CMS'de yok veya farklı - güncelle
      console.log(`   📱 Mobil kapak güncelleniyor: ${coverMobile.name}`)
      const asset = await client.assets.upload('image', coverMobile)
      updates.mainImageMobile = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      existingHashes.add(asset.sha1hash)
      existingFilenames.add(asset.originalFilename)
      hasChanges = true
    } else {
      console.log(`   ✓ Mobil kapak zaten eşleşiyor: ${coverMobile.name}`)
    }
  } else {
    // Klasörde mobil kapak yok - CMS'deki mobil kapak görselini sil (eşitleme)
    console.log(`   🗑️ Klasörde mobil kapak yok, CMS'deki mobil kapak siliniyor (eşitleme)`)
    updates.mainImageMobile = null
    hasChanges = true
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
    const firstImage = regularMedia.find(f => isImageFile(f.name))
    if (firstImage) {
      mediaToSync = regularMedia.filter(f => f !== firstImage)
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
  const productData = await client.fetch(`*[_id == $productId][0]{
    mainImage{asset->{sha1hash}},
    mainImageMobile{asset->{sha1hash}}
  }`, { productId })
  
  if (productData?.mainImage?.asset?.sha1hash) {
    coverHashes.add(productData.mainImage.asset.sha1hash)
  }
  if (productData?.mainImageMobile?.asset?.sha1hash) {
    coverHashes.add(productData.mainImageMobile.asset.sha1hash)
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
  
  const imageCount = Array.from(folderMediaMap.values()).filter(m => !m.isVideo).length
  const videoCount = Array.from(folderMediaMap.values()).filter(m => m.isVideo).length
  console.log(`   📊 Klasör: ${imageCount} görsel, ${videoCount} video | CMS: ${cmsMediaHashes.size} medya`)
  
  // Eşitleme: Klasördeki medyayla CMS'deki medyayı birleştir
  const syncedAlternativeMedia: any[] = []
  
  // 1. Klasördeki medyayı ekle (CMS'de yoksa yükle, varsa koru)
  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo } = mediaInfo
    
    if (cmsMediaHashes.has(hash)) {
      // Her ikisinde de var - koru
      const existingItem = cmsMediaMap.get(hash)
      syncedAlternativeMedia.push(existingItem)
      console.log(`   ✓ Korundu: ${file.name} (${isVideo ? 'video' : 'görsel'})`)
    } else {
      // Klasörde var ama CMS'de yok - ekle
      try {
        if (isVideo) {
          console.log(`   ✅ Video yükleniyor: ${file.name}`)
          const asset = await client.assets.upload('file', file) // Video için 'file' tipi
          syncedAlternativeMedia.push({
            _type: 'productSimpleMediaItem',
            _key: asset._id,
            type: 'video',
            videoFile: {
              _type: 'file',
              asset: {
                _type: 'reference',
                _ref: asset._id
              }
            }
          })
        } else {
          console.log(`   ✅ Görsel yükleniyor: ${file.name}`)
          const asset = await client.assets.upload('image', file)
          syncedAlternativeMedia.push({
            _type: 'productSimpleMediaItem',
            _key: asset._id,
            type: 'image',
            image: { 
              _type: 'image', 
              asset: { _type: 'reference', _ref: asset._id } 
            }
          })
        }
        hasChanges = true
      } catch (error) {
        console.error(`   ❌ Yüklenemedi: ${file.name}`, error)
      }
    }
  }
  
  // 2. CMS'de olan ama klasörde olmayan medyayı say (silinecek)
  const toDelete = Array.from(cmsMediaHashes).filter(hash => !folderMediaHashes.has(hash))
  if (toDelete.length > 0) {
    console.log(`   🗑️ ${toDelete.length} medya klasörde yok, CMS'den siliniyor`)
    hasChanges = true
  }
  
  // Sonuç: Sadece klasördeki görseller kalacak (eşitleme tamamlandı)
  updates.alternativeMedia = syncedAlternativeMedia
  
  // ============================================
  // 3. GÜNCELLEMELERİ UYGULA
  // ============================================
  
  if (hasChanges || syncedAlternativeMedia.length !== existingAlternativeMedia.length) {
    await client.patch(productId).set(updates).commit()
    const added = syncedAlternativeMedia.length - (existingAlternativeMedia.length - toDelete.length)
    const deleted = toDelete.length
    const addedText = added > 0 ? `+${added} eklendi` : ''
    const deletedText = deleted > 0 ? `-${deleted} silindi` : ''
    const summary = [addedText, deletedText].filter(Boolean).join(' ')
    console.log(`   ✅ Eşitleme tamamlandı: ${summary} (Toplam: ${syncedAlternativeMedia.length} medya)`)
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
  const projectData = await client.fetch(`*[_id == $projectId][0]{
    cover{asset->{_id, originalFilename, sha1hash}},
    coverMobile{asset->{_id, originalFilename, sha1hash}},
    coverDesktop{asset->{_id, originalFilename, sha1hash}},
    media[]{
      ...,
      type,
      image{asset->{_id, originalFilename, sha1hash}},
      imageMobile{asset->{_id, originalFilename, sha1hash}},
      imageDesktop{asset->{_id, originalFilename, sha1hash}},
      videoFile{asset->{_id, originalFilename, sha1hash}},
      videoFileMobile{asset->{_id, originalFilename, sha1hash}},
      videoFileDesktop{asset->{_id, originalFilename, sha1hash}}
    }
  }`, { projectId })
  
  const existingHashes = new Set<string>()
  const existingFilenames = new Set<string>()
  const existingMedia: any[] = []
  
  // Kapak görsellerini hash'le
  if (projectData?.cover?.asset?.sha1hash) {
    existingHashes.add(projectData.cover.asset.sha1hash)
    if (projectData.cover.asset.originalFilename) {
      existingFilenames.add(projectData.cover.asset.originalFilename)
    }
  }
  if (projectData?.coverMobile?.asset?.sha1hash) {
    existingHashes.add(projectData.coverMobile.asset.sha1hash)
  }
  if (projectData?.coverDesktop?.asset?.sha1hash) {
    existingHashes.add(projectData.coverDesktop.asset.sha1hash)
  }
  
  // Mevcut medyayı topla
  if (projectData?.media) {
    for (const mediaItem of projectData.media) {
      // Görsel medya
      if (mediaItem?.image?.asset?.sha1hash) {
        existingHashes.add(mediaItem.image.asset.sha1hash)
        if (mediaItem.image.asset.originalFilename) {
          existingFilenames.add(mediaItem.image.asset.originalFilename)
        }
        existingMedia.push(mediaItem)
      }
      // Video medya
      if (mediaItem?.videoFile?.asset?.sha1hash) {
        existingHashes.add(mediaItem.videoFile.asset.sha1hash)
        if (mediaItem.videoFile.asset.originalFilename) {
          existingFilenames.add(mediaItem.videoFile.asset.originalFilename)
        }
        existingMedia.push(mediaItem)
      }
    }
  }
  
  const updates: any = {}
  let hasChanges = false
  
  // Kapak görseli bul (_kapak.***) - sadece görsel dosyalar
  const coverFile = project.files.find((f: File) => 
    isImageFile(f.name) && f.name.toLowerCase().includes('_kapak')
  )
  
  console.log(`   🔍 Proje medya analizi: ${project.files.length} dosya bulundu`)
  if (coverFile) {
    console.log(`   📸 Kapak dosyası bulundu: ${coverFile.name}`)
  } else {
    console.log(`   ⚠️ Kapak dosyası bulunamadı, ilk görsel aranıyor...`)
  }
  
  // Diğer medya dosyalarını önce tanımla (kapak hariç)
  let otherMedia: File[] = []
  if (coverFile) {
    // Kapak görseli varsa, sadece _kapak içermeyen dosyaları kullan
    otherMedia = project.files.filter((f: File) => 
      !f.name.toLowerCase().includes('_kapak')
    )
  } else {
    // Kapak yoksa, tüm dosyaları kullan (kapak seçimi yapılacak)
    otherMedia = project.files
  }
  
  // Kapak görseli eşitleme
  if (coverFile) {
    const coverHash = await getFileHash(coverFile)
    const existingCoverHash = Array.from(existingHashes).find(h => h === coverHash)
    
    if (!existingCoverHash) {
      console.log(`   📸 Kapak görseli güncelleniyor: ${coverFile.name}`)
      const asset = await client.assets.upload('image', coverFile)
      updates.cover = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      existingHashes.add(asset.sha1hash)
      existingFilenames.add(asset.originalFilename)
      hasChanges = true
    } else {
      console.log(`   ✓ Kapak görseli zaten eşleşiyor: ${coverFile.name}`)
    }
  } else {
    // Kapak görseli yok - ilk görseli (video değil) kapak olarak kullan
    // Önce tüm dosyalardan görsel dosyaları bul
    const allImages = project.files.filter(f => isImageFile(f.name))
    
    console.log(`   🔍 Görsel dosyalar: ${allImages.length} adet (${allImages.map(f => f.name).join(', ')})`)
    
    if (allImages.length > 0) {
      const firstImage = allImages[0]
      console.log(`   📸 İlk görsel seçildi: ${firstImage.name}`)
      
      const firstImageHash = await getFileHash(firstImage)
      const existingCoverHash = Array.from(existingHashes).find(h => h === firstImageHash)
      
      if (!existingCoverHash) {
        console.log(`   ⚠️ Kapak yok, ilk görsel kapak olarak kullanılıyor: ${firstImage.name}`)
        const asset = await client.assets.upload('image', firstImage)
        updates.cover = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
        existingHashes.add(asset.sha1hash)
        existingFilenames.add(asset.originalFilename)
        hasChanges = true
      } else {
        console.log(`   ✓ İlk görsel zaten kapak olarak kullanılıyor: ${firstImage.name}`)
        // Mevcut kapak görseli zaten bu görsel, güncelleme yapmaya gerek yok
      }
      
      // İlk görseli alternatif medyadan çıkar
      otherMedia = otherMedia.filter(f => f !== firstImage)
      console.log(`   📋 Alternatif medya için ${otherMedia.length} dosya kaldı`)
    } else {
      // Klasörde hiç görsel yok - CMS'deki kapak görselini sil (eşitleme)
      console.log(`   🗑️ Klasörde görsel yok, CMS'deki kapak siliniyor (eşitleme)`)
      console.log(`   📄 Mevcut dosyalar: ${project.files.map(f => `${f.name} (${isImageFile(f.name) ? 'görsel' : isVideoFile(f.name) ? 'video' : 'diğer'})`).join(', ')}`)
      updates.cover = null
      hasChanges = true
    }
  }
  
  // Klasördeki medyayı hash'le
  const folderMediaHashes = new Set<string>()
  const folderMediaMap = new Map<string, { file: File; isVideo: boolean }>()
  
  console.log(`   🖼️ ${otherMedia.length} klasör medyası hash'leniyor...`)
  for (const media of otherMedia) {
    try {
      const hash = await getFileHash(media)
      folderMediaHashes.add(hash)
      folderMediaMap.set(hash, { file: media, isVideo: isVideoFile(media.name) })
    } catch (error) {
      console.error(`   ❌ Hash hesaplanamadı: ${media.name}`, error)
    }
  }
  
  // CMS'deki medyanın hash'lerini topla (kapak hariç)
  const cmsMediaHashes = new Set<string>()
  const cmsMediaMap = new Map<string, any>()
  
  // Kapak hash'lerini çıkar
  const coverHashes = new Set<string>()
  if (projectData?.cover?.asset?.sha1hash) {
    coverHashes.add(projectData.cover.asset.sha1hash)
  }
  if (projectData?.coverMobile?.asset?.sha1hash) {
    coverHashes.add(projectData.coverMobile.asset.sha1hash)
  }
  if (projectData?.coverDesktop?.asset?.sha1hash) {
    coverHashes.add(projectData.coverDesktop.asset.sha1hash)
  }
  
  // Alternatif medyayı topla (kapak görselleri hariç)
  for (const mediaItem of existingMedia) {
    let hash: string | null = null
    if (mediaItem?.image?.asset?.sha1hash) {
      hash = mediaItem.image.asset.sha1hash
    }
    if (mediaItem?.videoFile?.asset?.sha1hash) {
      hash = mediaItem.videoFile.asset.sha1hash
    }
    
    if (hash && !coverHashes.has(hash)) {
      cmsMediaHashes.add(hash)
      cmsMediaMap.set(hash, mediaItem)
    }
  }
  
  const imageCount = Array.from(folderMediaMap.values()).filter(m => !m.isVideo).length
  const videoCount = Array.from(folderMediaMap.values()).filter(m => m.isVideo).length
  console.log(`   📊 Klasör: ${imageCount} görsel, ${videoCount} video | CMS: ${cmsMediaHashes.size} medya`)
  
  // Eşitleme: Klasördeki medyayla CMS'deki medyayı birleştir
  const syncedMedia: any[] = []
  
  // 1. Klasördeki medyayı ekle (CMS'de yoksa yükle, varsa koru)
  for (const [hash, mediaInfo] of folderMediaMap.entries()) {
    const { file, isVideo } = mediaInfo
    
    if (cmsMediaHashes.has(hash)) {
      // Her ikisinde de var - koru
      const existingItem = cmsMediaMap.get(hash)
      syncedMedia.push(existingItem)
      console.log(`   ✓ Korundu: ${file.name} (${isVideo ? 'video' : 'görsel'})`)
    } else {
      // Klasörde var ama CMS'de yok - ekle
      try {
        if (isVideo) {
          console.log(`   ✅ Video yükleniyor: ${file.name}`)
          const asset = await client.assets.upload('file', file)
          syncedMedia.push({
            _type: 'object',
            _key: asset._id,
            type: 'video',
            videoFile: {
              _type: 'file',
              asset: {
                _type: 'reference',
                _ref: asset._id
              }
            }
          })
        } else {
          console.log(`   ✅ Görsel yükleniyor: ${file.name}`)
          const asset = await client.assets.upload('image', file)
          syncedMedia.push({
            _type: 'object',
            _key: asset._id,
            type: 'image',
            image: { 
              _type: 'image', 
              asset: { _type: 'reference', _ref: asset._id } 
            }
          })
        }
        hasChanges = true
      } catch (error) {
        console.error(`   ❌ Yüklenemedi: ${file.name}`, error)
      }
    }
  }
  
  // 2. CMS'de olan ama klasörde olmayan medyayı say (silinecek)
  const toDelete = Array.from(cmsMediaHashes).filter(hash => !folderMediaHashes.has(hash))
  if (toDelete.length > 0) {
    console.log(`   🗑️ ${toDelete.length} medya klasörde yok, CMS'den siliniyor`)
    hasChanges = true
  }
  
  // Sonuç: Sadece klasördeki medya kalacak (eşitleme tamamlandı)
  updates.media = syncedMedia
  
  // Güncellemeleri uygula
  if (hasChanges || syncedMedia.length !== existingMedia.length) {
    await client.patch(projectId).set(updates).commit()
    const added = syncedMedia.length - (existingMedia.length - toDelete.length)
    const deleted = toDelete.length
    const addedText = added > 0 ? `+${added} eklendi` : ''
    const deletedText = deleted > 0 ? `-${deleted} silindi` : ''
    const summary = [addedText, deletedText].filter(Boolean).join(' ')
    console.log(`   ✅ Eşitleme tamamlandı: ${summary} (Toplam: ${syncedMedia.length} medya)`)
  } else {
    console.log(`   ℹ️ Eşitleme gerekmedi, tüm medya zaten eşleşiyor`)
  }
}

