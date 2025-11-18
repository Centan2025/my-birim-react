# 🚀 Sanity CMS'e Direkt Yükleme

Bu kılavuz, ürün ve tasarımcı görsellerinizi direkt Sanity CMS'e nasıl yükleyeceğinizi anlatır.

## 📋 Ön Hazırlık

### 1. Sanity Token Alın

1. https://sanity.io/manage adresine gidin
2. Projenizi seçin: **wn3a082f**
3. Sol menüden **"API"** sekmesine tıklayın
4. **"Add API token"** butonuna tıklayın
5. Token bilgileri:
   - **Name:** `Media Importer` (veya istediğiniz isim)
   - **Permissions:** **Editor** veya **Admin** (önemli!)
6. **"Add token"** butonuna tıklayın
7. Token'ı kopyalayın ve güvenli bir yere kaydedin

⚠️ **Önemli:** Token'ı kimseyle paylaşmayın!

### 2. Klasör Yapınızı Hazırlayın

```
F:\Medya\
├── ürünler\
│   └── 01 - KANEPELER\
│       └── 01 - 0203 - SU\
│           ├── su_kapak.jpg          (Ana kapak - ZORUNLU)
│           ├── su_kapak_mobil.jpg    (Mobil kapak - opsiyonel)
│           ├── su_1.jpg              (Alternatif görseller)
│           └── su_2.jpg
└── tasarımcılar\
    └── Ahmet Yılmaz\
        ├── profil.jpg               (Genel)
        └── profil_mobil.jpg         (Mobil - opsiyonel)
```

## 🚀 Yükleme

### Windows (PowerShell)

```powershell
cd tools/media-importer
$env:SANITY_TOKEN="skxxxxxxxxxxxxxxxxxxxxxxxxxx"
npm run import -- --source "F:\Medya" --mode sanity
```

### Windows (CMD)

```cmd
cd tools\media-importer
set SANITY_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxxxxx
npm run import -- --source "F:\Medya" --mode sanity
```

### Linux / Mac

```bash
cd tools/media-importer
export SANITY_TOKEN=skxxxxxxxxxxxxxxxxxxxxxxxxxx
npm run import -- --source "F:/Medya" --mode sanity
```

### Tek Komut (Önerilen)

**Windows PowerShell:**
```powershell
cd tools/media-importer
$env:SANITY_TOKEN="skxxxx"; npm run import -- --source "F:\Medya" --mode sanity
```

**Linux/Mac:**
```bash
cd tools/media-importer
SANITY_TOKEN=skxxxx npm run import -- --source "F:/Medya" --mode sanity
```

## 📊 Yükleme Süreci

Araç çalıştığında şu adımları gerçekleştirir:

### 1️⃣ Tarama
```
🔍 Medya klasörü taranmaya başlanıyor...
   Kaynak: F:\Medya

📂 Ürünler klasörü taranıyor...
   Bulunan kategori sayısı: 3
   
   📁 Kategori: KANEPELER
      Bulunan model sayısı: 5
      ✓ SU: 4 görsel
      ✓ RICH: 3 görsel
      ...
```

### 2️⃣ Tasarımcılar Yükleniyor
```
============================================================
📤 TASARCILAR YÜKLENİYOR (3 adet)
============================================================

   📸 Tasarımcı: Ahmet Yılmaz
      Genel görsel yükleniyor...
      Mobil görsel yükleniyor...
   ✓ Tasarımcı oluşturuldu: Ahmet Yılmaz
```

### 3️⃣ Kategoriler Oluşturuluyor
```
============================================================
📂 KATEGORİLER OLUŞTURULUYOR
============================================================

   ✓ Kategori oluşturuldu: KANEPELER
   ✓ Kategori oluşturuldu: RAF SİSTEMLERİ
   ✓ Kategori oluşturuldu: SANDALYELER
```

### 4️⃣ Ürünler Yükleniyor
```
============================================================
📤 ÜRÜNLER YÜKLENİYOR (15 adet)
============================================================

   📸 Ürün: KANEPELER/SU
      Ana kapak yükleniyor: su_kapak.jpg
      Mobil kapak yükleniyor: su_kapak_mobil.jpg
      Alternatif görsel yükleniyor: su_1.jpg
      Alternatif görsel yükleniyor: su_2.jpg
   ✓ Ürün oluşturuldu: SU (4 görsel)
```

### 5️⃣ Tamamlandı
```
============================================================
✅ SANITY YÜKLEMESİ TAMAMLANDI!
============================================================
✓ Tasarımcı: 3
✓ Kategori: 3
✓ Ürün: 15
============================================================

📝 SONRAKİ ADIMLAR:
   1. Sanity Studio'da ürünleri kontrol edin
   2. Ürünlere tasarımcı ataması yapın
   3. Kategorilere hero image ekleyin
   4. Ürün açıklamalarını düzenleyin
   5. Ürünleri publish edin (isPublished: true)
```

## ✅ Yükleme Sonrası

### 1. Sanity Studio'da Kontrol Edin

```bash
# Sanity Studio'yu başlatın
cd birim-web
npm run dev
```

Tarayıcıda: http://localhost:3333

### 2. Ürünleri İnceleyin

- Sol menüden **"Products"** sekmesine gidin
- Oluşturulan ürünleri görün
- Görsellerin doğru yüklendiğini kontrol edin

### 3. Tasarımcı Ataması Yapın

Her ürün için:
1. Ürünü açın
2. **"Designer"** alanını bulun
3. İlgili tasarımcıyı seçin
4. **"Publish"** butonuna tıklayın

### 4. Kategorilere Hero Image Ekleyin

1. Sol menüden **"Categories"** sekmesine gidin
2. Her kategoriyi açın
3. **"Hero Image"** alanına kategori için bir ana görsel ekleyin
4. **"Publish"** butonuna tıklayın

### 5. Ürün Açıklamalarını Düzenleyin

Her ürün için:
1. **"Description"** alanını düzenleyin (Türkçe ve İngilizce)
2. Gerekirse **"Price"** ve diğer bilgileri ekleyin
3. **"Publish"** butonuna tıklayın

### 6. Ürünleri Yayınlayın

Ürünler başlangıçta "unpublished" olarak oluşturulur:
1. Ürünü açın
2. Tüm bilgileri kontrol edin
3. **"Publish"** butonuna tıklayın
4. Web sitesinde görünür hale gelir

## ⚠️ Önemli Notlar

### Yükleme Davranışı

- **createOrReplace kullanır:** Aynı ID'ye sahip döküman varsa üzerine yazar
- **Görseller yeniden yüklenir:** Her seferinde yeni asset'ler oluşturulur
- **Unpublished başlar:** Ürünler otomatik publish edilmez

### Neleri Otomatik Yapar

✅ Görselleri Sanity asset'lere yükler  
✅ Kategorileri oluşturur  
✅ Tasarımcıları oluşturur (görsellerle)  
✅ Ürünleri oluşturur (kategori referansıyla)  
✅ Ana kapak + mobil kapak + alternatif görseller  

### Neleri Manuel Yapmalısınız

❌ Tasarımcı ataması  
❌ Kategori hero image  
❌ Ürün açıklamaları  
❌ Fiyat bilgileri  
❌ Publish işlemi  

## 🔍 Sorun Giderme

### Hata: "SANITY_TOKEN environment variable gerekli!"

**Çözüm:** Token'ı ayarlamayı unutmuşsunuz:
```bash
export SANITY_TOKEN=your_token_here
# veya
$env:SANITY_TOKEN="your_token_here"
```

### Hata: "Permission denied" veya "Insufficient permissions"

**Çözüm:** Token'ınız yeterli yetkiye sahip değil:
1. Sanity dashboard'a gidin
2. Token'ı silin
3. **"Editor"** veya **"Admin"** yetkisiyle yeni token oluşturun

### Hata: "Failed to upload image"

**Çözüm:**
- Görsel dosyası bozuk olabilir
- Dosya çok büyük olabilir (max 50MB)
- İnternet bağlantınızı kontrol edin

### Uyarı: "Ana kapak bulunamadı, ilk görsel kullanılıyor"

**Çözüm:** En az bir görselin adının sonuna `_kapak` ekleyin:
```
su_kapak.jpg  ← Doğru
su.jpg        ← Kapak olarak işaretlenmez
```

## 💡 İpuçları

1. **İlk test:** Küçük bir klasörle test edin (2-3 ürün)
2. **Yedek alın:** İlk yüklemeden önce Sanity'den export alın
3. **Görselleri optimize edin:** Yükleme öncesi görselleri sıkıştırın
4. **Ağ hızı:** Çok sayıda ürün varsa yükleme uzun sürebilir

## 📞 Destek

Sorun yaşıyorsanız:
1. Console çıktısını dikkatlice okuyun
2. Sanity Studio'da dökümanları kontrol edin
3. Token yetkilerini doğrulayın
4. İnternet bağlantınızı kontrol edin

---

**Başarılar!** 🎉 Görselleriniz artık Sanity CMS'de!

