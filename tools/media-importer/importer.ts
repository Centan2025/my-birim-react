#!/usr/bin/env node

/**
 * Medya İçe Aktarma Aracı
 * 
 * Klasör yapısından ürün ve tasarımcı görsellerini otomatik olarak yükler.
 * 
 * Kullanım:
 *   npm run import -- --source "F:/Medya" --mode json
 *   npm run import -- --source "F:/Medya" --mode sanity
 * 
 * Klasör Yapısı:
 *   <kaynak>/
 *     ├── ürünler/
 *     │   └── <kategori>/ (örn: "01 - KANEPELER")
 *     │       └── <model>/ (örn: "01 - 0203 - SU" veya "RICH")
 *     │           ├── görsel1.jpg
 *     │           ├── görsel2_kapak.jpg (Ana kapak görseli)
 *     │           └── görsel3_kapak_mobil.jpg (Mobil kapak görseli)
 *     └── tasarımcılar/
 *         └── <tasarımcı-adı>/
 *             ├── profil.jpg (Tüm cihazlar için)
 *             └── profil_mobil.jpg (Mobil için)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@sanity/client';
import mime from 'mime-types';

// ============================================================================
// TİPLER
// ============================================================================

interface ProductImage {
  filename: string;
  fullPath: string;
  isCoverMain: boolean;      // _kapak ile biten
  isCoverMobile: boolean;    // _kapak_mobil ile biten
  isRegular: boolean;        // Normal görsel
}

interface ProductData {
  categoryId: string;
  categoryName: string;
  modelId: string;
  modelName: string;
  images: ProductImage[];
}

interface DesignerImage {
  filename: string;
  fullPath: string;
  isMobile: boolean;         // _mobil ile biten
  isGeneral: boolean;        // Tüm cihazlar için
}

interface DesignerData {
  designerId: string;
  designerName: string;
  images: DesignerImage[];
}

interface ImportResult {
  products: ProductData[];
  designers: DesignerData[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

/**
 * Türkçe karakterleri temizleyerek URL-dostu ID oluşturur
 */
function slugify(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };

  let result = text;
  Object.entries(turkishMap).forEach(([turkish, latin]) => {
    result = result.replace(new RegExp(turkish, 'g'), latin);
  });

  return result
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Klasör adından kategori/model adını çıkarır
 * Örnek: "01 - KANEPELER" -> "KANEPELER"
 * Örnek: "01 - 0203 - SU" -> "SU"
 * Örnek: "RICH" -> "RICH"
 */
function extractName(folderName: string): string {
  // Önce " - " ile böl ve son parçayı al
  const parts = folderName.split(' - ').map(p => p.trim());
  
  if (parts.length > 1) {
    // Son parça isim olmalı
    return parts[parts.length - 1];
  }
  
  // Eğer " - " yoksa, klasör adının tamamını kullan
  return folderName.trim();
}

/**
 * Dosyanın görsel dosyası olup olmadığını kontrol eder
 */
function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Görselin türünü belirler (kapak, kapak_mobil, normal)
 */
function categorizeProductImage(filename: string): { isCoverMain: boolean; isCoverMobile: boolean; isRegular: boolean } {
  const nameWithoutExt = path.basename(filename, path.extname(filename)).toLowerCase();
  
  // _kapak_mobil kontrolü (_kapak'tan önce)
  if (nameWithoutExt.endsWith('_kapak_mobil')) {
    return { isCoverMain: false, isCoverMobile: true, isRegular: false };
  }
  
  // _kapak kontrolü
  if (nameWithoutExt.endsWith('_kapak')) {
    return { isCoverMain: true, isCoverMobile: false, isRegular: false };
  }
  
  // Normal görsel
  return { isCoverMain: false, isCoverMobile: false, isRegular: true };
}

/**
 * Tasarımcı görselinin türünü belirler (mobil, genel)
 */
function categorizeDesignerImage(filename: string): { isMobile: boolean; isGeneral: boolean } {
  const nameWithoutExt = path.basename(filename, path.extname(filename)).toLowerCase();
  
  // _mobil kontrolü
  if (nameWithoutExt.endsWith('_mobil')) {
    return { isMobile: true, isGeneral: false };
  }
  
  // Genel görsel (tüm cihazlar için)
  return { isMobile: false, isGeneral: true };
}

/**
 * Dizinin var olup olmadığını ve okunabilir olup olmadığını kontrol eder
 */
function directoryExists(dirPath: string): boolean {
  try {
    const stat = fs.statSync(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Dizin içeriğini güvenli şekilde okur
 */
function readDirectorySafe(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error(`❌ Dizin okunamadı: ${dirPath}`, error);
    return [];
  }
}

// ============================================================================
// ANA İŞLEMLER
// ============================================================================

/**
 * Ürünler klasörünü tarar
 */
function scanProducts(productsDir: string): { products: ProductData[]; errors: string[]; warnings: string[] } {
  const products: ProductData[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!directoryExists(productsDir)) {
    errors.push(`Ürünler klasörü bulunamadı: ${productsDir}`);
    return { products, errors, warnings };
  }

  console.log(`\n📂 Ürünler klasörü taranıyor: ${productsDir}`);

  // Kategori klasörlerini oku
  const categoryFolders = readDirectorySafe(productsDir).filter(name => {
    const fullPath = path.join(productsDir, name);
    return directoryExists(fullPath);
  });

  console.log(`   Bulunan kategori sayısı: ${categoryFolders.length}`);

  for (const categoryFolder of categoryFolders) {
    const categoryPath = path.join(productsDir, categoryFolder);
    const categoryName = extractName(categoryFolder);
    const categoryId = slugify(categoryName);

    console.log(`\n   📁 Kategori: ${categoryName} (${categoryFolder})`);

    // Model klasörlerini oku
    const modelFolders = readDirectorySafe(categoryPath).filter(name => {
      const fullPath = path.join(categoryPath, name);
      return directoryExists(fullPath);
    });

    console.log(`      Bulunan model sayısı: ${modelFolders.length}`);

    for (const modelFolder of modelFolders) {
      const modelPath = path.join(categoryPath, modelFolder);
      const modelName = extractName(modelFolder);
      const modelId = slugify(modelName);

      // Görselleri oku
      const files = readDirectorySafe(modelPath);
      const imageFiles = files.filter(isImageFile);

      if (imageFiles.length === 0) {
        warnings.push(`Model "${modelName}" için görsel bulunamadı: ${modelPath}`);
        continue;
      }

      const images: ProductImage[] = imageFiles.map(filename => {
        const fullPath = path.join(modelPath, filename);
        const category = categorizeProductImage(filename);
        
        return {
          filename,
          fullPath,
          isCoverMain: category.isCoverMain,
          isCoverMobile: category.isCoverMobile,
          isRegular: category.isRegular,
        };
      });

      // Kapak görseli kontrolü
      const hasCoverMain = images.some(img => img.isCoverMain);
      if (!hasCoverMain) {
        warnings.push(`Model "${modelName}" için ana kapak görseli (_kapak) bulunamadı`);
      }

      products.push({
        categoryId,
        categoryName,
        modelId,
        modelName,
        images,
      });

      console.log(`      ✓ ${modelName}: ${imageFiles.length} görsel`);
    }
  }

  return { products, errors, warnings };
}

/**
 * Tasarımcılar klasörünü tarar
 */
function scanDesigners(designersDir: string): { designers: DesignerData[]; errors: string[]; warnings: string[] } {
  const designers: DesignerData[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!directoryExists(designersDir)) {
    errors.push(`Tasarımcılar klasörü bulunamadı: ${designersDir}`);
    return { designers, errors, warnings };
  }

  console.log(`\n📂 Tasarımcılar klasörü taranıyor: ${designersDir}`);

  // Tasarımcı klasörlerini oku
  const designerFolders = readDirectorySafe(designersDir).filter(name => {
    const fullPath = path.join(designersDir, name);
    return directoryExists(fullPath);
  });

  console.log(`   Bulunan tasarımcı sayısı: ${designerFolders.length}`);

  for (const designerFolder of designerFolders) {
    const designerPath = path.join(designersDir, designerFolder);
    const designerName = designerFolder; // Tasarımcı adı doğrudan klasör adı
    const designerId = slugify(designerName);

    // Görselleri oku
    const files = readDirectorySafe(designerPath);
    const imageFiles = files.filter(isImageFile);

    if (imageFiles.length === 0) {
      warnings.push(`Tasarımcı "${designerName}" için görsel bulunamadı: ${designerPath}`);
      continue;
    }

    const images: DesignerImage[] = imageFiles.map(filename => {
      const fullPath = path.join(designerPath, filename);
      const category = categorizeDesignerImage(filename);
      
      return {
        filename,
        fullPath,
        isMobile: category.isMobile,
        isGeneral: category.isGeneral,
      };
    });

    designers.push({
      designerId,
      designerName,
      images,
    });

    console.log(`   ✓ ${designerName}: ${imageFiles.length} görsel`);
  }

  return { designers, errors, warnings };
}

/**
 * Ana tarama fonksiyonu
 */
export function scanMediaDirectory(sourceDir: string): ImportResult {
  console.log(`\n🔍 Medya klasörü taranmaya başlanıyor...`);
  console.log(`   Kaynak: ${sourceDir}\n`);

  // Klasörleri bul (büyük/küçük harf duyarsız, Türkçe karakter destekli)
  const allFolders = readDirectorySafe(sourceDir);
  const productsFolder = allFolders.find(f => {
    const lower = f.toLowerCase();
    return lower.includes('urun') || lower.includes('ürün');
  }) || 'ürünler';
  const designersFolder = allFolders.find(f => {
    const lower = f.toLowerCase();
    return lower.includes('tasarim') || lower.includes('tasarım');
  }) || 'tasarımcılar';
  
  const productsDir = path.join(sourceDir, productsFolder);
  const designersDir = path.join(sourceDir, designersFolder);

  const productScan = scanProducts(productsDir);
  const designerScan = scanDesigners(designersDir);

  const result: ImportResult = {
    products: productScan.products,
    designers: designerScan.designers,
    errors: [...productScan.errors, ...designerScan.errors],
    warnings: [...productScan.warnings, ...designerScan.warnings],
  };

  // Özet
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TARAMA ÖZETİ`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✓ Toplam Ürün: ${result.products.length}`);
  console.log(`✓ Toplam Tasarımcı: ${result.designers.length}`);
  console.log(`⚠ Uyarı: ${result.warnings.length}`);
  console.log(`❌ Hata: ${result.errors.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  UYARILAR:`);
    result.warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (result.errors.length > 0) {
    console.log(`\n❌ HATALAR:`);
    result.errors.forEach(e => console.log(`   - ${e}`));
  }

  return result;
}

/**
 * JSON dosyalarını oluşturur (data/products/ ve data/designers/)
 */
export async function exportToJSON(result: ImportResult, outputDir: string): Promise<void> {
  console.log(`\n💾 JSON dosyaları oluşturuluyor...`);
  console.log(`   Çıktı dizini: ${outputDir}\n`);

  const productsDir = path.join(outputDir, 'products');
  const designersDir = path.join(outputDir, 'designers');

  // Dizinleri oluştur
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }
  if (!fs.existsSync(designersDir)) {
    fs.mkdirSync(designersDir, { recursive: true });
  }

  // Ürünleri işle
  for (const product of result.products) {
    const productDir = path.join(productsDir, product.categoryId, product.modelId);
    
    // Model dizinini oluştur
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // Görselleri kategorize et
    const coverMain = product.images.find(img => img.isCoverMain);
    const coverMobile = product.images.find(img => img.isCoverMobile);
    const regularImages = product.images.filter(img => img.isRegular);

    // metadata.json oluştur
    const metadata = {
      id: `${product.categoryId}-${product.modelId}`,
      name: {
        tr: product.modelName,
        en: product.modelName,
      },
      categoryId: product.categoryId,
      designerId: "unknown", // Manuel olarak ayarlanmalı
      year: new Date().getFullYear(),
      description: {
        tr: `${product.modelName} modeli hakkında açıklama`,
        en: `Description for ${product.modelName}`,
      },
      mainImage: coverMain ? {
        url: `./images/${coverMain.filename}`,
        urlMobile: coverMobile ? `./images/${coverMobile.filename}` : undefined,
      } : regularImages.length > 0 ? `./images/${regularImages[0].filename}` : "",
      alternativeImages: regularImages.slice(1).map(img => `./images/${img.filename}`),
      buyable: false,
      price: 0,
      currency: "TRY",
      materials: [],
      exclusiveContent: {
        images: [],
        drawings: [],
        models3d: [],
      },
    };

    // Undefined alanları temizle
    if (!metadata.mainImage.urlMobile) {
      delete metadata.mainImage.urlMobile;
    }

    const metadataPath = path.join(productDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log(`   ✓ ${product.categoryName}/${product.modelName}`);

    // TODO: Görselleri kopyala (isteğe bağlı)
    // Şu anda sadece path'leri kaydediyoruz
  }

  // Tasarımcıları işle
  for (const designer of result.designers) {
    const designerFile = path.join(designersDir, `${designer.designerId}.json`);

    const generalImage = designer.images.find(img => img.isGeneral);
    const mobileImage = designer.images.find(img => img.isMobile);

    const metadata = {
      id: designer.designerId,
      name: {
        tr: designer.designerName,
        en: designer.designerName,
      },
      bio: {
        tr: `${designer.designerName} hakkında bilgi`,
        en: `About ${designer.designerName}`,
      },
      image: generalImage ? generalImage.fullPath : (mobileImage ? mobileImage.fullPath : ""),
      imageMobile: mobileImage ? mobileImage.fullPath : undefined,
    };

    // Undefined alanları temizle
    if (!metadata.imageMobile) {
      delete metadata.imageMobile;
    }

    fs.writeFileSync(designerFile, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log(`   ✓ ${designer.designerName}`);
  }

  console.log(`\n✅ JSON dışa aktarma tamamlandı!`);
}

/**
 * Sanity client oluşturur
 */
function createSanityClient() {
  const projectId = process.env.SANITY_PROJECT_ID || 'wn3a082f';
  const dataset = process.env.SANITY_DATASET || 'production';
  const token = process.env.SANITY_TOKEN;

  if (!token) {
    throw new Error(
      'SANITY_TOKEN environment variable gerekli!\n' +
      'Kullanım: SANITY_TOKEN=your_token npm run import -- --source "..." --mode sanity'
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    token,
    useCdn: false,
  });
}

/**
 * Dosyayı Sanity asset olarak yükler
 */
async function uploadImageToSanity(client: any, filePath: string): Promise<any> {
  const fileStream = fs.createReadStream(filePath);
  const mimeType = mime.lookup(filePath) || 'image/jpeg';
  const filename = path.basename(filePath);

  try {
    const asset = await client.assets.upload('image', fileStream, {
      filename,
      contentType: mimeType,
    });
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };
  } catch (error: any) {
    console.error(`   ❌ Görsel yüklenemedi: ${filename}`, error.message);
    throw error;
  }
}

/**
 * Kategori ID'sinden Sanity _id oluşturur
 */
function getCategoryDocId(categoryId: string): string {
  return `category-${categoryId}`;
}

/**
 * Tasarımcı ID'sinden Sanity _id oluşturur
 */
function getDesignerDocId(designerId: string): string {
  return `designer-${designerId}`;
}

/**
 * Ürün ID'sinden Sanity _id oluşturur
 */
function getProductDocId(categoryId: string, modelId: string): string {
  return `product-${categoryId}-${modelId}`;
}

/**
 * Sanity'de kategori oluşturur veya günceller
 */
async function upsertCategory(client: any, categoryId: string, categoryName: string, existingCategories: Set<string>): Promise<void> {
  const docId = getCategoryDocId(categoryId);
  
  if (existingCategories.has(docId)) {
    console.log(`   ⏭  Kategori zaten var: ${categoryName}`);
    return;
  }

  const doc = {
    _type: 'category',
    _id: docId,
    id: {
      _type: 'slug',
      current: categoryId,
    },
    name: {
      tr: categoryName,
      en: categoryName,
    },
    subtitle: {
      tr: `${categoryName} kategorisi`,
      en: `${categoryName} category`,
    },
    // heroImage boş bırakılıyor, manuel olarak eklenebilir
  };

  try {
    await client.createOrReplace(doc);
    existingCategories.add(docId);
    console.log(`   ✓ Kategori oluşturuldu: ${categoryName}`);
  } catch (error: any) {
    console.error(`   ❌ Kategori oluşturulamadı: ${categoryName}`, error.message);
    throw error;
  }
}

/**
 * Sanity'de tasarımcı oluşturur veya günceller
 */
async function upsertDesigner(client: any, designer: DesignerData, existingDesigners: Set<string>): Promise<void> {
  const docId = getDesignerDocId(designer.designerId);
  
  console.log(`\n   📸 Tasarımcı: ${designer.designerName}`);

  // Görselleri yükle
  const generalImage = designer.images.find(img => img.isGeneral);
  const mobileImage = designer.images.find(img => img.isMobile);

  let imageAsset = null;
  let imageMobileAsset = null;

  if (generalImage) {
    console.log(`      Genel görsel yükleniyor...`);
    imageAsset = await uploadImageToSanity(client, generalImage.fullPath);
  }

  if (mobileImage) {
    console.log(`      Mobil görsel yükleniyor...`);
    imageMobileAsset = await uploadImageToSanity(client, mobileImage.fullPath);
  }

  const doc: any = {
    _type: 'designer',
    _id: docId,
    id: {
      _type: 'slug',
      current: designer.designerId,
    },
    name: {
      tr: designer.designerName,
      en: designer.designerName,
    },
    bio: {
      tr: `${designer.designerName} hakkında bilgi`,
      en: `About ${designer.designerName}`,
    },
  };

  if (imageAsset) {
    doc.image = imageAsset;
  }

  if (imageMobileAsset) {
    doc.imageMobile = imageMobileAsset;
  }

  try {
    await client.createOrReplace(doc);
    existingDesigners.add(docId);
    console.log(`   ✓ Tasarımcı oluşturuldu: ${designer.designerName}`);
  } catch (error: any) {
    console.error(`   ❌ Tasarımcı oluşturulamadı: ${designer.designerName}`, error.message);
    throw error;
  }
}

/**
 * Sanity'de ürün oluşturur veya günceller
 */
async function upsertProduct(client: any, product: ProductData, existingProducts: Set<string>): Promise<void> {
  const docId = getProductDocId(product.categoryId, product.modelId);
  const categoryRef = getCategoryDocId(product.categoryId);
  
  console.log(`\n   📸 Ürün: ${product.categoryName}/${product.modelName}`);

  // Görselleri kategorize et
  const coverMain = product.images.find(img => img.isCoverMain);
  const coverMobile = product.images.find(img => img.isCoverMobile);
  const regularImages = product.images.filter(img => img.isRegular);

  // Ana kapak görselini yükle
  let mainImageAsset = null;
  let mainImageMobileAsset = null;

  if (coverMain) {
    console.log(`      Ana kapak yükleniyor: ${coverMain.filename}`);
    mainImageAsset = await uploadImageToSanity(client, coverMain.fullPath);
  } else if (regularImages.length > 0) {
    console.log(`      ⚠️ Ana kapak bulunamadı, ilk görsel kullanılıyor: ${regularImages[0].filename}`);
    mainImageAsset = await uploadImageToSanity(client, regularImages[0].fullPath);
  }

  if (coverMobile) {
    console.log(`      Mobil kapak yükleniyor: ${coverMobile.filename}`);
    mainImageMobileAsset = await uploadImageToSanity(client, coverMobile.fullPath);
  }

  // Alternatif görselleri yükle
  const alternativeImageAssets = [];
  const imagesToUpload = coverMain ? regularImages : regularImages.slice(1); // Ana kapak için ilk görseli kullandıysak onu atla

  for (const img of imagesToUpload) {
    console.log(`      Alternatif görsel yükleniyor: ${img.filename}`);
    try {
      const asset = await uploadImageToSanity(client, img.fullPath);
      alternativeImageAssets.push(asset);
    } catch (error) {
      console.log(`      ⚠️ Görsel yüklenemedi, atlanıyor: ${img.filename}`);
    }
  }

  const doc: any = {
    _type: 'product',
    _id: docId,
    id: {
      _type: 'slug',
      current: `${product.categoryId}-${product.modelId}`,
    },
    name: {
      tr: product.modelName,
      en: product.modelName,
    },
    year: new Date().getFullYear(),
    isPublished: false, // Manuel olarak publish edilebilir
    description: {
      tr: `${product.modelName} modeli hakkında açıklama`,
      en: `Description for ${product.modelName}`,
    },
    category: {
      _type: 'reference',
      _ref: categoryRef,
    },
    // designer referansı manuel olarak eklenebilir
    buyable: false,
    price: 0,
    currency: 'TRY',
  };

  if (mainImageAsset) {
    doc.mainImage = mainImageAsset;
  }

  if (mainImageMobileAsset) {
    doc.mainImageMobile = mainImageMobileAsset;
  }

  if (alternativeImageAssets.length > 0) {
    doc.alternativeImages = alternativeImageAssets;
  }

  try {
    await client.createOrReplace(doc);
    existingProducts.add(docId);
    console.log(`   ✓ Ürün oluşturuldu: ${product.modelName} (${alternativeImageAssets.length + (mainImageAsset ? 1 : 0)} görsel)`);
  } catch (error: any) {
    console.error(`   ❌ Ürün oluşturulamadı: ${product.modelName}`, error.message);
    throw error;
  }
}

/**
 * Sanity'ye yükler
 */
export async function exportToSanity(result: ImportResult): Promise<void> {
  console.log(`\n🚀 Sanity'ye yükleme başlatılıyor...\n`);

  const client = createSanityClient();
  console.log(`   ✓ Sanity client oluşturuldu`);
  console.log(`   Proje: ${client.config().projectId}`);
  console.log(`   Dataset: ${client.config().dataset}\n`);

  // Mevcut dökümanları takip et (gereksiz oluşturmaları önlemek için)
  const existingCategories = new Set<string>();
  const existingDesigners = new Set<string>();
  const existingProducts = new Set<string>();

  try {
    // 1. Tasarımcıları yükle
    if (result.designers.length > 0) {
      console.log(`${'='.repeat(60)}`);
      console.log(`📤 TASARCILAR YÜKLENİYOR (${result.designers.length} adet)`);
      console.log(`${'='.repeat(60)}`);

      for (const designer of result.designers) {
        await upsertDesigner(client, designer, existingDesigners);
      }
    }

    // 2. Kategorileri oluştur (ürünlerden önce)
    if (result.products.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📂 KATEGORİLER OLUŞTURULUYOR`);
      console.log(`${'='.repeat(60)}\n`);

      const uniqueCategories = new Map<string, string>();
      result.products.forEach(p => {
        uniqueCategories.set(p.categoryId, p.categoryName);
      });

      for (const [categoryId, categoryName] of uniqueCategories) {
        await upsertCategory(client, categoryId, categoryName, existingCategories);
      }

      // 3. Ürünleri yükle
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📤 ÜRÜNLER YÜKLENİYOR (${result.products.length} adet)`);
      console.log(`${'='.repeat(60)}`);

      for (const product of result.products) {
        await upsertProduct(client, product, existingProducts);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SANITY YÜKLEMESİ TAMAMLANDI!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✓ Tasarımcı: ${existingDesigners.size}`);
    console.log(`✓ Kategori: ${existingCategories.size}`);
    console.log(`✓ Ürün: ${existingProducts.size}`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`📝 SONRAKİ ADIMLAR:`);
    console.log(`   1. Sanity Studio'da ürünleri kontrol edin`);
    console.log(`   2. Ürünlere tasarımcı ataması yapın`);
    console.log(`   3. Kategorilere hero image ekleyin`);
    console.log(`   4. Ürün açıklamalarını düzenleyin`);
    console.log(`   5. Ürünleri publish edin (isPublished: true)\n`);

  } catch (error: any) {
    console.error(`\n❌ Sanity yüklemesi sırasında hata oluştu:`, error.message);
    throw error;
  }
}

// ============================================================================
// CLI
// ============================================================================

function printUsage() {
  console.log(`
Kullanım:
  npm run import -- --source <klasör-yolu> --mode <json|sanity> [--output <çıktı-klasörü>]

Parametreler:
  --source    Kaynak medya klasörü (ürünler/ ve tasarımcılar/ içeren)
  --mode      Dışa aktarma modu: 'json' veya 'sanity'
  --output    JSON modu için çıktı klasörü (varsayılan: ./data)

Örnek:
  npm run import -- --source "F:/Medya" --mode json
  npm run import -- --source "F:/Medya" --mode json --output "./export"
  npm run import -- --source "F:/Medya" --mode sanity
  `);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let source = '';
  let mode: 'json' | 'sanity' | '' = '';
  let output = './data';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1];
      i++;
    } else if (args[i] === '--mode' && args[i + 1]) {
      mode = args[i + 1] as 'json' | 'sanity';
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  // Validate
  if (!source || !mode) {
    printUsage();
    process.exit(1);
  }

  if (!directoryExists(source)) {
    console.error(`❌ Kaynak klasör bulunamadı: ${source}`);
    process.exit(1);
  }

  // Scan
  const result = scanMediaDirectory(source);

  if (result.errors.length > 0) {
    console.error(`\n❌ Tarama sırasında hatalar oluştu. Devam edilemiyor.`);
    process.exit(1);
  }

  // Export
  if (mode === 'json') {
    await exportToJSON(result, output);
  } else if (mode === 'sanity') {
    await exportToSanity(result);
  }

  console.log(`\n✨ İşlem tamamlandı!\n`);
}

// CLI modunda çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`\n❌ Beklenmeyen hata:`, error);
    process.exit(1);
  });
}

