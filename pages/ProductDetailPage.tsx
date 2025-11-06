import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product, Designer, Category, LocalizedString } from '../types';
import { getProductById, getDesignerById, getCategories, getProductsByCategoryId } from '../services/cms';
import { useAuth } from '../App';
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

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [designer, setDesigner] = useState<Designer | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [siblingProducts, setSiblingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const { isLoggedIn } = useAuth();
  const { t, locale } = useTranslation();
  const { addToCart } = useCart();
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number>(0);
  const [activeBookIndex, setActiveBookIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [draggedX, setDraggedX] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const DRAG_THRESHOLD = 50; // pixels
  const [dimLightbox, setDimLightbox] = useState<string | null>(null);
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
          const altImgs = Array.isArray(productData.alternativeImages) ? productData.alternativeImages : [];
          const allImgs = [productData.mainImage, ...altImgs].filter(Boolean);
          setMainImage(allImgs[0] || '');
          setCurrentImageIndex(0);
          setPrevImage(null);
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

  const { prevProduct, nextProduct } = useMemo(() => {
    if (!product || siblingProducts.length < 2) return { prevProduct: null, nextProduct: null };
    const currentIndex = siblingProducts.findIndex(p => p.id === product.id);
    if (currentIndex === -1) return { prevProduct: null, nextProduct: null };
    const prev = currentIndex > 0 ? siblingProducts[currentIndex - 1] : null;
    const next = currentIndex < siblingProducts.length - 1 ? siblingProducts[currentIndex + 1] : null;
    return { prevProduct: prev, nextProduct: next };
  }, [product, siblingProducts]);

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

  // Görsel ve grup hesaplamaları (erken return'lerden önce)
  const altImages = Array.isArray(product?.alternativeImages) ? (product as any).alternativeImages : [];
  const allImagesRaw = [product?.mainImage, ...altImages];
  const allImages = Array.isArray(allImagesRaw) ? allImagesRaw.filter(Boolean) : [];

  const safeActiveIndex = Math.min(Math.max(activeMaterialGroup, 0), Math.max(mergedGroups.length - 1, 0));
  const activeGroup = Array.isArray(mergedGroups) ? mergedGroups[safeActiveIndex] : undefined;
  const books = Array.isArray((activeGroup as any)?.books) ? (activeGroup as any).books : [];
  const dimImages = Array.isArray(product?.dimensionImages) ? (product as any).dimensionImages.filter((di: any) => di?.image) : [];
  const slideCount = allImages.length || 1;

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
    if (allImages.length > 0 && currentImageIndex < allImages.length) {
      const newImage = allImages[currentImageIndex];
      if (newImage && newImage !== mainImage) {
        setPrevImage(mainImage);
        setMainImage(newImage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, allImages.length]);

  if (loading) return <div className="pt-20 text-center">{t('loading')}...</div>;
  if (!product) return <div className="pt-20 text-center">{t('product_not_found')}</div>;

  const changeMainImage = (img: string) => {
    const idx = allImages.indexOf(img);
    if (idx !== -1 && idx !== currentImageIndex) {
      setCurrentImageIndex(idx);
    }
  };
  const heroNext = () => { setCurrentImageIndex(prev => (prev + 1) % slideCount); };
  const heroPrev = () => { setCurrentImageIndex(prev => (prev - 1 + slideCount) % slideCount); };

  const closeLightbox = () => setIsLightboxOpen(false);
  const openLightbox = () => {
    setLightboxImageIndex(currentImageIndex);
    setIsLightboxOpen(true);
  };
  const nextImage = () => setLightboxImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  const prevImageFn = () => setLightboxImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);

  return (
    <>
      {/* Local style for hiding scrollbar */}
      <style>
        {`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}
      </style>
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
            {allImages.map((img, index) => (
              <div
                key={index}
                className="relative h-full shrink-0 cursor-pointer"
                style={{ width: `${100 / slideCount}%` }}
                onClick={(e) => {
                  if (!isDragging && draggedX === 0) {
                    openLightbox();
                  }
                }}
              >
                <img
                  src={img}
                  alt={`${t(product.name)} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
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

          {(prevProduct || nextProduct) && (
            <div className="absolute top-12 left-4 flex items-center gap-2 text-white/90">
              {prevProduct && (
                <Link to={`/product/${prevProduct.id}`} className="px-2 py-1 bg-black/35 hover:bg-black/50 rounded text-sm">‹ {t(prevProduct.name)}</Link>
              )}
              {nextProduct && (
                <Link to={`/product/${nextProduct.id}`} className="px-2 py-1 bg-black/35 hover:bg-black/50 rounded text-sm">{t(nextProduct.name)} ›</Link>
              )}
            </div>
          )}

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
          <div className="mt-1 md:mt-2 h-[2px] bg-gray-300" />
          {/* Hide scrollbar with custom class; enable drag scroll */}
          <div className="relative mt-3 select-none">
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
                {(Array.isArray(allImages) ? allImages : []).map((img: string, idx: number) => (
                  <button key={idx} onClick={() => changeMainImage(img)} className={`flex-shrink-0 w-24 h-24 overflow-hidden border-2 transition-all duration-300 ${mainImage === img ? 'border-gray-400 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}>
                    <img src={img} alt={`${t(product.name)} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
          <div className="mt-3 h-px bg-gray-300" />
        </div>
      </header>

      {/* DETAILS BELOW */}
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li><Link to="/" className="hover:text-gray-800">{t('homepage')}</Link></li>
              <li className="mx-2 font-light text-gray-400">|</li>
              {category && (<><li><Link to={`/products/${category.id}`} className="hover:text-gray-800">{t(category.name)}</Link></li><li className="mx-2 font-light text-gray-400">|</li></>)}
              <li className="font-semibold text-gray-800" aria-current="page">{t(product.name)}</li>
            </ol>
          </nav>

          <section className="space-y-10">
            {product.buyable && product.price > 0 && (
              <div><p className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat(locale, { style: 'currency', currency: product.currency || 'TRY' }).format(product.price)}</p></div>
            )}

            <div>
              <h2 className="text-2xl md:text-4xl font-medium text-gray-700">{t(product.name)}</h2>
              <p className="mt-3 text-gray-600 leading-relaxed max-w-2xl">{t(product.description)}</p>
            </div>

            {/* Dimensions as small drawings (thumbnails) - MOVED BEFORE MATERIALS */}
            {dimImages.length > 0 && (
              <div>
                <h2 className="text-xl font-medium text-gray-700 mb-4">{t('dimensions')}</h2>
                <div className="mb-3 h-px bg-gray-300" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {dimImages.map((dimImg: { image: string; title?: LocalizedString }, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setDimLightbox(dimImg.image)} 
                      className="group border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 p-3 bg-white rounded-lg flex flex-col"
                    >
                      <img 
                        src={dimImg.image} 
                        alt={dimImg.title ? t(dimImg.title) : `${t('dimensions')} ${idx + 1}`} 
                        className="w-full h-40 object-contain group-hover:scale-105 transition-transform duration-200" 
                      />
                      {dimImg.title && (
                        <p className="mt-3 text-sm text-gray-700 text-center font-medium">
                          {t(dimImg.title)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 h-px bg-gray-300" />
              </div>
            )}

            {product.materials && grouped.length > 0 && (
              <div>
                <h2 className="text-xl font-medium text-gray-700 mb-4">{t('material_alternatives')}</h2>
                
                {/* Group tabs - similar to image design */}
                <div className="flex flex-wrap gap-0 border-b border-gray-200 mb-6 bg-gray-50">
                  {(Array.isArray(mergedGroups) ? mergedGroups : []).map((g: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveMaterialGroup(idx)} 
                      className={`px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 rounded-none ${
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
                          className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 rounded-none ${
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
                    <div className="mb-3 h-px bg-gray-300" />
                    <div className="flex flex-wrap gap-6">
                      {(Array.isArray(books[activeBookIndex]?.materials) ? books[activeBookIndex].materials : []).map((material: any, index: number) => (
                        <div key={index} className="text-center group cursor-pointer" title={t(material.name)}>
                          <img
                            src={material.image}
                            alt={t(material.name)}
                            className="w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md rounded-sm"
                          />
                          <p className="mt-3 text-sm text-gray-700 font-medium max-w-[120px] break-words">
                            {t(material.name)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 h-px bg-gray-300" />
                  </>
                ) : (
                  /* Fallback: if no books, show materials directly */
                  <>
                  <div className="mb-3 h-px bg-gray-300" />
                  <div className="flex flex-wrap gap-6">
                    {(Array.isArray(grouped[safeActiveIndex]?.materials) ? grouped[safeActiveIndex].materials : []).map((material: any, index: number) => (
                      <div key={index} className="text-center group cursor-pointer" title={t(material.name)}>
                        <img 
                          src={material.image} 
                          alt={t(material.name)} 
                          className="w-28 h-28 md:w-32 md:h-32 object-cover border border-gray-200 group-hover:border-gray-400 transition-all duration-200 shadow-sm group-hover:shadow-md rounded-sm" 
                        />
                        <p className="mt-3 text-sm text-gray-700 font-medium max-w-[120px] break-words">
                          {t(material.name)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-px bg-gray-100" />
                  </>
                )}
              </div>
            )}

            {product.buyable && (
              <div className="pt-6 border-t border-gray-200">
                <button onClick={() => addToCart(product)} className="group w-20 h-20 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 hover:shadow-lg" aria-label={t('add_to_cart')}>
                  <TransparentShoppingBagIcon />
                </button>
              </div>
            )}

            {isLoggedIn && product.exclusiveContent && (
              <div className="bg-white p-8 sm:p-12 rounded-lg border">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4 border-gray-300">{t('exclusive_content')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('additional_images')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {product.exclusiveContent.images.map((img, idx) => (<img key={idx} src={img} alt={`Exclusive ${idx}`} className="w-full object-cover shadow-sm"/>))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('technical_drawings')}</h3>
                    <ul className="space-y-3">
                      {product.exclusiveContent.drawings.map((doc, idx) => (<li key={idx}><a href={doc.url} download className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-3 transition-transform duration-200 transform hover:translate-x-1.5"><DownloadIcon/> {t(doc.name)}</a></li>))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('3d_models')}</h3>
                    <ul className="space-y-3">
                      {product.exclusiveContent.models3d.map((model, idx) => (<li key={idx}><a href={model.url} download className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-3 transition-transform duration-200 transform hover:translate-x-1.5"><DownloadIcon/> {t(model.name)}</a></li>))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* bottom prev/next removed; now overlay under menu */}
          </section>
        </div>
      </main>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center" style={{ animationDuration: '0.2s' }}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:opacity-75 transition-opacity z-20"><CloseIcon /></button>
          <button onClick={prevImageFn} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2"><ChevronLeftIcon /></button>
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2"><ChevronRightIcon /></button>
          <div className="max-w-screen-lg max-h-[90vh] w-full p-4"><img src={allImages[lightboxImageIndex]} alt="Enlarged product view" className="w-full h-full object-contain" /></div>
        </div>
      )}

      {dimLightbox && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <button onClick={() => setDimLightbox(null)} className="absolute top-4 right-4 text-white hover:opacity-75 transition-opacity z-20"><CloseIcon /></button>
          <div className="max-w-screen-lg max-h-[90vh] w-full p-4">
            <img src={dimLightbox} alt="dimension-large" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
}