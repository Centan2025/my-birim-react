/**
 * Header CSS styles extracted to keep the main component clean.
 * These are global styles needed for header animations and mobile menu behavior.
 */
export function HeaderStyles() {
  return (
    <style>
      {`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .header-scroll-transition {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                      opacity 0.6s ease-out, 
                      scale 0.7s cubic-bezier(0.16, 1, 0.3, 1) !important;
          will-change: transform, opacity, scale;
        }

        .header-layout-transition {
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .header-layout-transition-delayed {
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.05s !important;
        }

        @keyframes crossFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .image-transition {
          transition: opacity 0.5s ease-in-out;
        }

        @keyframes textFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes textFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        .cross-fade-text-in {
          animation: textFadeIn 0.6s ease-in-out forwards;
        }

        .cross-fade-text-out {
          animation: textFadeOut 0.6s ease-in-out forwards;
        }

        .cross-fade-input {
          animation: textFadeIn 0.6s ease-in-out forwards;
        }

        /* Force consistent font sizing for all header nav items */
        header nav .header-nav-item,
        header nav .header-nav-item.active,
        header nav a.header-nav-item,
        header nav a.header-nav-item.active,
        header nav a[href*="/designers"],
        header nav a[href*="/projects"],
        header nav a[href*="/news"],
        header nav a[href*="/about"],
        header nav a[href*="/contact"],
        header nav a[href*="/categories"] {
          font-size: clamp(10px, 0.2rem + 0.7vw, 14px) !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
        }

        header nav .header-nav-text,
        header nav .header-nav-item .header-nav-text,
        header nav .header-nav-item.active .header-nav-text,
        header nav a.header-nav-item span.header-nav-text,
        header nav a.header-nav-item.active span.header-nav-text,
        header nav a[href*="/designers"] span,
        header nav a[href*="/projects"] span,
        header nav a[href*="/news"] span,
        header nav a[href*="/about"] span,
        header nav a[href*="/contact"] span,
        header nav a[href*="/categories"] span {
          font-size: clamp(10px, 0.2rem + 0.7vw, 14px) !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
          line-height: 1.25rem !important;
          display: inline-block !important;
        }

        /* React Router active state override */
        header nav a[class*="active"] span,
        header nav a.active span,
        header nav a[aria-current="page"] span {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
          line-height: 1.25rem !important;
        }

        /* Overlay mobile menu - fully opaque dark background */
        #mobile-menu.mobile-menu-overlay {
          background-color: #111827 !important;
          background: #111827 !important;
        }

        /* When overlay menu is open, force header to match */
        header.overlay-menu-open > div {
          background-color: #111827 !important;
          background: #111827 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        /* Consistent font sizing for mobile menu items */
        #mobile-menu nav button,
        #mobile-menu nav a,
        #mobile-menu nav button *,
        #mobile-menu nav a *,
        #mobile-menu nav button span,
        #mobile-menu nav a span,
        #mobile-menu nav button span span,
        #mobile-menu nav a span span,
        #mobile-menu nav button span span span,
        #mobile-menu nav a span span span,
        #mobile-menu nav button .cross-fade-text-in,
        #mobile-menu nav a .cross-fade-text-in,
        #mobile-menu nav button .cross-fade-text-out,
        #mobile-menu nav a .cross-fade-text-out {
          font-size: 1.25rem !important;
          font-weight: 300 !important;
          letter-spacing: 0.2em !important;
          line-height: 1.25 !important;
          font-family: 'Neue Montreal', 'Jura', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        /* Soften tap highlight on mobile menu */
        #mobile-menu button,
        #mobile-menu a {
          -webkit-tap-highlight-color: rgba(255, 255, 255, 0.08);
        }

        /* Neutral gray focus outlines for mobile menu */
        #mobile-menu a:focus,
        #mobile-menu a:focus-visible,
        #mobile-menu button:focus,
        #mobile-menu button:focus-visible {
          outline-color: rgba(148, 163, 184, 0.6);
        }
      `}
    </style>
  )
}
