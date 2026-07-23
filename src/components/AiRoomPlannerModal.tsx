import React, { useState, useRef, useEffect, useCallback } from 'react'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import {
  getDailyQuota,
  incrementDailyQuota,
  optimizeImageForUpload,
  resizeImageUrlOrBase64,
} from '../utils/aiSecurity'

interface ProductReference {
  id?: string
  name: string
  image: string
  details?: {
    material?: string
    legStyle?: string
    color?: string
    description?: string
  }
}

interface AiRoomPlannerModalProps {
  isOpen: boolean
  onClose: () => void
  initialProduct?: ProductReference
}

export const AiRoomPlannerModal: React.FC<AiRoomPlannerModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const [roomImagePreview, setRoomImagePreview] = useState<string | null>(null)
  const [selectedProduct] = useState<ProductReference | undefined>(initialProduct)
  const [isLoading, setIsLoading] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [selectedAngle, setSelectedAngle] = useState<string>('Front')
  const [selectedAlignment, setSelectedAlignment] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const isGeneratingRef = useRef(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'error' | 'success'>('error')
  const [showQuotaModal, setShowQuotaModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraStream(null)
    setIsCameraActive(false)
  }, [cameraStream])

  const handleCloseModal = useCallback(() => {
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node
    if (node && cameraStream) {
      node.srcObject = cameraStream
      node.play().catch((err) => console.warn('Video element play issue:', err))
    }
  }, [cameraStream])

  if (!isOpen) return null

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => {
      setToastMessage(null)
    }, 5000)
  }

  const startCamera = async () => {
    // 1. HTTPS / Secure Context check (localhost ve 127.0.0.1 güvenli sayılır)
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.'))

    if (typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost) {
      showToast('Kamera erişimi için sitenin HTTPS (güvenli bağlantı) üzerinden çalışması gerekmektedir.')
      return
    }

    // 2. Browser API support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Tarayıcınız kamera erişimini desteklemiyor veya izin kısıtlaması var.')
      return
    }

    try {
      // 3. Enumerate available video devices (Identical logic to Fiyat_Listesi-11-4 QRScannerModal)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')

      let targetId: string | undefined = undefined
      if (videoDevices.length > 0) {
        const backCamera = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        )
        targetId = backCamera ? backCamera.deviceId : videoDevices[0]?.deviceId
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: targetId ? { exact: targetId } : undefined,
          facingMode: targetId ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err1) {
        console.warn('Enumerate constraints failed, trying simple video: true', err1)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      setCameraStream(stream)
      setIsCameraActive(true)

      // Bind stream to video element directly if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (e) {
          console.warn('Autoplay prevented:', e)
        }
      }
    } catch (err: unknown) {
      console.error('Kamera İzin Hatası Detayı:', err)
      const errName = err instanceof Error ? err.name : ''
      const errMsg = err instanceof Error ? err.message : ''

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permissions policy')) {
        showToast('Kamera izni reddedildi. Lütfen tarayıcı adres çubuğundaki kilit simgesine tıklayıp kamera iznini aktif edin.')
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        showToast('Cihazınızda kullanılabilir bir kamera bulunamadı.')
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        showToast('Kamera başka bir uygulama tarafından kullanılıyor olabilir.')
      } else {
        showToast(`Kamera başlatılamadı: ${errMsg || 'Bilinmeyen hata'}`)
      }
    }
  }

  const captureCameraPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      let width = video.videoWidth || 1024
      let height = video.videoHeight || 768
      const maxDim = 1024
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
        setRoomImagePreview(dataUrl)
        setResultImage(null)
        stopCamera()
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Lütfen geçerli bir görsel dosyası (JPG, PNG vb.) seçin.')
        return
      }
      try {
        const optimized = await optimizeImageForUpload(file)
        setRoomImagePreview(optimized)
        setResultImage(null)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Görsel işlenirken hata oluştu.'
        showToast(msg)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Lütfen geçerli bir görsel dosyası seçin.')
        return
      }
      try {
        const optimized = await optimizeImageForUpload(file)
        setRoomImagePreview(optimized)
        setResultImage(null)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Görsel işlenirken hata oluştu.'
        showToast(msg)
      }
    }
  }

  const handleGenerate = async (
    targetAngle?: string,
    targetAlignment?: string
  ) => {
    // 1. Synchronous Lock & Debounce Check
    if (isGeneratingRef.current || isLoading || isUpdating) {
      return
    }

    if (!roomImagePreview) {
      showToast('Lütfen öncelikle odanızın bir fotoğrafını yükleyin veya çekin.')
      return
    }

    // Daily quota check only for initial render (3 per day for anonymous users)
    if (!resultImage) {
      const currentQuota = getDailyQuota(3)
      if (currentQuota.isExhausted) {
        setShowQuotaModal(true)
        return
      }
    }

    const prodImage = selectedProduct?.image || initialProduct?.image
    if (!prodImage) {
      showToast('Lütfen odanızda görmek istediğiniz mobilya/ürünü seçin.')
      return
    }

    // 2. Lock synchronously before any async work (canvas resize, fetch)
    isGeneratingRef.current = true
    if (resultImage) {
      setIsUpdating(true)
    } else {
      setIsLoading(true)
    }
    setToastMessage(null)

    const activeAngle = targetAngle !== undefined ? targetAngle : selectedAngle
    const activeAlignment = targetAlignment !== undefined ? targetAlignment : selectedAlignment
    const activeProd = selectedProduct || initialProduct

    try {
      const [compressedRoomImage, compressedProductImage] = await Promise.all([
        resizeImageUrlOrBase64(roomImagePreview, 768, 0.70),
        resizeImageUrlOrBase64(prodImage, 768, 0.70),
      ])

      const response = await fetch('/api/ai/nano-banana-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImage: compressedRoomImage,
          productImage: compressedProductImage,
          productName: activeProd?.name,
          productDetails: activeProd?.details,
          angle: activeAngle,
          alignmentInstruction: activeAlignment,
        }),
      })

      let data: { success?: boolean; imageUrl?: string; message?: string; isDemo?: boolean; error?: string } = {}
      try {
        data = (await response.json()) as { success?: boolean; imageUrl?: string; message?: string; isDemo?: boolean; error?: string }
      } catch {
        throw new Error(`Sunucu yanıtı okunamadı (HTTP ${response.status}). Lütfen tekrar deneyin.`)
      }

      if (response.status === 429) {
        throw new Error(data.error || 'Çok fazla istek attınız, lütfen 1 dakika bekleyin.')
      }

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'AI görsel üretimi sırasında bir sorun oluştu.')
      }

      // Increment daily quota on initial successful render only
      if (!resultImage) {
        incrementDailyQuota(3)
      }

      setResultImage(data.imageUrl)
      showToast(data.message || 'Oda tasarımınız AI 3D Render motoru ile başarıyla sentezlendi!', 'success')
    } catch (err: unknown) {
      console.error('Room planner error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      showToast(errorMsg, 'error')
    } finally {
      isGeneratingRef.current = false
      setIsLoading(false)
      setIsUpdating(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `birim-ai-room-planner-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeProd = selectedProduct || initialProduct

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-lg animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-md px-4 py-3 rounded-lg shadow-2xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-3 border ${
            toastType === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-white/60 hover:text-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Dialog Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 text-white rounded-none border border-neutral-800 shadow-none flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center border border-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium tracking-wide text-white uppercase font-sans">Odamda Gör • AI Oda Tasarımı</h3>
              <p className="text-xs text-neutral-400 font-sans">Yapay Zeka 3D Mekan & Yerleşim Motoru</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-none bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center justify-center cursor-pointer border border-neutral-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 flex-1">
          {/* Selected Product Banner */}
          {activeProd && (
            <div className="flex items-center gap-4 p-4 rounded-none bg-neutral-850 border border-neutral-800">
              <img
                src={activeProd.image}
                alt={activeProd.name}
                className="w-16 h-16 object-cover rounded-none border border-neutral-700"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#c5a059] font-medium">
                  Seçilen Mobilya
                </span>
                <h4 className="text-sm font-medium text-white truncate">{activeProd.name}</h4>
              </div>
              <span className="text-xs text-neutral-400 hidden sm:inline font-sans">
                Odanızda konumlandırılacak
              </span>
            </div>
          )}

          {/* Loading State Overlay */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 space-y-6 text-center animate-pulse">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-none border-4 border-[#c5a059]/20 animate-ping" />
                <div className="w-16 h-16 rounded-none border-4 border-t-[#c5a059] border-r-[#c5a059] border-b-transparent border-l-transparent animate-spin" />
              </div>
              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-medium text-[#c5a059]">
                  Odanızın ışığı ve perspektifi AI motoru ile analiz ediliyor...
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-light font-sans">
                  Yapay zeka, mobilyanın ölçeğini, gölgelerini ve doğal ışık açılarını odanıza kusursuzca yerleştiriyor.
                </p>
              </div>
            </div>
          )}

          {/* Result View (Before/After Slider) with Interactive Controls */}
          {!isLoading && resultImage && roomImagePreview && (
            <div className="space-y-5">
              <div className="relative rounded-none overflow-hidden border border-neutral-800">
                <BeforeAfterSlider
                  beforeImage={roomImagePreview}
                  afterImage={resultImage}
                  beforeLabel="Orijinal Oda"
                  afterLabel="AI 3D Oda Tasarımı"
                />

                {/* Skeleton Loader / Blur Overlay when updating angle/position */}
                {isUpdating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30 transition-all">
                    <div className="w-12 h-12 rounded-none border-3 border-t-[#c5a059] border-r-[#c5a059] border-b-transparent border-l-transparent animate-spin" />
                    <span className="text-xs font-medium text-[#c5a059] tracking-wide bg-neutral-900/80 px-3 py-1.5 rounded-none border border-[#c5a059]/30">
                      Açı ve ışık yeniden hesaplanıyor...
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Controls Panel */}
              <div className="p-4 rounded-none bg-neutral-850 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans uppercase tracking-widest text-[#c5a059] font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#c5a059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Arayüz Kontrol Paneli (Interactive Controls)
                  </span>
                  {isUpdating && (
                    <span className="text-[10px] text-[#c5a059]/80 animate-pulse font-sans">
                      Yeniden hesaplanıyor...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* a) Angle Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300 block font-sans">
                      🔄 Açıyı Döndür (Angle Switcher)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '3/4 left perspective', label: '↖ Sol Çapraz' },
                        { id: 'Front perspective', label: '⬆ Cephe' },
                        { id: '3/4 right perspective', label: '↗ Sağ Çapraz' },
                      ].map((angleOpt) => {
                        const isActive = selectedAngle === angleOpt.id
                        return (
                          <button
                            key={angleOpt.id}
                            disabled={isUpdating}
                            onClick={() => {
                              if (isUpdating) return
                              setSelectedAngle(angleOpt.id)
                            }}
                            className={`py-2 px-2 text-xs rounded-none border font-medium transition-all font-sans cursor-pointer shadow-none ${
                              isActive
                                ? 'bg-white text-black border-white shadow-none font-semibold'
                                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {angleOpt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* b) Alignment Presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300 block font-sans">
                      📐 Konum & Hizalama (Alignment Presets)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Align parallel to the left wall', label: '⬅ Sol Duvara Paralel' },
                        { id: 'Align parallel to the right wall', label: '➡️ Sağ Duvara Paralel' },
                        { id: 'Turn 45 degrees left', label: '🔄 45° Sola Çevir' },
                        { id: 'Turn 45 degrees right', label: '🔄 45° Sağa Çevir' },
                        { id: 'Center in the middle of the room floor', label: '📐 Odanın Ortasına Çek' },
                      ].map((alignOpt) => {
                        const isActive = selectedAlignment === alignOpt.id
                        return (
                          <button
                            key={alignOpt.id}
                            disabled={isUpdating}
                            onClick={() => {
                              if (isUpdating) return
                              const nextAlign = isActive ? '' : alignOpt.id
                              setSelectedAlignment(nextAlign)
                            }}
                            className={`py-1.5 px-2.5 text-[11px] rounded-none border font-medium transition-all font-sans cursor-pointer shadow-none ${
                              isActive
                                ? 'bg-white text-black border-white shadow-none font-semibold'
                                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {alignOpt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Explicit Re-Render Trigger Button */}
                <div className="pt-2 border-t border-neutral-800 flex justify-end">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleGenerate(selectedAngle, selectedAlignment)}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-medium text-white bg-[#c5a059] hover:bg-[#b08d48] rounded-none transition-colors border border-[#c5a059] flex items-center justify-center gap-2 font-sans cursor-pointer shadow-none disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Açı ve Konumu Yeniden Hesapla (AI Render)</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  disabled={isUpdating}
                  onClick={() => setResultImage(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-none border border-neutral-700 transition-colors disabled:opacity-50 font-sans cursor-pointer shadow-none"
                >
                  Farklı Oda Fotoğrafı Yükle / Çek
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-100 rounded-none border border-neutral-300 shadow-none transition-colors flex items-center gap-2 font-sans cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Yüksek Çözünürlüklü İndir
                </button>
              </div>
            </div>
          )}

          {/* Live Camera View */}
          {!isLoading && !resultImage && isCameraActive && (
            <div className="space-y-4">
              <div className="relative w-full h-[380px] bg-black rounded-none overflow-hidden border border-neutral-700 flex items-center justify-center">
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-none border border-neutral-700 text-xs text-white font-sans flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Canlı Kamera
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-none border border-neutral-700 transition-colors font-sans cursor-pointer shadow-none"
                >
                  Kamerayı Kapat
                </button>
                <button
                  onClick={captureCameraPhoto}
                  className="px-6 py-2.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 rounded-none border border-neutral-300 shadow-none transition-all flex items-center gap-2 font-sans cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Fotoğraf Çek
                </button>
              </div>
            </div>
          )}

          {/* Upload / Select View (Initial State) */}
          {!isLoading && !resultImage && !isCameraActive && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-700 hover:border-neutral-400 bg-neutral-950/50 hover:bg-neutral-900/80 transition-all rounded-none p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {roomImagePreview ? (
                  <div className="relative w-full max-h-64 overflow-hidden rounded-none border border-neutral-700">
                    <img
                      src={roomImagePreview}
                      alt="Oda Önizleme"
                      className="w-full h-56 object-cover rounded-none"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-black bg-white px-3 py-1.5 rounded-none font-sans font-medium border border-neutral-300">
                        Fotoğrafı Değiştir
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-none bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white font-sans">
                        Odanızın Fotoğrafını Sürükleyin veya Dosya Seçin
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 font-light font-sans">
                        En iyi sonuç için aydınlık ve geniş açılı bir fotoğraf tercih edin.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Options: File vs Live Camera */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-none transition-all flex items-center gap-2 font-sans cursor-pointer shadow-none"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Canlı Kamera ile Çek
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={!roomImagePreview || isLoading || isUpdating}
                className={`group relative w-full py-3.5 rounded-none font-semibold tracking-widest text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden shadow-none border ${
                  roomImagePreview && !isLoading && !isUpdating
                    ? 'bg-white hover:bg-neutral-100 text-black border-neutral-300 cursor-pointer'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 cursor-not-allowed'
                }`}
              >
                <div className={`w-5 h-5 rounded-none flex items-center justify-center ${
                  roomImagePreview ? 'bg-black text-white' : 'bg-neutral-700 text-neutral-400'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-sans">Bu Ürünü Odamda Gör • AI Render</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quota Exhausted Modal (Anti-Abuse 3 Tries/Day Limit) */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-none max-w-md w-full text-center space-y-5 shadow-none relative">
            <button
              onClick={() => setShowQuotaModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg font-sans"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-none bg-neutral-800 text-white border border-neutral-700 flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white font-sans">
                Günlük Ücretsiz AI Tasarım Hakkınız Doldu
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Anonim kullanıcılar için günlük 3 ücretsiz deneme sınırı bulunmaktadır. Mimarlarımızla iletişime geçerek veya ücretsiz üye olarak sınırsız AI oda tasarımı alabilirsiniz.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <a
                href="/#/contact"
                onClick={() => {
                  setShowQuotaModal(false)
                  onClose()
                }}
                className="block w-full py-3 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-none border border-neutral-300 transition-all shadow-none font-sans"
              >
                İç Mimarımızla İletişime Geçin
              </a>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-none border border-neutral-700 font-medium transition-all font-sans cursor-pointer shadow-none"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
