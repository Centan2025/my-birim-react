# 🎨 Medya İçe Aktarma Aracı - Hızlı Başlangıç

Bu araç, ürün ve tasarımcı görsellerinizi klasör yapısından otomatik olarak okur ve web siteniz için hazırlar.

## 🚀 Hızlı Başlangıç

### 1. Klasör Yapınızı Hazırlayın

Görsellerinizi şu şekilde düzenleyin:

```
F:\Medya\                           (veya istediğiniz herhangi bir klasör)
├── ürünler\
│   ├── 01 - KANEPELER\
│   │   ├── 01 - 0203 - SU\
│   │   │   ├── su_kapak.jpg              ← Ana görsel (zorunlu)
│   │   │   ├── su_kapak_mobil.jpg        ← Mobil görsel (opsiyonel)
│   │   │   ├── su_detay_1.jpg            ← Diğer görseller
│   │   │   └── su_detay_2.jpg
│   │   └── 16 - 0175 - RICH\
│   │       ├── rich_kapak.jpg
│   │       └── rich_detay.jpg
│   └── 08 - RAF SİSTEMLERİ\
│       └── MODERN\
│           ├── modern_kapak.jpg
│           └── modern_detay.jpg
└── tasarımcılar\
    ├── Ahmet Yılmaz\
    │   ├── ahmet.jpg                     ← Genel görsel
    │   └── ahmet_mobil.jpg               ← Mobil görsel (opsiyonel)
    └── Ayşe Demir\
        └── ayse.jpg
```

### 2. Aracı Çalıştırın

Proje ana dizininde:

```bash
npm run import-media -- --source "F:\Medya" --mode json
```

Veya tools klasörüne gidip:

```bash
cd tools/media-importer
npm install
npm run import -- --source "F:\Medya" --mode json
```

### 3. Sonuçları Kontrol Edin

Araç çalıştıktan sonra `data/` klasöründe şu yapı oluşur:

```
data/
├── products/
│   ├── kanepeler/
│   │   ├── su/
│   │   │   └── metadata.json
│   │   └── rich/
│   │       └── metadata.json
│   └── raf-sistemleri/
│       └── modern/
│           └── metadata.json
└── designers/
    ├── ahmet-yilmaz.json
    └── ayse-demir.json
```

## 📋 Önemli Kurallar

### ✅ Kategori Klasör İsimleri

| Klasör Adı | Çıkan Kategori | Slug (ID) |
|------------|----------------|-----------|
| `01 - KANEPELER` | KANEPELER | kanepeler |
| `08 - RAF SİSTEMLERİ` | RAF SİSTEMLERİ | raf-sistemleri |
| `SANDALYELER` | SANDALYELER | sandalyeler |

### ✅ Model Klasör İsimleri

| Klasör Adı | Çıkan Model | Slug (ID) |
|-----------|-------------|-----------|
| `01 - 0203 - SU` | SU | su |
| `16 - 0175 - RICH` | RICH | rich |
| `MODERN` | MODERN | modern |

### ✅ Görsel İsimlendirme

#### Ürün Görselleri:
- `xxx_kapak.jpg` → **Ana kapak görseli** (zorunlu, web'de büyük gösterilir)
- `xxx_kapak_mobil.jpg` → **Mobil kapak** (opsiyonel, mobilde gösterilir)
- `xxx_1.jpg`, `xxx_detay.jpg` → **Alternatif görseller** (galeri)

#### Tasarımcı Görselleri:
- `profil.jpg` → **Genel profil** (tüm cihazlarda)
- `profil_mobil.jpg` → **Mobil profil** (opsiyonel)

## 🎯 Kullanım Senaryoları

### Senaryo 1: Temel Kullanım
Sadece görselleri JSON'a dönüştür:
```bash
npm run import-media -- --source "F:\Medya" --mode json
```

### Senaryo 2: Özel Çıktı Klasörü
Farklı bir klasöre kaydet:
```bash
npm run import-media -- --source "F:\Medya" --mode json --output "./export"
```

### Senaryo 3: Test Klasörüyle Deneme
Önce küçük bir test klasörü oluşturup deneyin:
```bash
npm run import-media -- --source "./test-media" --mode json --output "./test-output"
```

## 📊 Çıktı Örnekleri

### Ürün Metadata Örneği (`data/products/kanepeler/su/metadata.json`)

```json
{
  "id": "kanepeler-su",
  "name": {
    "tr": "SU",
    "en": "SU"
  },
  "categoryId": "kanepeler",
  "designerId": "unknown",
  "year": 2025,
  "description": {
    "tr": "SU modeli hakkında açıklama",
    "en": "Description for SU"
  },
  "mainImage": {
    "url": "./images/su_kapak.jpg",
    "urlMobile": "./images/su_kapak_mobil.jpg"
  },
  "alternativeImages": [
    "./images/su_detay_1.jpg",
    "./images/su_detay_2.jpg"
  ],
  "buyable": false,
  "price": 0,
  "currency": "TRY",
  "materials": [],
  "exclusiveContent": {
    "images": [],
    "drawings": [],
    "models3d": []
  }
}
```

### Tasarımcı Metadata Örneği (`data/designers/ahmet-yilmaz.json`)

```json
{
  "id": "ahmet-yilmaz",
  "name": {
    "tr": "Ahmet Yılmaz",
    "en": "Ahmet Yılmaz"
  },
  "bio": {
    "tr": "Ahmet Yılmaz hakkında bilgi",
    "en": "About Ahmet Yılmaz"
  },
  "image": "F:/Medya/tasarımcılar/Ahmet Yılmaz/ahmet.jpg",
  "imageMobile": "F:/Medya/tasarımcılar/Ahmet Yılmaz/ahmet_mobil.jpg"
}
```

## ⚠️ Sık Karşılaşılan Sorunlar

### Sorun: "Klasör bulunamadı"
**Çözüm:** Yolu tırnak içinde ve ters slash (\\) veya düz slash (/) kullanarak yazın:
```bash
npm run import-media -- --source "F:\Medya" --mode json
# veya
npm run import-media -- --source "F:/Medya" --mode json
```

### Sorun: "Ana kapak görseli bulunamadı" uyarısı
**Çözüm:** En az bir görselin adının sonuna `_kapak` ekleyin:
```
su_kapak.jpg  ← Doğru
su.jpg        ← Kapak olarak işaretlenmez
```

### Sorun: "Görsel bulunamadı"
**Çözüm:** Desteklenen formatları kullanın: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`

### Sorun: Türkçe karakterler düzgün çalışmıyor
**Çözüm:** Klasör ve dosya isimlerinde Türkçe karakter kullanabilirsiniz. Araç otomatik olarak ID'lere çevirir:
- `KANEPELER` → `kanepeler`
- `RAF SİSTEMLERİ` → `raf-sistemleri`

## 🎨 Öneriler

1. **Görsel boyutları**: Ana kapak görselleri en az 1920x1080 olmalı
2. **Mobil görseller**: Mobil için dikey/kare kırpılmış versiyonlar ekleyin
3. **Dosya isimleri**: Kısa ve açıklayıcı isimler kullanın
4. **Organizasyon**: Her model için ayrı klasör kullanın

## 📞 Destek

Sorun yaşarsanız veya öneriniz varsa:
- README.md dosyasını okuyun
- Örnek klasör yapısını kontrol edin
- Console çıktısındaki uyarıları inceleyin

## ✨ Sonraki Adımlar

### Sanity CMS'e Direkt Yükleme

Görselleri ve verileri direkt Sanity CMS'e yüklemek için:

```bash
# Önce Sanity token'ınızı ayarlayın ve sonra çalıştırın
SANITY_TOKEN=your_token npm run import -- --source "F:\Medya" --mode sanity
```

**Windows PowerShell:**
```powershell
$env:SANITY_TOKEN="your_token"; npm run import -- --source "F:\Medya" --mode sanity
```

**Windows CMD:**
```cmd
set SANITY_TOKEN=your_token && npm run import -- --source "F:\Medya" --mode sanity
```

**Sanity Token Nasıl Alınır:**
1. https://sanity.io/manage → Projeniz (wn3a082f)
2. API sekmesi → "Add API token"
3. **"Editor" veya "Admin" yetkisi seçin**
4. Token'ı kopyalayın

**Ne Yapar:**
- ✅ Görselleri Sanity asset'lere yükler
- ✅ Kategorileri oluşturur
- ✅ Tasarımcıları oluşturur
- ✅ Ürünleri kategori referanslarıyla oluşturur

Detaylı bilgi: `SANITY_KULLANIM.md`

---

## JSON Modundan Sonra

JSON dosyaları oluşturulduktan sonra:
1. `metadata.json` dosyalarını düzenleyin (açıklama, fiyat, vs.)
2. `designerId` alanlarını doğru tasarımcı ID'leriyle güncelleyin
3. Görselleri web sitenizin `public/images/` klasörüne kopyalayın

---

**Not:** Bu araç, mevcut verilerinizin üzerine yazmaz. Güvenle test edebilirsiniz.

