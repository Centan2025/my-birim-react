# 🎨 Medya İçe Aktarma Aracı - Detaylı Kullanım Kılavuzu

Bu dokümantasyon, Sanity Studio'daki Medya İçe Aktarma aracının tüm özelliklerini ve kullanım detaylarını içermektedir.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Desteklenen Özellikler](#desteklenen-özellikler)
3. [Klasör Yapısı ve İsimlendirme](#klasör-yapısı-ve-isimlendirme)
4. [Kullanım Adımları](#kullanım-adımları)
5. [Detaylı İsimlendirme Kuralları](#detaylı-isimlendirme-kuralları)
6. [Art Direction (Cihaz Bazlı Görseller)](#art-direction-cihaz-bazlı-görseller)
7. [Hata Yönetimi](#hata-yönetimi)
8. [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## 🎯 Genel Bakış

Medya İçe Aktarma aracı, ürün, tasarımcı, proje, kategori ve malzeme görsellerinizi toplu olarak CMS'e yüklemek için kullanılır. Araç, klasör yapınızı otomatik olarak analiz eder ve görselleri doğru yerlere yerleştirir.

### ⚠️ ÖNEMLİ UYARI

**Bu araç sadece görselleri yükler!** Tasarımcılar, ürünler, projeler, kategoriler ve malzeme grupları CMS'de önceden oluşturulmuş olmalıdır.

### Kullanım Adımları

1. ✅ Önce CMS'de tasarımcı/ürün/proje/kategori/malzeme grubu/kartela oluşturun
2. ✅ Sonra bu araçla görsellerini yükleyin
3. ✅ Klasör yapınızın doğru formatta olduğundan emin olun

---

## ✨ Desteklenen Özellikler

### ✅ Tam Desteklenen Özellikler

- ✅ **Ürünler**
  - Ana kapak görseli (Tüm cihazlar, Mobil, Desktop)
  - Alternatif medya (Görsel ve Video, Mobil/Desktop versiyonları)
  - Ölçü görselleri (dimensionImages)
  - Alt medya panelleri (media)
  
- ✅ **Tasarımcılar**
  - Profil görseli (Tüm cihazlar, Mobil, Desktop)
  
- ✅ **Projeler**
  - Kapak görseli (Tüm cihazlar, Mobil, Desktop)
  - Medya (Görsel ve Video, Mobil/Desktop versiyonları)
  
- ✅ **Kategoriler**
  - Hero görseli (heroImage)
  - Menü görseli (menuImage)
  
- ✅ **Malzemeler**
  - Kartela görselleri

### 🔄 Eşitleme (Sync) Özelliği

Araç, klasörünüzdeki görsellerle CMS'deki görselleri eşitler:
- ✅ Klasörde olmayan CMS görsellerini siler
- ✅ CMS'de olmayan klasör görsellerini ekler
- ✅ Her ikisinde de olan görselleri korur (hash kontrolü ile)

---

## 📂 Klasör Yapısı ve İsimlendirme

### Genel Klasör Yapısı

```
Medya-Klasörü/
├── kategoriler/ (veya KATEGORİLER)
│   └── KANEPELER/
│       ├── hero.jpg          ← Hero görseli
│       └── menu.jpg          ← Menü görseli
├── ürünler/ (veya ÜRÜNLER)
│   └── 01 - KANEPELER/
│       └── 01 - 0203 - SU/
│           ├── su_kapak.jpg              ← Ana kapak
│           ├── su_kapak_mobil.jpg        ← Mobil kapak
│           ├── su_kapak_desktop.jpg      ← Desktop kapak
│           ├── su_1.jpg                   ← Alternatif görsel
│           ├── su_1_mobil.jpg             ← Mobil alternatif
│           ├── su_1_desktop.jpg          ← Desktop alternatif
│           ├── su_1.mp4                   ← Alternatif video
│           ├── su_panel_1.jpg             ← Alt medya paneli
│           └── su_panel_1_mobil.jpg      ← Mobil panel
│           └── ÖLÇÜLER/                  ← Ölçü görselleri klasörü
│               ├── olcu_1.jpg             ← Ölçü görseli
│               ├── olcu_1_mobil.jpg      ← Mobil ölçü
│               ├── olcu_1_desktop.jpg    ← Desktop ölçü
│               ├── olcu_2.jpg             ← İkinci ölçü görseli
│               └── olcu_2_mobil.jpg      ← İkinci mobil ölçü
├── tasarımcılar/ (veya TASARIMCILAR)
│   └── Ahmet Yılmaz/
│       ├── profil.jpg         ← Genel profil
│       ├── profil_mobil.jpg   ← Mobil profil
│       └── profil_desktop.jpg ← Desktop profil
├── projeler/ (veya PROJELER)
│   └── Proje Adı/
│       ├── proje_kapak.jpg          ← Kapak görseli
│       ├── proje_kapak_mobil.jpg    ← Mobil kapak
│       ├── proje_kapak_desktop.jpg  ← Desktop kapak
│       ├── proje_1.jpg               ← Medya
│       ├── proje_1_mobil.jpg        ← Mobil medya
│       ├── proje_1_desktop.jpg      ← Desktop medya
│       └── proje_1.mp4               ← Video medya
└── malzemeler/ (veya MALZEMELER)
    └── KUMAŞ/
        └── KARTELA-1/
            ├── malzeme1.jpg
            └── malzeme2.jpg
```

---

## 📝 Detaylı İsimlendirme Kuralları

### Ürünler İçin

#### Ana Kapak Görselleri

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{model}_kapak.jpg` | Ana kapak görseli (Tüm cihazlar) | `mainImage` |
| `{model}_kapak_mobil.jpg` | Mobil kapak görseli | `mainImageMobile` |
| `{model}_kapak_desktop.jpg` | Desktop kapak görseli | `mainImageDesktop` |

**Örnek:**
- `su_kapak.jpg` → Ana kapak
- `su_kapak_mobil.jpg` → Mobil kapak
- `su_kapak_desktop.jpg` → Desktop kapak

#### Alternatif Medya

Alternatif medya, ana görselin altındaki bantta gösterilir.

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{model}_1.jpg` | Alternatif görsel (Tüm cihazlar) | `alternativeMedia[].image` |
| `{model}_1_mobil.jpg` | Mobil alternatif görsel | `alternativeMedia[].imageMobile` |
| `{model}_1_desktop.jpg` | Desktop alternatif görsel | `alternativeMedia[].imageDesktop` |
| `{model}_1.mp4` | Alternatif video (Tüm cihazlar) | `alternativeMedia[].videoFile` |
| `{model}_1_mobil.mp4` | Mobil alternatif video | `alternativeMedia[].videoFileMobile` |
| `{model}_1_desktop.mp4` | Desktop alternatif video | `alternativeMedia[].videoFileDesktop` |

**Önemli:** `_kapak` ve `_panel` içermemeli! Ölçü görselleri ayrı bir klasörde olmalıdır (ÖLÇÜLER).

**Örnek:**
- `su_1.jpg`, `su_2.jpg`, `su_3.jpg` → Alternatif görseller
- `su_1.mp4`, `su_2.mp4` → Alternatif videolar

#### Ölçü Görselleri

Ölçü görselleri, ürün detay sayfasında malzemelerden önce gösterilir. **ÖLÇÜLER** klasörü içinde yer almalıdır.

**Klasör Yapısı:**
```
ürünler/
└── 01 - KANEPELER/
    └── 01 - 0203 - SU/
        └── ÖLÇÜLER/          ← Ölçü görselleri bu klasörde
            ├── olcu_1.jpg
            ├── olcu_1_mobil.jpg
            ├── olcu_1_desktop.jpg
            ├── olcu_2.jpg
            └── olcu_2_mobil.jpg
```

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `olcu_1.jpg` | Ölçü görseli (Tüm cihazlar) | `dimensionImages[].image` |
| `olcu_1_mobil.jpg` | Mobil ölçü görseli | `dimensionImages[].imageMobile` |
| `olcu_1_desktop.jpg` | Desktop ölçü görseli | `dimensionImages[].imageDesktop` |

**Önemli:**
- Ölçü görselleri **mutlaka ÖLÇÜLER klasörü içinde** olmalıdır
- Dosya adları numara içermelidir (olcu_1.jpg, 1.jpg, vs.)
- Numara bulunamazsa sıralı olarak işlenir

**Örnek:**
- `ÖLÇÜLER/olcu_1.jpg` → İlk ölçü görseli
- `ÖLÇÜLER/olcu_2.jpg` → İkinci ölçü görseli
- `ÖLÇÜLER/1.jpg` → İlk ölçü görseli (numara dosya adında)

#### Alt Medya Panelleri

Alt medya panelleri, sayfa altındaki medya bölümünde gösterilir.

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{model}_panel_1.jpg` | Alt medya paneli (Tüm cihazlar) | `media[].image` |
| `{model}_panel_1_mobil.jpg` | Mobil alt medya paneli | `media[].imageMobile` |
| `{model}_panel_1_desktop.jpg` | Desktop alt medya paneli | `media[].imageDesktop` |
| `{model}_panel_1.mp4` | Alt medya paneli video | `media[].videoFile` |
| `{model}_panel_1_mobil.mp4` | Mobil alt medya paneli video | `media[].videoFileMobile` |
| `{model}_panel_1_desktop.mp4` | Desktop alt medya paneli video | `media[].videoFileDesktop` |

**Örnek:**
- `su_panel_1.jpg` → İlk alt medya paneli
- `su_panel_2.jpg` → İkinci alt medya paneli

### Tasarımcılar İçin

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `profil.jpg` | Genel profil görseli | `image` |
| `profil_mobil.jpg` | Mobil profil görseli | `imageMobile` |
| `profil_desktop.jpg` | Desktop profil görseli | `imageDesktop` |

**Not:** Dosya adı `profil` olmak zorunda değil, herhangi bir isim kullanılabilir. `_mobil` ve `_desktop` etiketleri önemlidir.

**Örnek:**
- `ahmet_yilmaz.jpg` → Genel profil
- `ahmet_yilmaz_mobil.jpg` → Mobil profil
- `ahmet_yilmaz_desktop.jpg` → Desktop profil

### Projeler İçin

#### Kapak Görselleri

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{herhangi_isim}_kapak.jpg` | Kapak görseli (Tüm cihazlar) | `cover` |
| `{herhangi_isim}_kapak_mobil.jpg` | Mobil kapak görseli | `coverMobile` |
| `{herhangi_isim}_kapak_desktop.jpg` | Desktop kapak görseli | `coverDesktop` |

#### Medya

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{herhangi_isim}_1.jpg` | Medya görseli (Tüm cihazlar) | `media[].image` |
| `{herhangi_isim}_1_mobil.jpg` | Mobil medya görseli | `media[].imageMobile` |
| `{herhangi_isim}_1_desktop.jpg` | Desktop medya görseli | `media[].imageDesktop` |
| `{herhangi_isim}_1.mp4` | Medya video | `media[].videoFile` |
| `{herhangi_isim}_1_mobil.mp4` | Mobil medya video | `media[].videoFileMobile` |
| `{herhangi_isim}_1_desktop.mp4` | Desktop medya video | `media[].videoFileDesktop` |

**Önemli:** `_kapak` içermemeli!

### Kategoriler İçin

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `hero.jpg` veya `kapak.jpg` | Hero görseli | `heroImage` |
| `menu.jpg` veya `menü.jpg` | Menü görseli | `menuImage` |

**Not:** İlk görsel hero görseli olarak kullanılır. Menü görseli için dosya adında `menu` veya `menü` olmalı.

### Malzemeler İçin

| Dosya Adı | Açıklama | CMS Alanı |
|-----------|----------|-----------|
| `{herhangi_isim}.jpg` | Malzeme görseli | `materialGroup.books[].items[].image` |

**Not:** Dosya adı malzeme adı olarak kullanılır (uzantı hariç).

---

## 🎨 Art Direction (Cihaz Bazlı Görseller)

Araç, farklı cihazlar için özel görselleri destekler:

### Etiketler

- `_mobil` → Mobil cihazlar için özel görsel/video
- `_desktop` → Desktop cihazlar için özel görsel/video
- Etiket yok → Tüm cihazlar için varsayılan görsel/video

### Öncelik Sırası

1. **Mobil cihazlar:** `_mobil` varsa onu kullan, yoksa varsayılanı kullan
2. **Desktop cihazlar:** `_desktop` varsa onu kullan, yoksa varsayılanı kullan
3. **Diğer cihazlar:** Varsayılan görseli kullan

### Örnek Senaryo

```
su_kapak.jpg          → Tüm cihazlar için varsayılan
su_kapak_mobil.jpg    → Mobil için özel
su_kapak_desktop.jpg  → Desktop için özel
```

**Sonuç:**
- Mobil: `su_kapak_mobil.jpg` kullanılır
- Desktop: `su_kapak_desktop.jpg` kullanılır
- Tablet/Diğer: `su_kapak.jpg` kullanılır

---

## 🚀 Kullanım Adımları

### 1. Sanity Studio'yu Başlatın

```bash
cd birim-web
npm run dev
```

Tarayıcıda: http://localhost:3333

### 2. Medya İçe Aktar Aracını Açın

Sol üst menüden **"Medya İçe Aktar"** sekmesine tıklayın.

### 3. Klasör Yapınızı Hazırlayın

Yukarıdaki [Klasör Yapısı](#klasör-yapısı-ve-isimlendirme) bölümüne göre klasörlerinizi organize edin.

### 4. Yükleme Yapın

#### Yöntem 1: Sürükle-Bırak
1. Medya klasörünüzü masaüstünden alın
2. Sanity Studio'daki sürükle-bırak alanına bırakın
3. İşlem otomatik başlar

#### Yöntem 2: Klasör Seçimi
1. **"Klasör Seç"** butonuna tıklayın
2. Medya klasörünüzü seçin
3. İşlem otomatik başlar

### 5. İlerlemeyi Takip Edin

Arayüzde şunları göreceksiniz:
- 📊 Bulunan içerik sayıları (kategori, tasarımcı, ürün, görsel)
- ⏳ Her bir öğenin yükleme durumu
- ✅ Başarılı yüklemeler yeşil işaretle
- ❌ Hatalar kırmızı uyarıyla

---

## ⚠️ Hata Yönetimi

### Yaygın Hatalar ve Çözümleri

#### 1. "CMS'de bulunamadı" Hatası

**Sebep:** Tasarımcı/ürün/proje/kategori/malzeme grubu CMS'de yok.

**Çözüm:**
1. CMS'de ilgili kaydı oluşturun
2. İsimlerin eşleştiğinden emin olun (büyük/küçük harf duyarsız)
3. Tekrar deneyin

#### 2. "Klasör yapısı hatalı" Uyarısı

**Sebep:** Klasör yapısı beklenen formatta değil.

**Çözüm:**
- Klasör yapısını kontrol edin
- Dosya adlarının doğru formatta olduğundan emin olun
- [Detaylı İsimlendirme Kuralları](#detaylı-isimlendirme-kuralları) bölümüne bakın

#### 3. "Medya bulunamadı" Uyarısı

**Sebep:** Klasörlerde görsel veya video dosyası yok.

**Çözüm:**
- Desteklenen formatları kullanın:
  - **Görseller:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`
  - **Videolar:** `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`, `.m4v`

#### 4. "Hash eşleşti" Mesajı

**Sebep:** Görsel zaten CMS'de mevcut (aynı dosya).

**Çözüm:** Bu bir hata değil, görsel atlanır ve mevcut görsel korunur.

---

## ❓ Sık Sorulan Sorular

### S: Dosya adlarında Türkçe karakter kullanabilir miyim?

**C:** Evet! Dosya adlarında Türkçe karakter kullanabilirsiniz. Araç büyük/küçük harf duyarsız çalışır.

### S: Klasör adları büyük/küçük harf duyarlı mı?

**C:** Hayır, klasör adları büyük/küçük harf duyarsızdır. `ürünler`, `ÜRÜNLER`, `Ürünler` hepsi çalışır.

### S: Video dosyaları destekleniyor mu?

**C:** Evet! Desteklenen formatlar: `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`, `.m4v`

### S: Mobil/Desktop görselleri zorunlu mu?

**C:** Hayır, opsiyoneldir. Yoksa varsayılan görsel kullanılır.

### S: Ölçü görselleri zorunlu mu?

**C:** Hayır, opsiyoneldir. Ürün detay sayfasında gösterilmezse boş bırakılabilir.

### S: Ölçü görselleri nerede olmalı?

**C:** Ölçü görselleri **mutlaka ÖLÇÜLER klasörü içinde** olmalıdır. Klasör yapısı: `ürünler/kategori/model/ÖLÇÜLER/dosya.jpg`. Dosya adlarında numara bulunmalıdır (olcu_1.jpg, 1.jpg, vs.).

### S: Alt medya panelleri zorunlu mu?

**C:** Hayır, opsiyoneldir. Sayfa altındaki medya bölümünde gösterilmezse boş bırakılabilir.

### S: Klasörde olmayan CMS görselleri ne olur?

**C:** Eşitleme (sync) özelliği sayesinde, klasörde olmayan CMS görselleri otomatik olarak silinir.

### S: Aynı görseli birden fazla kez yükleyebilir miyim?

**C:** Hayır, araç hash kontrolü yapar. Aynı görsel zaten varsa atlanır.

### S: Toplu silme yapabilir miyim?

**C:** Evet, eşitleme özelliği sayesinde klasörde olmayan görseller otomatik silinir.

### S: İşlem sırasında hata olursa ne olur?

**C:** Hata olan öğeler atlanır, işlem devam eder. Tüm hatalar arayüzde gösterilir.

---

## 📊 Desteklenen Formatlar

### Görsel Formatları
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.avif`

### Video Formatları
- `.mp4`
- `.webm`
- `.mov`
- `.avi`
- `.mkv`
- `.m4v`

---

## 🔧 Teknik Detaylar

### Hash Kontrolü

Araç, dosyaları SHA-1 hash ile kontrol eder:
- Aynı hash'e sahip dosyalar atlanır
- Bu sayede gereksiz yüklemeler önlenir

### Eşitleme Mantığı

1. Klasördeki dosyalar hash'lenir
2. CMS'deki mevcut görseller hash'lenir
3. Eşleşenler korunur
4. Klasörde olmayan CMS görselleri silinir
5. CMS'de olmayan klasör görselleri eklenir

### Performans

- Büyük klasörler için optimize edilmiştir
- Paralel yükleme desteklenir
- İlerleme takibi yapılır

---

## 📞 Destek

Sorun yaşarsanız:
1. Hata mesajlarını kontrol edin
2. Klasör yapınızı doğrulayın
3. Dosya adlarının doğru formatta olduğundan emin olun
4. CMS'deki kayıtların mevcut olduğundan emin olun

---

**Son Güncelleme:** 2025-01-01
**Versiyon:** 2.0.0

