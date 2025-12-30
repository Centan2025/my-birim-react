import React, { useEffect, useState, useMemo } from 'react'
import type { StringInputProps } from 'sanity'
import { set } from 'sanity'
import styled from 'styled-components'
import { Search, Check, ExternalLink, ChevronDown, ChevronUp, Type, X } from 'lucide-react'

// Popüler Google Fonts listesi - Kategorize edilmiş ve genişletilmiş
const POPULAR_FONTS = [
  // Sistem Fontları
  { name: 'normal', displayName: 'Normal (Sans-serif)', category: 'Sistem' },
  { name: 'serif', displayName: 'Serif', category: 'Sistem' },
  { name: 'mono', displayName: 'Monospace', category: 'Sistem' },

  // Sans-serif
  { name: 'Inter', displayName: 'Inter', category: 'Sans-serif' },
  { name: 'Roboto', displayName: 'Roboto', category: 'Sans-serif' },
  { name: 'Open Sans', displayName: 'Open Sans', category: 'Sans-serif' },
  { name: 'Montserrat', displayName: 'Montserrat', category: 'Sans-serif' },
  { name: 'Lato', displayName: 'Lato', category: 'Sans-serif' },
  { name: 'Poppins', displayName: 'Poppins', category: 'Sans-serif' },
  { name: 'Raleway', displayName: 'Raleway', category: 'Sans-serif' },
  { name: 'Nunito', displayName: 'Nunito', category: 'Sans-serif' },
  { name: 'Work Sans', displayName: 'Work Sans', category: 'Sans-serif' },
  { name: 'Manrope', displayName: 'Manrope', category: 'Sans-serif' },
  { name: 'Outfit', displayName: 'Outfit', category: 'Sans-serif' },
  { name: 'Plus Jakarta Sans', displayName: 'Plus Jakarta Sans', category: 'Sans-serif' },
  { name: 'Urbanist', displayName: 'Urbanist', category: 'Sans-serif' },
  { name: 'Epilogue', displayName: 'Epilogue', category: 'Sans-serif' },
  { name: 'Syne', displayName: 'Syne', category: 'Sans-serif' },

  // Serif
  { name: 'Playfair Display', displayName: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', displayName: 'Merriweather', category: 'Serif' },
  { name: 'Lora', displayName: 'Lora', category: 'Serif' },
  { name: 'Crimson Text', displayName: 'Crimson Text', category: 'Serif' },
  { name: 'Libre Baskerville', displayName: 'Libre Baskerville', category: 'Serif' },
  { name: 'Cormorant Garamond', displayName: 'Cormorant Garamond', category: 'Serif' },
  { name: 'Cinzel', displayName: 'Cinzel', category: 'Serif' },
  { name: 'Bodoni Moda', displayName: 'Bodoni Moda', category: 'Serif' },
  { name: 'Fraunces', displayName: 'Fraunces', category: 'Serif' },
  { name: 'Prata', displayName: 'Prata', category: 'Serif' },

  // Display
  { name: 'Oswald', displayName: 'Oswald', category: 'Display' },
  { name: 'Bebas Neue', displayName: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', displayName: 'Anton', category: 'Display' },
  { name: 'Abril Fatface', displayName: 'Abril Fatface', category: 'Display' },
  { name: 'Righteous', displayName: 'Righteous', category: 'Display' },
  { name: 'Alfa Slab One', displayName: 'Alfa Slab One', category: 'Display' },
  { name: 'Titan One', displayName: 'Titan One', category: 'Display' },
  { name: 'Syncopate', displayName: 'Syncopate', category: 'Display' },

  // Handwriting
  { name: 'Dancing Script', displayName: 'Dancing Script', category: 'Handwriting' },
  { name: 'Pacifico', displayName: 'Pacifico', category: 'Handwriting' },
  { name: 'Caveat', displayName: 'Caveat', category: 'Handwriting' },
  { name: 'Satisfy', displayName: 'Satisfy', category: 'Handwriting' },
  { name: 'Handlee', displayName: 'Handlee', category: 'Handwriting' },
  { name: 'Marck Script', displayName: 'Marck Script', category: 'Handwriting' },
]

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`

const SelectorWrapper = styled.div`
  position: relative;
  width: 100%;
`

const DropdownTrigger = styled.div<{ $isOpen: boolean; $hasValue: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid ${(props) => (props.$isOpen ? '#4285f4' : '#d1d5db')};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 3rem;

  &:hover {
    border-color: #4285f4;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  ${(props) => props.$isOpen && `
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  `}
`

const SelectedFontInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const SelectedFontName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`

const SelectedFontPreview = styled.span<{ fontFamily: string }>`
  font-family: ${(props) => {
    if (props.fontFamily === 'normal') return 'sans-serif'
    if (props.fontFamily === 'serif') return 'serif'
    if (props.fontFamily === 'mono') return 'monospace'
    return `"${props.fontFamily}", sans-serif`
  }};
  font-size: 1.125rem;
  color: #4b5563;
  line-height: 1;
  font-weight: 200;
`

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const SearchWrapper = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f9fafb;
`

const SearchInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.875rem;
  padding: 0.25rem;
  outline: none;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }
`

const FontList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
`

const CategoryHeader = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  padding: 0.75rem 0.75rem 0.25rem;
  letter-spacing: 0.05em;
`

const FontItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  background: ${(props) => (props.$isSelected ? '#eff6ff' : 'transparent')};
  transition: background 0.15s;

  &:hover {
    background: ${(props) => (props.$isSelected ? '#dbeafe' : '#f3f4f6')};
  }
`

const FontItemMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const FontItemName = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
`

const FontItemPreview = styled.div<{ fontFamily: string }>`
  font-family: ${(props) => {
    if (props.fontFamily === 'normal') return 'sans-serif'
    if (props.fontFamily === 'serif') return 'serif'
    if (props.fontFamily === 'mono') return 'monospace'
    return `"${props.fontFamily}", sans-serif`
  }};
  font-size: 1.25rem;
  color: #111827;
  line-height: 1.2;
  font-weight: 200;
`

const CustomInputSection = styled.div`
  padding: 0.75rem;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
`

const CustomInputLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const CustomInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`

const StyledInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;

  &:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
  }
`

const AddButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #357ae8;
  }
`

const ClearButton = styled.div`
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #ef4444;
  }
`

// Google Fonts dinamik yükleyici
const loadGoogleFont = (fontName: string) => {
  if (!fontName || ['normal', 'serif', 'mono'].includes(fontName)) return

  const fontId = `google-font-preview-${fontName.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(fontId)) return

  const fontFamily = fontName.replace(/\s+/g, '+')
  const link = document.createElement('link')
  link.id = fontId
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@200;400;600;700&display=swap`
  document.head.appendChild(link)
}

export default function FontSelectorInput(props: StringInputProps) {
  const { value, onChange } = props
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customFontInput, setCustomFontInput] = useState('')

  // Seçili fontu yükle
  useEffect(() => {
    if (value) loadGoogleFont(value)
  }, [value])

  // Görünür fontları yükle (Dropdown açıldığında)
  useEffect(() => {
    if (isOpen) {
      POPULAR_FONTS.forEach(f => loadGoogleFont(f.name))
    }
  }, [isOpen])

  const filteredFonts = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const result = POPULAR_FONTS.filter(f =>
      f.displayName.toLowerCase().includes(term) ||
      f.category.toLowerCase().includes(term)
    )

    // Kategorize et
    const groups: Record<string, typeof POPULAR_FONTS> = {}
    result.forEach(f => {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    })

    return groups
  }, [searchTerm])

  const handleSelect = (fontName: string) => {
    onChange(set(fontName))
    setIsOpen(false)
  }

  const handleCustomAdd = () => {
    if (customFontInput.trim()) {
      handleSelect(customFontInput.trim())
      setCustomFontInput('')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(set('normal'))
  }

  const selectedFont = POPULAR_FONTS.find(f => f.name === value) ||
    (value ? { name: value, displayName: value, category: 'Özel' } : null)

  return (
    <Container>
      <SelectorWrapper>
        <DropdownTrigger
          $isOpen={isOpen}
          $hasValue={!!value}
          onClick={() => setIsOpen(!isOpen)}
        >
          <SelectedFontInfo>
            {value ? (
              <>
                <SelectedFontName>{selectedFont?.displayName}</SelectedFontName>
                <SelectedFontPreview fontFamily={value}>
                  The quick brown fox
                </SelectedFontPreview>
              </>
            ) : (
              <SelectedFontName style={{ color: '#9ca3af', fontWeight: 400 }}>
                Font seçin...
              </SelectedFontName>
            )}
          </SelectedFontInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {value && value !== 'normal' && (
              <ClearButton onClick={handleClear} title="Temizle">
                <X size={16} />
              </ClearButton>
            )}
            {isOpen ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
          </div>
        </DropdownTrigger>

        {isOpen && (
          <DropdownMenu onClick={(e) => e.stopPropagation()}>
            <SearchWrapper>
              <Search size={16} color="#9ca3af" />
              <SearchInput
                autoFocus
                placeholder="Font ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>

            <FontList>
              {Object.keys(filteredFonts).map(category => (
                <React.Fragment key={category}>
                  <CategoryHeader>{category}</CategoryHeader>
                  {filteredFonts[category].map(font => (
                    <FontItem
                      key={font.name}
                      $isSelected={value === font.name}
                      onClick={() => handleSelect(font.name)}
                    >
                      <FontItemMain>
                        <FontItemName>{font.displayName}</FontItemName>
                        <FontItemPreview fontFamily={font.name}>
                          Mistral Design
                        </FontItemPreview>
                      </FontItemMain>
                      {value === font.name && <Check size={18} color="#4285f4" />}
                    </FontItem>
                  ))}
                </React.Fragment>
              ))}
            </FontList>

            <CustomInputSection>
              <CustomInputLabel>
                <ExternalLink size={12} /> Google Fonts'tan Ekle
              </CustomInputLabel>
              <CustomInputGroup>
                <StyledInput
                  placeholder="Font adı (örn: Inter)"
                  value={customFontInput}
                  onChange={(e) => setCustomFontInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                />
                <AddButton onClick={handleCustomAdd}>Ekle</AddButton>
              </CustomInputGroup>
            </CustomInputSection>
          </DropdownMenu>
        )}
      </SelectorWrapper>
    </Container>
  )
}
