import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  FC,
  KeyboardEvent,
  ChangeEvent,
} from 'react'
import {ChevronDown, X, Check, Search} from 'lucide-react'
import {Country, searchCountries, findCountryByNameOrCode} from '../lib/countries'
import {useTranslation} from '../i18n'

export interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  id?: string
  name?: string
  className?: string
  disabled?: boolean
}

export const CountrySelect: FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  id,
  name = 'country',
  className = '',
  disabled = false,
}) => {
  const {t, locale} = useTranslation()
  const generatedId = useId()
  const inputId = id || `country-select-${generatedId}`
  const listboxId = `country-listbox-${generatedId}`

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const isTr = (locale || 'tr').toLowerCase().startsWith('tr')

  // Find currently selected country metadata if any
  const selectedCountry = findCountryByNameOrCode(value)

  // Filter countries according to search query
  const filteredCountries = searchCountries(query, locale || 'tr')

  // Keep highlighted index in bounds
  useEffect(() => {
    if (filteredCountries.length === 0) {
      setHighlightedIndex(-1)
    } else if (highlightedIndex >= filteredCountries.length) {
      setHighlightedIndex(0)
    }
  }, [filteredCountries.length, highlightedIndex])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[highlightedIndex] as HTMLElement | undefined
      if (activeItem && typeof activeItem.scrollIntoView === 'function') {
        activeItem.scrollIntoView({block: 'nearest'})
      }
    }
  }, [highlightedIndex, isOpen])

  const handleCloseDropdown = useCallback(() => {
    setIsOpen(false)
    setHighlightedIndex(-1)
    setQuery('')
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCloseDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [handleCloseDropdown])

  const handleSelectCountry = (country: Country) => {
    const countryName = isTr ? country.nameTr : country.nameEn
    onChange(countryName)
    setQuery('')
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (!isOpen) {
      setIsOpen(true)
    }
    setHighlightedIndex(0)
  }

  const handleInputFocus = () => {
    if (disabled) return
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setHighlightedIndex(0)
    inputRef.current?.focus()
    setIsOpen(true)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filteredCountries.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCountries.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        {
          const target =
            (highlightedIndex >= 0 ? filteredCountries[highlightedIndex] : undefined) ??
            filteredCountries[0]
          if (target) {
            handleSelectCountry(target)
          } else if (query.trim()) {
            // If typed custom country name that isn't in list
            onChange(query.trim())
            handleCloseDropdown()
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        handleCloseDropdown()
        break
      case 'Tab':
        handleCloseDropdown()
        break
    }
  }

  // Determine what to display inside the text input
  let displayInputValue = ''
  if (isOpen) {
    displayInputValue = query
  } else if (selectedCountry) {
    const name = isTr ? selectedCountry.nameTr : selectedCountry.nameEn
    displayInputValue = `${selectedCountry.flag}  ${name}`
  } else if (value) {
    displayInputValue = value
  }

  const defaultPlaceholder = placeholder || t('country_placeholder') || t('country') || 'Ülke'
  const searchPlaceholder = t('search_country') || 'Ülke ara...'

  return (
    <div ref={containerRef} className={`relative w-full text-left font-inter ${className}`}>
      {/* Hidden native input for standard HTML form validation */}
      <input
        type="text"
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        style={{position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0}}
      />

      <div className="relative group">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayInputValue}
          placeholder={isOpen ? searchPlaceholder : defaultPlaceholder}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!isOpen) setIsOpen(true)
          }}
          className={`block w-full pl-6 pr-14 bg-[var(--bg-primary)] border border-gray-400 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-[var(--text-primary)] transition-all text-sm md:text-base tracking-widest font-semibold font-inter ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
          }`}
          style={{outline: 'none', boxShadow: 'none'}}
        />

        {/* Action icons on right: clear button + chevron */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          {(value || query) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Temizle"
              tabIndex={-1}
              className="p-1 text-gray-400 hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (isOpen) {
                handleCloseDropdown()
              } else {
                setIsOpen(true)
                inputRef.current?.focus()
              }
            }}
            className="p-1 text-gray-400 hover:text-[var(--text-primary)] transition-colors focus:outline-none"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[var(--text-primary)]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options Menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--bg-primary)] border border-gray-400 shadow-2xl overflow-hidden rounded-none animate-in fade-in zoom-in-95 duration-150"
          style={{maxHeight: '260px'}}
        >
          {/* Quick search input hint header */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              {query
                ? `${filteredCountries.length} ${isTr ? 'ülke bulundu' : 'countries found'}`
                : isTr
                  ? 'Ülke Listesi'
                  : 'Country List'}
            </span>
            <span className="text-[10px] lowercase text-gray-400 font-mono">
              {isTr ? 'yazarak arayın' : 'type to filter'}
            </span>
          </div>

          <ul
            ref={listRef}
            className="max-h-[210px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50 py-1"
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => {
                const isSelected =
                  (selectedCountry && selectedCountry.code === country.code) ||
                  value === country.nameTr ||
                  value === country.nameEn
                const isHighlighted = index === highlightedIndex
                const primaryName = isTr ? country.nameTr : country.nameEn
                const secondaryName = isTr ? country.nameEn : country.nameTr

                return (
                  <li
                    key={country.code}
                    role="option"
                    tabIndex={-1}
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={e => {
                      // Prevent input blur before click finishes
                      e.preventDefault()
                    }}
                    onClick={() => handleSelectCountry(country)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectCountry(country)
                      }
                    }}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs md:text-sm font-inter tracking-wide ${
                      isHighlighted
                        ? 'bg-gray-100 dark:bg-white/10 text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-white/5'
                    } ${isSelected ? 'font-bold' : 'font-normal'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base flex-shrink-0 select-none" aria-hidden="true">
                        {country.flag}
                      </span>
                      <div className="flex items-baseline gap-2 truncate">
                        <span className="truncate">{primaryName}</span>
                        {primaryName !== secondaryName && (
                          <span className="text-[11px] text-gray-400 truncate">
                            ({secondaryName})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0 text-[#3c424d] dark:text-white ml-2" />
                    )}
                  </li>
                )
              })
            ) : (
              <li className="px-4 py-6 text-center text-xs text-gray-400 font-medium">
                <p>{t('no_country_found') || 'Sonuç bulunamadı'}</p>
                {query.trim() && (
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      onChange(query.trim())
                      handleCloseDropdown()
                    }}
                    className="mt-2.5 inline-block text-[11px] uppercase tracking-wider text-[var(--text-primary)] underline hover:opacity-75"
                  >
                    &ldquo;{query}&rdquo; {isTr ? 'olarak kaydet' : 'save as country'}
                  </button>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
