# Yaklaşım Karşılaştırması

## Yaklaşım 1: Klasör Tabanlı (Önerilen)

```
data/products/
├── bristol-sofa/
│   ├── metadata.json
│   ├── images/
│   ├── media/
│   └── dimensions/
└── husk-armchair/
    └── ...
```

### Avantajlar:
✅ Her ürün için organize klasör yapısı
✅ Görseller ve medya dosyaları ürünle birlikte
✅ Kolay yedekleme ve taşıma
✅ Büyük kataloglar için ölçeklenebilir

### Dezavantajlar:
⚠️ Daha fazla dosya yapısı
⚠️ Import.meta.glob kullanımı gerekir

---

## Yaklaşım 2: Tek Dosya (Basit)

```
data/products/
├── bristol-sofa.json
├── husk-armchair.json
└── index.ts (tüm ürünleri export eder)
```

### Avantajlar:
✅ Çok basit yapı
✅ Kolay import/export
✅ Hızlı geliştirme

### Dezavantajlar:
⚠️ Görseller ayrı klasörde (public/products/)
⚠️ Büyük kataloglar için yavaş olabilir
⚠️ Dosya boyutu büyüyebilir

---

## Yaklaşım 3: Hybrid (Her İkisini Destekle)

Hem klasör tabanlı hem de tek dosya yaklaşımını destekle:

```typescript
// Önce klasör tabanlı dene
try {
  return await loadProductsFromFiles();
} catch {
  // Fallback: Tek dosya yaklaşımı
  return await import('../data/products').then(m => m.default);
}
```

---

## Öneri

**Küçük-Orta Katalog (< 50 ürün)**: Yaklaşım 2 (Tek Dosya)
**Büyük Katalog (> 50 ürün)**: Yaklaşım 1 (Klasör Tabanlı)
**Esneklik İstiyorsanız**: Yaklaşım 3 (Hybrid)


