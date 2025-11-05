import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Product, Designer, Category } from '../types';
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
  const [selectedDimensionIndex, setSelectedDimensionIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeMaterialGroup, setActiveMaterialGroup] = useState<number>(0);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const { isLoggedIn } = useAuth();
  const { t, locale } = useTranslation();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      if (productId) {
        setSelectedDimensionIndex(0); // Reset on product change
        const productData = await getProductById(productId);
        setProduct(productData);
        if (productData) {
          setMainImage(productData.mainImage);
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
    if (!product || siblingProducts.length < 2) {
      return { prevProduct: null, nextProduct: null };
    }
    const currentIndex = siblingProducts.findIndex(p => p.id === product.id);
    if (currentIndex === -1) {
      return { prevProduct: null, nextProduct: null };
    }
    const prev = currentIndex > 0 ? siblingProducts[currentIndex - 1] : null;
    const next = currentIndex < siblingProducts.length - 1 ? siblingProducts[currentIndex + 1] : null;
    return { prevProduct: prev, nextProduct: next };
  }, [product, siblingProducts]);


  if (loading) {
    return <div className="pt-20 text-center">{t('loading')}...</div>;
  }

  if (!product) {
    return <div className="pt-20 text-center">{t('product_not_found')}</div>;
  }
  
  const allImages = [product.mainImage, ...product.alternativeImages];

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setIsLightboxOpen(true);
  };
  
  const closeLightbox = () => setIsLightboxOpen(false);

  const nextImage = () => {
    setLightboxImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevImage = () => {
    setLightboxImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };


  return (
    <>
      <div>
        <div className="bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
            
            {/* Breadcrumbs */}
            <nav className="mb-8 text-sm text-gray-500 animate-fade-in-up" aria-label="Breadcrumb">
              <ol className="list-none p-0 inline-flex items-center">
                <li><Link to="/" className="hover:text-gray-800">{t('homepage')}</Link></li>
                <li className="mx-2 font-light text-gray-400">|</li>
                {category && (
                  <>
                    <li><Link to={`/products/${category.id}`} className="hover:text-gray-800">{t(category.name)}</Link></li>
                    <li className="mx-2 font-light text-gray-400">|</li>
                  </>
                )}
                <li className="font-semibold text-gray-800" aria-current="page">{t(product.name)}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Image Gallery */}
              <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="aspect-w-1 aspect-h-1 mb-4 overflow-hidden bg-gray-100 cursor-zoom-in" onClick={() => openLightbox(allImages.indexOf(mainImage))}>
                  <img src={mainImage} alt={t(product.name)} className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`overflow-hidden border-2 transition-all duration-700 ${mainImage === img ? 'border-gray-900 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`${t(product.name)} thumbnail ${idx + 1}`} className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-col animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-gray-900">{t(product.name)}</h1>
                {designer && (
                  <p className="text-lg text-gray-500 mt-3">
                    <Link to={`/designer/${designer.id}`} className="text-gray-800 hover:underline font-semibold">{t(designer.name)}</Link> — {product.year}
                  </p>
                )}
                
                <div className="mt-8 space-y-8 border-t pt-8">
                    {product.buyable && product.price > 0 && (
                        <div>
                            <p className="text-3xl font-bold text-gray-900">
                                {new Intl.NumberFormat(locale, { style: 'currency', currency: product.currency || 'TRY' }).format(product.price)}
                            </p>
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{t('description')}</h2>
                        <p className="mt-2 text-gray-600 leading-relaxed">{t(product.description)}</p>
                    </div>
                    
                    {product.dimensions && product.dimensions.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{t('dimensions')}</h2>
                        {product.dimensions.length > 1 && (
                          <div className="mt-4 flex flex-wrap gap-4">
                            {product.dimensions.map((dimSet, index) => {
                                const widthDetail = dimSet.details.find(d => d.label === 'Genişlik' || d.label === 'Çap');
                                const dimensionLabel = widthDetail ? t(widthDetail.value) : t(dimSet.name);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDimensionIndex(index)}
                                        className={`relative py-2 px-2 text-sm font-medium transition-colors duration-300 focus:outline-none ${
                                            selectedDimensionIndex === index
                                                ? 'text-gray-900'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {dimensionLabel}
                                        <span className={`absolute bottom-0 left-0 block w-full h-[1.5px] bg-gray-900 transform transition-transform duration-300 ease-out ${
                                            selectedDimensionIndex === index ? 'scale-x-100' : 'scale-x-0'
                                        }`} style={{ transformOrigin: 'center' }}></span>
                                    </button>
                                );
                            })}
                          </div>
                        )}
                        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                          {product.dimensions[selectedDimensionIndex].details.map((dim, index) => (
                            <div key={index}>
                              <p className="text-sm text-gray-500">{t(dim.label)}</p>
                              <p className="text-lg font-semibold text-gray-800">{t(dim.value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.materials && product.materials.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{t('material_alternatives')}</h2>
                            {product.groupedMaterials && product.groupedMaterials.length > 0 ? (
                              <>
                                <div className="mt-4 flex flex-wrap gap-3">
                                  {product.groupedMaterials.map((g, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => setActiveMaterialGroup(idx)}
                                      className={`px-3 py-1 rounded-full border ${activeMaterialGroup===idx ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300'} transition`}
                                    >
                                      {t(g.groupTitle)}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-6 flex flex-wrap gap-4">
                                  {product.groupedMaterials[activeMaterialGroup].materials.map((material, index) => (
                                    <div key={index} className="text-center group cursor-pointer" title={t(material.name)}>
                                      <img src={material.image} alt={t(material.name)} className="w-20 h-20 rounded-full object-cover border-2 border-transparent group-hover:border-gray-400 transition" />
                                      <p className="mt-2 text-sm text-gray-600 max-w-[80px] break-words">{t(material.name)}</p>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="mt-4 flex flex-wrap gap-4">
                                {product.materials.map((material, index) => (
                                  <div key={index} className="text-center group cursor-pointer" title={t(material.name)}>
                                    <img src={material.image} alt={t(material.name)} className="w-20 h-20 rounded-full object-cover border-2 border-transparent group-hover:border-gray-400 transition" />
                                    <p className="mt-2 text-sm text-gray-600 max-w-[80px] break-words">{t(material.name)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                    )}
                </div>
                 {product.buyable && (
                      <div className="mt-12 pt-8 border-t border-gray-200">
                          <button
                              onClick={() => addToCart(product)}
                              className="group w-20 h-20 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 hover:shadow-lg"
                              aria-label={t('add_to_cart')}
                          >
                              <TransparentShoppingBagIcon />
                          </button>
                      </div>
                  )}
              </div>
            </div>
            
            {isLoggedIn && product.exclusiveContent && (
                <div className="mt-20 bg-white p-8 sm:p-12 rounded-lg animate-fade-in-up border">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4 border-gray-300">{t('exclusive_content')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('additional_images')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                            {product.exclusiveContent.images.map((img, idx) => (
                                <img key={idx} src={img} alt={`Exclusive ${idx}`} className="rounded-lg w-full object-cover shadow-sm"/>
                            ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('technical_drawings')}</h3>
                            <ul className="space-y-3">
                            {product.exclusiveContent.drawings.map((doc, idx) => (
                                <li key={idx}>
                                    <a href={doc.url} download className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-3 transition-transform duration-200 transform hover:translate-x-1.5"><DownloadIcon/> {t(doc.name)}</a>
                                </li>
                            ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('3d_models')}</h3>
                             <ul className="space-y-3">
                            {product.exclusiveContent.models3d.map((model, idx) => (
                                <li key={idx}>
                                    <a href={model.url} download className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-3 transition-transform duration-200 transform hover:translate-x-1.5"><DownloadIcon/> {t(model.name)}</a>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Product Navigation */}
        {(prevProduct || nextProduct) && (
          <nav className="bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-8">
              <div className="w-1/2 flex justify-start">
                {prevProduct ? (
                  <Link 
                    to={`/product/${prevProduct.id}`} 
                    className="group flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label={`Previous product: ${t(prevProduct.name)}`}
                  >
                    <ChevronLeftIcon className="w-8 h-8 transition-transform group-hover:-translate-x-1" />
                    <div className="text-right">
                        <span className="text-xs uppercase tracking-wider text-gray-500">{t('previous_product')}</span>
                        <p className="text-lg font-semibold truncate max-w-[200px]">{t(prevProduct.name)}</p>
                    </div>
                  </Link>
                ) : (
                  <div /> 
                )}
              </div>

              <div className="w-1/2 flex justify-end">
                {nextProduct ? (
                   <Link 
                    to={`/product/${nextProduct.id}`} 
                    className="group flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label={`Next product: ${t(nextProduct.name)}`}
                   >
                     <div className="text-left">
                        <span className="text-xs uppercase tracking-wider text-gray-500">{t('next_product')}</span>
                        <p className="text-lg font-semibold truncate max-w-[200px]">{t(nextProduct.name)}</p>
                    </div>
                     <ChevronRightIcon className="w-8 h-8 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:opacity-75 transition-opacity z-20">
            <CloseIcon />
          </button>
          <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2">
            <ChevronLeftIcon />
          </button>
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:opacity-75 transition-opacity z-20 bg-black/20 rounded-full p-2">
            <ChevronRightIcon />
          </button>
          <div className="max-w-screen-lg max-h-[90vh] w-full p-4">
             <img src={allImages[lightboxImageIndex]} alt="Enlarged product view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
}