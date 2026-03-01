# Katkıda Bulunma Rehberi

Birim Web projesine katkıda bulunmak istediğiniz için teşekkürler! Bu doküman, projeye nasıl katkıda bulunabileceğinizi açıklar.

## 🚀 Başlangıç

### Gereksinimler

- Node.js 20.x veya üzeri
- npm veya yarn
- Git

### Kurulum

1. Repository'yi fork edin
2. Fork'unuzu klonlayın:
   ```bash
   git clone https://github.com/yourusername/birim-web.git
   cd birim-web
   ```
3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
4. Environment variables oluşturun:
   ```bash
   # .env dosyası oluşturun ve gerekli değişkenleri ekleyin
   # Detaylar için README.md'ye bakın
   ```
5. Development server'ı başlatın:
   ```bash
   npm run dev
   ```

## 📝 Kod Standartları

### TypeScript

- TypeScript strict mode kullanılıyor
- Tüm dosyalar `.ts` veya `.tsx` uzantılı olmalı
- `any` tipi kullanmaktan kaçının
- Gerekli yerlerde type tanımlamaları yapın

### Code Style

- **ESLint**: Kod kalitesi için ESLint kullanılıyor
- **Prettier**: Kod formatı için Prettier kullanılıyor
- Pre-commit hook'ları otomatik olarak lint ve format kontrolü yapar

### Format Kontrolü

```bash
# Format kontrolü
npm run format:check

# Format düzeltme
npm run format
```

### Lint Kontrolü

```bash
# Lint kontrolü
npm run lint
```

## 🔀 Pull Request Süreci

### 1. Branch Oluşturma

- `main` branch'inden yeni bir branch oluşturun:
  ```bash
  git checkout -b feature/your-feature-name
  # veya
  git checkout -b fix/your-bug-fix
  ```

### 2. Değişikliklerinizi Yapın

- Kodunuzu yazın
- Testlerinizi ekleyin (mümkünse)
- Lint ve format kontrollerini çalıştırın

### 3. Commit Mesajları

Açıklayıcı commit mesajları yazın:

```
feat: Yeni özellik eklendi
fix: Bug düzeltildi
docs: Dokümantasyon güncellendi
style: Kod formatı düzeltildi
refactor: Kod yeniden düzenlendi
test: Test eklendi
chore: Build/config değişiklikleri
```

### 4. Push ve PR Oluşturma

```bash
git push origin feature/your-feature-name
```

GitHub'da Pull Request oluşturun ve şunları ekleyin:

- Değişikliklerin açıklaması
- İlgili issue numarası (varsa)
- Screenshot'lar (UI değişiklikleri için)

### 5. Code Review

- PR'ınız review edilecek
- Gerekli değişiklikler yapılacak
- Onaylandıktan sonra merge edilecek

## 🧪 Testler

### Test Yazma

- Yeni özellikler için test yazın
- Kritik fonksiyonlar için test ekleyin
- Test coverage'ı artırmaya çalışın

### Test Çalıştırma

```bash
# Tüm testler
npm run test

# Test UI
npm run test:ui

# Coverage raporu
npm run test:coverage
```

## 📁 Proje Yapısı

```
birim-web/
├── components/          # Reusable component'ler
├── pages/              # Sayfa component'leri
├── services/           # API servisleri
├── src/
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utility fonksiyonlar
│   └── queries/       # React Query queries
├── i18n/              # Internationalization
├── public/             # Static dosyalar
└── scripts/            # Build script'leri
```

## 🎨 Component Geliştirme

### Component Yapısı

```typescript
import React from 'react'

interface ComponentProps {
  // Props tanımlamaları
}

/**
 * Component açıklaması
 */
export function Component({...props}: ComponentProps) {
  // Component logic
  return (
    // JSX
  )
}
```

### Best Practices

- Component'leri küçük ve odaklı tutun
- Props için TypeScript interface kullanın
- Reusable component'ler oluşturun
- Accessibility (a11y) standartlarına uyun

## 🌐 Internationalization (i18n)

- Tüm kullanıcıya görünen metinler i18n'e taşınmalı
- `useTranslation` hook'unu kullanın
- Yeni çeviriler için `i18n/locales/` klasöründeki dosyaları güncelleyin

## 🐛 Bug Raporlama

Bug bulduysanız:

1. Issue oluşturun
2. Açıklayıcı başlık ve açıklama ekleyin
3. Adımları, beklenen ve gerçek sonuçları belirtin
4. Screenshot veya video ekleyin (mümkünse)
5. Browser ve OS bilgisi ekleyin

## ✨ Feature İstekleri

Yeni özellik önerisi için:

1. Issue oluşturun
2. Özelliği detaylı açıklayın
3. Kullanım senaryolarını belirtin
4. Alternatif çözümleri düşünün

## 📚 Dokümantasyon

- Kod değişiklikleri için gerekli dokümantasyonu güncelleyin
- README.md'yi güncelleyin (gerekirse)
- JSDoc yorumları ekleyin (public API'ler için)

## 🤝 Davranış Kuralları

- Saygılı ve yapıcı olun
- Farklı görüşlere açık olun
- Yapıcı eleştiriler yapın
- Topluluğa katkıda bulunun

## ❓ Sorularınız mı var?

- Issue oluşturun
- Dokümantasyonu kontrol edin
- Mevcut PR'ları inceleyin

---

**Teşekkürler!** 🎉
