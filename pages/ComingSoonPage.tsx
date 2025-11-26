export function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex items-start justify-center px-4 md:px-8 py-5">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center justify-start text-center animate-fade-in">
          {/* Logo */}
          <div className="w-full max-w-full flex justify-center items-center mb-6">
            <img
              src="/img/logo-1.png"
              alt="Birim"
              className="w-auto h-auto max-w-[420px] max-h-[140px] object-contain"
            />
          </div>

          {/* Sofa image */}
          <div className="w-full max-w-full flex justify-center items-center mb-6">
            <img
              src="/img/sofa.jpg"
              alt="Sofa"
              className="w-full max-w-full max-h-[65vh] h-auto object-contain block"
            />
          </div>

          {/* Title */}
          <h1 className="text-[1.8rem] md:text-[2rem] font-normal tracking-[0.12em] mb-5 font-[Inter,'system-ui',sans-serif]">
            {/* Bu sayfada görsel tasarımı birebir korumak için metni sabit yazıyoruz */}
            coming&nbsp;soon,&nbsp;under&nbsp;construction
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
