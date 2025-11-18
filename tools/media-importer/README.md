# Medya İçe Aktarma Aracı

Ürün ve tasarımcı görsellerini klasör yapısından otomatik olarak yükler ve JSON dosyaları oluşturur veya Sanity CMS'e aktarır.

## 📁 Beklenen Klasör Yapısı

```
Kaynak-Klasör/
├── ürünler/
│   └── <kategori>/          (örn: "01 - KANEPELER", "08 - RAF SİSTEMLERİ")
│       └── <model>/         (örn: "01 - 0203 - SU", "16 - 0175 - RICH", "RICH")
│           ├── görsel1.jpg
│           ├── görsel2_kapak.jpg         (Ana kapak görseli)
│           ├── görsel3_kapak_mobil.jpg   (Mobil kapak görseli)
│           └── görsel4.jpg
└── tasarımcılar/
    └── <tasarımcı-adı>/     (örn: "Ahmet Yılmaz")
        ├── profil.jpg                    (Tüm cihazlar için)
        └── profil_mobil.jpg              (Mobil için, opsiyonel)
```

## 🎯 Özellikler

### Ürünler
- ✅ Kategori adını klasör adından otomatik çıkarır (örn: "01 - KANEPELER" → "KANEPELER")
- ✅ Model adını klasör adından otomatik çıkarır (örn: "01 - 0203 - SU" → "SU")
- ✅ `_kapak` ile biten görselleri ana kapak görseli olarak işaretler
- ✅ `_kapak_mobil` ile biten görselleri mobil kapak görseli olarak işaretler
- ✅ Diğer tüm görselleri alternatif görseller olarak ekler

### Tasarımcılar
- ✅ Tasarımcı adını klasör adından alır
- ✅ `_mobil` ile biten görselleri mobil görsel olarak işaretler
- ✅ Tek görsel varsa tüm cihazlar için kullanır

## 🚀 Kurulum

1. Bağımlılıkları yükleyin:
```bash
cd tools/media-importer
npm install
```

## 📖 Kullanım

### JSON Dosyaları Oluşturma

```bash
npm run import -- --source "F:/Medya" --mode json
```

Özel çıktı klasörü belirtmek için:
```bash
npm run import -- --source "F:/Medya" --mode json --output "./export"
```

Bu komut şu yapıyı oluşturur:
```
data/
├── products/
│   └── kanepeler/
│       └── su/
│           └── metadata.json
└── designers/
    └── ahmet-yilmaz.json
```

### Sanity CMS'e Aktarma

```bash
# Token ile birlikte çalıştırın
SANITY_TOKEN=your_token npm run import -- --source "F:/Medya" --mode sanity
```

Bu komut:
1. Görselleri Sanity asset'lere yükler
2. Kategorileri oluşturur
3. Tasarımcıları oluşturur
4. Ürünleri kategori referanslarıyla oluşturur

**Önemli:** Token'ın "Editor" veya "Admin" yetkisi olmalıdır.

## ⚙️ Parametreler

| Parametre | Açıklama | Örnek |
|-----------|----------|-------|
| `--source` | Kaynak medya klasörü (zorunlu) | `"F:/Medya"` |
| `--mode` | Dışa aktarma modu: `json` veya `sanity` (zorunlu) | `json` |
| `--output` | JSON modu için çıktı klasörü (opsiyonel) | `"./export"` |

## 📝 Çıktı Formatı

### Ürün Metadata (metadata.json)

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
    "./images/su_1.jpg",
    "./images/su_2.jpg"
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

### Tasarımcı Metadata

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
  "image": "F:/Medya/tasarımcılar/Ahmet Yılmaz/profil.jpg",
  "imageMobile": "F:/Medya/tasarımcılar/Ahmet Yılmaz/profil_mobil.jpg"
}
```

## 🔍 İsimlendirme Kuralları

### Kategori Klasörleri
- ✅ `01 - KANEPELER` → Kategori: "KANEPELER", ID: "kanepeler"
- ✅ `08 - RAF SİSTEMLERİ` → Kategori: "RAF SİSTEMLERİ", ID: "raf-sistemleri"
- ✅ `SANDALYELER` → Kategori: "SANDALYELER", ID: "sandalyeler"

### Model Klasörleri
- ✅ `01 - 0203 - SU` → Model: "SU", ID: "su"
- ✅ `16 - 0175 - RICH` → Model: "RICH", ID: "rich"
- ✅ `RICH` → Model: "RICH", ID: "rich"

### Ürün Görselleri
- ✅ `su_kapak.jpg` → Ana kapak görseli (tüm cihazlar)
- ✅ `su_kapak_mobil.jpg` → Mobil kapak görseli
- ✅ `su_1.jpg`, `su_2.jpg` → Alternatif görseller

### Tasarımcı Görselleri
- ✅ `profil.jpg` → Tüm cihazlar için
- ✅ `profil_mobil.jpg` → Mobil için

## ⚠️ Uyarılar ve Hatalar

Araç çalışırken şu uyarıları verebilir:
- Model için görsel bulunamadı
- Ana kapak görseli (_kapak) bulunamadı
- Tasarımcı için görsel bulunamadı
- Klasör okunamadı

## 🛠️ Geliştirme

TypeScript ile yazılmıştır. Geliştirmek için:

```bash
# Kodu düzenleyin
npm run import -- --source "test-data" --mode json

# Derlemek için
npm run build
```

## 📄 Lisans

MIT

