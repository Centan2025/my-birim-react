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

## Önemli Notlar

- Sanity token'ı olmadan üye kayıtları sadece local storage'da saklanır ve CMS'de görünmez
- Token'ın "Editor" veya "Admin" yetkisi olmalıdır, aksi halde üye kayıtları yapılamaz
- `.env` dosyasını git'e commit etmeyin (`.gitignore`'da olmalı)
