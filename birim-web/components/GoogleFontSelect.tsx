import React, {useEffect, useState, useRef} from 'react'
import type {StringInputProps} from 'sanity'
import {set} from 'sanity'
import {Stack, Text, Box, Button, Card, Flex} from '@sanity/ui'

interface GoogleFont {
  family: string
  category: string
  variants: string[]
}

export default function GoogleFontSelect(props: StringInputProps) {
  const {value, onChange, schemaType} = props
  const [fonts, setFonts] = useState<GoogleFont[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedFontsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Google Fonts API'den font listesini çek
    const fetchFonts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Google Fonts API - API key olmadan da çalışabilir
        // sort=popularity ile popüler fontları önce getirir
        const response = await fetch(
          'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            // Tüm fontları al ve kategorilerine göre map et
            const mappedFonts: GoogleFont[] = data.items.map((item: any) => ({
              family: item.family,
              category: item.category || 'sans-serif',
              variants: item.variants || ['400', '700'],
            }))
            setFonts(mappedFonts)
            setLoading(false)
            console.log(`✅ Google Fonts API'den ${mappedFonts.length} font yüklendi`)
            return
          } else {
            console.warn('⚠️ Google Fonts API boş sonuç döndü, fallback kullanılıyor')
          }
        } else {
          // 403 hatası genellikle API key gerektiğini veya rate limiting olduğunu gösterir
          // Sessizce fallback listesine geçiyoruz
          if (response.status !== 403) {
            console.warn(`⚠️ Google Fonts API hatası: ${response.status} ${response.statusText}`)
          }
        }
        
        // Fallback: Genişletilmiş popüler Google Fonts listesi
        const popularFonts: GoogleFont[] = [
          // Sans-Serif (en popüler)
          {family: 'Roboto', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Open Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Lato', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Montserrat', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Oswald', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Raleway', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Poppins', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Ubuntu', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Nunito', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Inter', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Source Sans Pro', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Work Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'DM Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Manrope', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Noto Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Fira Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Dosis', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Quicksand', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Comfortaa', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Barlow', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Mukta', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Cabin', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Hind', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Karla', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Rubik', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Titillium Web', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Josefin Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Libre Franklin', category: 'sans-serif', variants: ['400', '700']},
          {family: 'PT Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Dancing Script', category: 'handwriting', variants: ['400', '700']},
          // Serif
          {family: 'Playfair Display', category: 'serif', variants: ['400', '700']},
          {family: 'Merriweather', category: 'serif', variants: ['400', '700']},
          {family: 'Lora', category: 'serif', variants: ['400', '700']},
          {family: 'PT Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Roboto Slab', category: 'serif', variants: ['400', '700']},
          {family: 'Crimson Text', category: 'serif', variants: ['400', '700']},
          {family: 'Libre Baskerville', category: 'serif', variants: ['400', '700']},
          {family: 'Bitter', category: 'serif', variants: ['400', '700']},
          {family: 'Noto Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Cormorant Garamond', category: 'serif', variants: ['400', '700']},
          {family: 'EB Garamond', category: 'serif', variants: ['400', '700']},
          {family: 'Bree Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Arvo', category: 'serif', variants: ['400', '700']},
          {family: 'Vollkorn', category: 'serif', variants: ['400', '700']},
          // Monospace
          {family: 'Roboto Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'Source Code Pro', category: 'monospace', variants: ['400', '700']},
          {family: 'Fira Code', category: 'monospace', variants: ['400', '700']},
          {family: 'Courier Prime', category: 'monospace', variants: ['400', '700']},
          {family: 'Inconsolata', category: 'monospace', variants: ['400', '700']},
          {family: 'Space Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'JetBrains Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'IBM Plex Mono', category: 'monospace', variants: ['400', '700']},
        ]
        setFonts(popularFonts)
      } catch (err) {
        console.error('❌ Google Fonts API hatası:', err)
        setError('Google Fonts API\'ye bağlanılamadı. Popüler fontlar kullanılıyor.')
        // Fallback: genişletilmiş popüler fontlar
        const popularFonts: GoogleFont[] = [
          {family: 'Roboto', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Open Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Lato', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Montserrat', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Oswald', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Raleway', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Poppins', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Ubuntu', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Nunito', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Inter', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Source Sans Pro', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Work Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'DM Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Manrope', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Noto Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Fira Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Dosis', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Quicksand', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Comfortaa', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Barlow', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Mukta', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Cabin', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Hind', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Karla', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Rubik', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Titillium Web', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Josefin Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Libre Franklin', category: 'sans-serif', variants: ['400', '700']},
          {family: 'PT Sans', category: 'sans-serif', variants: ['400', '700']},
          {family: 'Playfair Display', category: 'serif', variants: ['400', '700']},
          {family: 'Merriweather', category: 'serif', variants: ['400', '700']},
          {family: 'Lora', category: 'serif', variants: ['400', '700']},
          {family: 'PT Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Roboto Slab', category: 'serif', variants: ['400', '700']},
          {family: 'Crimson Text', category: 'serif', variants: ['400', '700']},
          {family: 'Libre Baskerville', category: 'serif', variants: ['400', '700']},
          {family: 'Bitter', category: 'serif', variants: ['400', '700']},
          {family: 'Noto Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Cormorant Garamond', category: 'serif', variants: ['400', '700']},
          {family: 'EB Garamond', category: 'serif', variants: ['400', '700']},
          {family: 'Bree Serif', category: 'serif', variants: ['400', '700']},
          {family: 'Arvo', category: 'serif', variants: ['400', '700']},
          {family: 'Vollkorn', category: 'serif', variants: ['400', '700']},
          {family: 'Roboto Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'Source Code Pro', category: 'monospace', variants: ['400', '700']},
          {family: 'Fira Code', category: 'monospace', variants: ['400', '700']},
          {family: 'Courier Prime', category: 'monospace', variants: ['400', '700']},
          {family: 'Inconsolata', category: 'monospace', variants: ['400', '700']},
          {family: 'Space Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'JetBrains Mono', category: 'monospace', variants: ['400', '700']},
          {family: 'IBM Plex Mono', category: 'monospace', variants: ['400', '700']},
        ]
        setFonts(popularFonts)
      } finally {
        setLoading(false)
      }
    }

    fetchFonts()
  }, [])

  // Fontları unique yap (aynı isimde font varsa sadece birini tut)
  const uniqueFonts = fonts.filter((font, index, self) => 
    index === self.findIndex(f => f.family === font.family)
  )

  // Kategorilere göre fontları grupla
  const fontsByCategory = uniqueFonts.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = []
    }
    acc[font.category].push(font)
    return acc
  }, {} as Record<string, GoogleFont[]>)

  // Seçili fontu yükle - her zaman çağrılmalı (hook sırası için)
  // ERKEN RETURN'LERDEN ÖNCE OLMALI!
  useEffect(() => {
    if (value && value !== 'normal' && value !== 'serif' && value !== 'mono') {
      const font = fonts.find(f => f.family === value)
      if (font && !loadedFontsRef.current.has(font.family)) {
        const fontLink = document.createElement('link')
        fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@400;700&display=swap`
        fontLink.rel = 'stylesheet'
        fontLink.crossOrigin = 'anonymous'
        if (!document.head.querySelector(`link[href*="${encodeURIComponent(font.family)}"]`)) {
          document.head.appendChild(fontLink)
          loadedFontsRef.current.add(font.family)
        }
      }
    }
  }, [value, fonts])

  // Varsayılan font seçenekleri
  const defaultFonts = [
    {title: 'Normal (Varsayılan)', value: 'normal'},
    {title: 'Serif', value: 'serif'},
    {title: 'Monospace', value: 'mono'},
  ]

  if (loading) {
    return (
      <Stack space={3}>
        <Text size={1}>Fontlar yükleniyor...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack space={3}>
        <Text size={1} style={{color: 'red'}}>{error}</Text>
      </Stack>
    )
  }

  const handleFontChange = (fontValue: string) => {
    if (onChange) {
      // Sanity StringInputProps onChange API'si - set() kullan
      onChange(set(fontValue))
    }
  }

  const isSelected = (fontValue: string) => value === fontValue

  // Seçili font için önizleme
  const selectedFont = value && value !== 'normal' && value !== 'serif' && value !== 'mono'
    ? fonts.find(f => f.family === value)
    : null

  const getPreviewFontFamily = () => {
    if (!value || value === 'normal') return 'sans-serif'
    if (value === 'serif') return 'serif'
    if (value === 'mono') return 'monospace'
    if (selectedFont) return `"${selectedFont.family}", ${selectedFont.category}`
    return 'sans-serif'
  }

  return (
    <Stack space={4}>
      {/* Seçili font önizlemesi */}
      {value && (
        <Card padding={3} radius={2} style={{background: '#f9f9f9', border: '1px solid #e0e0e0'}}>
          <Text size={0} weight="semibold" style={{marginBottom: '0.5rem', display: 'block', color: '#666'}}>
            Seçili Font Önizlemesi
          </Text>
          <Text
            size={1}
            weight="semibold"
            style={{
              fontFamily: getPreviewFontFamily(),
              fontSize: '1.5rem',
              lineHeight: '1.3',
              color: '#333',
              marginBottom: '0.5rem',
            }}
          >
            {value === 'normal' ? 'Normal (Varsayılan)' : value === 'serif' ? 'Serif' : value === 'mono' ? 'Monospace' : value}
          </Text>
          <Text
            size={1}
            style={{
              fontFamily: getPreviewFontFamily(),
              fontSize: '1rem',
              lineHeight: '1.5',
              color: '#666',
            }}
          >
            Bu font başlıklarda kullanılacak. Örnek metin: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>
        </Card>
      )}

      {/* Varsayılan fontlar */}
      <Box>
        <Text size={1} weight="semibold" style={{marginBottom: '0.75rem', display: 'block'}}>
          Varsayılan Fontlar
        </Text>
        <Flex gap={2} wrap="wrap">
          {defaultFonts.map((font) => {
            const getFontFamily = (value: string) => {
              if (value === 'normal') return 'sans-serif'
              if (value === 'serif') return 'serif'
              if (value === 'mono') return 'monospace'
              return 'sans-serif'
            }
            
            return (
              <Card
                key={font.value}
                padding={2}
                radius={2}
                style={{
                  border: isSelected(font.value) ? '2px solid #0066cc' : '1px solid #e0e0e0',
                  background: isSelected(font.value) ? '#e6f2ff' : '#fff',
                  cursor: 'pointer',
                  minWidth: '120px',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleFontChange(font.value)}
                onMouseEnter={(e) => {
                  if (!isSelected(font.value)) {
                    e.currentTarget.style.background = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected(font.value)) {
                    e.currentTarget.style.background = '#fff'
                  }
                }}
              >
                <Stack space={2}>
                  <Text
                    size={0}
                    weight="semibold"
                    style={{
                      fontFamily: getFontFamily(font.value),
                      fontSize: '0.75rem',
                      color: isSelected(font.value) ? '#0066cc' : '#333',
                    }}
                  >
                    {font.title}
                  </Text>
                  <Text
                    size={1}
                    style={{
                      fontFamily: getFontFamily(font.value),
                      fontSize: '1.25rem',
                      lineHeight: '1.2',
                      color: '#666',
                    }}
                  >
                    Aa Bb Cc
                  </Text>
                  <Text
                    size={0}
                    style={{
                      fontFamily: getFontFamily(font.value),
                      fontSize: '0.75rem',
                      color: '#999',
                    }}
                  >
                    Örnek Metin
                  </Text>
                </Stack>
              </Card>
            )
          })}
        </Flex>
      </Box>

      {/* Google Fonts */}
      <Box>
        <Text size={1} weight="semibold" style={{marginBottom: '0.75rem', display: 'block'}}>
          Google Fonts
        </Text>
        <Card
          padding={3}
          radius={2}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <Stack space={4}>
            {Object.entries(fontsByCategory).map(([category, categoryFonts]) => (
              <Box key={category}>
                <Text
                  size={0}
                  weight="semibold"
                  style={{
                    textTransform: 'capitalize',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}
                >
                  {category}
                </Text>
                <Flex gap={2} wrap="wrap">
                  {categoryFonts.map((font) => {
                    // Fontu dinamik olarak yükle (sadece bir kez)
                    if (!loadedFontsRef.current.has(font.family)) {
                      const fontLink = document.createElement('link')
                      fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@400;700&display=swap`
                      fontLink.rel = 'stylesheet'
                      fontLink.crossOrigin = 'anonymous'
                      if (!document.head.querySelector(`link[href*="${encodeURIComponent(font.family)}"]`)) {
                        document.head.appendChild(fontLink)
                        loadedFontsRef.current.add(font.family)
                      }
                    }
                    
                    return (
                      <Card
                        key={font.family}
                        padding={2}
                        radius={2}
                        style={{
                          border: isSelected(font.family) ? '2px solid #0066cc' : '1px solid #e0e0e0',
                          background: isSelected(font.family) ? '#e6f2ff' : '#fff',
                          cursor: 'pointer',
                          minWidth: '120px',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleFontChange(font.family)}
                        onMouseEnter={(e) => {
                          if (!isSelected(font.family)) {
                            e.currentTarget.style.background = '#f5f5f5'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected(font.family)) {
                            e.currentTarget.style.background = '#fff'
                          }
                        }}
                      >
                        <Stack space={2}>
                          <Text
                            size={0}
                            weight="semibold"
                            style={{
                              fontFamily: `"${font.family}", ${font.category}`,
                              fontSize: '0.75rem',
                              color: isSelected(font.family) ? '#0066cc' : '#333',
                            }}
                          >
                            {font.family}
                          </Text>
                          <Text
                            size={1}
                            style={{
                              fontFamily: `"${font.family}", ${font.category}`,
                              fontSize: '1.25rem',
                              lineHeight: '1.2',
                              color: '#666',
                            }}
                          >
                            Aa Bb Cc
                          </Text>
                          <Text
                            size={0}
                            style={{
                              fontFamily: `"${font.family}", ${font.category}`,
                              fontSize: '0.75rem',
                              color: '#999',
                            }}
                          >
                            Örnek Metin
                          </Text>
                        </Stack>
                      </Card>
                    )
                  })}
                </Flex>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    </Stack>
  )
}

