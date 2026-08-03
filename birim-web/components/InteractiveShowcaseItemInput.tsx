import React, {useState, useRef} from 'react'
import {ObjectInputProps, set} from 'sanity'
import {Card, Box, Text, Button, Flex} from '@sanity/ui'

export default function InteractiveShowcaseItemInput(props: ObjectInputProps) {
  const {renderDefault, value, onChange} = props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemVal = value as Record<string, any> | undefined

  const imageUrl = itemVal?.imageR2?.url || itemVal?.imageR2?.asset?.url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotspots = (itemVal?.hotspots || []) as Array<Record<string, any>>

  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const xPercent = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)))
    const yPercent = Math.min(100, Math.max(0, Math.round((clickY / rect.height) * 100)))

    if (selectedHotspotIndex !== null && hotspots[selectedHotspotIndex]) {
      // Move existing selected hotspot to clicked location
      const updatedHotspots = [...hotspots]
      updatedHotspots[selectedHotspotIndex] = {
        ...updatedHotspots[selectedHotspotIndex],
        x: xPercent,
        y: yPercent,
      }
      onChange(set(updatedHotspots, ['hotspots']))
    } else {
      // Add a new hotspot pin at clicked location
      const newHotspot = {
        _key: `hs_${Date.now()}`,
        _type: 'productHotspot',
        x: xPercent,
        y: yPercent,
      }
      onChange(set([...hotspots, newHotspot], ['hotspots']))
      setSelectedHotspotIndex(hotspots.length)
    }
  }

  return (
    <Card border radius={2} overflow="hidden">
      {imageUrl ? (
        <Card padding={3} tone="primary" borderBottom>
          <Box marginBottom={2}>
            <Text weight="bold" size={2}>
              🎯 Görsel Üzerinde Tıklayarak Ürün Noktası Seçici
            </Text>
            <Text size={1} muted style={{marginTop: '4px'}}>
              Görsel üzerinde istediğiniz noktaya tıklayarak **yeni ürün noktası ekleyebilir** veya
              aşağıdan bir nokta seçip tıklayarak **konumunu değiştirebilirsiniz**.
            </Text>
          </Box>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '450px',
              backgroundColor: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: 'crosshair',
              borderRadius: '4px',
              border: '1px solid #333',
            }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Hotspot Visual Picker"
              onClick={handleImageClick}
              style={{
                width: '100%',
                maxHeight: '450px',
                objectFit: 'contain',
                display: 'block',
                userSelect: 'none',
              }}
            />

            {/* Render Pins */}
            {hotspots.map((hs, idx) => {
              const isSelected = selectedHotspotIndex === idx
              const x = typeof hs.x === 'number' ? hs.x : 50
              const y = typeof hs.y === 'number' ? hs.y : 50

              return (
                <div
                  key={hs._key || idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedHotspotIndex(idx)
                  }}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#000000',
                    border: '2px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 30 : 20,
                  }}
                  title={`Nokta #${idx + 1} (X: %${x}, Y: %${y})`}
                >
                  {idx + 1}
                </div>
              )
            })}
          </div>

          <Flex
            align="center"
            justify="space-between"
            marginTop={3}
            padding={2}
            style={{background: '#f4f5f7', borderRadius: '4px'}}
          >
            <Text size={1} weight="medium">
              {selectedHotspotIndex !== null && hotspots[selectedHotspotIndex]
                ? `Seçili Nokta #${selectedHotspotIndex + 1}: X: %${hotspots[selectedHotspotIndex].x}, Y: %${hotspots[selectedHotspotIndex].y}`
                : `Toplam ${hotspots.length} ürün noktası eklendi. (Görsele tıklayarak yeni nokta ekleyebilirsiniz)`}
            </Text>
            {selectedHotspotIndex !== null && (
              <Button
                mode="ghost"
                tone="primary"
                text="Seçimi Temizle"
                size={1}
                onClick={() => setSelectedHotspotIndex(null)}
              />
            )}
          </Flex>
        </Card>
      ) : null}

      <Box padding={4}>{renderDefault(props)}</Box>
    </Card>
  )
}
