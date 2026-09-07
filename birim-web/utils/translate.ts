/**
 * Çok dilli alanlar için Google Translate API yardımcı fonksiyonu
 */
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || text.trim() === '') {
    throw new Error('Çevrilecek metin boş')
  }

  const sourceLang = 'tr' // Türkçe kaynak dil
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Çeviri servisi yanıt vermedi')
    }

    const data = await response.json()
    if (data && data[0] && Array.isArray(data[0])) {
      return data[0].map((item: any[]) => item[0] || '').join('')
    }
    throw new Error('Çeviri sonucu alınamadı')
  } catch (error: any) {
    throw new Error(`Çeviri hatası: ${error.message}`)
  }
}
