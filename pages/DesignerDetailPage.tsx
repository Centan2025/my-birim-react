

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Designer, Product } from '../types';
import { getDesignerById, getProductsByDesignerId } from '../services/cms';
import { ProductCard } from '../components/ProductCard';
import { useTranslation } from '../i18n';

export function DesignerDetailPage() {
  const { designerId } = useParams<{ designerId: string }>();
  const [designer, setDesigner] = useState<Designer | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDesigner = async () => {
      setLoading(true);
      if (designerId) {
        const designerData = await getDesignerById(designerId);
        setDesigner(designerData);
        if (designerData) {
          const productList = await getProductsByDesignerId(designerData.id);
          setProducts(productList);
        }
      }
      setLoading(false);
    };
    fetchDesigner();
  }, [designerId]);

  if (loading) {
    return <div className="pt-20 text-center">{t('loading')}...</div>;
  }

  if (!designer) {
    return <div className="pt-20 text-center">{t('designer_not_found')}</div>;
  }

  return (
    <div className="bg-gray-50 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-12">
            <div className="flex-shrink-0">
                <img src={designer.image} alt={t(designer.name)} className="w-64 h-80 md:w-72 md:h-96 object-cover shadow-lg filter grayscale" />
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-gray-900">{t(designer.name)}</h1>
                <p className="mt-4 text-gray-700 max-w-2xl leading-relaxed">{t(designer.bio)}</p>
            </div>
        </div>

        <div className="border-t pt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('designs')}</h2>
            {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-600">{t('no_products_by_designer')}</p>
            )}
        </div>
      </div>
    </div>
  );
}