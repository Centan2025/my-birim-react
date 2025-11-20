import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// FIX: Imported SiteSettings type to correctly type component state.
import type { Product, Designer, Category, LocalizedString, SiteSettings } from '../types';
import { getProductById, getDesignerById, getCategories, getProductsByCategoryId, getSiteSettings } from '../services/cms';
// FIX: Removed non-existent `useSiteSettings` import. `useAuth` is sufficient.
import { useAuth } from '../App';
import { OptimizedImage } from '../components/OptimizedImage';
import { OptimizedVideo } from '../components/OptimizedVideo';
import { useTranslation } from '../i18n';
import { useCart } from '../context/CartContext';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
);

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const TransparentShoppingBagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

const MinimalChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const MinimalChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  // FIX: Changed siteSettings state to use the correct SiteSettings type, resolving a type mismatch with the `getSiteSettings` service function.
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [designer, setDesigner] = useState<Designer | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [siblingProducts, setSiblingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [lightboxSource, setLightboxSource] = useState<'band' | 'panel'>('band');
  const youTubePlayerRef = useRef<HTMLIFrameElement | null>(null);
  const [ytPlaying, setYtPlaying] = useState<boolean>(false);
  const { isLoggedIn, user } = useAuth();
  const { t, locale } = useTranslation();
  const { addToCart } = useCart();
  // FIX: Removed usage of non-existent `useSiteSettings` hook and now use the local `siteSettings` state.
  const imageBorderClass = siteSettings?.imageBorderStyle === 'rounded' ? 'rounded-lg' : 'rounded-none';
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number>(0);
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [draggedX, setDraggedX] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const DRAG_THRESHOLD = 50; // pixels
  const [dimLightbox, setDimLightbox] = useState<{ images: { image: string; title?: LocalizedString }[]; currentIndex: number } | null>(null);
  const [materialLightbox, setMaterialLightbox] = useState<{ images: { image: string; name: string }[]; currentIndex: number } | null>(null);
  // Thumbnails horizontal drag/scroll
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [thumbDragStartX, setThumbDragStartX] = useState<number | null>(null);
  const [thumbScrollStart, setThumbScrollStart] = useState<number>(0);

  // Grup değiştiğinde kartela indexini sıfırla
  useEffect(() => {
    setActiveBookIndex(0);
  }, [activeMaterialGroup]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      if (productId) {
        const productData = await getProductById(productId);
        setProduct(productData);
        if (productData) {
          // İlk görünmesini istediğimiz medya: alternatifMedia varsa onun ilk öğesi; yoksa eski alternatif görseller
          const altMediaArr: any[] = Array.isArray((productData as any).alternativeMedia) ? (productData as any).alternativeMedia : [];
          if (altMediaArr.length > 0) {
            setCurrentImageIndex(0);
            const first = altMediaArr[0];
            if (first?.type === 'image' && first?.url) {
              setMainImage(first.url);
            } else {
              // video/youtube ise mainImage'i dokunmadan bırakıyoruz; slider yine doğru render eder
              const mainImgUrl = typeof productData.mainImage === 'string' ? productData.mainImage : productData.mainImage?.url || '';
              setMainImage(mainImgUrl);
            }
          } else {
            const altImgs = Array.isArray(productData.alternativeImages) ? productData.alternativeImages : [];
            const mainImgUrl = typeof productData.mainImage === 'string' ? productData.mainImage : productData.mainImage?.url || '';
            const allImgs = [mainImgUrl, ...altImgs].filter(Boolean);
            setMainImage(allImgs[0] || '');
            setCurrentImageIndex(0);
          }
          const [designerData, allCategories, productsInCategory] = await Promise.all([
            getDesignerById(productData.designerId),
            getCategories(),
            getProductsByCategoryId(productData.categoryId)
          ]);
          setDesigner(designerData);
          setCategory(allCategories.find(c => c.id === productData.categoryId));
          setSiblingProducts(productsInCategory);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    getSiteSettings().then(setSiteSettings);
  }, []);
  const { prevProduct, nextProduct } = useMemo(() => {
    if (!product || siblingProducts.length < 2) return { prevProduct: null, nextProduct: null };
    const currentIndex = siblingProducts.findIndex(p => p.id === product.id);
    if (currentIndex === -1) return { prevProduct: null, nextProduct: null };
    const prev = currentIndex > 0 ? siblingProducts[currentIndex - 1] : null;
    const next = currentIndex < siblingProducts.length - 1 ? siblingProducts[currentIndex + 1] : null;
    return { prevProduct: prev, nextProduct: next };
  }, [product, siblingProducts]);
  // Bottom prev/next visibility from CMS settings
  const showBottomPrevNext = Boolean(siteSettings?.showProductPrevNext);

  // Aynı groupTitle'a sahip grupları tek bir sekme altında birleştir - erken return'lerden önce
  const grouped = useMemo(() => {
    if (!product) return [];
    return Array.isArray((product as any).groupedMaterials) ? (product as any).groupedMaterials : [];
  }, [product]);

  const mergedGroups = useMemo(() => {
    const map = new Map<string, any>();
    (grouped || []).forEach((g: any) => {
      const key = JSON.stringify(g.groupTitle || '');
      if (!map.has(key)) {
        map.set(key, {
          groupTitle: g.groupTitle,
          books: Array.isArray(g.books) ? [...g.books] : [],
          materials: Array.isArray(g.materials) ? [...g.materials] : [],
        });
      } else {
        const agg = map.get(key);
        // kitapları başlıklarına göre birleştir
        const byTitle = new Map<string, any>();
        [...(agg.books || []), ...(g.books || [])].forEach((b: any) => {
          const bKey = JSON.stringify(b.bookTitle || '');
          if (!byTitle.has(bKey)) byTitle.set(bKey, { bookTitle: b.bookTitle, materials: [] });
          const entry = byTitle.get(bKey);
          entry.materials = [...entry.materials, ...(Array.isArray(b.materials) ? b.materials : [])];
        });
        agg.books = Array.from(byTitle.values());
        agg.materials = [...(agg.materials || []), ...(Array.isArray(g.materials) ? g.materials : [])];
        map.set(key, agg);
      }
    });
    return Array.from(map.values());
  }, [grouped]);

  // Görsel/Video/YouTube bant medyası (erken return'lerden önce)
  const rawAltMedia: any[] = Array.isArray((product as any)?.alternativeMedia) ? (product as any).alternativeMedia : [];
  // Helper: mainImage string veya object olabilir
  const mainImageUrl = product?.mainImage ? (typeof product.mainImage === 'string' ? product.mainImage : product.mainImage.url) : '';
  const mainImageMobile = product?.mainImage && typeof product.mainImage === 'object' ? product.mainImage.urlMobile : undefined;
  const mainImageDesktop = product?.mainImage && typeof product.mainImage === 'object' ? product.mainImage.urlDesktop : undefined;
  
  const fallbackImages = (() => {
    const ai = Array.isArray((product as any)?.alternativeImages) ? (product as any).alternativeImages : [];
    const arw = [mainImageUrl, ...ai];
    return Array.isArray(arw) ? arw.filter(Boolean).map((u: string) => ({ type: 'image' as const, url: u })) : [];
  })();
  // Bant medyası: alternatif medya varsa, ana görseli en başa ekle
  const bandMedia: { type: 'image' | 'video' | 'youtube'; url: string; urlMobile?: string; urlDesktop?: string }[] = (() => {
    if (rawAltMedia.length) {
      const head: any[] = mainImageUrl ? [{ type: 'image', url: mainImageUrl, urlMobile: mainImageMobile, urlDesktop: mainImageDesktop }] : [];
      const merged = [...head, ...rawAltMedia];
      // tekilleştir (aynı url tekrar etmesin)
      const seen = new Set<string>();
      return merged.filter((m: any) => {
        const key = `${m.type}:${m.url || (m.image && 'image')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return fallbackImages;
  })();
  const firstImageIndex = useMemo(() => bandMedia.findIndex((m) => m.type === 'image'), [bandMedia]);

  const safeActiveIndex = Math.min(Math.max(activeMaterialGroup, 0), Math.max(mergedGroups.length - 1, 0));
  const activeGroup = Array.isArray(mergedGroups) ? mergedGroups[safeActiveIndex] : undefined;
  const books = Array.isArray((activeGroup as any)?.books) ? (activeGroup as any).books : [];
  // FIX: Safely access `dimensionImages` (now added to Product type) and provide a fallback array to prevent errors when it's undefined.
  const dimImages = product?.dimensionImages?.filter((di) => di?.image) ?? [];
  const slideCount = bandMedia.length || 1;

  // HomePage hero medya mantığına benzer drag sistemi
  const handleHeroDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('a, button')) {
      return;
    }
    setIsDragging(true);
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(startX);
    setDraggedX(0);
    e.preventDefault();
  };

  const handleHeroDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDraggedX(currentX - dragStartX);
  };

  const handleHeroDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (draggedX < -DRAG_THRESHOLD) {
      setCurrentImageIndex(prev => (prev + 1) % slideCount);
    } else if (draggedX > DRAG_THRESHOLD) {
      setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount);
    }
    setDraggedX(0);
  };

  // currentImageIndex değiştiğinde mainImage'i güncelle (erken return'lerden önce)
  useEffect(() => {
    if (bandMedia.length > 0 && currentImageIndex < bandMedia.length) {
      const current = bandMedia[currentImageIndex];
      const newImage = current?.type === 'image' ? current.url : mainImage;
      if (newImage && newImage !== mainImage) {
        setMainImage(newImage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, bandMedia.length]);

  // Ürün ilk yüklendiğinde ilk gösterilecek medyayı mümkünse görsel yap
  useEffect(() => {
    if (bandMedia.length > 0) {
      // Ana görsel bantta ilk sırada; değilse ilk görsel index'ine git
      const mainIdx = bandMedia.findIndex((m) => m.type === 'image' && m.url === mainImageUrl);
      const idx = mainIdx >= 0 ? mainIdx : (firstImageIndex >= 0 ? firstImageIndex : 0);
      setCurrentImageIndex(idx);
      // mainImage'i anında güncelle (özellikle video ilkse boş kalmasın)
      const current = bandMedia[idx];
      if (current?.type === 'image' && current.url && current.url !== mainImage) {
        setMainImage(current.url);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandMedia.length]);

  if (loading) return <div className="pt-20 text-center">{t('loading')}...</div>;
  if (!product) return <div className="pt-20 text-center">{t('product_not_found')}</div>;

  const heroNext = () => { setCurrentImageIndex(prev => (prev + 1) % slideCount); };
  const heroPrev = () => { setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount); };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    // YouTube iframe'i sıfırla
    setYtPlaying(false);
  };
  const openLightbox = () => {
    setLightboxSource('band');
    setLightboxImageIndex(currentImageIndex);
    // Aktif medya YouTube ise direkt oynat
    const item = bandMedia[currentImageIndex];
    if (item && item.type === 'youtube') {
      setYtPlaying(true);
    } else {
      setYtPlaying(false);
    }
    setIsLightboxOpen(true);
  };
  const openPanelLightbox = (index: number) => {
    setLightboxSource('panel');
    setLightboxImageIndex(index);
    const panels = (product as any)?.media || [];
    const item = panels[index];
    if (item && item.type === 'youtube') {
      setYtPlaying(true);
    } else {
      setYtPlaying(false);
    }
    setIsLightboxOpen(true);
  };
  const currentLightboxItems = lightboxSource === 'panel' ? (Array.isArray((product as any)?.media) ? (product as any).media : []) : bandMedia;
  const nextImage = () => {
    setLightboxImageIndex((prevIndex) => {
      const nextIdx = (prevIndex + 1) % (currentLightboxItems.length || 1);
      const target = currentLightboxItems[nextIdx];
      if (target?.type === 'youtube') {
        setYtPlaying(true);
      } else {
        setYtPlaying(false);
      }
      return nextIdx;
    });
  };
  const prevImageFn = () => {
    setLightboxImageIndex((prevIndex) => {
      const nextIdx = (prevIndex - 1 + (currentLightboxItems.length || 1)) % (currentLightboxItems.length || 1);
      const target = currentLightboxItems[nextIdx];
      if (target?.type === 'youtube') {
        setYtPlaying(true);
      } else {
        setYtPlaying(false);
      }
      return nextIdx;
    });
  };

  // YouTube helpers
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[1] && match[1].length === 11 ? match[1] : null;
  };
  const toYouTubeEmbed = (url: string, { autoplay = true, controls = false }: { autoplay?: boolean; controls?: boolean } = {}): string => {
    const id = getYouTubeId(url);
    if (!id) return url;
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: '1',
      playsinline: '1',
      controls: controls ? '1' : '0',
      modestbranding: '1',
      rel: '0',
      enablejsapi: '1',
      iv_load_policy: '3',
      fs: '0',
      disablekb: controls ? '0' : '1',
      loop: '1',
      playlist: id
    }).toString();
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
  };
  const youTubeThumb = (url: string): string => {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  };

  return (
    <>
      {/* Local style for hiding scrollbar */}
      <style>
        {`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>
      {/* helpers */}
      {(() => null)()}
      {/* FULL-WIDTH HERO IMAGE */}
      <header className="relative w-full">
        <div
          className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleHeroDragStart}
          onMouseMove={handleHeroDragMove}
          onMouseUp={handleHeroDragEnd}
          onMouseLeave={handleHeroDragEnd}
          onTouchStart={handleHeroDragStart}
          onTouchMove={handleHeroDragMove}
          onTouchEnd={handleHeroDragEnd}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{
              width: `${slideCount * 100}%`,
              transform: `translateX(calc(-${currentImageIndex * (100 / slideCount)}% + ${draggedX}px))`,
            }}
          >
            {bandMedia.map((m, index) => (
              <div
                key={index}
                className="relative h-full shrink-0 cursor-pointer bg-white flex items-center justify-center"
                style={{ width: `${100 / slideCount}%` }}
                onClick={() => {
                  if (!isDragging && draggedX === 0) {
                    openLightbox();
                  }
                }}
              >
                {m.type === 'image' ? (
                  <OptimizedImage
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    alt={`${t(product.name)} ${index + 1}`}
                    className={`w-full h-full object-contain ${imageBorderClass}`}
                    loading="eager"
                    quality={90}
                  />
                ) : m.type === 'video' ? (
                  <OptimizedVideo
                    src={m.url}
                    srcMobile={m.urlMobile}
                    srcDesktop={m.urlDesktop}
                    className={`w-full h-full object-contain ${imageBorderClass}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    loading="eager"
                  />
                ) : (
                  <iframe className="w-full h-full" title="youtube-player" src={toYouTubeEmbed(m.url, { autoplay: true })} allow="autoplay; encrypted-media; fullscreen" frameBorder="0" />
                )}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

          {/* overlay breadcrumbs top-left */}
          <nav className="absolute top-4 left-4 text-sm text-white/80">
            <ol className="list-none p-0 inline-flex items-center gap-2">
              <li><Link to="/" className="hover:text-white">{t('homepage')}</Link></li>
              {category && (<><li className="opacity-70">/</li><li><Link to={`/products/${category.id}`} className="hover:text-white">{t(category.name)}</Link></li></>)}
              <li className="opacity-70">/</li>
              <li className="text-white">{t(product.name)}</li>
            </ol>
          </nav>

          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">{t(product.name)}</h1>
            {designer && (
              <p className="mt-2 text-white/80">
                <Link to={`/designer/${designer.id}`} className="underline hover:text-white">{t(designer.name)}</Link> — {product.year}
              </p>
            )}
          </div>

          {/* hero arrows */}
          <button onClick={heroPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">‹</button>
          <button onClick={heroNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">›</button>
        </div>
        {/* Divider and Thumbnails under hero */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Üst/alt çizgileri tek yerde tanımla: aynı renk/kalınlık */}
          <div className="mt-1 md:mt-2 border-y border-gray-300 py-3">
          {/* Hide scrollbar with custom class; enable drag scroll */}
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
                {bandMedia.map((m, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative flex-shrink-0 w-24 h-24 overflow-hidden border-2 transition-all duration-300 ${currentImageIndex === idx ? 'border-gray-400 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}>
                    {m.type === 'image' ? (
                      <OptimizedImage
                        src={m.url}
                        alt={`${t(product.name)} thumbnail ${idx + 1}`}
                        className={`w-full h-full object-cover ${imageBorderClass}`}
                        loading="lazy"
                        quality={75}
                      />
                    ) : m.type === 'video' ? (
                      <div className={`w-full h-full bg-black/60 ${imageBorderClass}`} />
                    ) : (
                      <OptimizedImage
                        src={youTubeThumb(m.url)}
                        alt={`youtube thumb ${idx + 1}`}
                        className={`w-full h-full object-cover ${imageBorderClass}`}
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
          </div>
          </div>
        </div>
      </header>

      {/* DETAILS BELOW */}
      <main className="bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li><Link to="/" className="hover:text-gray-800">{t('homepage')}</Link></li>
              <li className="mx-2 font-light text-gray-400">|</li>
              {category && (<><li><Link to={`/products/${category.id}`} className="hover:text-gray-800">{t(category.name)}</Link></li><li className="mx-2 font-light text-gray-400">|</li></>)}
              <li className="font-light text-gray-500" aria-current="page">{t(product.name)}</li>
            </ol>
          </nav>

          <section className="space-y-10">
            {product.buyable && product.price > 0 && (
              <div><p className="text-3xl font-light text-gray-600">{new Intl.NumberFormat(locale, { style: 'currency', currency: product.currency || 'TRY' }).format(product.price)}</p></div>
            )}

            <div>
              <h2 className="text-2xl md:text-4xl font-light text-gray-600">{t(product.name)}</h2>
              <p className="mt-3 text-gray-500 leading-relaxed max-w-2xl font-light">{t(product.description)}</p>
            </div>

            {/* Dimensions as small drawings (thumbnails) - MOVED BEFORE MATERIALS */}
            {dimImages.length > 0 && (
              <div className="pb-4">
                <h2 className="text-xl font-light text-gray-600">{t('dimensions')}</h2>
                <div className="h-px bg-gray-300 my-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {dimImages.map((dimImg: { image: string; imageMobile?: string; imageDesktop?: string; title?: LocalizedString }, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <button 
                        onClick={() => setDimLightbox({ images: dimImages, currentIndex: idx })} 
                        className="group border border-gray-200 transition-transform duration-200 p-3 bg-white rounded-none"
                      >
                        <OptimizedImage
                          src={dimImg.image}
                          srcMobile={dimImg.imageMobile}
                          srcDesktop={dimImg.imageDesktop}
                          alt={dimImg.title ? t(dimImg.title) : `${t('dimensions')} ${idx + 1}`}
                          className={`w-full h-40 object-contain group-hover:scale-[1.03] transition-transform duration-700 ease-in-out ${imageBorderClass}`}
                          loading="lazy"
                          quality={85}
                        />
                      </button>
                      {dimImg.title && (
                        <p className="mt-2 text-sm text-gray-600 text-center font-medium">
                          {t(dimImg.title)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.materials && grouped.length > 0 && (
              <div className="pb-4">
                <h2 className="text-xl font-light text-gray-600 mb-4">{t('material_alternatives')}</h2>
                
                {/* Group tabs - similar to image design */}
                <div className="flex flex-wrap gap-0 border-t border-b border-gray-400 mb-6 bg-gray-200">
                  {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveMaterialGroup(idx)} 
                      className={`px-5 py-3 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                        activeMaterialGroup === idx 
                          ? 'bg-white text-gray-800 border-gray-500' 
                          : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                      }`}
                    >
                      {t(g.groupTitle)}
                    </button>
                  ))}
                </div>

                {/* Swatch books (kartelalar) yatay sekmeler */}
                {books.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-0 border-b border-gray-200 mb-6">
                      {books.map((book: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveBookIndex(idx)}
                          className={`px-4 py-2 text-sm font-thin tracking-wider transition-all duration-200 border-b-2 rounded-none ${
                            activeBookIndex === idx
                              ? 'bg-white text-gray-800 border-gray-500'
                              : 'bg-transparent text-gray-600 border-transparent hover:text-gray-800'
                          }`}
                        >
                          {t(book.bookTitle)}
                        </button>
                      ))}
                    </div>

                    {/* Seçili kartelaya ait malzemeler */}
                    <div className="flex flex-wrap gap-6">
                      {(Array.isArray(books[activeBookIndex]?.materials) ? books[activeBookIndex].materials : []).map((material: any, index: number) => (
                        <div key={index} className="text-center group cursor-pointer" title={t(material.name)} onClick={() => {
                          const allMaterials = Array.isArray(books[activeBookIndex]?.materials) ? books[activeBookIndex].materials : [];
                          setMaterialLightbox({ images: allMaterials.map((m: any) => ({ image: m.image, name: t(m.name) })), currentIndex: index });
                        }}>
                          <OptimizedImage
                            src={material.image}
                            alt={t(material.name)}
                            className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                            loading="lazy"
                            quality={80}
                          />
                      <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                            {t(material.name)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Fallback: if no books, show materials directly */
                  <>
                  <div className="flex flex-wrap gap-6">
                    {(Array.isArray(grouped[safeActiveIndex]?.materials) ? grouped[safeActiveIndex].materials : []).map((material: any, index: number) => (
                      <div key={index} className="text-center group cursor-pointer" title={t(material.name)} onClick={() => {
                        const allMaterials = Array.isArray(grouped[safeActiveIndex]?.materials) ? grouped[safeActiveIndex].materials : [];
                        setMaterialLightbox({ images: allMaterials.map((m: any) => ({ image: m.image, name: t(m.name) })), currentIndex: index });
                      }}>
                        <OptimizedImage
                          src={material.image}
                          alt={t(material.name)}
                          className={`w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md ${imageBorderClass}`}
                          loading="lazy"
                          quality={80}
                        />
                        <p className="mt-3 text-xs md:text-sm text-gray-600 font-thin tracking-wider max-w-[120px] break-words">
                          {t(material.name)}
                        </p>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}

            {/* Designer section after materials */}
            {designer && (
              <section className="mt-10 bg-gray-200 text-gray-600 border-t border-b border-gray-400">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
                  <h2 className="text-xl font-thin text-gray-600 mb-4">{t('designer')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="w-full">
                      <OptimizedImage
                        src={typeof designer.image === 'string' ? designer.image : designer.image?.url || ''}
                        srcMobile={typeof designer.image === 'object' ? designer.image.urlMobile : designer.imageMobile}
                        srcDesktop={typeof designer.image === 'object' ? designer.image.urlDesktop : designer.imageDesktop}
                        alt={t(designer.name)}
                        className="w-full h-auto object-cover filter grayscale"
                        loading="lazy"
                        quality={85}
                      />
                    </div>
                    <div className="w-full">
                      <h3 className="text-2xl font-thin text-gray-600">{t(designer.name)}</h3>
                      <p className="mt-4 text-gray-500 font-light leading-relaxed">
                        {t(designer.bio).slice(0, 400)}{t(designer.bio).length > 400 ? '…' : ''}
                      </p>
                      <Link
                        to={`/designer/${designer.id}`}
                        className="inline-block mt-6 text-gray-600 font-light underline underline-offset-4 hover:text-gray-800"
                      >
                        {t('discover_the_designer')}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {product.buyable && (
              <div className="pt-6 border-t border-gray-200">
                <button onClick={() => addToCart(product)} className="group w-20 h-20 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 hover:shadow-lg" aria-label={t('add_to_cart')}>
                  <TransparentShoppingBagIcon />
                </button>
              </div>
            )}

            {product.exclusiveContent && (
              <div className="relative rounded-none border border-gray-200 bg-white/70 backdrop-blur p-6 sm:p-8 pb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-light text-gray-700">İndirilebilir Dosyalar</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">{t('additional_images') || 'Ek Görseller'}</div>
                    {product.exclusiveContent.images && product.exclusiveContent.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {product.exclusiveContent.images.map((img, idx) => (
                          <OptimizedImage
                            key={idx}
                            src={img}
                            alt={`exclusive-${idx}`}
                            className={`w-full aspect-video object-cover ${imageBorderClass}`}
                            loading="lazy"
                            quality={85}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Ek görsel bulunmuyor</p>
                    )}
                  </div>
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">{t('technical_drawings') || 'Teknik Çizimler'}</div>
                    {product.exclusiveContent.drawings && product.exclusiveContent.drawings.length > 0 ? (
                      <ul className="space-y-2">
                        {product.exclusiveContent.drawings.map((doc, idx) => (
                          <li key={idx} className="group">
                            <a
                              href={doc.url}
                              download
                              onClick={(e) => {
                                const canDownload = isLoggedIn && user?.userType === 'full_member';
                                if (!canDownload) { e.preventDefault(); navigate('/login'); }
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-none border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <span className="shrink-0 text-gray-600 group-hover:text-gray-900"><DownloadIcon /></span>
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t(doc.name)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">Teknik çizim bulunmuyor</p>
                    )}
                  </div>
                  <div className="rounded-none border border-gray-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">{t('3d_models') || '3D Modeller'}</div>
                    {product.exclusiveContent.models3d && product.exclusiveContent.models3d.length > 0 ? (
                      <ul className="space-y-2">
                        {product.exclusiveContent.models3d.map((model, idx) => (
                          <li key={idx} className="group">
                            <a
                              href={model.url}
                              download
                              onClick={(e) => {
                                const canDownload = isLoggedIn && user?.userType === 'full_member';
                                if (!canDownload) { e.preventDefault(); navigate('/login'); }
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-none border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <span className="shrink-0 text-gray-600 group-hover:text-gray-900"><DownloadIcon /></span>
                              <span className="text-sm text-gray-700 group-hover:text-gray-900">{t(model.name)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">3D model bulunmuyor</p>
                    )}
                  </div>
                </div>
                {/* Alt çizgi: kartın tam alt kenarında, kenarlara kadar */}
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300" />
              </div>
            )}

            {/* bottom prev/next removed; now overlay under menu */}
          </section>
          {Array.isArray((product as any)?.media) && (product as any).media.length > 0 && (product as any).showMediaPanels !== false && (
            <section className="mt-12">
                <h2 className="text-xl font-light text-gray-600 mb-4">
                  {(product as any)?.mediaSectionTitle && String((product as any).mediaSectionTitle).trim().length > 0
                    ? t((product as any).mediaSectionTitle)
                    : 'Projeler'}
                </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(product as any).media.map((m: any, idx: number) => (
                  <div key={idx} className="overflow-hidden">
                    <button onClick={() => openPanelLightbox(idx)} className="relative w-full aspect-video bg-gray-200 flex items-center justify-center">
                      {m.type === 'image' ? (
                        <OptimizedImage
                          src={m.url}
                          alt={`media-${idx}`}
                          className={`w-full h-full object-cover ${imageBorderClass}`}
                          loading="lazy"
                          quality={85}
                        />
                      ) : m.type === 'video' ? (
                        <div className={`w-full h-full bg-gray-300 ${imageBorderClass}`} />
                      ) : (
                        <OptimizedImage
                          src={youTubeThumb(m.url)}
                          alt={`youtube thumb ${idx + 1}`}
                          className={`w-full h-full object-cover ${imageBorderClass}`}
                          loading="lazy"
                          quality={75}
                        />
                      )}
                      {(m.type === 'video' || m.type === 'youtube') && (
                        <span className="pointer-events-none absolute bottom-2 right-2">
                          <span className="bg-white/85 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                          </span>
                        </span>
                      )}
                    </button>
                    {m.title && (<div className="px-1 pt-2 text-sm text-gray-600">{t(m.title)}</div>)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Bottom Prev / Next controls (toggle with ?showNav=1) */}
      {showBottomPrevNext && (prevProduct || nextProduct) && (
        <div className="bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {prevProduct ? (
                  <Link
                    to={`/product/${prevProduct.id}`}
                    className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Previous product"
                  >
                    <MinimalChevronLeft className="w-12 h-12 md:w-16 md:h-16" />
                  </Link>
                ) : <span />}
              </div>
              <div className="flex-1 text-right">
                {nextProduct ? (
                  <Link
                    to={`/product/${nextProduct.id}`}
                    className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Next product"
                  >
                    <MinimalChevronRight className="w-12 h-12 md:w-16 md:h-16" />
                  </Link>
                ) : <span />}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center" style={{ animationDuration: '0.2s' }}>
          <button onClick={prevImageFn} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2"><ChevronLeftIcon /></button>
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2"><ChevronRightIcon /></button>
          <div className="relative w-screen max-w-screen-2xl h-[80vh] p-2 overflow-hidden">
            <button onClick={closeLightbox} className="absolute top-2 right-2 text-white hover:opacity-75 transition-opacity z-[80] bg-black/50 rounded-full p-2"><CloseIcon /></button>
            {currentLightboxItems[lightboxImageIndex]?.type === 'image' ? (
              <OptimizedImage
                src={currentLightboxItems[lightboxImageIndex].url}
                alt="Enlarged product view"
                className="w-full h-full object-contain"
                loading="eager"
                quality={95}
              />
            ) : currentLightboxItems[lightboxImageIndex]?.type === 'video' ? (
              <OptimizedVideo
                src={currentLightboxItems[lightboxImageIndex].url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-contain"
                preload="auto"
                loading="eager"
              />
            ) : (
                <div className="relative w-full h-full">
                    {/* Doğrudan iframe'i göster, ortadaki büyük play butonu kaldırıldı */}
                    <iframe 
                      ref={youTubePlayerRef as any} 
                      className="w-full h-full pointer-events-auto" 
                      title="youtube-player" 
                      src={toYouTubeEmbed(currentLightboxItems[lightboxImageIndex]?.url || '', { autoplay: true, controls: false })} 
                      allow="autoplay; encrypted-media; fullscreen" 
                      frameBorder="0"
                      style={{ pointerEvents: 'auto' }}
                    />
                    <button onClick={() => {
                      const next = !ytPlaying;
                      try { youTubePlayerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: next ? 'playVideo' : 'pauseVideo', args: [] }), '*'); } catch {}
                      setYtPlaying(next);
                    }} className="absolute bottom-4 right-4 z-[60] bg-white/85 text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-white pointer-events-auto">
                      {ytPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                </div>
            )}
            {/* Medya bilgileri overlay - sadece panel medyaları için göster */}
            {lightboxSource === 'panel' && currentLightboxItems[lightboxImageIndex] && (() => {
              const currentItem = currentLightboxItems[lightboxImageIndex];
              
              const linkUrl = currentItem?.link ? String(currentItem.link).trim() : '';
              const linkText = currentItem?.linkText;
              const hasLink = linkUrl.length > 0;
              const hasLinkText = linkText && (typeof linkText === 'string' || (typeof linkText === 'object' && Object.keys(linkText).length > 0));
              
              return (
                <div className="absolute bottom-2 left-2 max-w-md p-6 text-white z-[70] pointer-events-auto">
                  {currentItem.title && (
                    <h3 className="text-xl font-light mb-2">{t(currentItem.title)}</h3>
                  )}
                  {currentItem.description && (
                    <p className="text-sm text-white/90 leading-relaxed mb-3">{t(currentItem.description)}</p>
                  )}
                  {hasLink && hasLinkText && (() => {
                    const isExternal = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('//');
                    
                    const linkContent = (
                      <span className="inline-flex items-center gap-2 text-white/90 hover:text-white font-light transition-all duration-300 cursor-pointer group">
                        <span className="relative">
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/50 transition-all duration-300">{t(linkText)}</span>
                          <span className="absolute bottom-0 left-0 w-0 h-px bg-white/50 group-hover:w-full transition-all duration-300"></span>
                        </span>
                        {isExternal && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        )}
                      </span>
                    );

                    return isExternal ? (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {linkContent}
                      </a>
                    ) : (
                      <Link
                        to={linkUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeLightbox();
                        }}
                      >
                        {linkContent}
                      </Link>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dimension Images Modal */}
      {dimLightbox && dimLightbox.images.length > 0 && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDimLightbox(null)}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setDimLightbox(null)} 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-20 p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="p-8 relative">
              {dimLightbox.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDimLightbox({
                        ...dimLightbox,
                        currentIndex: (dimLightbox.currentIndex - 1 + dimLightbox.images.length) % dimLightbox.images.length
                      });
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-md transition-all z-10"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDimLightbox({
                        ...dimLightbox,
                        currentIndex: (dimLightbox.currentIndex + 1) % dimLightbox.images.length
                      });
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-md transition-all z-10"
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
              <OptimizedImage
                src={dimLightbox.images[dimLightbox.currentIndex].image}
                alt={dimLightbox.images[dimLightbox.currentIndex].title ? t(dimLightbox.images[dimLightbox.currentIndex].title!) : "Technical Drawing"}
                className="w-full h-auto object-contain"
                loading="eager"
                quality={95}
              />
            </div>
          </div>
        </div>
      )}

      {/* Material Images Modal */}
      {materialLightbox && materialLightbox.images.length > 0 && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-1" onClick={() => setMaterialLightbox(null)}>
          <div className="bg-white border border-gray-300 max-w-2xl w-full max-h-[98vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setMaterialLightbox(null)} 
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 transition-colors z-20 p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="relative">
              {materialLightbox.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialLightbox({
                        ...materialLightbox,
                        currentIndex: (materialLightbox.currentIndex - 1 + materialLightbox.images.length) % materialLightbox.images.length
                      });
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-1.5 rounded-full shadow-md transition-all z-10"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMaterialLightbox({
                        ...materialLightbox,
                        currentIndex: (materialLightbox.currentIndex + 1) % materialLightbox.images.length
                      });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-1.5 rounded-full shadow-md transition-all z-10"
                    aria-label="Next"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              <OptimizedImage
                src={materialLightbox.images[materialLightbox.currentIndex].image}
                alt={materialLightbox.images[materialLightbox.currentIndex].name}
                className="w-full h-auto object-contain"
                loading="eager"
                quality={95}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}