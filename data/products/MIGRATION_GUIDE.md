# CMS'den Statik Dosyalara Geçiş Kılavuzu

## Adım 1: Mevcut Ürünleri Dışa Aktar

CMS'den tüm ürünleri JSON formatında dışa aktarın. `services/cms.ts` dosyasına geçici bir export fonksiyonu ekleyebilirsiniz:

```typescript
// Geçici: CMS'den ürünleri JSON olarak dışa aktar
export const exportProductsToJSON = async () => {
  const products = await getProducts();
  const fs = require('fs');
  const path = require('path');
  
  products.forEach(product => {
    const dir = path.join(__dirname, '../data/products', product.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, 'metadata.json'),
      JSON.stringify(product, null, 2)
    );
  });
};
```

## Adım 2: services/cms.ts'i Güncelle

`getProducts` ve `getProductById` fonksiyonlarını statik dosyalardan okuyacak şekilde güncelleyin:

```typescript
import { loadProductsFromFiles, loadProductById } from './productsLoader';

export const getProducts = async (): Promise<Product[]> => {
  // Önce statik dosyalardan dene
  try {
    return await loadProductsFromFiles();
  } catch (error) {
    console.warn('Statik dosyalardan yüklenemedi, CMS\'e dönülüyor...', error);
    // Fallback: CMS veya localStorage
    if (useSanity && sanity) {
      // ... mevcut CMS kodu
    }
    return getItem<Product[]>(KEYS.PRODUCTS).map(normalizeProduct);
  }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  // Önce statik dosyalardan dene
  try {
    return await loadProductById(id);
  } catch (error) {
    console.warn(`Ürün ${id} statik dosyalardan yüklenemedi, CMS'e dönülüyor...`, error);
    // Fallback: CMS veya localStorage
    // ... mevcut kod
  }
};
```

## Adım 3: Görselleri Organize Et

1. Görselleri `public/products/{product-id}/` altına taşıyın
2. `metadata.json` dosyalarındaki URL'leri güncelleyin:
   - `https://cdn.sanity.io/...` → `/products/{product-id}/images/main.jpg`
   - Veya görselleri `data/products/{product-id}/images/` altına koyun ve import edin

## Adım 4: Test Et

1. Yeni yapıyı test edin
2. Tüm ürünlerin doğru yüklendiğini kontrol edin
3. Görsellerin doğru gösterildiğini kontrol edin

## Adım 5: CMS Bağımlılığını Kaldır (Opsiyonel)

Eğer tamamen CMS'den bağımsız olmak istiyorsanız:
- Sanity bağımlılıklarını kaldırın
- `useSanity` kontrolünü kaldırın
- Sadece statik dosyalardan okuyun

## Avantajlar

✅ **Hızlı**: Dosya sistemi okuma, API çağrısından daha hızlı
✅ **Basit**: Karmaşık CMS yapılandırması yok
✅ **Versiyon Kontrolü**: Git ile takip edilebilir
✅ **Offline**: İnternet bağlantısı gerektirmez
✅ **Maliyet**: CMS hosting maliyeti yok

## Dezavantajlar

⚠️ **Manuel Güncelleme**: Ürün eklemek/düzenlemek için dosya düzenleme gerekir
⚠️ **Build Zamanı**: Büyük ürün katalogları build süresini artırabilir
⚠️ **Dinamik İçerik**: Gerçek zamanlı güncellemeler için uygun değil



