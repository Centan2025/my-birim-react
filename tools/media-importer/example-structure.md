# Örnek Klasör Yapısı

Test etmek için bu yapıyı kullanabilirsiniz:

```
test-media/
├── ürünler/
│   ├── 01 - KANEPELER/
│   │   ├── 01 - 0203 - SU/
│   │   │   ├── su_kapak.jpg
│   │   │   ├── su_kapak_mobil.jpg
│   │   │   ├── su_detay_1.jpg
│   │   │   ├── su_detay_2.jpg
│   │   │   └── su_detay_3.jpg
│   │   ├── 16 - 0175 - RICH/
│   │   │   ├── rich_kapak.jpg
│   │   │   ├── rich_kapak_mobil.jpg
│   │   │   └── rich_detay.jpg
│   │   └── BRISTOL/
│   │       ├── bristol_kapak.jpg
│   │       └── bristol_1.jpg
│   ├── 08 - RAF SİSTEMLERİ/
│   │   ├── MODERN/
│   │   │   ├── modern_kapak.jpg
│   │   │   └── modern_detay.jpg
│   │   └── KLASIK/
│   │       └── klasik_kapak.png
│   └── 03 - SANDALYELER/
│       └── 05 - COMFORT/
│           ├── comfort_kapak.jpg
│           └── comfort_yan.jpg
└── tasarımcılar/
    ├── Ahmet Yılmaz/
    │   ├── ahmet.jpg
    │   └── ahmet_mobil.jpg
    ├── Ayşe Demir/
    │   └── ayse.jpg
    └── Mehmet Kaya/
        └── mehmet.png
```

## Bu Yapı İçin Beklenen Sonuç

### Kategoriler (3 adet)
1. **KANEPELER** (ID: `kanepeler`)
   - SU (3 model)
   - RICH
   - BRISTOL

2. **RAF SİSTEMLERİ** (ID: `raf-sistemleri`)
   - MODERN
   - KLASIK

3. **SANDALYELER** (ID: `sandalyeler`)
   - COMFORT

### Tasarımcılar (3 adet)
1. **Ahmet Yılmaz** (ID: `ahmet-yilmaz`)
   - Genel görsel: ✓
   - Mobil görsel: ✓

2. **Ayşe Demir** (ID: `ayse-demir`)
   - Genel görsel: ✓
   - Mobil görsel: ✗

3. **Mehmet Kaya** (ID: `mehmet-kaya`)
   - Genel görsel: ✓
   - Mobil görsel: ✗

## Test Komutu

```bash
# Test klasörünü oluşturun ve içine örnek görseller ekleyin
mkdir -p test-media/ürünler/"01 - KANEPELER"/"01 - 0203 - SU"
mkdir -p test-media/tasarımcılar/"Ahmet Yılmaz"

# Sonra aracı test edin
npm run import -- --source "./test-media" --mode json --output "./test-output"
```

## Beklenen Çıktılar

### Console Çıktısı
```
🔍 Medya klasörü taranmaya başlanıyor...
   Kaynak: ./test-media

📂 Ürünler klasörü taranıyor: ./test-media/ürünler
   Bulunan kategori sayısı: 3

   📁 Kategori: KANEPELER (01 - KANEPELER)
      Bulunan model sayısı: 3
      ✓ SU: 5 görsel
      ✓ RICH: 3 görsel
      ✓ BRISTOL: 2 görsel

   📁 Kategori: RAF SİSTEMLERİ (08 - RAF SİSTEMLERİ)
      Bulunan model sayısı: 2
      ✓ MODERN: 2 görsel
      ✓ KLASIK: 1 görsel

   📁 Kategori: SANDALYELER (03 - SANDALYELER)
      Bulunan model sayısı: 1
      ✓ COMFORT: 2 görsel

📂 Tasarımcılar klasörü taranıyor: ./test-media/tasarımcılar
   Bulunan tasarımcı sayısı: 3
   ✓ Ahmet Yılmaz: 2 görsel
   ✓ Ayşe Demir: 1 görsel
   ✓ Mehmet Kaya: 1 görsel

============================================================
📊 TARAMA ÖZETİ
============================================================
✓ Toplam Ürün: 6
✓ Toplam Tasarımcı: 3
⚠ Uyarı: 0
❌ Hata: 0
============================================================

💾 JSON dosyaları oluşturuluyor...
   Çıktı dizini: ./test-output

   ✓ KANEPELER/SU
   ✓ KANEPELER/RICH
   ✓ KANEPELER/BRISTOL
   ✓ RAF SİSTEMLERİ/MODERN
   ✓ RAF SİSTEMLERİ/KLASIK
   ✓ SANDALYELER/COMFORT
   ✓ Ahmet Yılmaz
   ✓ Ayşe Demir
   ✓ Mehmet Kaya

✅ JSON dışa aktarma tamamlandı!

✨ İşlem tamamlandı!
```

### Oluşturulan Dosyalar

```
test-output/
├── products/
│   ├── kanepeler/
│   │   ├── su/
│   │   │   └── metadata.json
│   │   ├── rich/
│   │   │   └── metadata.json
│   │   └── bristol/
│   │       └── metadata.json
│   ├── raf-sistemleri/
│   │   ├── modern/
│   │   │   └── metadata.json
│   │   └── klasik/
│   │       └── metadata.json
│   └── sandalyeler/
│       └── comfort/
│           └── metadata.json
└── designers/
    ├── ahmet-yilmaz.json
    ├── ayse-demir.json
    └── mehmet-kaya.json
```

