# 🚀 Hızlı Başlangıç - 5 Dakikada Kullanım

## 1️⃣ Klasörünüzü Hazırlayın

Görsellerinizi bir klasörde şu şekilde düzenleyin:

```
F:\Medya\                           ← Klasörünüz nerede olursa olsun
├── ürünler\
│   └── 01 - KANEPELER\             ← Kategori (numara opsiyonel)
│       └── 01 - 0203 - SU\         ← Model (numara ve kod opsiyonel)
│           ├── su_kapak.jpg        ← BU ZORUNLU (_kapak ile bitmeli)
│           ├── su_kapak_mobil.jpg  ← Opsiyonel (mobil için)
│           └── su_1.jpg            ← Diğer görseller (istediğiniz kadar)
└── tasarımcılar\
    └── Ahmet Yılmaz\               ← Tasarımcı adı
        └── ahmet.jpg               ← Profil görseli
```

## 2️⃣ Komutu Çalıştırın

Proje ana dizininde terminal açın ve:

```bash
npm run import-media -- --source "F:\Medya" --mode json
```

**Önemli:**
- Windows'ta: `"F:\Medya"` veya `"F:/Medya"` (her ikisi de çalışır)
- Tırnak işaretlerini unutmayın!

## 3️⃣ Sonuçları Görün

Araç şunu oluşturur:

```
data/
├── products/
│   └── kanepeler/
│       └── su/
│           └── metadata.json       ← Ürün bilgileri
└── designers/
    └── ahmet-yilmaz.json          ← Tasarımcı bilgileri
```

## 4️⃣ Metadata'yı Düzenleyin (Opsiyonel)

`metadata.json` dosyalarını açıp:
- Açıklamaları yazın
- Fiyatları ekleyin
- Tasarımcı ID'sini güncelleyin

## ✅ İşte Bu Kadar!

## 🆘 Sorun mu Yaşıyorsunuz?

### Hata: "Klasör bulunamadı"
```bash
# Yolu tırnak içinde yazın:
npm run import-media -- --source "F:\Medya" --mode json

# Veya slash ile:
npm run import-media -- --source "F:/Medya" --mode json
```

### Uyarı: "Ana kapak görseli bulunamadı"
En az bir görselin adını `xxx_kapak.jpg` şeklinde yapın.

### "npm: command not found"
Node.js kurulu değil. [nodejs.org](https://nodejs.org) adresinden indirin.

## 📚 Daha Fazla Bilgi

- **Detaylı kullanım:** `KULLANIM.md`
- **Teknik dokümantasyon:** `README.md`
- **Örnek yapı:** `example-structure.md`

## 💡 İpuçları

1. **Test edin:** Önce küçük bir klasörle deneyin
2. **İsimlendirme:** `_kapak` ekini kullanmayı unutmayın
3. **Türkçe karakter:** Sorun değil, otomatik çevrilir
4. **Mobil görseller:** Opsiyonel ama önerilir

## 🎯 Sonraki Adımlar

### JSON Modu İçin:
1. ✅ JSON dosyaları oluşturuldu
2. 📝 Metadata'ları düzenleyin (açıklama, fiyat, vs.)
3. 🖼️ Görselleri `public/images/` klasörüne kopyalayın
4. 🚀 Web sitenizi test edin

### Sanity Modunu Kullanmak İsterseniz:

```bash
# Direkt CMS'e yükleyin (daha pratik!)
SANITY_TOKEN=your_token npm run import -- --source "F:\Medya" --mode sanity
```

Detaylar için: `SANITY_KULLANIM.md`

---

**Yardıma mı ihtiyacınız var?** Diğer dokümantasyon dosyalarını okuyun veya console çıktısındaki mesajları kontrol edin.

