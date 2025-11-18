# Hızlı Başlangıç: Statik Ürün Dosyaları

## 🎯 Amaç

CMS'e yüklemek yerine ürün bilgilerini statik dosyalarda tutmak.

## 📁 Oluşturulan Yapı

```
data/products/
├── README.md                    # Detaylı açıklamalar
├── MIGRATION_GUIDE.md          # CMS'den geçiş kılavuzu
├── STRUCTURE_COMPARISON.md     # Yaklaşım karşılaştırması
├── QUICK_START.md              # Bu dosya
├── bristol-sofa/
│   ├── metadata.json           # JSON formatında ürün verisi
│   └── metadata.ts             # TypeScript formatında ürün verisi
└── index.ts                     # Tüm ürünleri export eden dosya
```

## 🚀 Kullanım

### Seçenek 1: Klasör Tabanlı (Önerilen)

Her ürün için ayrı klasör:

1. `data/products/{urun-id}/` klasörü oluştur
2. `metadata.json` dosyası ekle
3. Görselleri `public/products/{urun-id}/images/` altına koy

### Seçenek 2: Tek Dosya

1. `data/products/{urun-id}.json` dosyası oluştur
2. `data/products/index.ts` dosyasına ekle

## ⚙️ Entegrasyon

### Adım 1: Environment Variable Ekle

`.env` dosyasına ekle:
```
VITE_USE_STATIC_PRODUCTS=true
```

### Adım 2: services/cms.ts'i Güncelle

`services/cms.example.ts` dosyasındaki örnek kodu `services/cms.ts`'e ekle.

### Adım 3: Test Et

```typescript
import { loadProductsFromFiles } from './services/productsLoader';

const products = await loadProductsFromFiles();
console.log('Yüklenen ürünler:', products);
```

## 📝 Örnek Ürün Ekleme

### JSON Formatında:

```json
{
  "id": "yeni-urun",
  "name": {
    "tr": "Yeni Ürün",
    "en": "New Product"
  },
  "designerId": "jean-marie-massaud",
  "categoryId": "kanepeler",
  "year": 2024,
  "description": {
    "tr": "Açıklama...",
    "en": "Description..."
  },
  "mainImage": {
    "url": "/products/yeni-urun/images/main.jpg"
  },
  "buyable": true,
  "price": 100000,
  "currency": "TRY"
}
```

### TypeScript Formatında:

```typescript
import type { Product } from '../../types';

const yeniUrun: Product = {
  id: 'yeni-urun',
  name: {
    tr: 'Yeni Ürün',
    en: 'New Product',
  },
  // ...
};

export default yeniUrun;
```

## 🔄 CMS'den Geçiş

1. `MIGRATION_GUIDE.md` dosyasını oku
2. CMS'den ürünleri export et
3. `data/products/` altına yerleştir
4. `VITE_USE_STATIC_PRODUCTS=true` yap
5. Test et

## ✅ Avantajlar

- ✅ Hızlı yükleme
- ✅ Git ile versiyon kontrolü
- ✅ CMS maliyeti yok
- ✅ Offline çalışma
- ✅ Kolay yedekleme

## ⚠️ Dikkat Edilmesi Gerekenler

- Görselleri `public/` altına koyun
- Büyük dosyalar build süresini artırabilir
- Manuel güncelleme gerektirir


