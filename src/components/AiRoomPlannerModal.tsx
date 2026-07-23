import React, { useState, useRef, useEffect, useCallback } from 'react'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import {
  getDailyQuota,
  incrementDailyQuota,
  optimizeImageForUpload,
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

  // Attach stream when video element mounts in DOM
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current
        .play()
        .catch((err) => console.warn('Video element play issue:', err))
    }
  }, [isCameraActive, cameraStream])

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
      let stream: MediaStream | null = null
      try {
        // Try mobile back camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch {
        // Fallback to default camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      setCameraStream(stream)
      setIsCameraActive(true)
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
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
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

    const activeAngle = targetAngle !== undefined ? targetAngle : selectedAngle
    const activeAlignment = targetAlignment !== undefined ? targetAlignment : selectedAlignment

    if (resultImage) {
      setIsUpdating(true)
    } else {
      setIsLoading(true)
    }
    setToastMessage(null)

    const activeProd = selectedProduct || initialProduct

    try {
      const response = await fetch('/api/ai/nano-banana-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImage: roomImagePreview,
          productImage: prodImage,
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
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 text-white rounded-2xl border border-neutral-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
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
              <h3 className="text-lg font-light tracking-wide text-white">AI Room Planner</h3>
              <p className="text-xs text-neutral-400 font-mono">3D Spatial Render Engine</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center justify-center"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 flex-1">
          {/* Selected Product Banner */}
          {activeProd && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-850 border border-neutral-800">
              <img
                src={activeProd.image}
                alt={activeProd.name}
                className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  Seçilen Mobilya
                </span>
                <h4 className="text-sm font-medium text-white truncate">{activeProd.name}</h4>
              </div>
              <span className="text-xs text-neutral-400 hidden sm:inline">
                Odanızda konumlandırılacak
              </span>
            </div>
          )}

          {/* Loading State Overlay */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 space-y-6 text-center animate-pulse">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-t-amber-400 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
              </div>
              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-medium text-amber-300">
                  Odanızın ışığı ve perspektifi AI motoru ile analiz ediliyor...
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Yapay zeka, mobilyanın ölçeğini, gölgelerini ve doğal ışık açılarını odanıza kusursuzca yerleştiriyor.
                </p>
              </div>
            </div>
          )}

          {/* Result View (Before/After Slider) with Interactive Controls */}
          {!isLoading && resultImage && roomImagePreview && (
            <div className="space-y-5">
              <div className="relative rounded-2xl overflow-hidden">
                <BeforeAfterSlider
                  beforeImage={roomImagePreview}
                  afterImage={resultImage}
                  beforeLabel="Orijinal Oda"
                  afterLabel="AI 3D Oda Tasarımı"
                />

                {/* Skeleton Loader / Blur Overlay when updating angle/position */}
                {isUpdating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30 transition-all">
                    <div className="w-12 h-12 rounded-full border-3 border-t-amber-400 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
                    <span className="text-xs font-medium text-amber-300 tracking-wide bg-neutral-900/80 px-3 py-1.5 rounded-full border border-amber-500/30">
                      Açı ve ışık yeniden hesaplanıyor...
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Controls Panel */}
              <div className="p-4 rounded-xl bg-neutral-850 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Arayüz Kontrol Paneli (Interactive Controls)
                  </span>
                  {isUpdating && (
                    <span className="text-[10px] text-amber-300/80 animate-pulse">
                      Yeniden hesaplanıyor...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* a) Angle Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-300 block">
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
                              if (isActive || isUpdating) return
                              setSelectedAngle(angleOpt.id)
                              handleGenerate(angleOpt.id, selectedAlignment)
                            }}
                            className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all ${
                              isActive
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
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
                    <label className="text-xs font-medium text-neutral-300 block">
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
                              const nextAlign = isActive ? '' : alignOpt.id
                              if (isUpdating) return
                              setSelectedAlignment(nextAlign)
                              handleGenerate(selectedAngle, nextAlign)
                            }}
                            className={`py-1.5 px-2.5 text-[11px] rounded-lg border font-medium transition-all ${
                              isActive
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {alignOpt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  disabled={isUpdating}
                  onClick={() => setResultImage(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Farklı Oda Fotoğrafı Yükle / Çek
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2"
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
              <div className="relative w-full h-[380px] bg-black rounded-xl overflow-hidden border border-neutral-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs text-amber-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Canlı Kamera
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  Kamerayı Kapat
                </button>
                <button
                  onClick={captureCameraPhoto}
                  className="px-6 py-2.5 text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all flex items-center gap-2"
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
                className="border-2 border-dashed border-neutral-700 hover:border-amber-500/50 bg-neutral-950/50 hover:bg-neutral-900/80 transition-all rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {roomImagePreview ? (
                  <div className="relative w-full max-h-64 overflow-hidden rounded-lg">
                    <img
                      src={roomImagePreview}
                      alt="Oda Önizleme"
                      className="w-full h-56 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white bg-black/70 px-3 py-1.5 rounded-full">
                        Fotoğrafı Değiştir
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Odanızın Fotoğrafını Sürükleyin veya Dosya Seçin
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 font-light">
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
                  className="px-4 py-2.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 rounded-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Canlı Kamera ile Çek
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={!roomImagePreview}
                className={`group relative w-full py-3.5 rounded-xl font-medium tracking-widest text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden ${
                  roomImagePreview
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 hover:border-amber-400/80 shadow-lg cursor-pointer'
                    : 'bg-neutral-850 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-mono">Bu Ürünü Odamda Gör • AI Render</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quota Exhausted Modal (Anti-Abuse 3 Tries/Day Limit) */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowQuotaModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Günlük Ücretsiz AI Tasarım Hakkınız Doldu
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
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
                className="block w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-medium text-xs rounded-xl transition-all shadow-lg shadow-amber-400/20"
              >
                İç Mimarımızla İletişime Geçin
              </a>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl font-medium transition-all"
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
