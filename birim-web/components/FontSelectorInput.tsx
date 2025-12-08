import React, {useEffect, useState} from 'react'
import type {StringInputProps} from 'sanity'
import {set} from 'sanity'
import styled from 'styled-components'

// Popüler Google Fonts listesi
const POPULAR_FONTS = [
  {name: 'normal', displayName: 'Normal (Sans-serif)', category: 'Sistem'},
  {name: 'serif', displayName: 'Serif', category: 'Sistem'},
  {name: 'mono', displayName: 'Monospace', category: 'Sistem'},
  {name: 'Playfair Display', displayName: 'Playfair Display', category: 'Serif'},
  {name: 'Roboto', displayName: 'Roboto', category: 'Sans-serif'},
  {name: 'Open Sans', displayName: 'Open Sans', category: 'Sans-serif'},
  {name: 'Lato', displayName: 'Lato', category: 'Sans-serif'},
  {name: 'Montserrat', displayName: 'Montserrat', category: 'Sans-serif'},
  {name: 'Raleway', displayName: 'Raleway', category: 'Sans-serif'},
  {name: 'Poppins', displayName: 'Poppins', category: 'Sans-serif'},
  {name: 'Merriweather', displayName: 'Merriweather', category: 'Serif'},
  {name: 'Lora', displayName: 'Lora', category: 'Serif'},
  {name: 'Source Sans Pro', displayName: 'Source Sans Pro', category: 'Sans-serif'},
  {name: 'Oswald', displayName: 'Oswald', category: 'Sans-serif'},
  {name: 'Roboto Slab', displayName: 'Roboto Slab', category: 'Serif'},
  {name: 'PT Sans', displayName: 'PT Sans', category: 'Sans-serif'},
  {name: 'Nunito', displayName: 'Nunito', category: 'Sans-serif'},
  {name: 'Ubuntu', displayName: 'Ubuntu', category: 'Sans-serif'},
  {name: 'Crimson Text', displayName: 'Crimson Text', category: 'Serif'},
  {name: 'Dancing Script', displayName: 'Dancing Script', category: 'Handwriting'},
  {name: 'Pacifico', displayName: 'Pacifico', category: 'Handwriting'},
  {name: 'Bebas Neue', displayName: 'Bebas Neue', category: 'Display'},
  {name: 'Anton', displayName: 'Anton', category: 'Display'},
  {name: 'Fjalla One', displayName: 'Fjalla One', category: 'Sans-serif'},
  {name: 'Bitter', displayName: 'Bitter', category: 'Serif'},
  {name: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'Serif'},
  {name: 'Inter', displayName: 'Inter', category: 'Sans-serif'},
  {name: 'Work Sans', displayName: 'Work Sans', category: 'Sans-serif'},
  {name: 'Noto Sans', displayName: 'Noto Sans', category: 'Sans-serif'},
  {name: 'DM Sans', displayName: 'DM Sans', category: 'Sans-serif'},
  {name: 'Space Grotesk', displayName: 'Space Grotesk', category: 'Sans-serif'},
  {name: 'Manrope', displayName: 'Manrope', category: 'Sans-serif'},
  {name: 'Plus Jakarta Sans', displayName: 'Plus Jakarta Sans', category: 'Sans-serif'},
  {name: 'Outfit', displayName: 'Outfit', category: 'Sans-serif'},
  {name: 'Sora', displayName: 'Sora', category: 'Sans-serif'},
  {name: 'Figtree', displayName: 'Figtree', category: 'Sans-serif'},
  {name: 'Rubik', displayName: 'Rubik', category: 'Sans-serif'},
  {name: 'Quicksand', displayName: 'Quicksand', category: 'Sans-serif'},
  {name: 'Comfortaa', displayName: 'Comfortaa', category: 'Sans-serif'},
  {name: 'Josefin Sans', displayName: 'Josefin Sans', category: 'Sans-serif'},
  {name: 'Cormorant Garamond', displayName: 'Cormorant Garamond', category: 'Serif'},
  {name: 'EB Garamond', displayName: 'EB Garamond', category: 'Serif'},
  {name: 'Cinzel', displayName: 'Cinzel', category: 'Serif'},
  {name: 'Abril Fatface', displayName: 'Abril Fatface', category: 'Display'},
  {name: 'Bodoni Moda', displayName: 'Bodoni Moda', category: 'Serif'},
  {name: 'Prata', displayName: 'Prata', category: 'Serif'},
  {name: 'DM Serif Display', displayName: 'DM Serif Display', category: 'Serif'},
  {name: 'Cormorant', displayName: 'Cormorant', category: 'Serif'},
  {name: 'Vollkorn', displayName: 'Vollkorn', category: 'Serif'},
  {name: 'Crimson Pro', displayName: 'Crimson Pro', category: 'Serif'},
  {name: 'Fraunces', displayName: 'Fraunces', category: 'Serif'},
  {name: 'Spectral', displayName: 'Spectral', category: 'Serif'},
  {name: 'Zilla Slab', displayName: 'Zilla Slab', category: 'Serif'},
  {name: 'Alfa Slab One', displayName: 'Alfa Slab One', category: 'Display'},
  {name: 'Righteous', displayName: 'Righteous', category: 'Display'},
  {name: 'Fredoka One', displayName: 'Fredoka One', category: 'Display'},
  {name: 'Bangers', displayName: 'Bangers', category: 'Display'},
  {name: 'Lobster', displayName: 'Lobster', category: 'Display'},
  {name: 'Satisfy', displayName: 'Satisfy', category: 'Handwriting'},
  {name: 'Kalam', displayName: 'Kalam', category: 'Handwriting'},
  {name: 'Caveat', displayName: 'Caveat', category: 'Handwriting'},
  {name: 'Permanent Marker', displayName: 'Permanent Marker', category: 'Handwriting'},
  {name: 'Shadows Into Light', displayName: 'Shadows Into Light', category: 'Handwriting'},
  {name: 'Amatic SC', displayName: 'Amatic SC', category: 'Handwriting'},
  {name: 'Indie Flower', displayName: 'Indie Flower', category: 'Handwriting'},
  {name: 'Dosis', displayName: 'Dosis', category: 'Sans-serif'},
  {name: 'Exo 2', displayName: 'Exo 2', category: 'Sans-serif'},
  {name: 'Orbitron', displayName: 'Orbitron', category: 'Sans-serif'},
  {name: 'Rajdhani', displayName: 'Rajdhani', category: 'Sans-serif'},
  {name: 'Titillium Web', displayName: 'Titillium Web', category: 'Sans-serif'},
  {name: 'Yanone Kaffeesatz', displayName: 'Yanone Kaffeesatz', category: 'Sans-serif'},
  {name: 'Comic Neue', displayName: 'Comic Neue', category: 'Handwriting'},
  {name: 'Patrick Hand', displayName: 'Patrick Hand', category: 'Handwriting'},
]

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`

const FontGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
`

const FontCard = styled.div<{isSelected: boolean}>`
  border: 2px solid ${(props) => (props.isSelected ? '#4285f4' : '#e0e0e0')};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  background: ${(props) => (props.isSelected ? '#f0f7ff' : 'white')};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${(props) => (props.isSelected ? '#4285f4' : '#b0b0b0')};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`

const FontName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
  margin-bottom: 0.5rem;
`

const FontCategory = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.75rem;
`

const FontPreview = styled.div<{fontFamily: string}>`
  font-family: ${(props) => {
    if (props.fontFamily === 'normal') return 'sans-serif'
    if (props.fontFamily === 'serif') return 'serif'
    if (props.fontFamily === 'mono') return 'monospace'
    return `"${props.fontFamily}", sans-serif`
  }};
  font-size: 1rem;
  font-weight: 600;
  color: #111;
  line-height: 1.3;
  margin-bottom: 0.5rem;
  min-height: 1.5rem;
`

const FontPreviewText = styled.div<{fontFamily: string}>`
  font-family: ${(props) => {
    if (props.fontFamily === 'normal') return 'sans-serif'
    if (props.fontFamily === 'serif') return 'serif'
    if (props.fontFamily === 'mono') return 'monospace'
    return `"${props.fontFamily}", sans-serif`
  }};
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
`

const SelectedBadge = styled.div`
  display: inline-block;
  background: #4285f4;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-weight: 500;
`

const CustomInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`

const CustomInputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
`

// Google Fonts'u dinamik olarak yükle
const loadGoogleFont = (fontName: string) => {
  if (fontName === 'normal' || fontName === 'serif' || fontName === 'mono') {
    return
  }

  const fontId = `google-font-preview-${fontName.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(fontId)) {
    return
  }

  const fontFamily = fontName.replace(/\s+/g, '+')
  const link = document.createElement('link')
  link.id = fontId
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap`
  document.head.appendChild(link)
}

export default function FontSelectorInput(props: StringInputProps) {
  const {value, onChange, schemaType} = props
  const [searchTerm, setSearchTerm] = useState('')
  const [customFont, setCustomFont] = useState('')

  // Tüm fontları yükle (preview için)
  useEffect(() => {
    POPULAR_FONTS.forEach((font) => {
      if (font.name !== 'normal' && font.name !== 'serif' && font.name !== 'mono') {
        loadGoogleFont(font.name)
      }
    })
  }, [])

  // Seçilen fontu yükle
  useEffect(() => {
    if (value && value !== 'normal' && value !== 'serif' && value !== 'mono') {
      loadGoogleFont(value)
    }
  }, [value])

  const filteredFonts = POPULAR_FONTS.filter((font) =>
    font.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    font.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFontSelect = (fontName: string) => {
    onChange(set(fontName))
    setCustomFont('')
  }

  const handleCustomFontChange = (fontName: string) => {
    setCustomFont(fontName)
    if (fontName.trim()) {
      loadGoogleFont(fontName.trim())
      onChange(set(fontName.trim()))
    }
  }

  return (
    <Container>
      <SearchInput
        type="text"
        placeholder="Font ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <FontGrid>
        {filteredFonts.map((font) => {
          const isSelected = value === font.name
          return (
            <FontCard
              key={font.name}
              isSelected={isSelected}
              onClick={() => handleFontSelect(font.name)}
            >
              <FontName>{font.displayName}</FontName>
              <FontCategory>{font.category}</FontCategory>
              <FontPreview fontFamily={font.name}>
                Başlık Örneği
              </FontPreview>
              <FontPreviewText fontFamily={font.name}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </FontPreviewText>
              {isSelected && <SelectedBadge>Seçili</SelectedBadge>}
            </FontCard>
          )
        })}
      </FontGrid>

      <CustomInputLabel>
        Özel Font (Google Fonts'tan font adı girin)
      </CustomInputLabel>
      <CustomInput
        type="text"
        placeholder="Örn: Inter, Noto Sans, etc."
        value={customFont || (value && !POPULAR_FONTS.find((f) => f.name === value) ? value : '')}
        onChange={(e) => handleCustomFontChange(e.target.value)}
      />
      {customFont && (
        <FontCard isSelected={true} style={{marginTop: '0.5rem'}}>
          <FontName>{customFont}</FontName>
          <FontCategory>Özel Font</FontCategory>
          <FontPreview fontFamily={customFont}>
            Başlık Örneği
          </FontPreview>
          <FontPreviewText fontFamily={customFont}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </FontPreviewText>
          <SelectedBadge>Seçili</SelectedBadge>
        </FontCard>
      )}
    </Container>
  )
}

