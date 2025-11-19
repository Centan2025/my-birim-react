import {useState} from 'react'
import {useClient} from 'sanity'
import * as XLSX from 'xlsx'
import styled from 'styled-components'

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`

const UploadArea = styled.div<{isDragging: boolean}>`
  border: 2px dashed ${(props) => (props.isDragging ? '#2276fc' : '#ccc')};
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  background: ${(props) => (props.isDragging ? '#f0f7ff' : '#fafafa')};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;

  &:hover {
    border-color: #2276fc;
    background: #f0f7ff;
  }
`

const FileInput = styled.input`
  display: none;
`

const Button = styled.button`
  background: #2276fc;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin: 0.5rem;

  &:hover:not(:disabled) {
    background: #1a5fc7;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const StatusBox = styled.div<{type: 'info' | 'success' | 'error'}>`
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  background: ${(props) => {
    if (props.type === 'success') return '#d4edda'
    if (props.type === 'error') return '#f8d7da'
    return '#d1ecf1'
  }};
  color: ${(props) => {
    if (props.type === 'success') return '#155724'
    if (props.type === 'error') return '#721c24'
    return '#0c5460'
  }};
  border: 1px solid
    ${(props) => {
      if (props.type === 'success') return '#c3e6cb'
      if (props.type === 'error') return '#f5c6cb'
      return '#bee5eb'
    }};
`

const ProgressBar = styled.div<{progress: number}>`
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 1rem 0;

  &::after {
    content: '';
    display: block;
    width: ${(props) => props.progress}%;
    height: 100%;
    background: #2276fc;
    transition: width 0.3s;
  }
`

const LogContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
  margin-top: 1rem;
`

const FilterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const FilterButton = styled.button<{active: boolean}>`
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: ${(props) => (props.active ? '#2276fc' : 'white')};
  color: ${(props) => (props.active ? 'white' : '#333')};
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    background: ${(props) => (props.active ? '#1a5fc7' : '#f0f0f0')};
  }
`

const DangerButton = styled(Button)`
  background: #dc3545;

  &:hover:not(:disabled) {
    background: #c82333;
  }
`

const LogEntry = styled.div<{type: 'info' | 'success' | 'error' | 'warning'}>`
  padding: 0.25rem 0;
  color: ${(props) => {
    if (props.type === 'success') return '#155724'
    if (props.type === 'error') return '#721c24'
    if (props.type === 'warning') return '#856404'
    return '#333'
  }};
`

interface ProcessResult {
  success: boolean
  message: string
  details?: string[]
}

export function ExcelImportTool() {
  const client = useClient({apiVersion: '2025-01-01'})
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<ProcessResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'warning'>('all')

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('tr-TR')
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
    setLogs((prev) => [...prev, `[${timestamp}] ${prefix} ${message}`])
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setStatus({
        success: false,
        message: 'Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)',
      })
      return
    }
    setFile(selectedFile)
    setStatus(null)
    setLogs([])
    addLog(`Dosya seçildi: ${selectedFile.name}`)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  // Slug oluşturma helper
  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Kategori bul veya oluştur
  const findOrCreateCategory = async (categoryName: string): Promise<string | null> => {
    if (!categoryName || categoryName.trim() === '') {
      return null
    }

    const categorySlug = createSlug(categoryName.trim())

    try {
      // Mevcut kategoriyi bul
      const existingCategory = await client.fetch(
        `*[_type == "category" && id.current == $slug][0]`,
        {slug: categorySlug}
      )

      if (existingCategory) {
        addLog(`Kategori bulundu: ${categoryName}`, 'success')
        return existingCategory._id
      }

      // Yeni kategori oluştur
      addLog(`Yeni kategori oluşturuluyor: ${categoryName}`, 'info')
      const newCategory = await client.create({
        _type: 'category',
        id: {
          _type: 'slug',
          current: categorySlug,
        },
        name: {
          tr: categoryName.trim(),
          en: categoryName.trim(),
        },
      })

      addLog(`Kategori oluşturuldu: ${categoryName}`, 'success')
      return newCategory._id
    } catch (error: any) {
      addLog(`Kategori oluşturma hatası (${categoryName}): ${error.message}`, 'error')
      return null
    }
  }

  // Tasarımcı bul (oluşturma) - AD ile arama yapar
  const findDesigner = async (designerName: string): Promise<string | null> => {
    if (!designerName || designerName.trim() === '') {
      return null
    }

    const trimmedName = designerName.trim()

    try {
      // Mevcut tasarımcıyı AD ile bul (name.tr veya name.en)
      const existingDesigner = await client.fetch(
        `*[_type == "designer" && (name.tr == $name || name.en == $name)][0]`,
        {name: trimmedName}
      )

      if (existingDesigner) {
        addLog(`Tasarımcı bulundu: ${designerName}`, 'success')
        return existingDesigner._id
      }

      // Tasarımcı bulunamadı, oluşturma
      addLog(`Tasarımcı bulunamadı: ${designerName}`, 'warning')
      return null
    } catch (error: any) {
      addLog(`Tasarımcı arama hatası (${designerName}): ${error.message}`, 'error')
      return null
    }
  }

  // Tasarımcı bul veya oluştur (sadece TASARIMCILAR sayfası için kullanılmıyor artık)
  // Bu fonksiyon artık kullanılmıyor çünkü TASARIMCILAR sayfası için upsertDesigner kullanılıyor
  const findOrCreateDesigner = async (designerName: string): Promise<string | null> => {
    if (!designerName || designerName.trim() === '') {
      return null
    }

    const trimmedName = designerName.trim()
    const designerSlug = createSlug(trimmedName)

    try {
      // Mevcut tasarımcıyı AD ile bul
      const existingDesigner = await client.fetch(
        `*[_type == "designer" && (name.tr == $name || name.en == $name)][0]`,
        {name: trimmedName}
      )

      if (existingDesigner) {
        addLog(`Tasarımcı bulundu: ${designerName}`, 'success')
        return existingDesigner._id
      }

      // Yeni tasarımcı oluştur
      addLog(`Yeni tasarımcı oluşturuluyor: ${designerName}`, 'info')
      const newDesigner = await client.create({
        _type: 'designer',
        id: {
          _type: 'slug',
          current: designerSlug,
        },
        name: {
          tr: trimmedName,
          en: trimmedName,
        },
      })

      addLog(`Tasarımcı oluşturuldu: ${designerName}`, 'success')
      return newDesigner._id
    } catch (error: any) {
      addLog(`Tasarımcı oluşturma hatası (${designerName}): ${error.message}`, 'error')
      return null
    }
  }

  // Tasarımcı ekle veya güncelle (ID ile)
  const upsertDesigner = async (
    designerId: string,
    designerName: string,
    bioTr: string,
    bioEn: string
  ): Promise<boolean> => {
    try {
      const designerSlug = createSlug(designerId)

      // Mevcut tasarımcıyı kontrol et
      const existingDesigner = await client.fetch(
        `*[_type == "designer" && id.current == $slug][0]`,
        {slug: designerSlug}
      )

      const designerData: any = {
        _type: 'designer',
        id: {
          _type: 'slug',
          current: designerSlug,
        },
        name: {
          tr: designerName.trim(),
          en: designerName.trim(),
        },
      }

      // Bio bilgilerini ekle
      if (bioTr || bioEn) {
        designerData.bio = {}
        if (bioTr) designerData.bio.tr = bioTr.trim()
        if (bioEn) designerData.bio.en = bioEn.trim()
      }

      if (existingDesigner) {
        // Güncelle
        addLog(`Tasarımcı güncelleniyor: ${designerName} (ID: ${designerId})`, 'info')
        await client.patch(existingDesigner._id).set(designerData).commit()
        addLog(`Tasarımcı güncellendi: ${designerName}`, 'success')
      } else {
        // Yeni tasarımcı oluştur
        addLog(`Yeni tasarımcı oluşturuluyor: ${designerName} (ID: ${designerId})`, 'info')
        await client.create(designerData)
        addLog(`Tasarımcı oluşturuldu: ${designerName}`, 'success')
      }

      return true
    } catch (error: any) {
      addLog(`Tasarımcı işleme hatası (${designerName}): ${error.message}`, 'error')
      return false
    }
  }

  // Ürün ekle veya güncelle
  const upsertProduct = async (
    productId: string,
    productName: string,
    categoryId: string | null,
    designerId: string | null,
    year: number | null,
    descriptionTr: string,
    descriptionEn: string
  ): Promise<boolean> => {
    try {
      const productSlug = createSlug(productId)

      // Mevcut ürünü kontrol et
      const existingProduct = await client.fetch(
        `*[_type == "product" && id.current == $slug][0]`,
        {slug: productSlug}
      )

      const productData: any = {
        _type: 'product',
        id: {
          _type: 'slug',
          current: productSlug,
        },
        name: {
          tr: productName.trim(),
          en: productName.trim(),
        },
        isPublished: true,
      }

      if (categoryId) {
        productData.category = {
          _type: 'reference',
          _ref: categoryId,
        }
      }

      if (designerId) {
        productData.designer = {
          _type: 'reference',
          _ref: designerId,
        }
      }

      if (year) {
        productData.year = parseInt(String(year), 10)
      }

      if (descriptionTr || descriptionEn) {
        productData.description = {}
        if (descriptionTr) productData.description.tr = descriptionTr.trim()
        if (descriptionEn) productData.description.en = descriptionEn.trim()
      }

      if (existingProduct) {
        // Güncelle
        addLog(`Ürün güncelleniyor: ${productName} (ID: ${productId})`, 'info')
        await client.patch(existingProduct._id).set(productData).commit()
        addLog(`Ürün güncellendi: ${productName}`, 'success')
      } else {
        // Yeni ürün oluştur
        addLog(`Yeni ürün oluşturuluyor: ${productName} (ID: ${productId})`, 'info')
        await client.create(productData)
        addLog(`Ürün oluşturuldu: ${productName}`, 'success')
      }

      return true
    } catch (error: any) {
      addLog(`Ürün işleme hatası (${productName}): ${error.message}`, 'error')
      return false
    }
  }

  // TASARIMCILAR sayfasını işle
  const processDesignersSheet = async (worksheet: XLSX.WorkSheet): Promise<{
    successCount: number
    errorCount: number
    skippedCount: number
  }> => {
    const data = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''}) as any[][]

    if (data.length < 2) {
      addLog('TASARIMCILAR sayfası en az 2 satır içermelidir (başlık + veri)', 'warning')
      return {successCount: 0, errorCount: 0, skippedCount: 0}
    }

    // İlk satırı başlık olarak atla
    const rows = data.slice(1)
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    addLog(`TASARIMCILAR sayfası: Toplam ${rows.length} satır bulundu`, 'info')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // A sütunu kontrolü: "SON" varsa dur
      const columnA = String(row[0] || '').trim()
      if (columnA.toUpperCase() === 'SON') {
        addLog('TASARIMCILAR: "SON" değeri bulundu, işlem durduruldu', 'warning')
        break
      }

      // A sütunu kontrolü: "-" varsa atla
      if (columnA === '-') {
        skippedCount++
        continue
      }

      // Sütunları al
      const columnB = String(row[1] || '').trim() // ID
      const columnC = String(row[2] || '').trim() // TASARIMCI ADI
      const columnD = String(row[3] || '').trim() // TASARIMCI AÇIKLAMA TÜRKÇE
      const columnE = String(row[4] || '').trim() // TASARIMCI AÇIKLAMA İNGİLİZCE

      // ID kontrolü
      if (!columnB) {
        addLog(`TASARIMCILAR Satır ${i + 2}: ID boş, atlanıyor`, 'error')
        errorCount++
        continue
      }

      // TASARIMCI ADI kontrolü
      if (!columnC) {
        addLog(`TASARIMCILAR Satır ${i + 2}: TASARIMCI ADI boş, atlanıyor`, 'error')
        errorCount++
        continue
      }

      // ID kontrolü: Aynı ID var mı?
      const designerSlug = createSlug(columnB)
      const existingDesigner = await client.fetch(
        `*[_type == "designer" && id.current == $slug][0]`,
        {slug: designerSlug}
      )

      if (existingDesigner) {
        const existingName = existingDesigner.name?.tr || existingDesigner.name?.en || ''
        if (existingName !== columnC) {
          addLog(
            `TASARIMCILAR Satır ${i + 2}: ID "${columnB}" zaten var, ancak AD farklı. Mevcut: "${existingName}", Yeni: "${columnC}". Güncellenecek.`,
            'warning'
          )
        }
      } else {
        // Yeni tasarımcı, AD kontrolü yap
        const existingByName = await client.fetch(
          `*[_type == "designer" && (name.tr == $name || name.en == $name)][0]`,
          {name: columnC.trim()}
        )
        if (existingByName) {
          addLog(
            `TASARIMCILAR Satır ${i + 2}: AD "${columnC}" zaten başka bir tasarımcıda kullanılıyor (ID: ${existingByName.id?.current}). Yine de devam ediliyor.`,
            'warning'
          )
        }
      }

      // Tasarımcıyı ekle/güncelle
      const success = await upsertDesigner(columnB, columnC, columnD, columnE)

      if (success) {
        successCount++
      } else {
        errorCount++
      }
    }

    return {successCount, errorCount, skippedCount}
  }

  const processExcel = async () => {
    if (!file) {
      setStatus({
        success: false,
        message: 'Lütfen önce bir dosya seçin',
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatus(null)
    setLogs([])
    addLog('İşlem başlatıldı...', 'info')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, {type: 'array'})

      // Excel'deki tasarımcı isimlerini tutacak Set
      const designersInExcel = new Set<string>()

      // TASARIMCILAR sayfasını kontrol et ve işle
      const designersSheetName = workbook.SheetNames.find(
        (name) => name.toUpperCase().includes('TASARIMCILAR') || name.toUpperCase().includes('DESIGNER')
      )

      let designersResult = {successCount: 0, errorCount: 0, skippedCount: 0}
      if (designersSheetName) {
        addLog(`TASARIMCILAR sayfası bulundu: ${designersSheetName}`, 'info')
        const designersWorksheet = workbook.Sheets[designersSheetName]
        
        // Tasarımcı isimlerini topla
        const designersData = XLSX.utils.sheet_to_json(designersWorksheet, {header: 1, defval: ''}) as any[][]
        if (designersData.length > 1) {
          const designersRows = designersData.slice(1)
          for (const row of designersRows) {
            const columnA = String(row[0] || '').trim()
            const columnC = String(row[2] || '').trim() // TASARIMCI ADI
            
            // "SON" varsa dur
            if (columnA.toUpperCase() === 'SON') break
            
            // "-" veya boş değilse ve isim varsa ekle
            if (columnA !== '-' && columnC) {
              designersInExcel.add(columnC.trim())
            }
          }
          addLog(`Excel'de ${designersInExcel.size} tasarımcı tanımı bulundu`, 'info')
          if (designersInExcel.size > 0) {
            addLog(`Tanımlı tasarımcılar: ${Array.from(designersInExcel).join(', ')}`, 'info')
          }
        }
        
        designersResult = await processDesignersSheet(designersWorksheet)
        addLog(
          `TASARIMCILAR işlemi tamamlandı! Başarılı: ${designersResult.successCount}, Hata: ${designersResult.errorCount}, Atlandı: ${designersResult.skippedCount}`,
          'success'
        )
        addLog('⚠️ Önemli: ÜRÜNLER sayfasında sadece CMS\'de mevcut tasarımcılar kullanılabilir. Yeni tasarımcı otomatik oluşturulmaz!', 'warning')
      } else {
        addLog('⚠️ TASARIMCILAR sayfası bulunamadı. ÜRÜNLER için CMS\'de mevcut tasarımcılar kullanılacak.', 'warning')
        addLog('⚠️ Eğer bir ürünün tasarımcısı CMS\'de yoksa, ürün eklenmeyecek ve uyarı verilecek!', 'warning')
      }

      // ÜRÜNLER sayfasını kontrol et ve işle (mevcut kod)
      const productsSheetName = workbook.SheetNames.find(
        (name) => name.toUpperCase().includes('ÜRÜNLER') || name.toUpperCase().includes('PRODUCT')
      )

      let productsResult = {successCount: 0, errorCount: 0, skippedCount: 0, processedCount: 0}
      if (productsSheetName) {
        addLog(`ÜRÜNLER sayfası bulundu: ${productsSheetName}`, 'info')
        const productsWorksheet = workbook.Sheets[productsSheetName]
        const data = XLSX.utils.sheet_to_json(productsWorksheet, {header: 1, defval: ''}) as any[][]

        if (data.length < 2) {
          addLog('ÜRÜNLER sayfası en az 2 satır içermelidir (başlık + veri)', 'warning')
        } else {
          // İlk satırı başlık olarak atla
          const rows = data.slice(1)
          let processedCount = 0
          let successCount = 0
          let errorCount = 0
          let skippedCount = 0

          addLog(`ÜRÜNLER sayfası: Toplam ${rows.length} satır bulundu`, 'info')

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]

            // A sütunu kontrolü: "SON" varsa dur
            const columnA = String(row[0] || '').trim()
            if (columnA.toUpperCase() === 'SON') {
              addLog('ÜRÜNLER: "SON" değeri bulundu, işlem durduruldu', 'warning')
              break
            }

            // A sütunu kontrolü: Sadece "-" varsa atla (boş olabilir, boşsa devam et)
            if (columnA === '-') {
              skippedCount++
              continue
            }

            // Sütunları al
            const columnB = String(row[1] || '').trim() // ÜRÜN GURUBU (Kategori)
            const columnC = String(row[2] || '').trim() // ID
            const columnD = String(row[3] || '').trim() // AD
            const columnE = String(row[4] || '').trim() // TASARIMCI
            const columnF = String(row[5] || '').trim() // TASARIM YILI
            const columnG = String(row[6] || '').trim() // AÇIKLAMA TÜRKÇE
            const columnH = String(row[7] || '').trim() // AÇIKLAMA İNGİLİZCE

            // B sütunu boşsa atla
            if (!columnB) {
              addLog(`ÜRÜNLER Satır ${i + 2}: ÜRÜN GURUBU boş, atlanıyor`, 'warning')
              skippedCount++
              continue
            }

            // ID ve AD kontrolü
            if (!columnC) {
              addLog(`ÜRÜNLER Satır ${i + 2}: ID boş, atlanıyor`, 'error')
              errorCount++
              continue
            }

            if (!columnD) {
              addLog(`ÜRÜNLER Satır ${i + 2}: AD boş, atlanıyor`, 'error')
              errorCount++
              continue
            }

            // ID kontrolü: Aynı ID var mı?
            const productSlug = createSlug(columnC)
            const existingProduct = await client.fetch(
              `*[_type == "product" && id.current == $slug][0]`,
              {slug: productSlug}
            )

            if (existingProduct) {
              // AD kontrolü: Aynı ID'ye sahip ürünün adı farklı mı?
              const existingName = existingProduct.name?.tr || existingProduct.name?.en || ''
              if (existingName !== columnD) {
                addLog(
                  `ÜRÜNLER Satır ${i + 2}: ID "${columnC}" zaten var, ancak AD farklı. Mevcut: "${existingName}", Yeni: "${columnD}". Güncellenecek.`,
                  'warning'
                )
              }
            } else {
              // Yeni ürün, AD kontrolü yap
              const existingByName = await client.fetch(
                `*[_type == "product" && (name.tr == $name || name.en == $name)][0]`,
                {name: columnD.trim()}
              )
              if (existingByName) {
                addLog(
                  `ÜRÜNLER Satır ${i + 2}: AD "${columnD}" zaten başka bir üründe kullanılıyor (ID: ${existingByName.id?.current}). Yine de devam ediliyor.`,
                  'warning'
                )
              }
            }

            // Kategori bul/oluştur
            const categoryId = await findOrCreateCategory(columnB)
            if (!categoryId) {
              addLog(`ÜRÜNLER Satır ${i + 2}: Kategori oluşturulamadı, atlanıyor`, 'error')
              errorCount++
              continue
            }

            // Tasarımcı kontrolü ve bulma
            let designerId: string | null = null
            if (columnE) {
              // Excel'de TASARIMCILAR sayfası varsa ve tasarımcı orada tanımlı değilse hata ver
              if (designersInExcel.size > 0 && !designersInExcel.has(columnE.trim())) {
                addLog(
                  `ÜRÜNLER Satır ${i + 2}: ⚠️ Tasarımcı "${columnE}" TASARIMCILAR sayfasında tanımlı değil! Ürün atlanıyor.`,
                  'error'
                )
                errorCount++
                continue
              }
              
              // Tasarımcıyı sadece bul (oluşturma!)
              designerId = await findDesigner(columnE)
              
              if (!designerId) {
                addLog(
                  `ÜRÜNLER Satır ${i + 2}: ⚠️ Tasarımcı "${columnE}" CMS'de bulunamadı! Önce TASARIMCILAR sayfasında tanımlayın veya CMS'den manuel ekleyin. Ürün atlanıyor.`,
                  'error'
                )
                errorCount++
                continue
              }
            }

            // Tasarım yılı
            let year: number | null = null
            if (columnF) {
              const yearNum = parseInt(columnF, 10)
              if (!isNaN(yearNum)) {
                year = yearNum
              }
            }

            // Ürünü ekle/güncelle
            const success = await upsertProduct(
              columnC,
              columnD,
              categoryId,
              designerId,
              year,
              columnG,
              columnH
            )

            if (success) {
              successCount++
            } else {
              errorCount++
            }

            processedCount++
            setProgress(Math.round((processedCount / rows.length) * 100))
          }

          productsResult = {successCount, errorCount, skippedCount, processedCount}
          addLog(
            `ÜRÜNLER işlemi tamamlandı! Başarılı: ${successCount}, Hata: ${errorCount}, Atlandı: ${skippedCount}`,
            'success'
          )
        }
      } else {
        addLog('ÜRÜNLER sayfası bulunamadı, atlanıyor', 'warning')
      }

      // Toplam sonuçları göster
      const totalSuccess = designersResult.successCount + productsResult.successCount
      const totalError = designersResult.errorCount + productsResult.errorCount
      const totalSkipped = designersResult.skippedCount + productsResult.skippedCount

      setStatus({
        success: totalError === 0,
        message: `İşlem tamamlandı! Toplam Başarılı: ${totalSuccess}, Toplam Hata: ${totalError}, Toplam Atlandı: ${totalSkipped}`,
        details: [
          `TASARIMCILAR - Başarılı: ${designersResult.successCount}, Hata: ${designersResult.errorCount}, Atlandı: ${designersResult.skippedCount}`,
          `ÜRÜNLER - Başarılı: ${productsResult.successCount}, Hata: ${productsResult.errorCount}, Atlandı: ${productsResult.skippedCount}`,
        ],
      })

      addLog('Tüm işlemler tamamlandı!', 'success')
    } catch (error: any) {
      addLog(`Hata: ${error.message}`, 'error')
      setStatus({
        success: false,
        message: `İşlem sırasında hata oluştu: ${error.message}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteAllProducts = async () => {
    if (!confirm('TÜM ÜRÜNLERİ VE KATEGORİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nÖnce tüm ürünler, sonra tüm kategoriler silinecek.\n\nBu işlem geri alınamaz!')) {
      return
    }

    if (!confirm('LÜTFEN TEKRAR ONAYLAYIN: Tüm ürünler ve kategoriler kalıcı olarak silinecek!')) {
      return
    }

    setIsDeleting(true)
    setStatus(null)
    setLogs([])
    setProgress(0)
    addLog('Tüm ürünler siliniyor...', 'info')

    try {
      // Tüm ürünleri getir
      const allProducts = await client.fetch(`*[_type == "product"]{_id, "id": id.current, name}`)
      const totalProducts = allProducts.length

      if (totalProducts === 0) {
        addLog('Silinecek ürün bulunamadı', 'warning')
        setStatus({
          success: true,
          message: 'Silinecek ürün bulunamadı',
        })
        setIsDeleting(false)
        return
      }

      addLog(`Toplam ${totalProducts} ürün bulundu`, 'info')

      let deletedCount = 0
      let errorCount = 0

      // Her ürünü sil
      for (let i = 0; i < allProducts.length; i++) {
        const product = allProducts[i]
        const productName = product.name?.tr || product.name?.en || product.id || 'Bilinmeyen'

        try {
          await client.delete(product._id)
          deletedCount++
          addLog(`Ürün silindi: ${productName} (${product.id})`, 'success')
        } catch (error: any) {
          errorCount++
          addLog(`Ürün silinemedi: ${productName} - ${error.message}`, 'error')
        }

        setProgress(Math.round(((i + 1) / totalProducts) * 100))
      }

      addLog(`Ürün silme işlemi tamamlandı! ${deletedCount} ürün silindi`, 'success')

      // Şimdi tüm kategorileri sil
      addLog('Tüm kategoriler siliniyor...', 'info')
      const allCategories = await client.fetch(`*[_type == "category"]{_id, "id": id.current, name}`)
      const totalCategories = allCategories.length

      if (totalCategories === 0) {
        addLog('Silinecek kategori bulunamadı', 'warning')
      } else {
        addLog(`Toplam ${totalCategories} kategori bulundu`, 'info')

        let deletedCategoriesCount = 0
        let categoryErrorCount = 0

        // Her kategoriyi sil
        for (let i = 0; i < allCategories.length; i++) {
          const category = allCategories[i]
          const categoryName = category.name?.tr || category.name?.en || category.id || 'Bilinmeyen'

          try {
            await client.delete(category._id)
            deletedCategoriesCount++
            addLog(`Kategori silindi: ${categoryName} (${category.id})`, 'success')
          } catch (error: any) {
            categoryErrorCount++
            addLog(`Kategori silinemedi: ${categoryName} - ${error.message}`, 'error')
          }
        }

        addLog(`Kategori silme işlemi tamamlandı! ${deletedCategoriesCount} kategori silindi`, 'success')
        errorCount += categoryErrorCount
      }

      setStatus({
        success: errorCount === 0,
        message: `Silme işlemi tamamlandı! Ürünler: ${deletedCount}, Kategoriler: ${totalCategories > 0 ? allCategories.length : 0}, Hata: ${errorCount}`,
        details: [
          `Toplam ürün: ${totalProducts}`,
          `Başarıyla silinen ürün: ${deletedCount}`,
          `Toplam kategori: ${totalCategories}`,
          `Başarıyla silinen kategori: ${totalCategories > 0 ? allCategories.length - (errorCount - (totalProducts - deletedCount)) : 0}`,
          `Toplam hata: ${errorCount}`,
        ],
      })

      addLog(`Tüm işlemler tamamlandı!`, 'success')
    } catch (error: any) {
      addLog(`Hata: ${error.message}`, 'error')
      setStatus({
        success: false,
        message: `Silme işlemi sırasında hata oluştu: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteAllDesigners = async () => {
    if (!confirm('TÜM TASARIMCILARI SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
      return
    }

    if (!confirm('LÜTFEN TEKRAR ONAYLAYIN: Tüm tasarımcılar kalıcı olarak silinecek!')) {
      return
    }

    setIsDeleting(true)
    setStatus(null)
    setLogs([])
    setProgress(0)
    addLog('Tüm tasarımcılar siliniyor...', 'info')

    try {
      // Tüm tasarımcıları getir
      const allDesigners = await client.fetch(`*[_type == "designer"]{_id, "id": id.current, name}`)
      const totalDesigners = allDesigners.length

      if (totalDesigners === 0) {
        addLog('Silinecek tasarımcı bulunamadı', 'warning')
        setStatus({
          success: true,
          message: 'Silinecek tasarımcı bulunamadı',
        })
        setIsDeleting(false)
        return
      }

      addLog(`Toplam ${totalDesigners} tasarımcı bulundu`, 'info')

      let deletedCount = 0
      let errorCount = 0

      // Her tasarımcıyı sil
      for (let i = 0; i < allDesigners.length; i++) {
        const designer = allDesigners[i]
        const designerName = designer.name?.tr || designer.name?.en || designer.id || 'Bilinmeyen'

        try {
          await client.delete(designer._id)
          deletedCount++
          addLog(`Tasarımcı silindi: ${designerName} (${designer.id})`, 'success')
        } catch (error: any) {
          errorCount++
          addLog(`Tasarımcı silinemedi: ${designerName} - ${error.message}`, 'error')
        }

        setProgress(Math.round(((i + 1) / totalDesigners) * 100))
      }

      setStatus({
        success: errorCount === 0,
        message: `Silme işlemi tamamlandı! Silinen: ${deletedCount}, Hata: ${errorCount}`,
        details: [
          `Toplam: ${totalDesigners} tasarımcı`,
          `Başarıyla silinen: ${deletedCount} tasarımcı`,
          `Hata: ${errorCount} tasarımcı`,
        ],
      })

      addLog(`Silme işlemi tamamlandı! ${deletedCount} tasarımcı silindi`, 'success')
    } catch (error: any) {
      addLog(`Hata: ${error.message}`, 'error')
      setStatus({
        success: false,
        message: `Silme işlemi sırasında hata oluştu: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Log filtreleme
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true
    if (logFilter === 'error') return log.includes('❌')
    if (logFilter === 'success') return log.includes('✅')
    if (logFilter === 'warning') return log.includes('⚠️')
    return true
  })

  return (
    <Container>
      <h1>Excel'den Ürün Yükle</h1>
      <p>
        Excel dosyanızı yükleyerek ürünleri toplu olarak ekleyebilir veya güncelleyebilirsiniz.
      </p>
      
      <div style={{marginBottom: '2rem', padding: '1rem', background: '#e7f3ff', border: '1px solid #2196f3', borderRadius: '4px'}}>
        <h3 style={{marginTop: 0, color: '#1976d2'}}>ℹ️ Excel Formatı ve Önemli Kurallar</h3>
        <ul style={{marginBottom: 0, color: '#1976d2', lineHeight: '1.8'}}>
          <li>
            <strong>TASARIMCILAR Sayfası:</strong> Önce işlenir ve CMS'e eklenir/güncellenir.
          </li>
          <li>
            <strong>ÜRÜNLER Sayfası:</strong> Daha sonra işlenir.
            <ul style={{marginTop: '0.5rem'}}>
              <li>Ürünlerin tasarımcıları <strong>MUTLAKA CMS'de mevcut olmalıdır</strong></li>
              <li>Tasarımcı CMS'de yoksa → ⚠️ Uyarı verilir ve <strong>ürün eklenmez</strong></li>
              <li>Tasarımcı otomatik oluşturulmaz, manuel eklemeniz gerekir</li>
            </ul>
          </li>
          <li><strong>Kategoriler:</strong> Otomatik olarak oluşturulur (sorun değil).</li>
          <li><strong>Öneri:</strong> Önce tüm tasarımcıları Excel'e ekleyin ve yükleyin, sonra ürünleri yükleyin.</li>
        </ul>
      </div>

      <div style={{marginBottom: '2rem', padding: '1rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px'}}>
        <h3 style={{marginTop: 0, color: '#856404'}}>⚠️ Tehlikeli İşlemler</h3>
        <p style={{marginBottom: '0.5rem', color: '#856404'}}>
          Tüm ürünleri veya tasarımcıları silmek istiyorsanız aşağıdaki butonları kullanın. Bu işlemler geri alınamaz!
        </p>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <DangerButton onClick={deleteAllProducts} disabled={isDeleting || isProcessing}>
            {isDeleting ? 'Siliniyor...' : 'TÜM ÜRÜNLERİ VE KATEGORİLERİ SİL'}
          </DangerButton>
          <DangerButton onClick={deleteAllDesigners} disabled={isDeleting || isProcessing}>
            {isDeleting ? 'Siliniyor...' : 'TÜM TASARIMCILARI SİL'}
          </DangerButton>
        </div>
        {isDeleting && (
          <div style={{marginTop: '1rem'}}>
            <ProgressBar progress={progress} />
            <p style={{textAlign: 'center', marginTop: '0.5rem'}}>İlerleme: %{progress}</p>
          </div>
        )}
      </div>

      <UploadArea
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div>
          <p style={{fontSize: '3rem', margin: '0 0 1rem 0'}}>📁</p>
          <p style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>
            {file ? file.name : 'Excel dosyasını buraya sürükleyin veya tıklayın'}
          </p>
          <p style={{color: '#666', fontSize: '0.9rem'}}>
            .xlsx veya .xls formatında dosya seçin
          </p>
        </div>
        <FileInput
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
        />
      </UploadArea>

      {file && (
        <div style={{marginBottom: '1rem'}}>
          <Button onClick={processExcel} disabled={isProcessing}>
            {isProcessing ? 'İşleniyor...' : 'Ürünleri Yükle'}
          </Button>
          <Button
            onClick={() => {
              setFile(null)
              setStatus(null)
              setLogs([])
              setProgress(0)
            }}
            disabled={isProcessing}
            style={{background: '#6c757d'}}
          >
            Temizle
          </Button>
        </div>
      )}

      {isProcessing && (
        <div>
          <ProgressBar progress={progress} />
          <p style={{textAlign: 'center', marginTop: '0.5rem'}}>İlerleme: %{progress}</p>
        </div>
      )}

      {status && (
        <StatusBox type={status.success ? 'success' : 'error'}>
          <strong>{status.message}</strong>
          {status.details && (
            <ul style={{marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem'}}>
              {status.details.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          )}
        </StatusBox>
      )}

      {logs.length > 0 && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3 style={{margin: 0}}>İşlem Logları ({filteredLogs.length}/{logs.length})</h3>
            <FilterButtons>
              <FilterButton active={logFilter === 'all'} onClick={() => setLogFilter('all')}>
                Tümü
              </FilterButton>
              <FilterButton active={logFilter === 'error'} onClick={() => setLogFilter('error')}>
                ❌ Hatalar
              </FilterButton>
              <FilterButton active={logFilter === 'warning'} onClick={() => setLogFilter('warning')}>
                ⚠️ Uyarılar
              </FilterButton>
              <FilterButton active={logFilter === 'success'} onClick={() => setLogFilter('success')}>
                ✅ Başarılı
              </FilterButton>
            </FilterButtons>
          </div>
          <LogContainer>
            {filteredLogs.length === 0 ? (
              <div style={{padding: '1rem', textAlign: 'center', color: '#666'}}>
                Seçilen filtreye uygun log bulunamadı
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const type = log.includes('❌')
                  ? 'error'
                  : log.includes('✅')
                    ? 'success'
                    : log.includes('⚠️')
                      ? 'warning'
                      : 'info'
                return (
                  <LogEntry key={idx} type={type}>
                    {log}
                  </LogEntry>
                )
              })
            )}
          </LogContainer>
        </div>
      )}
    </Container>
  )
}

