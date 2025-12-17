import {useSEO} from '../hooks/useSEO'

export function ComingSoonPage() {
  useSEO({
    title: 'BIRIM - Yakında Yayında',
    description: 'Birim web sitesi üzerinde çalışmalarımız devam ediyor.',
    siteName: 'BIRIM',
    type: 'website',
    locale: 'tr_TR',
  })

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex items-center justify-start px-5 md:px-10 py-5">
      <div className="w-full">
        <div className="w-full flex flex-col items-center justify-start text-center animate-fade-in px-4 md:px-10">
          {/* Logo */}
          <div className="w-full max-w-full flex justify-center items-center mb-4">
            <img
              src="/img/logo-1.png"
              alt="Birim"
              className="w-auto h-auto max-w-[400px] max-h-[400px] object-contain md:max-w-[400px] md:max-h-[400px]"
            />
          </div>

          {/* Sofa image */}
          <div className="w-full max-w-full flex justify-center items-center mb-5">
            <img
              src="/img/sofa.jpg"
              alt="Sofa"
              className="w-full max-w-full max-h-[50vh] sm:max-h-[40vh] md:max-h-[50vh] h-auto object-contain block"
            />
          </div>

          {/* Title */}
          <h1 className="text-[1.8rem] md:text-[2rem] font-normal tracking-[0.12em] mb-5 font-[Inter,'system-ui',sans-serif]">
            Under construction
          </h1>

          {/* Contact */}
          <div className="mt-0">
            <a
              href="mailto:info@birim.com"
              className="text-[#1a1a1a] font-bold text-[0.9rem] tracking-[0.15em] border-b border-[#1a1a1a] pb-[2px] hover:opacity-60 hover:border-transparent transition-opacity"
            >
              info@birim.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
