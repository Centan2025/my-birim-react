const fs = require('fs');
const filePath = 'f:/birim-web-antigravity/src/components/Header.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const desktopStartMarker = '{!isMobile ? (';
const mobileStartMarker = '/* Mobile View */';

const startIndex = content.indexOf(desktopStartMarker);
const endIndex = content.indexOf(mobileStartMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    process.exit(1);
}

const headerScaleLogic = `
              <div className="header-main-container">
                <div
                  className="header-inner"
                  style={{
                    transform: \`scale(\${headerScale})\`,
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Left Side Group */}
                  <div className="side-group">
                    <div className="side-anchor-group left-anchor">
                      <button
                        ref={searchButtonRef}
                        onClick={() => {
                          if (!isSearchOpen && headerOpacity <= 0.05 && previousHeaderOpacityRef.current === null) {
                            previousHeaderOpacityRef.current = headerOpacity
                            setHeaderOpacity(0.7)
                          }
                          isSearchOpen ? closeSearch() : setIsSearchOpen(true)
                        }}
                        className={\`\${iconClasses}\`}
                        aria-label={isSearchOpen ? t('close_search') || 'Aramayı kapat' : t('open_search') || 'Ara'}
                        aria-expanded={isSearchOpen}
                        aria-controls="search-panel"
                      >
                        <span className="relative flex items-center justify-center w-5 h-5">
                          <span className={\`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out \${isSearchOpen ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0'}\`}>
                            <SearchIcon />
                          </span>
                          <span className={\`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out \${isSearchOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'}\`}>
                            <CloseIcon />
                          </span>
                        </span>
                      </button>

                      <div className="divider-line" />
                    </div>

                    <div className="nav-center-container">
                      <div className="nav-items-wrapper">
                        <div
                          ref={productsButtonRef}
                          className="relative"
                          onMouseEnter={handleProductsEnter}
                          onMouseLeave={handleProductsLeave}
                        >
                          <Link
                            to="/categories"
                            className={\`group flex items-center space-x-1 py-2 \${navLinkClasses}\`}
                            onClick={() => setIsProductsOpen(false)}
                          >
                            <span className="relative inline-block transition-transform duration-300 ease-out group-hover:-translate-y-0.5 uppercase header-nav-text">
                              {t('products')}
                              <span className={\`absolute -bottom-1 left-0 w-full h-[2px] bg-white transition-transform duration-300 ease-out origin-center \${isProductsOpen ? 'scale-x-0 opacity-0' : 'transform scale-x-0 group-hover:scale-x-100'}\`}></span>
                            </span>
                            <ChevronDownIcon />
                          </Link>
                        </div>
                        <NavItem to="/designers" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>
                          {t('designers')}
                        </NavItem>
                        <NavItem to="/projects" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>
                          {t('projects') || 'Projeler'}
                        </NavItem>
                      </div>
                    </div>
                  </div>

                  {/* Center Logo */}
                  <div className="logo-box">
                    <Link to="/" className="block">
                      <SiteLogo logoUrl={settings?.logoUrl} className="site-logo-fluid" />
                    </Link>
                  </div>

                  {/* Right Side Group */}
                  <div className="side-group">
                    <div className="nav-center-container">
                      <div className="nav-items-wrapper">
                        <NavItem to="/news" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>
                          {t('news')}
                        </NavItem>
                        <NavItem to="/about" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>
                          {t('about')}
                        </NavItem>
                        <NavItem to="/contact" onMouseEnter={handleCloseProducts} onClick={handleCloseProducts}>
                          {t('contact')}
                        </NavItem>
                      </div>
                    </div>

                    <div className="side-anchor-group right-anchor">
                      <div className="divider-line" />

                      <div className="utility-group">
                        {settings?.isLanguageSwitcherVisible !== false && supportedLocales.length \u003e 1 && (
                          <div className="lang-btn-box">
                            {supportedLocales.map(langCode =\u003e (
                              <button
                                key={langCode}
                                onClick={() => setLocale(langCode)}
                                className={\`text-[clamp(0.6rem,0.6vw,0.75rem)] tracking-[0.2em] font-light transition-colors \${locale === langCode ? 'text-white' : 'text-white/20 hover:text-white'}\`}
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {langCode.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-[clamp(0.5rem,1.5vw,2.5rem)]">
                          {settings?.showCartButton === true && (
                            <button
                              onClick={toggleCart}
                              className={\`relative \${iconClasses}\`}
                              aria-label={\`\${t('cart') || 'Sepet'}\${cartCount \u003e 0 ? \` (\${cartCount} \${t('items') || 'ürün'})\` : ''}\`}
                              style={{ padding: '0.5rem' }}
                            >
                              <ShoppingBagIcon />
                              {cartCount \u003e 0 && (
                                <span className="absolute top-1 right-0.5 bg-white text-black text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                                  {cartCount}
                                </span>
                              )}
                            </button>
                          )}
                          <NavLink
                            to={isLoggedIn ? '/profile' : '/login'}
                            className={\`\${iconClasses}\`}
                            aria-label={isLoggedIn ? t('profile') || 'Profil' : t('login') || 'Giriş Yap'}
                            style={{ padding: '0.5rem' }}
                          >
                            <UserIcon />
                          </NavLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (\n`;

const newContent = content.substring(0, startIndex) + desktopStartMarker + headerScaleLogic + content.substring(endIndex);
fs.writeFileSync(filePath, newContent);
console.log('Header restructured and logo restored successfully!');
