export interface Country {
  code: string
  nameTr: string
  nameEn: string
  flag: string
  aliases?: string[]
}

export const COUNTRIES: Country[] = [
  {code: 'TR', nameTr: 'Türkiye', nameEn: 'Turkey', flag: '🇹🇷', aliases: ['turkiye', 'turk', 'tr']},
  {code: 'DE', nameTr: 'Almanya', nameEn: 'Germany', flag: '🇩🇪', aliases: ['deutschland', 'de']},
  {
    code: 'US',
    nameTr: 'Amerika Birleşik Devletleri',
    nameEn: 'United States',
    flag: '🇺🇸',
    aliases: ['abd', 'usa', 'amerika', 'america', 'us'],
  },
  {
    code: 'GB',
    nameTr: 'Birleşik Krallık',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    aliases: ['ingiltere', 'england', 'uk', 'great britain', 'britanya', 'gb'],
  },
  {code: 'FR', nameTr: 'Fransa', nameEn: 'France', flag: '🇫🇷', aliases: ['fr']},
  {code: 'IT', nameTr: 'İtalya', nameEn: 'Italy', flag: '🇮🇹', aliases: ['italia', 'it']},
  {code: 'ES', nameTr: 'İspanya', nameEn: 'Spain', flag: '🇪🇸', aliases: ['espana', 'es']},
  {code: 'NL', nameTr: 'Hollanda', nameEn: 'Netherlands', flag: '🇳🇱', aliases: ['holland', 'nl']},
  {code: 'BE', nameTr: 'Belçika', nameEn: 'Belgium', flag: '🇧🇪', aliases: ['be']},
  {
    code: 'CH',
    nameTr: 'İsviçre',
    nameEn: 'Switzerland',
    flag: '🇨🇭',
    aliases: ['swiss', 'suisse', 'schweiz', 'ch'],
  },
  {code: 'AT', nameTr: 'Avusturya', nameEn: 'Austria', flag: '🇦🇹', aliases: ['österreich', 'at']},
  {
    code: 'AZ',
    nameTr: 'Azerbaycan',
    nameEn: 'Azerbaijan',
    flag: '🇦🇿',
    aliases: ['azerbaycan', 'az'],
  },
  {
    code: 'CY',
    nameTr: 'Kuzey Kıbrıs',
    nameEn: 'Northern Cyprus',
    flag: '🇹🇷',
    aliases: ['kktc', 'kıbrıs', 'cyprus'],
  },
  {
    code: 'AE',
    nameTr: 'Birleşik Arap Emirlikleri',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    aliases: ['bae', 'uae', 'dubai', 'abu dhabi'],
  },
  {
    code: 'SA',
    nameTr: 'Suudi Arabistan',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    aliases: ['saudi', 'riyadh', 'sa'],
  },
  {code: 'QA', nameTr: 'Katar', nameEn: 'Qatar', flag: '🇶🇦', aliases: ['qa']},
  {code: 'KW', nameTr: 'Kuveyt', nameEn: 'Kuwait', flag: '🇰🇼', aliases: ['kw']},
  {code: 'RU', nameTr: 'Rusya', nameEn: 'Russia', flag: '🇷🇺', aliases: ['rossiya', 'ru']},
  {code: 'CA', nameTr: 'Kanada', nameEn: 'Canada', flag: '🇨🇦', aliases: ['ca']},
  {code: 'AU', nameTr: 'Avustralya', nameEn: 'Australia', flag: '🇦🇺', aliases: ['au']},
  {code: 'SE', nameTr: 'İsveç', nameEn: 'Sweden', flag: '🇸🇪', aliases: ['sverige', 'se']},
  {code: 'NO', nameTr: 'Norveç', nameEn: 'Norway', flag: '🇳🇴', aliases: ['norge', 'no']},
  {code: 'DK', nameTr: 'Danimarka', nameEn: 'Denmark', flag: '🇩🇰', aliases: ['danmark', 'dk']},
  {code: 'FI', nameTr: 'Finlandiya', nameEn: 'Finland', flag: '🇫🇮', aliases: ['suomi', 'fi']},
  {code: 'PL', nameTr: 'Polonya', nameEn: 'Poland', flag: '🇵🇱', aliases: ['polska', 'pl']},
  {code: 'GR', nameTr: 'Yunanistan', nameEn: 'Greece', flag: '🇬🇷', aliases: ['hellas', 'gr']},
  {code: 'PT', nameTr: 'Portekiz', nameEn: 'Portugal', flag: '🇵🇹', aliases: ['pt']},
  {code: 'IE', nameTr: 'İrlanda', nameEn: 'Ireland', flag: '🇮🇪', aliases: ['eire', 'ie']},
  {
    code: 'CZ',
    nameTr: 'Çekya',
    nameEn: 'Czech Republic',
    flag: '🇨🇿',
    aliases: ['çek cumhuriyeti', 'czechia', 'cz'],
  },
  {code: 'RO', nameTr: 'Romanya', nameEn: 'Romania', flag: '🇷🇴', aliases: ['ro']},
  {code: 'BG', nameTr: 'Bulgaristan', nameEn: 'Bulgaria', flag: '🇧🇬', aliases: ['bg']},
  {code: 'HU', nameTr: 'Macaristan', nameEn: 'Hungary', flag: '🇭🇺', aliases: ['magyar', 'hu']},
  {code: 'HR', nameTr: 'Hırvatistan', nameEn: 'Croatia', flag: '🇭🇷', aliases: ['hrvatska', 'hr']},
  {code: 'RS', nameTr: 'Sırbistan', nameEn: 'Serbia', flag: '🇷🇸', aliases: ['rs']},
  {
    code: 'BA',
    nameTr: 'Bosna-Hersek',
    nameEn: 'Bosnia and Herzegovina',
    flag: '🇧🇦',
    aliases: ['bosna', 'ba'],
  },
  {code: 'AL', nameTr: 'Arnavutluk', nameEn: 'Albania', flag: '🇦🇱', aliases: ['al']},
  {
    code: 'MK',
    nameTr: 'Kuzey Makedonya',
    nameEn: 'North Macedonia',
    flag: '🇲🇰',
    aliases: ['makedonya', 'mk'],
  },
  {code: 'ME', nameTr: 'Karadağ', nameEn: 'Montenegro', flag: '🇲🇪', aliases: ['me']},
  {code: 'XK', nameTr: 'Kosova', nameEn: 'Kosovo', flag: '🇽🇰', aliases: ['xk']},
  {code: 'UA', nameTr: 'Ukrayna', nameEn: 'Ukraine', flag: '🇺🇦', aliases: ['ua']},
  {code: 'GE', nameTr: 'Gürcistan', nameEn: 'Georgia', flag: '🇬🇪', aliases: ['ge']},
  {code: 'KZ', nameTr: 'Kazakistan', nameEn: 'Kazakhstan', flag: '🇰🇿', aliases: ['kz']},
  {code: 'UZ', nameTr: 'Özbekistan', nameEn: 'Uzbekistan', flag: '🇺🇿', aliases: ['uz']},
  {code: 'TM', nameTr: 'Türkmenistan', nameEn: 'Turkmenistan', flag: '🇹🇲', aliases: ['tm']},
  {code: 'KG', nameTr: 'Kırgızistan', nameEn: 'Kyrgyzstan', flag: '🇰🇬', aliases: ['kg']},
  {code: 'JP', nameTr: 'Japonya', nameEn: 'Japan', flag: '🇯🇵', aliases: ['nippon', 'nihon', 'jp']},
  {code: 'CN', nameTr: 'Çin', nameEn: 'China', flag: '🇨🇳', aliases: ['cn']},
  {code: 'KR', nameTr: 'Güney Kore', nameEn: 'South Korea', flag: '🇰🇷', aliases: ['korea', 'kr']},
  {code: 'IN', nameTr: 'Hindistan', nameEn: 'India', flag: '🇮🇳', aliases: ['bharat', 'in']},
  {code: 'SG', nameTr: 'Singapur', nameEn: 'Singapore', flag: '🇸🇬', aliases: ['sg']},
  {code: 'MY', nameTr: 'Malezya', nameEn: 'Malaysia', flag: '🇲🇾', aliases: ['my']},
  {code: 'ID', nameTr: 'Endonezya', nameEn: 'Indonesia', flag: '🇮🇩', aliases: ['id']},
  {code: 'TH', nameTr: 'Tayland', nameEn: 'Thailand', flag: '🇹🇭', aliases: ['th']},
  {code: 'VN', nameTr: 'Vietnam', nameEn: 'Vietnam', flag: '🇻🇳', aliases: ['vn']},
  {code: 'PH', nameTr: 'Filipinler', nameEn: 'Philippines', flag: '🇵🇭', aliases: ['ph']},
  {code: 'BR', nameTr: 'Brezilya', nameEn: 'Brazil', flag: '🇧🇷', aliases: ['brasil', 'br']},
  {code: 'MX', nameTr: 'Meksika', nameEn: 'Mexico', flag: '🇲🇽', aliases: ['mx']},
  {code: 'AR', nameTr: 'Arjantin', nameEn: 'Argentina', flag: '🇦🇷', aliases: ['ar']},
  {code: 'CL', nameTr: 'Şili', nameEn: 'Chile', flag: '🇨🇱', aliases: ['cl']},
  {code: 'CO', nameTr: 'Kolombiya', nameEn: 'Colombia', flag: '🇨🇴', aliases: ['co']},
  {code: 'EG', nameTr: 'Mısır', nameEn: 'Egypt', flag: '🇪🇬', aliases: ['eg']},
  {code: 'MA', nameTr: 'Fas', nameEn: 'Morocco', flag: '🇲🇦', aliases: ['maroc', 'ma']},
  {code: 'TN', nameTr: 'Tunus', nameEn: 'Tunisia', flag: '🇹🇳', aliases: ['tn']},
  {code: 'DZ', nameTr: 'Cezayir', nameEn: 'Algeria', flag: 'DZ', aliases: ['dz']},
  {code: 'ZA', nameTr: 'Güney Afrika', nameEn: 'South Africa', flag: '🇿🇦', aliases: ['za']},
  {code: 'IL', nameTr: 'İsrail', nameEn: 'Israel', flag: '🇮🇱', aliases: ['il']},
  {code: 'LB', nameTr: 'Lübnan', nameEn: 'Lebanon', flag: '🇱🇧', aliases: ['lb']},
  {code: 'JO', nameTr: 'Ürdün', nameEn: 'Jordan', flag: '🇯🇴', aliases: ['jo']},
  {code: 'OM', nameTr: 'Umman', nameEn: 'Oman', flag: '🇴🇲', aliases: ['om']},
  {code: 'BH', nameTr: 'Bahreyn', nameEn: 'Bahrain', flag: '🇧🇭', aliases: ['bh']},
  {code: 'IQ', nameTr: 'Irak', nameEn: 'Iraq', flag: '🇮🇶', aliases: ['iq']},
  {code: 'NZ', nameTr: 'Yeni Zelanda', nameEn: 'New Zealand', flag: '🇳🇿', aliases: ['nz']},
  {code: 'LU', nameTr: 'Lüksemburg', nameEn: 'Luxembourg', flag: '🇱🇺', aliases: ['lu']},
  {code: 'MC', nameTr: 'Monako', nameEn: 'Monaco', flag: '🇲🇨', aliases: ['mc']},
  {code: 'MT', nameTr: 'Malta', nameEn: 'Malta', flag: '🇲🇹', aliases: ['mt']},
  {code: 'IS', nameTr: 'İzlanda', nameEn: 'Iceland', flag: '🇮🇸', aliases: ['is']},
  {code: 'SK', nameTr: 'Slovakya', nameEn: 'Slovakia', flag: '🇸🇰', aliases: ['sk']},
  {code: 'SI', nameTr: 'Slovenya', nameEn: 'Slovenia', flag: '🇸🇮', aliases: ['si']},
  {code: 'EE', nameTr: 'Estonya', nameEn: 'Estonia', flag: '🇪🇪', aliases: ['ee']},
  {code: 'LV', nameTr: 'Letonya', nameEn: 'Latvia', flag: '🇱🇻', aliases: ['lv']},
  {code: 'LT', nameTr: 'Litvanya', nameEn: 'Lithuania', flag: '🇱🇹', aliases: ['lt']},
  {code: 'MD', nameTr: 'Moldova', nameEn: 'Moldova', flag: '🇲🇩', aliases: ['md']},
  {code: 'BY', nameTr: 'Belarus', nameEn: 'Belarus', flag: '🇧🇾', aliases: ['beyaz rusya', 'by']},
  {code: 'AM', nameTr: 'Ermenistan', nameEn: 'Armenia', flag: '🇦🇲', aliases: ['am']},
  {code: 'PK', nameTr: 'Pakistan', nameEn: 'Pakistan', flag: '🇵🇰', aliases: ['pk']},
  {code: 'BD', nameTr: 'Bangladeş', nameEn: 'Bangladesh', flag: '🇧🇩', aliases: ['bd']},
  {code: 'PE', nameTr: 'Peru', nameEn: 'Peru', flag: '🇵🇪', aliases: ['pe']},
  {code: 'UY', nameTr: 'Uruguay', nameEn: 'Uruguay', flag: '🇺🇾', aliases: ['uy']},
  {code: 'EC', nameTr: 'Ekvador', nameEn: 'Ecuador', flag: '🇪🇨', aliases: ['ec']},
  {code: 'VE', nameTr: 'Venezuela', nameEn: 'Venezuela', flag: '🇻🇪', aliases: ['ve']},
  {code: 'CR', nameTr: 'Kosta Rika', nameEn: 'Costa Rica', flag: '🇨🇷', aliases: ['cr']},
  {code: 'PA', nameTr: 'Panama', nameEn: 'Panama', flag: '🇵🇦', aliases: ['pa']},
  {code: 'NG', nameTr: 'Nijerya', nameEn: 'Nigeria', flag: '🇳🇬', aliases: ['ng']},
  {code: 'KE', nameTr: 'Kenya', nameEn: 'Kenya', flag: '🇰🇪', aliases: ['ke']},
  {code: 'GH', nameTr: 'Gana', nameEn: 'Ghana', flag: '🇬🇭', aliases: ['gh']},
  {code: 'SN', nameTr: 'Senegal', nameEn: 'Senegal', flag: '🇸🇳', aliases: ['sn']},
  {code: 'ET', nameTr: 'Etiyopya', nameEn: 'Ethiopia', flag: '🇪🇹', aliases: ['et']},
]

/**
 * Normalizes a string for diacritic-insensitive and case-insensitive search
 * supports both Turkish (i/İ/ı/I, ç, ğ, ö, ş, ü) and Latin characters.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return ''
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim()
}

/**
 * Filters and ranks countries based on search term and active locale.
 * When query is empty, returns Turkey first, followed by alphabetical ordering.
 */
export function searchCountries(query: string, locale: string = 'tr'): Country[] {
  const normQuery = normalizeSearchText(query)
  const isTr = locale.toLowerCase().startsWith('tr')

  if (!normQuery) {
    // Sort all countries alphabetically based on current locale, keeping Turkey pinned at top
    const turkey = COUNTRIES.find(c => c.code === 'TR')
    const others = COUNTRIES.filter(c => c.code !== 'TR').sort((a, b) => {
      const nameA = isTr ? a.nameTr : a.nameEn
      const nameB = isTr ? b.nameTr : b.nameEn
      return nameA.localeCompare(nameB, isTr ? 'tr-TR' : 'en-US')
    })
    return turkey ? [turkey, ...others] : others
  }

  // Calculate match scores for ranking
  type ScoredCountry = {country: Country; score: number}
  const results: ScoredCountry[] = []

  for (const country of COUNTRIES) {
    const primaryName = isTr ? country.nameTr : country.nameEn
    const secondaryName = isTr ? country.nameEn : country.nameTr

    const normPrimary = normalizeSearchText(primaryName)
    const normSecondary = normalizeSearchText(secondaryName)
    const normCode = country.code.toLowerCase()

    let score = 0

    if (normPrimary === normQuery) {
      score = 100 // Exact primary match
    } else if (normSecondary === normQuery) {
      score = 90 // Exact secondary match
    } else if (normCode === normQuery) {
      score = 85 // Exact ISO code match
    } else if (normPrimary.startsWith(normQuery)) {
      score = 80 // Primary name starts with query
    } else if (normSecondary.startsWith(normQuery)) {
      score = 70 // Secondary name starts with query
    } else if (normPrimary.includes(` ${normQuery}`) || normPrimary.includes(normQuery)) {
      score = 60 // Primary contains query
    } else if (normSecondary.includes(` ${normQuery}`) || normSecondary.includes(normQuery)) {
      score = 50 // Secondary contains query
    } else if (country.aliases?.some(alias => normalizeSearchText(alias).startsWith(normQuery))) {
      score = 45 // Alias starts with query (e.g. 'abd' -> ABD, 'uk' -> Birleşik Krallık)
    } else if (country.aliases?.some(alias => normalizeSearchText(alias).includes(normQuery))) {
      score = 35 // Alias contains query
    }

    if (score > 0) {
      results.push({country, score})
    }
  }

  // Sort by score desc, then alphabetically
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    const nameA = isTr ? a.country.nameTr : a.country.nameEn
    const nameB = isTr ? b.country.nameTr : b.country.nameEn
    return nameA.localeCompare(nameB, isTr ? 'tr-TR' : 'en-US')
  })

  return results.map(r => r.country)
}

/**
 * Finds a matching country by exact or partial string
 */
export function findCountryByNameOrCode(text: string): Country | undefined {
  if (!text) return undefined
  const norm = normalizeSearchText(text)
  return COUNTRIES.find(
    c =>
      normalizeSearchText(c.nameTr) === norm ||
      normalizeSearchText(c.nameEn) === norm ||
      c.code.toLowerCase() === norm ||
      c.aliases?.some(a => normalizeSearchText(a) === norm)
  )
}
