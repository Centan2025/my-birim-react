import { useState, useEffect } from 'react';
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
    <div className="bg-gray-100 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-8 md:gap-16 mb-12">
            <div className="flex-shrink-0">
                <img src={designer.image} alt={t(designer.name)} className="w-80 h-96 md:w-96 md:h-[32rem] object-cover shadow-lg filter grayscale" />
            </div>
            <div className="text-left w-full">
                <div className="max-w-2xl">
                    <h1 className="text-4xl font-light text-gray-600">{t(designer.name)}</h1>
                    <p className="mt-4 text-gray-500 leading-relaxed">{t(designer.bio)}</p>
                </div>
            </div>
        </div>

        <div className="border-t pt-12">
            <h2 className="text-3xl font-light text-gray-600 mb-8">{t('designs')}</h2>
            {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} variant="light" />
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