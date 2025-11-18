# Birim Web

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Sanity Token Yapılandırması:
   
   Üye kayıtlarının CMS'de görünmesi için Sanity token'ı yapılandırmanız gerekmektedir.
   
   a. Proje kök dizininde `.env` dosyası oluşturun:
   ```bash
   # Windows'ta
   type nul > .env
   
   # Linux/Mac'te
   touch .env
   ```
   
   b. `.env` dosyasına aşağıdaki satırları ekleyin:
   ```env
   VITE_SANITY_PROJECT_ID=wn3a082f
   VITE_SANITY_DATASET=production
   VITE_SANITY_API_VERSION=2025-01-01
   VITE_SANITY_TOKEN=your_sanity_token_here
   ```
   
   c. Sanity token'ınızı alın:
   - https://sanity.io/manage adresine gidin
   - Projenizi seçin (wn3a082f)
   - "API" sekmesine gidin
   - "Add API token" butonuna tıklayın
   - Token'a bir isim verin (örn: "Web App Token")
   - **"Editor" veya "Admin" yetkisi seçin** (önemli!)
   - Token'ı kopyalayın ve `.env` dosyasındaki `VITE_SANITY_TOKEN` değerine yapıştırın
   
   d. Uygulamayı yeniden başlatın:
   ```bash
   npm run dev
   ```

3. Uygulamayı çalıştırın:
   ```bash
   npm run dev
   ```

## Geçici "Yakında" Sayfası (Maintenance Mode)

Sayfa tam olana kadar geçici bir "Yakında" sayfası göstermek için:

### Önemli: Development vs Production

- **Development modunda (`npm run dev`)**: Maintenance mode **otomatik olarak devre dışıdır**. Tüm sayfalara normal şekilde erişebilirsiniz.
- **Production modunda**: Maintenance mode aktif olabilir.

### Maintenance Mode'u Aktif Etmek (Önerilen: CMS'den)

**En kolay yöntem - Sanity CMS'den:**

1. Sanity Studio'ya gidin (`birim-web` klasöründe `npm run dev` ile çalıştırın)
2. **Site Ayarları** (Site Settings) dokümanını açın
3. **"Bakım Modu (Yakında Sayfası)"** seçeneğini aktif edin
4. Değişiklikleri kaydedin ve publish edin
5. Web sitesi otomatik olarak güncellenecektir (CDN cache süresi içinde)

**Alternatif: Environment Variable (Vercel'de):**

1. Vercel dashboard'unuza gidin
2. Projenizi seçin
3. Settings > Environment Variables bölümüne gidin
4. Yeni bir variable ekleyin:
   - **Name:** `VITE_MAINTENANCE_MODE`
   - **Value:** `true`
5. Deploy'u yeniden yapın

**Not:** CMS'den kontrol etmek daha pratiktir çünkü deploy gerektirmez. Her iki yöntem de çalışır, CMS önceliklidir.

### Production'da Bypass Etmek (Sayfalara Erişim)

Maintenance mode aktifken production'da sayfalara erişmek için:

1. **Secret bypass key ekleyin (opsiyonel, güvenlik için):**
   - Vercel'de yeni bir environment variable ekleyin:
     - **Name:** `VITE_MAINTENANCE_BYPASS_SECRET`
     - **Value:** Kendi belirlediğiniz bir secret (örn: `my-secret-key-2024`)
   
2. **URL'ye query parameter ekleyin:**
   
   HashRouter kullanıldığı için iki yöntem var:
   
   **Yöntem 1 - Hash'ten önce (önerilen):**
   ```
   https://yourdomain.com/?bypass=my-secret-key-2024
   ```
   
   **Yöntem 2 - Hash içinde:**
   ```
   https://yourdomain.com/#/products?bypass=my-secret-key-2024
   ```
   
   Her iki yöntem de çalışır. İstediğiniz sayfaya gidebilirsiniz:
   ```
   https://yourdomain.com/?bypass=my-secret-key-2024#/products
   https://yourdomain.com/?bypass=my-secret-key-2024#/designers
   https://yourdomain.com/?bypass=my-secret-key-2024#/about
   ```

3. **Secret belirlemezseniz:**
   - Varsayılan secret: `dev-bypass-2024`
   - URL: `https://yourdomain.com/?bypass=dev-bypass-2024`

### Normal Sayfaya Dönmek

**CMS'den (Önerilen):**
1. Sanity Studio'da **Site Ayarları** dokümanını açın
2. **"Bakım Modu (Yakında Sayfası)"** seçeneğini kapatın
3. Değişiklikleri kaydedin ve publish edin

**Veya Environment Variable'dan:**
- Vercel'de `VITE_MAINTENANCE_MODE` environment variable'ını silin veya `false` olarak güncelleyin
- Yeniden deploy edin

### Notlar

- Maintenance mode **sadece production'da** çalışır
- Development'ta (`npm run dev`) her zaman tüm sayfalara erişebilirsiniz
- Production'da bypass secret ile sayfalara erişebilirsiniz
- Maintenance mode aktifken normal kullanıcılar sadece "Yakında" sayfasını görür

## Medya İçe Aktarma Aracı

Ürün ve tasarımcı görsellerinizi kolayca yükleyin! **3 farklı yöntem:**

### 🎨 Yöntem 1: Sanity Studio'da Sürükle-Bırak (ÖNERİLEN)

**En kolay ve hızlı yöntem!** Sanity Studio içinde grafik arayüzle:

1. Sanity Studio'yu başlatın:
   ```bash
   cd birim-web
   npm run dev
   ```

2. Tarayıcıda http://localhost:3333 açın

3. Sol menüden **"Medya İçe Aktar"** sekmesine tıklayın

4. **İki seçenek:**
   - 📁 **"Klasör Seç"** butonu ile medya klasörünüzü seçin
   - 🖱️ Veya klasörü direkt **sürükle-bırak** alanına bırakın

5. İşlem otomatik başlar, ilerlemeyı izleyin!

**Avantajları:**
- ✅ Grafik arayüz - kod bilgisi gerektirmez
- ✅ Sürükle-bırak desteği
- ✅ Canlı ilerleme takibi
- ✅ Hata mesajları ekranda
- ✅ Kurulum gerektirmez

Detaylar: `birim-web/tools/mediaImport/README.md`

---

### 💻 Yöntem 2: Komut Satırı (Terminal)

**JSON dosyaları oluşturmak için:**
```bash
npm run import-media -- --source "F:\Medya" --mode json
```

**Direkt Sanity CMS'e yüklemek için:**
```bash
SANITY_TOKEN=your_token npm run import-media -- --source "F:\Medya" --mode sanity
```

Detaylar: `tools/media-importer/KULLANIM.md`

---

### 📂 Beklenen Klasör Yapısı

```
Medya-Klasörü/
├── ürünler/
│   └── 01 - KANEPELER/
│       └── 01 - 0203 - SU/
│           ├── su_kapak.jpg          ← Ana kapak (zorunlu)
│           ├── su_kapak_mobil.jpg    ← Mobil kapak (opsiyonel)
│           └── su_detay_1.jpg        ← Alternatif görseller
└── tasarımcılar/
    └── Ahmet Yılmaz/
        ├── profil.jpg               ← Genel profil
        └── profil_mobil.jpg         ← Mobil profil (opsiyonel)
```

### ✨ Özellikler

- ✅ **Sürükle-bırak** ve klasör seçimi (Sanity Studio'da)
- ✅ **Canlı ilerleme** takibi
- ✅ Kategori ve model adlarını otomatik çıkarır
- ✅ `_kapak` ve `_kapak_mobil` görselleri otomatik tanır
- ✅ Görselleri Sanity asset'lere otomatik yükler
- ✅ Türkçe karakter desteği
- ✅ Detaylı hata ve uyarı raporları

### 📚 Dokümantasyon

- **Sanity Studio (Grafik Arayüz):** `birim-web/tools/mediaImport/README.md`
- **Komut Satırı:** `tools/media-importer/KULLANIM.md`
- **Hızlı Başlangıç:** `tools/media-importer/HIZLI_BASLANGIC.md`

## Önemli Notlar

- Sanity token'ı olmadan üye kayıtları sadece local storage'da saklanır ve CMS'de görünmez
- Token'ın "Editor" veya "Admin" yetkisi olmalıdır, aksi halde üye kayıtları yapılamaz
- `.env` dosyasını git'e commit etmeyin (`.gitignore`'da olmalı)
