import React, {useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {set} from 'sanity'
import styled from 'styled-components'

const TranslateButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: #357ae8;
  }

  &:disabled {
    background: #ccc;
    color: #666;
    cursor: not-allowed;
    opacity: 1;
  }
`

const TranslateButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
`

const StatusMessage = styled.div<{type: 'success' | 'error'}>`
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => (props.type === 'success' ? '#d4edda' : '#f8d7da')};
  color: ${(props) => (props.type === 'success' ? '#155724' : '#721c24')};
  border: 1px solid ${(props) => (props.type === 'success' ? '#c3e6cb' : '#f5c6cb')};
`

// Google Translate API kullanarak çeviri yap
const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || text.trim() === '') {
    throw new Error('Çevrilecek metin boş')
  }

  const sourceLang = 'tr' // Türkçe'den çeviriyoruz
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Çeviri servisi yanıt vermedi')
    }

    const data = await response.json()
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item: any[]) => item[0]).join('')
    }
    throw new Error('Çeviri sonucu alınamadı')
  } catch (error: any) {
    throw new Error(`Çeviri hatası: ${error.message}`)
  }
}

export default function LocalizedTextInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const [translating, setTranslating] = useState<string | null>(null)
  const [status, setStatus] = useState<{type: 'success' | 'error'; message: string} | null>(null)

  const trValue = value?.tr || ''

  const handleTranslate = async (targetLang: 'en' | 'it') => {
    if (!trValue || trValue.trim() === '') {
      setStatus({type: 'error', message: 'Önce Türkçe metni girin'})
      return
    }

    setTranslating(targetLang)
    setStatus(null)

    try {
      const translated = await translateText(trValue, targetLang)

      // Çeviriyi ilgili alana kaydet
      const currentValue = value || {}
      onChange(set({...currentValue, [targetLang]: translated}))

      setStatus({
        type: 'success',
        message: `${targetLang === 'en' ? 'İngilizce' : 'İtalyanca'} çevirisi yapıldı`,
      })

      // 3 saniye sonra status mesajını kaldır
      setTimeout(() => setStatus(null), 3000)
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Çeviri yapılamadı',
      })
    } finally {
      setTranslating(null)
    }
  }

  const {renderDefault} = props

  return (
    <div>
      {trValue && (
        <TranslateButtonsContainer>
          <span style={{fontWeight: 'bold', marginRight: '0.5rem', color: '#333'}}>
            🌐 Otomatik Çeviri:
          </span>
          <TranslateButton
            onClick={() => handleTranslate('en')}
            disabled={translating !== null || !trValue}
          >
            {translating === 'en' ? '⏳ Çevriliyor...' : "🇬🇧 İngilizce'ye Çevir"}
          </TranslateButton>
          <TranslateButton
            onClick={() => handleTranslate('it')}
            disabled={translating !== null || !trValue}
          >
            {translating === 'it' ? '⏳ Çevriliyor...' : "🇮🇹 İtalyanca'ya Çevir"}
          </TranslateButton>
        </TranslateButtonsContainer>
      )}

      {status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}

      {/* Sanity'nin varsayılan input'unu render et */}
      {renderDefault(props)}
    </div>
  )
}
