import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useTranslation } from '../i18n';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.mainImage}
          alt={t(product.name)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 overflow-hidden">
        <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-black">{t(product.name)}</h3>
            <p className="text-sm text-gray-500 mt-1">{product.year}</p>
        </div>
      </div>
    </Link>
  );
};