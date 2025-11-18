/**
 * Statik dosyalardan ürün verilerini yükler
 * CMS yerine data/products/ klasöründen okur
 */

import type { Product } from '../types';

/**
 * Tüm ürünleri yükler
 * data/products/ klasöründeki tüm metadata.json dosyalarını okur
 * 
 * Not: Vite JSON dosyalarını doğrudan import edebilir
 */
export async function loadProductsFromFiles(): Promise<Product[]> {
  // Vite'ın import.meta.glob özelliğini kullanarak tüm metadata.json dosyalarını yükle
  const productModules = import.meta.glob<Product>(
    '../data/products/**/metadata.json',
    {
      eager: true,
      import: 'default',
    }
  );

  const products: Product[] = [];

  for (const path in productModules) {
    try {
      const product = productModules[path];
      if (product) {
        products.push(product);
      }
    } catch (error) {
      console.error(`Ürün yüklenirken hata: ${path}`, error);
    }
  }

  return products;
}

/**
 * Belirli bir ürünü ID'ye göre yükler
 */
export async function loadProductById(id: string): Promise<Product | undefined> {
  try {
    // Önce JSON dosyasından dene
    const jsonModule = await import(`../data/products/${id}/metadata.json`);
    return jsonModule.default as Product;
  } catch (error) {
    // Alternatif: TypeScript dosyasından import et
    try {
      const tsModule = await import(`../data/products/${id}/metadata`);
      return tsModule.default as Product;
    } catch (tsError) {
      console.error(`Ürün bulunamadı: ${id}`, error, tsError);
      return undefined;
    }
  }
}

/**
 * Kategoriye göre ürünleri yükler
 */
export async function loadProductsByCategory(categoryId: string): Promise<Product[]> {
  const allProducts = await loadProductsFromFiles();
  return allProducts.filter(p => p.categoryId === categoryId);
}

/**
 * Tasarımcıya göre ürünleri yükler
 */
export async function loadProductsByDesigner(designerId: string): Promise<Product[]> {
  const allProducts = await loadProductsFromFiles();
  return allProducts.filter(p => p.designerId === designerId);
}

