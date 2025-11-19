/**
 * Tüm ürünleri tek bir dosyadan export et
 * Bu yaklaşım daha basit ama büyük kataloglar için yavaş olabilir
 */

import type { Product } from '../../types';
import bristolSofa from './bristol-sofa/metadata';

// Tüm ürünleri buraya ekleyin
const allProducts: Product[] = [
  bristolSofa,
  // Diğer ürünleri buraya ekleyin:
  // huskArmchair,
  // charlesSofa,
  // ...
];

export default allProducts;

/**
 * ID'ye göre ürün bul
 */
export function getProductById(id: string): Product | undefined {
  return allProducts.find(p => p.id === id);
}

/**
 * Kategoriye göre ürünleri filtrele
 */
export function getProductsByCategory(categoryId: string): Product[] {
  return allProducts.filter(p => p.categoryId === categoryId);
}

/**
 * Tasarımcıya göre ürünleri filtrele
 */
export function getProductsByDesigner(designerId: string): Product[] {
  return allProducts.filter(p => p.designerId === designerId);
}



