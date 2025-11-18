# 🎨 Sanity Studio Medya İçe Aktarma Aracı

Ürün ve tasarımcı görsellerinizi **sürükle-bırak** veya **klasör seçimi** ile direkt Sanity CMS'e yükleyin!

## ✨ Özellikler

- 📁 **Klasör Seçimi:** "Klasör Seç" butonu ile medya klasörünüzü seçin
- 🖱️ **Sürükle-Bırak:** Klasörünüzü direkt arayüze sürükleyip bırakın
- 🚀 **Otomatik Yükleme:** Görseller, kategoriler, tasarımcılar ve ürünler otomatik oluşturulur
- 📊 **Canlı İlerleme:** Yükleme sürecini anlık takip edin
- ✅ **Hata Yönetimi:** Sorunlu dosyalar atlanır, işlem devam eder

## 🎯 Kullanım

### 1. Sanity Studio'yu Başlatın

```bash
cd birim-web
npm run dev
```

Tarayıcıda: http://localhost:3333

### 2. Medya İçe Aktar Aracını Açın

Sol üst menüden **"Medya İçe Aktar"** sekmesine tıklayın.

### 3. Klasör Yapınızı Hazırlayın

```
Medya-Klasörü/
├── ürünler/
│   └── 01 - KANEPELER/
│       └── 01 - 0203 - SU/
│           ├── su_kapak.jpg          ← Ana kapak
│           ├── su_kapak_mobil.jpg    ← Mobil kapak
│           └── su_detay_1.jpg        ← Alternatif görseller
└── tasarımcılar/
    └── Ahmet Yılmaz/
        ├── profil.jpg               ← Genel profil
        └── profil_mobil.jpg         ← Mobil profil
```

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

## 📂 Klasör Yapısı Kuralları

### Kategori Klasörleri
- `01 - KANEPELER` → Kategori: "KANEPELER"
- `08 - RAF SİSTEMLERİ` → Kategori: "RAF SİSTEMLERİ"
- Numara opsiyoneldir, araç son kısmı alır

### Model Klasörleri
- `01 - 0203 - SU` → Model: "SU"
- `16 - 0175 - RICH` → Model: "RICH"
- `BRISTOL` → Model: "BRISTOL"
- Son kısım model adı olarak kullanılır

### Görsel İsimleri

**Ürün Görselleri:**
- `xxx_kapak.jpg` → Ana kapak (zorunlu)
- `xxx_kapak_mobil.jpg` → Mobil kapak (opsiyonel)
- Diğer tüm görseller → Alternatif görseller

**Tasarımcı Görselleri:**
- `profil.jpg` → Genel profil (tüm cihazlar)
- `profil_mobil.jpg` → Mobil profil (opsiyonel)

### Desteklenen Formatlar
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.avif`

## 🎬 Ne Olur?

### Otomatik Oluşturulur:
✅ **Kategoriler:** Her kategori için bir döküman  
✅ **Tasarımcılar:** Profil görselleriyle birlikte  
✅ **Ürünler:** Ana kapak, mobil kapak ve tüm görseller  
✅ **Asset'ler:** Tüm görseller Sanity asset'lere yüklenir  

### Manuel Yapmanız Gerekenler:
📝 Ürünlere tasarımcı ataması  
📝 Kategorilere hero image ekleme  
📝 Ürün açıklamalarını düzenleme  
📝 Fiyat ve diğer bilgileri ekleme  
📝 Ürünleri publish etme (isPublished: true)  

## ⚠️ Önemli Notlar

### Yükleme Davranışı
- **createOrReplace kullanır:** Aynı ID'ye sahip döküman varsa üzerine yazar
- **Görseller yeniden yüklenir:** Her seferinde yeni asset'ler oluşturulur
- **Unpublished başlar:** Ürünler otomatik publish edilmez, manuel kontrol gerekir

### Performans
- Büyük klasörler için yükleme uzun sürebilir
- Her görsel tek tek yüklenir
- İnternet hızınıza bağlıdır

### Hata Durumları
- Bozuk görseller atlanır
- Kategori referansı olmayan ürünler hataya düşer
- Tüm hatalar ekranda gösterilir

## 🔧 Sorun Giderme

### "Klasör seçme çalışmıyor"
**Çözüm:** Bazı tarayıcılar klasör seçmeyi desteklemez. Chrome veya Edge kullanın.

### "Görseller yüklenmiyor"
**Çözüm:**
- Görsellerin bozuk olmadığından emin olun
- Dosya boyutlarını kontrol edin (max 50MB)
- İnternet bağlantınızı kontrol edin

### "Kategoriler oluşturulmuyor"
**Çözüm:** Klasör yapınızın doğru olduğundan emin olun:
```
ürünler/KATEGORİ/MODEL/görsel.jpg
```

### "İşlem çok yavaş"
**Çözüm:**
- Önce küçük bir klasörle test edin
- Görselleri önceden optimize edin
- İnternet hızınızı kontrol edin

## 💡 İpuçları

1. **İlk test:** 2-3 ürünle test edin, sonra büyük klasörü yükleyin
2. **Görsel optimizasyonu:** Yüklemeden önce görselleri sıkıştırın
3. **İsimlendirme:** `_kapak` ekini unutmayın
4. **Yedek:** İlk yüklemeden önce Sanity'den export alın
5. **Kontrol:** Yükleme sonrası Sanity Studio'da ürünleri kontrol edin

## 🎓 Adım Adım Örnek

### Senaryo: 5 Ürün Yükleme

1. **Klasör Hazırlama (5 dakika)**
   ```
   Medya/
   ├── ürünler/
   │   └── KANEPELER/
   │       ├── SU/ (4 görsel)
   │       ├── RICH/ (3 görsel)
   │       └── BRISTOL/ (2 görsel)
   └── tasarımcılar/
       └── Ahmet Yılmaz/ (2 görsel)
   ```

2. **Yükleme (2 dakika)**
   - Sanity Studio'da "Medya İçe Aktar" sekmesine gidin
   - Klasörü sürükle-bırak alanına bırakın
   - Onay verin: "1 kategori, 1 tasarımcı, 3 ürün yüklenecek"

3. **İlerleme Takibi (2 dakika)**
   - Tasarımcı: Ahmet Yılmaz ✅
   - Kategori: KANEPELER ✅
   - Ürün: SU ✅
   - Ürün: RICH ✅
   - Ürün: BRISTOL ✅

4. **Tamamlama (5 dakika)**
   - Ürünleri açıp tasarımcı atayın
   - Açıklamaları düzenleyin
   - Publish edin

**Toplam Süre: ~15 dakika** 🎉

## 🚀 Sonraki Adımlar

Yükleme tamamlandıktan sonra:

1. **Kontrol:** Products sekmesinden ürünleri inceleyin
2. **Tasarımcı Ataması:** Her ürüne tasarımcı atayın
3. **Hero Image:** Kategorilere hero image ekleyin
4. **Açıklamalar:** Ürün açıklamalarını düzenleyin
5. **Publish:** Ürünleri yayınlayın

## 📞 Destek

Sorun yaşarsanız:
1. Console'u kontrol edin (F12)
2. Klasör yapınızı kontrol edin
3. Görsel formatlarını kontrol edin
4. Hata mesajlarını okuyun

---

**Başarılar!** 🎨 Artık Sanity Studio'da sürükle-bırak ile ürün yükleyebilirsiniz!

