# 📚 Medya İçe Aktarma Aracı - Dokümantasyon İndeksi

## 🚀 Hemen Başlayın

1. **Yeni Başlayanlar:** [HIZLI_BASLANGIC.md](HIZLI_BASLANGIC.md) - 5 dakikada başlayın
2. **Sanity Kullanıcıları:** [SANITY_KULLANIM.md](SANITY_KULLANIM.md) - Direkt CMS'e yükleme
3. **Detaylı Kılavuz:** [KULLANIM.md](KULLANIM.md) - Tüm özellikleri öğrenin

## 📖 Dokümantasyon

### Temel Dokümantasyon

| Dosya | İçerik | Kime Göre |
|-------|--------|-----------|
| [HIZLI_BASLANGIC.md](HIZLI_BASLANGIC.md) | 5 dakikada kullanmaya başlayın | ⭐ Yeni başlayanlar |
| [SANITY_KULLANIM.md](SANITY_KULLANIM.md) | Direkt Sanity CMS'e yükleme | ⭐ Sanity kullanıcıları |
| [KULLANIM.md](KULLANIM.md) | Detaylı kullanım kılavuzu | Tüm özellikler |
| [README.md](README.md) | Teknik dokümantasyon | Geliştiriciler |

### Referans Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| [example-structure.md](example-structure.md) | Örnek klasör yapısı ve beklenen çıktılar |
| [test.sh](test.sh) / [test.bat](test.bat) | Test ortamı oluşturma scriptleri |

## 🎯 Kullanım Senaryoları

### Senaryo 1: İlk Kez Kullanım (JSON)
1. Oku: [HIZLI_BASLANGIC.md](HIZLI_BASLANGIC.md)
2. Klasör yapınızı hazırlayın
3. Komutu çalıştırın: `npm run import -- --source "..." --mode json`

### Senaryo 2: Direkt Sanity'ye Yükleme
1. Oku: [SANITY_KULLANIM.md](SANITY_KULLANIM.md)
2. Sanity token alın
3. Komutu çalıştırın: `SANITY_TOKEN=xxx npm run import -- --source "..." --mode sanity`

### Senaryo 3: Test Etme
1. Test script'ini çalıştırın: `./test.bat` (Windows) veya `./test.sh` (Linux/Mac)
2. Test verileriyle deneyin
3. Sonuçları kontrol edin

## 📂 Klasör Yapısı Özeti

```
Kaynak-Klasör/
├── ürünler/
│   └── <kategori>/              (örn: "01 - KANEPELER")
│       └── <model>/             (örn: "01 - 0203 - SU")
│           ├── xxx_kapak.jpg           ← ZORUNLU
│           ├── xxx_kapak_mobil.jpg     ← Opsiyonel
│           └── xxx_detay.jpg           ← Alternatif
└── tasarımcılar/
    └── <tasarımcı-adı>/
        ├── profil.jpg                  ← Genel
        └── profil_mobil.jpg            ← Mobil (opsiyonel)
```

## ⚙️ Temel Komutlar

### JSON Modu (Yerel dosyalar)
```bash
npm run import -- --source "F:\Medya" --mode json
```

### Sanity Modu (Direkt CMS)
```bash
# Linux/Mac
SANITY_TOKEN=xxx npm run import -- --source "F:\Medya" --mode sanity

# Windows PowerShell
$env:SANITY_TOKEN="xxx"; npm run import -- --source "F:\Medya" --mode sanity

# Windows CMD
set SANITY_TOKEN=xxx && npm run import -- --source "F:\Medya" --mode sanity
```

## 🔑 Önemli Kurallar

### İsimlendirme

| Tür | Örnek | Sonuç |
|-----|-------|-------|
| Kategori | `01 - KANEPELER` | KANEPELER (ID: `kanepeler`) |
| Model | `01 - 0203 - SU` | SU (ID: `su`) |
| Kapak | `xxx_kapak.jpg` | Ana kapak görseli |
| Mobil kapak | `xxx_kapak_mobil.jpg` | Mobil kapak |
| Diğer | `xxx_detay.jpg` | Alternatif görsel |

### Görsel Türleri

- **`_kapak.jpg`** → Ana kapak (zorunlu)
- **`_kapak_mobil.jpg`** → Mobil kapak (opsiyonel)
- **Diğer tüm görseller** → Alternatif görseller

### Tasarımcı Görselleri

- Tek görsel → Tüm cihazlar için
- **`_mobil.jpg`** ile biten → Mobil için

## 🆘 Sık Karşılaşılan Sorunlar

### "Klasör bulunamadı"
→ Yolu tırnak içinde yazın: `"F:\Medya"`

### "Ana kapak görseli bulunamadı"
→ En az bir görselin adını `xxx_kapak.jpg` yapın

### "SANITY_TOKEN gerekli" (Sanity modu)
→ Token'ı environment variable olarak ayarlayın

### "Permission denied" (Sanity modu)
→ Token'ın "Editor" veya "Admin" yetkisi olmalı

## 💡 İpuçları

1. ✅ İlk test için küçük bir klasör kullanın (2-3 ürün)
2. ✅ Görsellerin boyutunu optimize edin (yükleme hızı için)
3. ✅ Ana kapak görselini mutlaka `_kapak` ile işaretleyin
4. ✅ Mobil için özel kırpılmış görseller ekleyin (`_kapak_mobil`)
5. ✅ Türkçe karakter kullanabilirsiniz (otomatik çevrilir)

## 🔗 Hızlı Bağlantılar

- [Sanity Token Alma](https://sanity.io/manage) - API token oluşturun
- [Proje README](../../README.md) - Ana proje dokümantasyonu
- [Package.json](package.json) - Bağımlılıklar ve scriptler

## 📊 Desteklenen Formatlar

**Görsel Formatları:**
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.avif`

## 🎓 Öğrenme Yolu

### Başlangıç Seviyesi
1. [HIZLI_BASLANGIC.md](HIZLI_BASLANGIC.md) okuyun
2. Test klasörü oluşturun (`test.bat`)
3. JSON moduyla test edin

### Orta Seviye
1. [KULLANIM.md](KULLANIM.md) okuyun
2. Gerçek verilerinizle JSON oluşturun
3. Çıktıları kontrol edin ve düzenleyin

### İleri Seviye
1. [SANITY_KULLANIM.md](SANITY_KULLANIM.md) okuyun
2. Sanity token alın
3. Direkt CMS'e yükleyin

## 🔄 Güncelleme Notları

**v1.0.0** - İlk sürüm
- ✅ JSON modu
- ✅ Sanity modu (asset yükleme)
- ✅ Kategori, tasarımcı ve ürün oluşturma
- ✅ Kapak ve mobil kapak desteği
- ✅ Türkçe karakter desteği

---

**İyi çalışmalar!** 🎨

Sorun yaşarsanız ilgili dokümantasyon dosyasını okuyun veya console çıktısını kontrol edin.

