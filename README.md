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

## Önemli Notlar

- Sanity token'ı olmadan üye kayıtları sadece local storage'da saklanır ve CMS'de görünmez
- Token'ın "Editor" veya "Admin" yetkisi olmalıdır, aksi halde üye kayıtları yapılamaz
- `.env` dosyasını git'e commit etmeyin (`.gitignore`'da olmalı)
