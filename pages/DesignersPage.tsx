

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Designer } from '../types';
import { getDesigners } from '../services/cms';
import { useTranslation } from '../i18n';

const DesignerCard: React.FC<{ designer: Designer }> = ({ designer }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/designer/${designer.id}`} className="group block text-center">
      <div className="overflow-hidden bg-white">
        <img
          src={designer.image}
          alt={t(designer.name)}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter grayscale"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-black">{t(designer.name)}</h3>
      </div>
    </Link>
  );
};


export function DesignersPage() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDesigners = async () => {
      setLoading(true);
      const designerList = await getDesigners();
      setDesigners(designerList);
      setLoading(false);
    };

    fetchDesigners();
  }, []);
  
  if (loading) {
    return <div className="pt-20 text-center">{t('loading')}...</div>;
  }

  return (
    <div className="bg-gray-50 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          {t('designers')}
        </h1>
        {designers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
            {designers.map((designer) => (
              <DesignerCard key={designer.id} designer={designer} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">{t('designer_not_found')}</p>
        )}
      </div>
    </div>
  );
}