# 🔤 Büyük/Küçük Harf Desteği

Medya içe aktarma aracı **büyük/küçük harf duyarsızdır**. Klasör isimlerinizi istediğiniz şekilde yazabilirsiniz.

## ✅ Çalışan Klasör İsimleri

### Ürünler Klasörü

Tüm bu isimler **aynı şekilde** çalışır:

- ✅ `ürünler`
- ✅ `ÜRÜNLER`
- ✅ `Ürünler`
- ✅ `URUNLER` (Türkçe karakter olmadan)
- ✅ `urunler`
- ✅ `Urunler`

**Nasıl Çalışır:** Klasör adında "urun" geçiyorsa tanır.

### Tasarımcılar Klasörü

Tüm bu isimler **aynı şekilde** çalışır:

- ✅ `tasarımcılar`
- ✅ `TASARIMCILAR`
- ✅ `Tasarımcılar`
- ✅ `TASARIMCILAR` (Türkçe karakter olmadan)
- ✅ `tasarimcilar`
- ✅ `Tasarimcilar`

**Nasıl Çalışır:** Klasör adında "tasarim" geçiyorsa tanır.

## 📂 Gerçek Örnekler

### Örnek 1: Tamamen Büyük Harf

```
[BİRİM WEB]/
├── [ÜRÜNLER]/
│   └── [01 - KANEPELER]/
│       └── [01 - 0203 - SU]/
│           └── su_kapak.jpg
└── [TASARIMCILAR]/
    └── [ARİF ÖZDEN]/
        └── profil.jpg
```

✅ **Çalışır!**

### Örnek 2: Küçük Harf

```
medya/
├── ürünler/
│   └── 01 - kanepeler/
│       └── 01 - su/
│           └── su_kapak.jpg
└── tasarımcılar/
    └── arif özden/
        └── profil.jpg
```

✅ **Çalışır!**

### Örnek 3: Karışık

```
Medya/
├── ÜRÜNLER/
│   └── 01 - Kanepeler/
│       └── Su/
│           └── SU_KAPAK.jpg
└── tasarımcılar/
    └── Arif Özden/
        └── PROFIL.jpg
```

✅ **Çalışır!**

### Örnek 4: Türkçe Karakter Olmadan

```
Media/
├── URUNLER/
│   └── 01 - KANEPELER/
│       └── SU/
│           └── kapak.jpg
└── TASARIMCILAR/
    └── ARIF OZDEN/
        └── profil.jpg
```

✅ **Çalışır!**

## 🎯 Alt Klasörler

Ana klasörlerde (ürünler/tasarımcılar) büyük/küçük harf önemli değil ama:

### Kategori ve Model İsimleri

Bunlar **istediğiniz gibi** olabilir:

```
├── ÜRÜNLER/
│   ├── 01 - KANEPELER/        ← Büyük harf
│   ├── 02 - Sandalyeler/      ← Karışık
│   └── 03 - masalar/          ← Küçük harf
│       ├── AHŞAP/             ← Büyük harf
│       └── metal/             ← Küçük harf
```

✅ **Hepsi çalışır!** Araç otomatik olarak:

- `01 - KANEPELER` → KANEPELER (ID: kanepeler)
- `02 - Sandalyeler` → Sandalyeler (ID: sandalyeler)
- `AHŞAP` → AHŞAP (ID: ahsap)

## 🖼️ Görsel İsimleri

Görsel isimleri için **önemli olan kısım:**

### Kapak Görselleri

**`_kapak` veya `_KAPAK` olması gerekli:**

- ✅ `su_kapak.jpg`
- ✅ `SU_KAPAK.jpg`
- ✅ `Su_Kapak.jpg`
- ✅ `SU_kapak.JPG`

**Nasıl Çalışır:** Dosya adında "\_kapak" geçiyorsa (büyük/küçük harf fark etmez) kapak görseli olarak tanır.

### Mobil Kapak

**`_kapak_mobil` veya `_KAPAK_MOBIL` olması gerekli:**

- ✅ `su_kapak_mobil.jpg`
- ✅ `SU_KAPAK_MOBIL.jpg`
- ✅ `Su_Kapak_Mobil.jpg`

### Mobil Profil (Tasarımcılar)

**`_mobil` veya `_MOBIL` olması gerekli:**

- ✅ `profil_mobil.jpg`
- ✅ `PROFIL_MOBIL.jpg`
- ✅ `Profil_Mobil.jpg`

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Ana Klasör İsimleri

Ana klasörlerde **"urun"** veya **"tasarim"** kelimesi geçmeli:

❌ **ÇALIŞMAZ:**

```
- products/          (İngilizce)
- items/
- designers/         (İngilizce)
```

✅ **ÇALIŞIR:**

```
- ürünler, ÜRÜNLER, urunler
- tasarımcılar, TASARIMCILAR, tasarimcilar
```

### 2. Dosya Uzantıları

Dosya uzantıları büyük/küçük harf fark etmez:

- ✅ `.jpg`, `.JPG`, `.Jpg`
- ✅ `.png`, `.PNG`, `.Png`
- ✅ `.jpeg`, `.JPEG`, `.Jpeg`

### 3. Özel Dosya İsimleri

Kapak ve mobil görselleri için özel isimler:

- ✅ `_kapak` (küçük harf)
- ✅ `_KAPAK` (büyük harf)
- ✅ `_Kapak` (karışık)
- ❌ `kapak` (underscore yok)
- ❌ `-kapak` (tire ile)

## 🎓 Öneriler

### Windows Kullanıcıları

Windows'ta klasör isimleri genelde büyük harfle görünür:

```
[BİRİM WEB]
  [ÜRÜNLER]
  [TASARIMCILAR]
```

✅ **Sorun yok!** Araç bunu otomatik tanır.

### Mac/Linux Kullanıcıları

Unix sistemlerde genelde küçük harf kullanılır:

```
birim-web/
  ürünler/
  tasarımcılar/
```

✅ **Sorun yok!** Bu da çalışır.

### En İyi Uygulama

Tutarlılık için bir stil seçin:

**Öneri 1: Türkçe Küçük Harf**

```
ürünler/
tasarımcılar/
```

**Öneri 2: İngilizce Küçük Harf** (Türkçe karakter sorunu yaşıyorsanız)

```
urunler/
tasarimcilar/
```

## 🔍 Test Etme

Klasör yapınızın doğru tanınıp tanınmadığını test etmek için:

1. Sanity Studio'da "Medya İçe Aktar" sekmesini açın
2. Klasörünüzü sürükle-bırak yapın
3. Ekranda "Bulunan İçerik" bölümünü kontrol edin:
   ```
   📊 Bulunan İçerik:
   📂 3 Kategori  👤 2 Tasarımcı
   📦 15 Ürün     🖼️ 47 Görsel
   ```

Eğer "0 Kategori, 0 Tasarımcı" görüyorsanız:

- Ana klasör isimlerini kontrol edin
- "urun" veya "tasarim" kelimesi geçtiğinden emin olun

## 💡 Özet

✅ **Ana klasörler:** "urun" veya "tasarim" içermeli (büyük/küçük harf önemli değil)  
✅ **Alt klasörler:** İstediğiniz gibi olabilir  
✅ **Dosya isimleri:** `_kapak`, `_mobil` önemli (büyük/küçük harf önemli değil)  
✅ **Türkçe karakter:** Olsa da olur, olmasa da olur

---

**Sonuç:** Klasör isimlerinizi **istediğiniz gibi** yazabilirsiniz! 🎉
