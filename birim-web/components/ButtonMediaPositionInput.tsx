import React, {useState, useRef, useCallback, useEffect} from 'react'
import type {StringInputProps} from 'sanity'
import {set, useFormValue} from 'sanity'
import {Card, Box, Text, Button, Flex, Stack, Grid, Switch, Badge} from '@sanity/ui'
import {Target, RotateCcw, Monitor, Smartphone, Scissors} from 'lucide-react'

// 9 Hazır Konum Şablonu ve Temsil Ettiği Yüzdelik Koordinatlar
export const POSITION_PRESETS: Array<{
  id: string
  label: string
  x: number
  y: number
}> = [
  {id: 'top-left', label: 'Sol Üst', x: 8, y: 8},
  {id: 'top-center', label: 'Üst Orta', x: 50, y: 8},
  {id: 'top-right', label: 'Sağ Üst', x: 92, y: 8},
  {id: 'center-left', label: 'Sol Orta', x: 8, y: 50},
  {id: 'center', label: 'Merkez', x: 50, y: 50},
  {id: 'center-right', label: 'Sağ Orta', x: 92, y: 50},
  {id: 'bottom-left', label: 'Sol Alt', x: 8, y: 92},
  {id: 'bottom-center', label: 'Alt Orta', x: 50, y: 92},
  {id: 'bottom-right', label: 'Sağ Alt', x: 92, y: 92},
]

// Koordinat çözümleme yardımcısı
function parsePosString(posStr?: string) {
  if (!posStr) return {x: 50, y: 50, presetId: 'center'}
  if (posStr.startsWith('custom:')) {
    const parts = posStr.split(':')
    const x = Math.min(100, Math.max(0, Math.round(parseFloat(parts[1] || '50'))))
    const y = Math.min(100, Math.max(0, Math.round(parseFloat(parts[2] || '50'))))
    const preset = POSITION_PRESETS.find((p) => Math.abs(p.x - x) <= 5 && Math.abs(p.y - y) <= 5)
    return {x, y, presetId: preset?.id || null}
  }
  const preset = POSITION_PRESETS.find((p) => p.id === posStr)
  if (preset) return {x: preset.x, y: preset.y, presetId: preset.id}
  return {x: 50, y: 50, presetId: 'center'}
}

export default function ButtonMediaPositionInput(props: StringInputProps) {
  const {value, onChange} = props

  // Üst nesneden (contentBlock) masaüstü ve mobil görsellerini al
  const parentPath = props.path.slice(0, -1)
  const parentBlock = useFormValue(parentPath) as Record<string, any> | undefined

  const desktopAsset =
    parentBlock?.imageDesktopR2 ||
    parentBlock?.imageR2 ||
    (Array.isArray(parentBlock?.imagePanels) && parentBlock?.imagePanels[0])

  const mobileAsset = parentBlock?.imageMobileR2 || desktopAsset

  const desktopImageUrl = desktopAsset?.url
  const mobileImageUrl = mobileAsset?.url

  const buttonLabel =
    parentBlock?.linkText?.tr ||
    parentBlock?.linkText?.en ||
    parentBlock?.linkText?.de ||
    'Buton Önizleme'

  // Değeri çözümle (Masaüstü ve Mobil)
  const rawVal = value || ''
  const [desktopRaw, mobileRaw] = rawVal.split('@mobile:')

  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop')
  const [hasCustomMobile, setHasCustomMobile] = useState<boolean>(Boolean(mobileRaw))

  const parsedDesktop = parsePosString(desktopRaw)
  const parsedMobile = parsePosString(mobileRaw || desktopRaw)

  const [desktopCoords, setDesktopCoords] = useState({x: parsedDesktop.x, y: parsedDesktop.y})
  const [desktopPreset, setDesktopPreset] = useState<string | null>(parsedDesktop.presetId)

  const [mobileCoords, setMobileCoords] = useState({x: parsedMobile.x, y: parsedMobile.y})
  const [mobilePreset, setMobilePreset] = useState<string | null>(parsedMobile.presetId)

  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Aktif varlık ve Crop verileri
  const currentAsset = activeTab === 'desktop' ? desktopAsset : mobileAsset
  const currentImageUrl = activeTab === 'desktop' ? desktopImageUrl : mobileImageUrl

  const cropX = Number(currentAsset?.cropX ?? currentAsset?.crop?.left ?? 0) || 0
  const cropY = Number(currentAsset?.cropY ?? currentAsset?.crop?.top ?? 0) || 0
  const cropWidth =
    Number(
      currentAsset?.cropWidth ??
        (currentAsset?.crop
          ? 1 - (currentAsset.crop.left || 0) - (currentAsset.crop.right || 0)
          : 1),
    ) || 1
  const cropHeight =
    Number(
      currentAsset?.cropHeight ??
        (currentAsset?.crop
          ? 1 - (currentAsset.crop.top || 0) - (currentAsset.crop.bottom || 0)
          : 1),
    ) || 1

  const hasCrop = cropWidth < 0.999 || cropHeight < 0.999 || cropX > 0.001 || cropY > 0.001

  // Görsel doğal boyutları
  const [naturalDims, setNaturalDims] = useState<{w: number; h: number}>({
    w: currentAsset?.width || 16,
    h: currentAsset?.height || 9,
  })

  // Tab veya görsel varlığı değiştiğinde gerçek boyutları anında senkronize et
  useEffect(() => {
    const assetW = currentAsset?.width
    const assetH = currentAsset?.height
    if (assetW && assetH) {
      setNaturalDims({w: assetW, h: assetH})
    }
    if (currentImageUrl) {
      const probe = new Image()
      probe.src = currentImageUrl
      if (probe.complete && probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setNaturalDims({w: probe.naturalWidth, h: probe.naturalHeight})
      } else {
        probe.onload = () => {
          if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
            setNaturalDims({w: probe.naturalWidth, h: probe.naturalHeight})
          }
        }
      }
    }
  }, [activeTab, currentImageUrl, currentAsset?.width, currentAsset?.height])

  // Görsel yüklendiğinde gerçek doğal en-boy oranını al
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalDims({w: img.naturalWidth, h: img.naturalHeight})
    }
  }

  // Kırpılmış alanın net en-boy oranı
  const croppedAspect = (naturalDims.w * cropWidth) / Math.max(1, naturalDims.h * cropHeight)

  // Tuval kutusu boyutlandırması (en-boy oranını bozmadan maksimum 560x400 kutu içine oturtma)
  const maxBoxWidth = 560
  const maxBoxHeight = 400
  const computedCanvasMaxWidth = Math.min(
    maxBoxWidth,
    Math.max(120, Math.round(maxBoxHeight * croppedAspect)),
  )
  const computedCanvasWidth =
    croppedAspect >= maxBoxWidth / maxBoxHeight
      ? '100%'
      : `min(100%, ${(maxBoxHeight * croppedAspect).toFixed(1)}px)`

  // Dışarıdan değer değiştikçe senkronize et
  useEffect(() => {
    const [dRaw, mRaw] = (value || '').split('@mobile:')
    const dParsed = parsePosString(dRaw)
    const mParsed = parsePosString(mRaw || dRaw)

    setDesktopCoords({x: dParsed.x, y: dParsed.y})
    setDesktopPreset(dParsed.presetId)

    setMobileCoords({x: mParsed.x, y: mParsed.y})
    setMobilePreset(mParsed.presetId)
    setHasCustomMobile(Boolean(mRaw))
  }, [value])

  // Değeri kaydetme
  const saveValue = useCallback(
    (newDesktopPos: string, newMobilePos: string | null) => {
      if (newMobilePos) {
        onChange(set(`${newDesktopPos}@mobile:${newMobilePos}`))
      } else {
        onChange(set(newDesktopPos))
      }
    },
    [onChange],
  )

  // Pozisyon güncelleme
  const updatePosition = (newX: number, newY: number, presetId?: string) => {
    const clampedX = Math.min(100, Math.max(0, Math.round(newX)))
    const clampedY = Math.min(100, Math.max(0, Math.round(newY)))
    const posString = presetId || `custom:${clampedX}:${clampedY}`

    if (activeTab === 'desktop') {
      setDesktopCoords({x: clampedX, y: clampedY})
      const foundPreset =
        presetId || POSITION_PRESETS.find((p) => p.x === clampedX && p.y === clampedY)?.id || null
      setDesktopPreset(foundPreset)

      const currentMobilePos = hasCustomMobile
        ? mobilePreset || `custom:${mobileCoords.x}:${mobileCoords.y}`
        : null
      saveValue(posString, currentMobilePos)
    } else {
      setMobileCoords({x: clampedX, y: clampedY})
      const foundPreset =
        presetId || POSITION_PRESETS.find((p) => p.x === clampedX && p.y === clampedY)?.id || null
      setMobilePreset(foundPreset)

      const currentDesktopPos = desktopPreset || `custom:${desktopCoords.x}:${desktopCoords.y}`
      saveValue(currentDesktopPos, posString)
    }
  }

  // Mobil toggle değişimi
  const handleToggleCustomMobile = () => {
    const nextState = !hasCustomMobile
    setHasCustomMobile(nextState)

    const currentDesktopPos = desktopPreset || `custom:${desktopCoords.x}:${desktopCoords.y}`
    if (nextState) {
      const currentMobilePos = mobilePreset || `custom:${mobileCoords.x}:${mobileCoords.y}`
      saveValue(currentDesktopPos, currentMobilePos)
    } else {
      saveValue(currentDesktopPos, null)
    }
  }

  // Tıklama ile koordinat belirleme (Kırpılmış görsel sınırları üzerinden hesaplanır)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const xPercent = (clickX / rect.width) * 100
    const yPercent = (clickY / rect.height) * 100
    updatePosition(xPercent, yPercent)
  }

  // Sürükleme (Drag) desteği
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const xPercent = (clickX / rect.width) * 100
    const yPercent = (clickY / rect.height) * 100
    updatePosition(xPercent, yPercent)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }
  }

  const currentCoords = activeTab === 'desktop' ? desktopCoords : mobileCoords
  const currentPreset = activeTab === 'desktop' ? desktopPreset : mobilePreset
  const hasMobileImage = Boolean(parentBlock?.imageMobileR2?.url)

  return (
    <Card border radius={2} padding={3} tone="primary">
      <Stack space={3}>
        {/* Başlık ve Masaüstü / Mobil Sekmeleri */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
          <Flex align="center" gap={2}>
            <Target size={18} color="#2563eb" />
            <Text weight="bold" size={2}>
              Butonun Medya Üzerindeki Konumu
            </Text>
          </Flex>

          <Flex gap={1} style={{backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '6px'}}>
            <Button
              mode={activeTab === 'desktop' ? 'default' : 'bleed'}
              tone={activeTab === 'desktop' ? 'primary' : 'default'}
              icon={Monitor}
              text="Masaüstü"
              size={1}
              onClick={() => setActiveTab('desktop')}
            />
            <Button
              mode={activeTab === 'mobile' ? 'default' : 'bleed'}
              tone={activeTab === 'mobile' ? 'primary' : 'default'}
              icon={Smartphone}
              text={hasCustomMobile ? 'Mobil (Özel)' : 'Mobil'}
              size={1}
              onClick={() => setActiveTab('mobile')}
            />
          </Flex>
        </Flex>

        {/* Mobil Sekmesi Bilgi & Toggle Kutusu */}
        {activeTab === 'mobile' && (
          <Card padding={2} radius={2} tone={hasCustomMobile ? 'primary' : 'transparent'} border>
            <Flex align="center" justify="space-between">
              <Box>
                <Text size={1} weight="semibold">
                  📱 Mobilde Ayrı Buton Konumu Kullan
                </Text>
                <Text size={0} muted style={{marginTop: '2px'}}>
                  {hasCustomMobile
                    ? hasMobileImage
                      ? 'Mobil dikey görselinize özel bağımsız buton konumu ayarlanıyor.'
                      : 'Masaüstü görseli üzerinde mobil ekrana özel konum ayarlanıyor.'
                    : 'Kapalıyken mobil ekranda da masaüstü konumu kullanılır.'}
                </Text>
              </Box>
              <Switch checked={hasCustomMobile} onChange={handleToggleCustomMobile} />
            </Flex>
          </Card>
        )}

        {/* 1. Görsel Önizleme Tuvali (Görsel ve Kırpma Alanına %100 Kilitli) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#090d16',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid #1e293b',
          }}
        >
          {currentImageUrl ? (
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                position: 'relative',
                width: computedCanvasWidth,
                maxWidth: `${computedCanvasMaxWidth}px`,
                aspectRatio: `${croppedAspect.toFixed(4)}`,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
                border: '1px solid #334155',
                cursor: isDragging ? 'grabbing' : 'crosshair',
                userSelect: 'none',
                backgroundColor: '#000000',
              }}
            >
              {/* Kırpılmış Görsel — Frontend'deki gibi tam kırpma çerçevesini doldurur */}
              <img
                key={currentImageUrl}
                src={currentImageUrl}
                alt="Önizleme"
                onLoad={handleImageLoad}
                style={{
                  position: 'absolute',
                  width: `${((1 / cropWidth) * 100).toFixed(4)}%`,
                  height: `${((1 / cropHeight) * 100).toFixed(4)}%`,
                  left: `${((-cropX / cropWidth) * 100).toFixed(4)}%`,
                  top: `${((-cropY / cropHeight) * 100).toFixed(4)}%`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />

              {/* Kırpma Bildirimi */}
              {hasCrop && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: '#93c5fd',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                >
                  <Scissors size={10} />
                  Kırpılmış Önizleme (Frontend ile 1:1)
                </div>
              )}

              {/* Kılavuz Çizgileri */}
              <div
                style={{
                  position: 'absolute',
                  left: `${currentCoords.x}%`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: 'rgba(59, 130, 246, 0.6)',
                  boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: `${currentCoords.y}%`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: 'rgba(59, 130, 246, 0.6)',
                  boxShadow: '0 0 4px rgba(59, 130, 246, 0.8)',
                  pointerEvents: 'none',
                }}
              />

              {/* Sürüklenebilir Buton Pini */}
              <div
                style={{
                  position: 'absolute',
                  left: `${currentCoords.x}%`,
                  top: `${currentCoords.y}%`,
                  transform: 'translate(-50%, -50%)',
                  padding: '5px 12px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '2px solid #2563eb',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.7)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                  }}
                />
                {buttonLabel}
              </div>

              {/* Koordinat Rozeti */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              >
                X: %{currentCoords.x} • Y: %{currentCoords.y}
              </div>
            </div>
          ) : (
            <div style={{textAlign: 'center', color: '#64748b', padding: '24px'}}>
              <Text size={1} muted>
                Görsel henüz yüklenmedi. Görsel yüklendiğinde burada kırpılmış çerçevesiyle 1:1
                gösterilecektir.
              </Text>
            </div>
          )}
        </div>

        {/* 2. Hazır Butonlar (3x3 Matris) */}
        <Box marginTop={1}>
          <Flex align="center" justify="space-between" marginBottom={2}>
            <Text size={1} weight="semibold">
              📌 3x3 Hazır Konum Şablonları ({activeTab === 'desktop' ? 'Masaüstü' : 'Mobil'})
            </Text>
            <Button
              mode="ghost"
              tone="default"
              icon={RotateCcw}
              text="Merkeze Sıfırla"
              size={1}
              onClick={() => updatePosition(50, 50, 'center')}
            />
          </Flex>

          <Grid columns={3} gap={1}>
            {POSITION_PRESETS.map((preset) => {
              const isSelected = currentPreset === preset.id
              return (
                <Button
                  key={preset.id}
                  mode={isSelected ? 'default' : 'ghost'}
                  tone={isSelected ? 'primary' : 'default'}
                  text={preset.label}
                  size={1}
                  onClick={() => updatePosition(preset.x, preset.y, preset.id)}
                  style={{
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: '11px',
                  }}
                />
              )
            })}
          </Grid>
        </Box>

        {/* 3. Hassas Sayısal Ayar (X% ve Y% Kaydırıcıları) */}
        <Box
          padding={3}
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          <Text size={1} weight="semibold" style={{marginBottom: '8px'}}>
            🎯 Hassas Sayısal Ayar (X% ve Y%)
          </Text>

          <Stack space={3}>
            {/* X Koordinatı */}
            <Flex align="center" gap={3}>
              <div style={{width: '70px', fontSize: '11px', fontWeight: 600, color: '#475569'}}>
                Yatay (X):
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentCoords.x}
                onChange={(e) => updatePosition(Number(e.target.value), currentCoords.y)}
                style={{flex: 1, cursor: 'pointer'}}
              />
              <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentCoords.x}
                  onChange={(e) => updatePosition(Number(e.target.value), currentCoords.y)}
                  style={{
                    width: '48px',
                    padding: '3px 6px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'center',
                  }}
                />
                <span style={{fontSize: '11px', color: '#64748b'}}>%</span>
              </div>
            </Flex>

            {/* Y Koordinatı */}
            <Flex align="center" gap={3}>
              <div style={{width: '70px', fontSize: '11px', fontWeight: 600, color: '#475569'}}>
                Dikey (Y):
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentCoords.y}
                onChange={(e) => updatePosition(currentCoords.x, Number(e.target.value))}
                style={{flex: 1, cursor: 'pointer'}}
              />
              <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentCoords.y}
                  onChange={(e) => updatePosition(currentCoords.x, Number(e.target.value))}
                  style={{
                    width: '48px',
                    padding: '3px 6px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'center',
                  }}
                />
                <span style={{fontSize: '11px', color: '#64748b'}}>%</span>
              </div>
            </Flex>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}
