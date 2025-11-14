

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Designer } from '../types';
import { getDesigners } from '../services/cms';
import { OptimizedImage } from '../components/OptimizedImage';
import { useTranslation } from '../i18n';
import { useSiteSettings } from '../App';

const DesignerCard: React.FC<{ designer: Designer }> = ({ designer }) => {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const imageBorderClass = settings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none';
  return (
    <Link to={`/designer/${designer.id}`} className="group flex flex-col h-full text-center">
      <div className={`overflow-hidden bg-white aspect-[3/4] ${imageBorderClass}`}>
        <OptimizedImage
          src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''}
          srcMobile={typeof designer.image === 'object' ? designer.image.urlMobile : designer.imageMobile}
          srcDesktop={typeof designer.image === 'object' ? designer.image.urlDesktop : designer.imageDesktop}
          alt={t(designer.name)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter grayscale ${imageBorderClass}`}
          loading="lazy"
          quality={85}
        />
      </div>
      <div className="mt-4 min-h-[2.5rem] flex items-center justify-center">
        <h3 className="text-xl font-light text-gray-500 group-hover:text-gray-600">{t(designer.name)}</h3>
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
    <div className="bg-gray-100 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-600">{t('designers')}</h1>
          <div className="h-px bg-gray-300 mt-4 w-full"></div>
        </div>
        {designers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 items-stretch">
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