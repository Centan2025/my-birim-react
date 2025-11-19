# Ürün Verileri Klasör Yapısı

Bu klasör, CMS yerine statik dosyalarda tutulan ürün verilerini içerir.

## Klasör Yapısı

Her ürün için ayrı bir klasör oluşturun:

```
data/products/
├── bristol-sofa/
│   ├── metadata.json          # Ürün bilgileri (JSON formatında)
│   ├── images/                # Görseller
│   │   ├── main.jpg
│   │   ├── main-mobile.jpg
│   │   ├── main-desktop.jpg
│   │   ├── alt-1.jpg
│   │   └── alt-2.jpg
│   ├── media/                 # Videolar ve diğer medya
│   │   ├── hero-video.mp4
│   │   └── hero-video-mobile.mp4
│   ├── dimensions/            # Boyut çizimleri
│   │   ├── dim-1.jpg
│   │   └── dim-2.jpg
│   └── exclusive/             # Özel içerik (giriş gerektirir)
│       ├── images/
│       ├── drawings/
│       └── models3d/
└── husk-armchair/
    ├── metadata.json
    └── ...
```

## Alternatif: Tek Dosya Yapısı

Daha basit bir yaklaşım için her ürün için tek bir JSON dosyası:

```
data/products/
├── bristol-sofa.json
├── husk-armchair.json
└── charles-sofa.json
```

Bu durumda görseller `public/products/` altında tutulabilir.

## Metadata.json Formatı

```json
{
  "id": "bristol-sofa",
  "name": {
    "tr": "Bristol Kanepe",
    "en": "Bristol Sofa"
  },
  "designerId": "jean-marie-massaud",
  "categoryId": "kanepeler",
  "year": 2013,
  "description": {
    "tr": "Açıklama...",
    "en": "Description..."
  },
  "mainImage": {
    "url": "/products/bristol-sofa/images/main.jpg",
    "urlMobile": "/products/bristol-sofa/images/main-mobile.jpg",
    "urlDesktop": "/products/bristol-sofa/images/main-desktop.jpg"
  },
  "alternativeImages": [
    "/products/bristol-sofa/images/alt-1.jpg",
    "/products/bristol-sofa/images/alt-2.jpg"
  ],
  "buyable": true,
  "price": 150000,
  "currency": "TRY",
  "sku": "BRI-001",
  "stockStatus": "in_stock",
  "materials": [
    {
      "name": {
        "tr": "Kumaş",
        "en": "Fabric"
      },
      "image": "/products/bristol-sofa/images/material-fabric.jpg"
    }
  ]
}
```



