import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getContactPageContent } from '../services/cms';
import type { ContactPageContent, ContactLocation, ContactLocationMedia } from '../types';
import { OptimizedImage } from '../components/OptimizedImage';
import { OptimizedVideo } from '../components/OptimizedVideo';
import { useTranslation } from '../i18n';

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return (match && match[1].length === 11) ? match[1] : null;
};

const youTubeThumb = (url: string): string => {
  const videoId = getYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
};

const convertGoogleMapsUrlToEmbed = (url: string): string => {
  if (!url) return '';
  
  // Zaten embed URL ise olduğu gibi döndür
  if (url.includes('/embed')) {
    // Eğer https:// yoksa ekle
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }
  
  // Place ID'yi çıkar - format: !1s0x14cab93b568287b3:0xbae194105488893c
  // Veya data=!4m2!3m1!1s0x14cab93b568287b3:0xbae194105488893c formatında
  const placeIdMatch = url.match(/!1s([^!?&]+)/);
  if (placeIdMatch && placeIdMatch[1]) {
    const placeId = placeIdMatch[1];
    // Embed URL formatına çevir - Google Maps embed formatı
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${encodeURIComponent(placeId)}!2s!5e0!3m2!1str!2str!4v1!5m2!1str!2str`;
  }
  
  // data parametresinden çıkar - format: data=!4m2!3m1!1s...
  const dataMatch = url.match(/data=!([^?&]+)/);
  if (dataMatch && dataMatch[1]) {
    const data = dataMatch[1];
    // Embed URL formatına çevir
    return `https://www.google.com/maps/embed?pb=!${data}`;
  }
  
  // Place link formatı: google.com/maps/place/...
  const placeMatch = url.match(/maps\/place\/([^\/\?]+)/);
  if (placeMatch && placeMatch[1]) {
    const placeName = placeMatch[1];
    // Place name ile search yaparak embed oluştur
    return `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(placeName)}`;
  }
  
  // Hiçbiri eşleşmezse, https:// ekleyip döndür
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

const MapPinIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const PhoneIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MailIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);

const MediaModal: React.FC<{
  media: ContactLocationMedia;
  isOpen: boolean;
  onClose: () => void;
}> = ({ media, isOpen, onClose }) => {
  if (!isOpen || !media) return null;

  const getMediaUrl = () => {
    if (media.type === 'image' && media.url) {
      return media.url;
    }
    if (media.type === 'video' && media.url) {
      return media.url;
    }
    if (media.type === 'youtube' && media.url) {
      const videoId = getYouTubeId(media.url);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : media.url;
    }
    return '';
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      style={{ zIndex: 100 }}
    >
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-4 md:right-4 text-white hover:text-gray-300 transition-colors text-4xl font-light bg-black/70 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/90 shadow-lg"
          aria-label="Close"
          style={{ zIndex: 101, top: '80px' }}
        >
          ×
        </button>
        {media.type === 'youtube' ? (
          <iframe
            src={getMediaUrl()}
            className="w-full h-full max-w-7xl max-h-[90vh]"
            allow="autoplay; encrypted-media; fullscreen"
            frameBorder="0"
          />
        ) : media.type === 'video' ? (
          <OptimizedVideo
            src={getMediaUrl()}
            controls
            autoPlay
            className="w-full h-full max-w-7xl max-h-[90vh] object-contain"
            preload="auto"
            loading="eager"
          />
        ) : (
          <OptimizedImage
            src={getMediaUrl()}
            alt=""
            className="w-full h-full max-w-7xl max-h-[90vh] object-contain"
            loading="eager"
            quality={95}
          />
        )}
      </div>
    </div>
  );
};

const LocationCard: React.FC<{
  location: ContactLocation;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ location, isSelected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
    >
      <h3 className="text-xl font-light text-gray-500">{t(location.title)}</h3>
      <p className="mt-2 text-gray-500 flex items-start gap-2 font-light">
        <MapPinIcon className="mt-1 flex-shrink-0 text-gray-400" />
        <span>{location.address}</span>
      </p>
      <p className="mt-1 text-gray-500 flex items-center gap-2 font-light">
        <PhoneIcon className="flex-shrink-0 text-gray-400" />
        <span>{location.phone}</span>
      </p>
      {location.email && (
        <p className="mt-1 text-gray-500 flex items-center gap-2 font-light">
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
  const [selectedMedia, setSelectedMedia] = useState<ContactLocationMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null);
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0);
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

  // Seçili lokasyonun medyalarını al
  const selectedLocationMedia = useMemo(() => {
    if (!selectedLocation || !selectedLocation.isMediaVisible || !selectedLocation.media || !Array.isArray(selectedLocation.media)) {
      return [];
    }
    return selectedLocation.media.filter((m) => m.url);
  }, [selectedLocation]);


  if (loading || !content) {
    return <div className="flex items-center justify-center h-screen">{t('loading')}...</div>;
  }
  
  return (
    <div className="bg-gray-100 animate-fade-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-gray-600">{t(content.title)}</h1>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto font-light">{t(content.subtitle)}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-8 overflow-y-auto max-h-[600px]">
             {/* FIX: Refactored to use Object.keys to avoid potential type inference issues with Object.entries in some TypeScript environments. */}
             {Object.keys(locationGroups).map((type) => (
              <div key={type}>
                <h2 className="text-2xl font-light text-gray-600 mb-6">{type}</h2>
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
                src={convertGoogleMapsUrlToEmbed(selectedLocation.mapEmbedUrl)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allow="fullscreen"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${t(selectedLocation.title)}`}
                key={selectedLocation.mapEmbedUrl}
              ></iframe>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <p>{t('map_not_available')}</p>
                </div>
            )}
          </div>
        </div>
        
        {/* Medya Bantı - Seçili lokasyonun medyaları */}
        {selectedLocationMedia.length > 0 && (
          <div className="mt-12 border-y border-gray-300 py-3">
            <style>{`
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="relative select-none">
              <div
                ref={thumbRef}
                className="hide-scrollbar overflow-x-auto cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => { setThumbDragStartX(e.clientX); setThumbScrollStart(thumbRef.current ? thumbRef.current.scrollLeft : 0); }}
                onMouseLeave={() => { setThumbDragStartX(null); }}
                onMouseUp={() => { setThumbDragStartX(null); }}
                onMouseMove={(e) => {
                  if (thumbDragStartX === null || !thumbRef.current) return;
                  const delta = e.clientX - thumbDragStartX;
                  thumbRef.current.scrollLeft = thumbScrollStart - delta;
                }}
              >
                <div className="flex gap-3 min-w-max pb-2">
                  {selectedLocationMedia.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedMedia(m);
                        setIsModalOpen(true);
                      }}
                      className="relative flex-shrink-0 w-24 h-24 overflow-hidden border-2 border-transparent opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-300"
                    >
                      {m.type === 'image' ? (
                        <OptimizedImage
                          src={m.url || ''}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          quality={75}
                        />
                      ) : m.type === 'video' ? (
                        <div className="w-full h-full bg-black/60" />
                      ) : (
                        <OptimizedImage
                          src={youTubeThumb(m.url || '')}
                          alt={`youtube thumb ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          quality={75}
                        />
                      )}
                      {(m.type === 'video' || m.type === 'youtube') && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                          </span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scroll buttons */}
              {selectedLocationMedia.length > 6 && (
                <>
                  <button
                    aria-label="scroll-left"
                    onClick={() => { if (thumbRef.current) thumbRef.current.scrollBy({ left: -240, behavior: 'smooth' }); }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 shadow px-2 py-2"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="scroll-right"
                    onClick={() => { if (thumbRef.current) thumbRef.current.scrollBy({ left: 240, behavior: 'smooth' }); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 shadow px-2 py-2"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMedia(null);
          }}
        />
      )}
    </div>
  );
}
