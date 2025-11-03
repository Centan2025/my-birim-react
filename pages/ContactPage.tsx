import React, { useState, useEffect, useMemo } from 'react';
import { getContactPageContent } from '../services/cms';
import type { ContactPageContent, ContactLocation } from '../types';
import { useTranslation } from '../i18n';

const MapPinIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const PhoneIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MailIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);

const LocationCard: React.FC<{
  location: ContactLocation;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ location, isSelected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
    >
      <h3 className="text-xl font-semibold text-gray-900">{t(location.title)}</h3>
      <p className="mt-2 text-gray-600 flex items-start gap-2">
        <MapPinIcon className="mt-1 flex-shrink-0 text-gray-400" />
        <span>{location.address}</span>
      </p>
      <p className="mt-1 text-gray-600 flex items-center gap-2">
        <PhoneIcon className="flex-shrink-0 text-gray-400" />
        <span>{location.phone}</span>
      </p>
      {location.email && (
        <p className="mt-1 text-gray-600 flex items-center gap-2">
          <MailIcon className="flex-shrink-0 text-gray-400" />
          <span>{location.email}</span>
        </p>
      )}
    </div>
  );
};


export function ContactPage() {
  const [content, setContent] = useState<ContactPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<ContactLocation | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const pageContent = await getContactPageContent();
      setContent(pageContent);
      if (pageContent && pageContent.locations.length > 0) {
        const firstWithMap = pageContent.locations.find(loc => loc.mapEmbedUrl);
        setSelectedLocation(firstWithMap || pageContent.locations[0]);
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  // Fix: Ensure useMemo always returns a consistently typed object to avoid type inference issues.
  // FIX: Explicitly setting the return type for useMemo to avoid type inference issues with Object.entries downstream.
  const locationGroups = useMemo((): Record<string, ContactLocation[]> => {
    const groups: Record<string, ContactLocation[]> = {};
    for (const loc of content?.locations || []) {
      const type = t(loc.type) || t('other_location_type');
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(loc);
    }
    return groups;
  }, [content, t]);


  if (loading || !content) {
    return <div className="flex items-center justify-center h-screen">{t('loading')}...</div>;
  }
  
  return (
    <div className="bg-gray-50 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t(content.title)}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">{t(content.subtitle)}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-8 overflow-y-auto max-h-[600px]">
             {/* FIX: Refactored to use Object.keys to avoid potential type inference issues with Object.entries in some TypeScript environments. */}
             {Object.keys(locationGroups).map((type) => (
              <div key={type}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">{type}</h2>
                <div className="space-y-4">
                  {locationGroups[type].map((loc, index) => <LocationCard 
                    key={index} 
                    location={loc} 
                    isSelected={selectedLocation?.title === loc.title && selectedLocation?.address === loc.address}
                    onSelect={() => setSelectedLocation(loc)}
                  />)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden min-h-[400px] md:min-h-0 sticky top-28 h-[600px]">
            {selectedLocation?.mapEmbedUrl ? (
              <iframe
                src={selectedLocation.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${t(selectedLocation.title)}`}
                key={selectedLocation.mapEmbedUrl}
              ></iframe>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    <p>{t('map_not_available')}</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
