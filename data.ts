import type { SiteSettings, Category, Designer, Product, HomePageContent, AboutPageContent, ContactPageContent, FooterContent, NewsItem } from './types';

export const KEYS = {
    SITE_SETTINGS: 'birim_site_settings',
    CATEGORIES: 'birim_categories',
    DESIGNERS: 'birim_designers',
    PRODUCTS: 'birim_products',
    USERS: 'birim_users',
    HOME_PAGE: 'birim_home_page',
    ABOUT_PAGE: 'birim_about_page',
    CONTACT_PAGE: 'birim_contact_page',
    FOOTER: 'birim_footer',
    NEWS: 'birim_news',
    LANGUAGES: 'birim_languages',
};

export const languagesData: string[] = ['tr', 'en'];

// FIX: Removed `heroMediaUrl` and `heroMediaType` as they are not defined in the SiteSettings type.
export const siteSettingsData: SiteSettings = {
    logoUrl: '/img/logo.png',
    showProductPrevNext: false,
};

export const categoriesData: Category[] = [
    { id: 'kanepeler', name: { tr: 'Kanepeler', en: 'Sofas' }, subtitle: { tr: 'Koleksiyonumuzdaki en rafine kanepeleri keşfedin.', en: 'Discover the most refined sofas in our collection.' }, heroImage: 'https://picsum.photos/seed/sofas/1920/1080' },
    { id: 'koltuklar', name: { tr: 'Koltuklar', en: 'Armchairs' }, subtitle: { tr: 'Koleksiyonumuzdaki en rafine koltukları keşfedin.', en: 'Discover the most refined armchairs in our collection.' }, heroImage: 'https://picsum.photos/seed/armchairs/1920/1080' },
    { id: 'masalar', name: { tr: 'Masalar', en: 'Tables' }, subtitle: { tr: 'Koleksiyonumuzdaki en rafine masaları keşfedin.', en: 'Discover the most refined tables in our collection.' }, heroImage: 'https://picsum.photos/seed/tables/1920/1080' },
    { id: 'aydinlatma', name: { tr: 'Aydınlatma', en: 'Lighting' }, subtitle: { tr: 'Koleksiyonumuzdaki en rafine aydınlatma ürünlerini keşfedin.', en: 'Discover the most refined lighting products in our collection.' }, heroImage: 'https://picsum.photos/seed/lighting/1920/1080' },
];

export const designersData: Designer[] = [
    { id: 'jean-marie-massaud', name: {tr: 'Jean-Marie Massaud', en: 'Jean-Marie Massaud'}, bio: { tr: 'Jean-Marie Massaud, 1966 yılında Toulouse, Fransa\'da doğan bir Fransız mimar, mucit ve tasarımcıdır. Çalışmaları endüstriyel ürünler, mimari projeler, marka geliştirme ve hem seri hem de benzersiz parçaları kapsamaktadır.', en: 'Jean-Marie Massaud is a French architect, inventor and designer. He was born in Toulouse, France in 1966. His work covers industrial products, architectural projects, brand development, and both series and unique pieces.' }, image: 'https://picsum.photos/seed/massaud/400/500' },
    { id: 'patricia-urquiola', name: {tr: 'Patricia Urquiola', en: 'Patricia Urquiola'}, bio: { tr: 'Patricia Urquiola bir İspanyol mimar ve tasarımcıdır. Eğlenceli ve şiirsel, ancak işlevsel ve teknik olarak sağlam tasarımlarıyla tanınır. Eserleri, New York\'taki MoMA da dahil olmak üzere dünya çapındaki müzelerde sergilenmektedir.', en: 'Patricia Urquiola is a Spanish architect and designer. She is known for her playful and poetic, yet functional and technically sound designs. Her work is exhibited in museums worldwide, including the MoMA in New York.' }, image: 'https://picsum.photos/seed/urquiola/400/500' },
    { id: 'antonio-citterio', name: {tr: 'Antonio Citterio', en: 'Antonio Citterio'}, bio: { tr: 'Antonio Citterio bir İtalyan mimar ve mobilya tasarımcısıdır. Birçok tanınmış markayla çalışmış ve 1987 ve 1994\'te Compasso d\'Oro da dahil olmak üzere çok sayıda ödül kazanmıştır.', en: 'Antonio Citterio is an Italian architect and furniture designer. He has worked with many renowned brands and has won numerous awards, including the Compasso d\'Oro in 1987 and 1994.' }, image: 'https://picsum.photos/seed/citterio/400/500' },
];

export const productsData: Product[] = [
    {
        id: 'bristol-sofa',
        name: { tr: 'Bristol Kanepe', en: 'Bristol Sofa' },
        designerId: 'jean-marie-massaud',
        categoryId: 'kanepeler',
        year: 2013,
        description: { tr: 'Jean-Marie Massaud tarafından tasarlanan Bristol, birincil şekilleri uyumlu ve ergonomik bir tasarımda birleştiren bir kanepe sistemidir. Saran sırtlıklara sahip yumuşak, konforlu şekiller maksimum konfor sağlar.', en: 'Bristol, designed by Jean-Marie Massaud, is a sofa system that combines primary shapes in a harmonious and ergonomic design. The soft, comfortable shapes, with enveloping backrests, provide maximum comfort.' },
        mainImage: 'https://picsum.photos/seed/bristol-1/800/800',
        alternativeImages: ['https://picsum.photos/seed/bristol-2/800/800', 'https://picsum.photos/seed/bristol-3/800/800'],
        buyable: true,
        price: 150000,
        currency: 'TRY',
        materials: [{ name: { tr: 'Kumaş', en: 'Fabric' }, image: 'https://picsum.photos/seed/fabric/100/100' }, { name: { tr: 'Deri', en: 'Leather' }, image: 'https://picsum.photos/seed/leather/100/100' }],
        dimensionImages: [
            { image: 'https://picsum.photos/seed/bristol-dim-1/800/600' },
            { image: 'https://picsum.photos/seed/bristol-dim-2/800/600' }
        ],
        exclusiveContent: { images: ['https://picsum.photos/seed/bristol-ex1/800/800'], drawings: [{ name: { tr: 'Teknik Çizim', en: 'Technical Drawing' }, url: '#' }], models3d: [{ name: { tr: '3DS Max Modeli', en: '3DS Max Model' }, url: '#' }] },
    },
    {
        id: 'husk-armchair',
        name: { tr: 'Husk Koltuk', en: 'Husk Armchair' },
        designerId: 'patricia-urquiola',
        categoryId: 'koltuklar',
        year: 2011,
        description: { tr: 'Husk, göründüğü kadar rahat bir koltuktur. Hirek®\'ten yapılmış sert kabuk, ergonomik profilini vurguluyor gibi görünen bölümlere ayrılmış yumuşak bir minder içerir.', en: 'Husk is an armchair that is as comfortable as it looks. The stiff shell, made of Hirek®, contains a soft cushion divided into portions, which seem to underscore its ergonomic profile.' },
        mainImage: 'https://picsum.photos/seed/husk-1/800/800',
        alternativeImages: ['https://picsum.photos/seed/husk-2/800/800'],
        buyable: false,
        price: 45000,
        currency: 'TRY',
        materials: [{ name: { tr: 'Yün Kumaş', en: 'Wool Fabric' }, image: 'https://picsum.photos/seed/wool/100/100' }, { name: { tr: 'Kadife', en: 'Velvet' }, image: 'https://picsum.photos/seed/velvet/100/100' }],
        exclusiveContent: { images: [], drawings: [], models3d: [] },
    },
    {
        id: 'charles-sofa',
        name: { tr: 'Charles Kanepe', en: 'Charles Sofa' },
        designerId: 'antonio-citterio',
        categoryId: 'kanepeler',
        year: 1997,
        description: { tr: 'Uzun süredir en çok satanlar arasında yer alan Charles kanepe, döküm alüminyum ayaklarının temel tasarımıyla vurgulanan hafif görüntüsüyle karakterize edilir. Tasarım dünyasında bir dönüm noktasını temsil eder.', en: 'The Charles sofa, a long-time bestseller, is characterized by its light image accentuated by the essential design of its die-cast aluminium feet. It represents a milestone in the world of design.' },
        mainImage: 'https://picsum.photos/seed/charles-1/800/800',
        alternativeImages: [],
        buyable: true,
        price: 120000,
        currency: 'TRY',
        materials: [],
        exclusiveContent: { images: [], drawings: [], models3d: [] },
    },
    {
      id: 'pathos-table',
      name: { tr: 'Pathos Masa', en: 'Pathos Table' },
      designerId: 'antonio-citterio',
      categoryId: 'masalar',
      year: 2013,
      description: { tr: 'Pathos masa koleksiyonu, parlak krom kaplama, siyah boyalı veya bronz nikel boyalı çelik bir çerçeve ve yuvarlak köşeli dikdörtgen veya kare olabilen bir üst tabla ile karakterize edilir.', en: 'The Pathos table collection is characterized by a frame in polished chrome-plated, black painted, or bronzed nickel-painted steel, and a top that can be rectangular or square with rounded corners.' },
      mainImage: 'https://picsum.photos/seed/pathos-1/800/800',
      alternativeImages: ['https://picsum.photos/seed/pathos-2/800/800'],
      buyable: true,
      price: 85000,
      currency: 'TRY',
      materials: [{ name: { tr: 'Mermer', en: 'Marble' }, image: 'https://picsum.photos/seed/marble/100/100' }],
      exclusiveContent: { images: [], drawings: [], models3d: [] },
    },
     {
        id: 'lifesteel-sofa',
        name: { tr: 'Lifesteel Kanepe', en: 'Lifesteel Sofa' },
        designerId: 'antonio-citterio',
        categoryId: 'kanepeler',
        year: 2006,
        description: { tr: 'Lifesteel kanepe, yükseltilmiş tabanı ve metal ayakları ile hafif ve havadar bir estetik sunar. Geniş, alçak kolçakları ve cömert kaz tüyü minderleri ile modern konforun bir simgesidir.', en: 'The Lifesteel sofa offers a light and airy aesthetic with its raised base and metal feet. It is a symbol of modern comfort with its wide, low armrests and generous goose-down cushions.' },
        mainImage: 'https://picsum.photos/seed/lifesteel-1/800/800',
        alternativeImages: ['https://picsum.photos/seed/lifesteel-2/800/800', 'https://picsum.photos/seed/lifesteel-3/800/800'],
        buyable: true,
        price: 180000,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Nubuk Deri', en: 'Nubuck Leather' }, image: 'https://picsum.photos/seed/nubuck/100/100' },
            { name: { tr: 'Keten', en: 'Linen' }, image: 'https://picsum.photos/seed/linen/100/100' }
        ],
        exclusiveContent: { images: [], drawings: [], models3d: [] },
    },
    {
        id: 'groundpiece-sofa',
        name: { tr: 'Groundpiece Kanepe', en: 'Groundpiece Sofa' },
        designerId: 'antonio-citterio',
        categoryId: 'kanepeler',
        year: 2001,
        description: { tr: 'Groundpiece, bir kanepenin ne olabileceği algısını değiştirdi. Alçak ve derin yapısı, rahat ve gayriresmi bir oturma deneyimi sunar. Yenilikçi kolçakları hem depolama alanı hem de sehpa işlevi görebilir.', en: 'Groundpiece changed the perception of what a sofa could be. Its low and deep structure offers a relaxed and informal seating experience. Its innovative armrests can function as both storage and a side table.' },
        mainImage: 'https://picsum.photos/seed/groundpiece-1/800/800',
        alternativeImages: ['https://picsum.photos/seed/groundpiece-2/800/800'],
        buyable: true,
        price: 210000,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Pamuklu Kumaş', en: 'Cotton Fabric' }, image: 'https://picsum.photos/seed/cotton/100/100' }
        ],
        exclusiveContent: { images: [], drawings: [], models3d: [] },
    }
];

export const homePageContentData: HomePageContent = {
    heroMedia: [
        { type: 'image', url: 'https://picsum.photos/seed/home-hero-1/1920/1080', title: { tr: 'Zamanın Ötesinde Tasarım', en: 'Timeless Design' }, subtitle: { tr: 'İkonik mobilyalarla yaşam alanlarınızı yeniden şekillendirin.', en: 'Reshape your living spaces with iconic furniture.' }, isButtonVisible: true, buttonText: { tr: 'Koleksiyonu Keşfet', en: 'Discover the Collection' }, buttonLink: '/products/kanepeler' },
        { type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', title: { tr: 'Hareketin Zarafeti', en: 'The Elegance of Motion' }, subtitle: { tr: 'Dinamik ve fonksiyonel tasarımlarımızla tanışın.', en: 'Meet our dynamic and functional designs.' }, isButtonVisible: false, buttonText: {tr: '', en: ''}, buttonLink: '' },
        { type: 'image', url: 'https://picsum.photos/seed/home-hero-2/1920/1080', title: { tr: 'Malzemenin Doğallığı', en: 'The Nature of Materials' }, subtitle: { tr: 'En kaliteli ve doğal malzemelerle üretilen tasarımlar.', en: 'Designs crafted with the finest and most natural materials.' }, isButtonVisible: true, buttonText: { tr: 'Hakkımızda', en: 'About Us' }, buttonLink: '/about' },
        { type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', title: { tr: 'Yaratıcılığın Sınırları', en: 'The Limits of Creativity' }, subtitle: { tr: 'Dünyaca ünlü tasarımcıların imzasını taşıyan eserler.', en: 'Works bearing the signature of world-renowned designers.' }, isButtonVisible: false, buttonText: {tr: '', en: ''}, buttonLink: '' },
        { type: 'image', url: 'https://picsum.photos/seed/home-hero-3/1920/1080', title: { tr: 'Detaydaki Mükemmellik', en: 'Perfection in Detail' }, subtitle: { tr: 'Her bir parçada ustalık ve zanaatkarlığın izleri.', en: 'Traces of mastery and craftsmanship in every single piece.' }, isButtonVisible: true, buttonText: { tr: 'Tasarımcılar', en: 'Designers' }, buttonLink: '/designers' },
    ],
    isHeroTextVisible: true,
    isLogoVisible: true,
    featuredProductIds: ['bristol-sofa', 'husk-armchair', 'lifesteel-sofa'],
    featuredDesignerId: 'antonio-citterio',
    inspirationSection: {
        backgroundImage: 'https://picsum.photos/seed/inspiration/1920/1080',
        title: { tr: 'İlham Veren Mekanlar Yaratın', en: 'Create Inspiring Spaces' },
        subtitle: { tr: 'Tasarımın gücüyle hayalinizdeki atmosferi oluşturun.', en: 'Create your dream atmosphere with the power of design.' },
        buttonText: { tr: 'Tasarımcılarımızı Tanıyın', en: 'Meet Our Designers' },
        buttonLink: '/designers',
    },
};

export const aboutPageContentData: AboutPageContent = {
    heroImage: 'https://picsum.photos/seed/about-hero/1920/1080',
    heroTitle: { tr: 'Hakkımızda', en: 'About Us' },
    heroSubtitle: { tr: 'Tasarım tutkusunu zanaatkarlıkla birleştiren yarım asırlık bir hikaye.', en: 'A half-century story combining a passion for design with craftsmanship.' },
    storyTitle: { tr: 'Bizim Hikayemiz', en: 'Our Story' },
    storyContentP1: { tr: '1973 yılında kurulan Birim, mobilya tasarımına olan tutkusuyla yola çıktı. Amacımız, sadece estetik değil, aynı zamanda fonksiyonel ve zamana meydan okuyan parçalar yaratmaktı.', en: 'Founded in 1973, Birim set out with a passion for furniture design. Our goal was to create pieces that were not only aesthetic but also functional and timeless.' },
    storyContentP2: { tr: 'Bugün, dünyanın önde gelen tasarımcılarıyla işbirliği yaparak, yenilikçi malzeme ve teknolojileri geleneksel zanaatkarlıkla harmanlıyoruz.', en: 'Today, we collaborate with the world\'s leading designers, blending innovative materials and technologies with traditional craftsmanship.' },
    storyImage: 'https://picsum.photos/seed/about-story/600/800',
    isQuoteVisible: true,
    quoteText: { tr: 'İyi tasarım, iyi iş demektir.', en: 'Good design is good business.' },
    quoteAuthor: 'Thomas Watson Jr.',
    valuesTitle: { tr: 'Değerlerimiz', en: 'Our Values' },
    values: [
        { title: { tr: 'Kalite', en: 'Quality' }, description: { tr: 'Her detayda en yüksek kalite standartlarını hedefleriz.', en: 'We aim for the highest quality standards in every detail.' } },
        { title: { tr: 'Tasarım Odaklılık', en: 'Design Focus' }, description: { tr: 'Tasarımın gücüne inanır, estetik ve fonksiyonelliği bir araya getiririz.', en: 'We believe in the power of design, bringing together aesthetics and functionality.' } },
        { title: { tr: 'Zanaatkarlık', en: 'Craftsmanship' }, description: { tr: 'Geleneksel üretim tekniklerine saygı duyar, usta ellerin değerini biliriz.', en: 'We respect traditional production techniques and value the work of master craftsmen.' } },
    ]
};

export const contactPageContentData: ContactPageContent = {
    title: { tr: 'İletişim', en: 'Contact' },
    subtitle: { tr: 'Size yardımcı olmak için buradayız. Showroomlarımızı ziyaret edin veya bizimle doğrudan iletişime geçin.', en: 'We are here to help you. Visit our showrooms or contact us directly.' },
    locations: [
        { type: { tr: 'Mağaza', en: 'Store' }, title: {tr: 'İstanbul Showroom', en: 'Istanbul Showroom'}, address: 'Bağdat Caddesi No: 200, Kadıköy, İstanbul', phone: '+90 216 123 45 67', email: 'istanbul@birim.com', mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3012.792582189033!2d29.05586431541315!3d40.9650399793051!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac687b1341a03%3A0x9a842f6191b7d8c!2sBa%C4%9Fdat%20Cd.!5e0!3m2!1sen!2str!4v1626876615758!5m2!1sen!2str' },
        { type: { tr: 'Mağaza', en: 'Store' }, title: {tr: 'Ankara Showroom', en: 'Ankara Showroom'}, address: 'Tunalı Hilmi Caddesi No: 88, Çankaya, Ankara', phone: '+90 312 987 65 43', email: 'ankara@birim.com', mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3060.038481352358!2d32.85734031538019!3d39.918905979426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d34fa421941a5d%3A0x8f7d4b4f5e0e0e0a!2sTunal%C4%B1%20Hilmi%20Cd.!5e0!3m2!1sen!2str!4v1626876707314!5m2!1sen!2str' },
        { type: { tr: 'Fabrika', en: 'Factory' }, title: { tr: 'Üretim Tesisi', en: 'Production Facility' }, address: 'Organize Sanayi Bölgesi, Bursa', phone: '+90 224 111 22 33', mapEmbedUrl: '' },
    ]
};

export const footerContentData: FooterContent = {
    copyrightText: { tr: '© 2024 Birim Mobilya. Tüm hakları saklıdır.', en: '© 2024 Birim Furniture. All rights reserved.' },
    partnerNames: ['Poliform', 'B&B Italia'],
    linkColumns: [
        {
            title: { tr: 'Navigasyon', en: 'Navigation' },
            links: [
                { text: { tr: 'Koleksiyon', en: 'Collection' }, url: '/products/kanepeler' },
                { text: { tr: 'Tasarımcılar', en: 'Designers' }, url: '/designers' },
                { text: { tr: 'Haberler', en: 'News' }, url: '/news' },
                { text: { tr: 'Hakkımızda', en: 'About Us' }, url: '/about' },
                { text: { tr: 'İletişim', en: 'Contact' }, url: '/contact' },
            ]
        },
        {
            title: { tr: 'Destek', en: 'Support' },
            links: [
                { text: { tr: 'SSS', en: 'FAQ' }, url: '#' },
            ]
        }
    ],
    socialLinks: [
        { name: 'Instagram', url: 'https://instagram.com', svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>', isEnabled: true },
        { name: 'Facebook', url: 'https://facebook.com', svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>', isEnabled: true },
    ],
    legalLinks: [
        { text: { tr: 'Şirket Bilgileri', en: 'Company Data' }, url: '#', isVisible: true },
        { text: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' }, url: '/privacy', isVisible: true },
        { text: { tr: 'Çerez Politikası', en: 'Cookie Policy' }, url: '/cookies', isVisible: true },
        { text: { tr: 'Kullanım Şartları', en: 'Terms of Service' }, url: '/terms', isVisible: true },
        { text: { tr: 'KVKK Aydınlatma Metni', en: 'KVKK Disclosure' }, url: '/kvkk', isVisible: true },
        { text: { tr: 'Yasal Bilgiler', en: 'Legals' }, url: '#', isVisible: true },
    ]
};

export const newsData: NewsItem[] = [
    { 
        id: 'milan-design-week-2024', 
        title: { tr: 'Milano Tasarım Haftası 2024 İzlenimleri', en: 'Milan Design Week 2024 Impressions' }, 
        date: '15 Haziran 2024', 
        content: { tr: 'Bu yılki Milano Tasarım Haftası\'nda öne çıkan trendleri ve yeni koleksiyonları sizler için derledik. Sürdürülebilirlik ve doğal malzemeler yine ön plandaydı. Tasarımcılar, geri dönüştürülmüş materyalleri lüks ve yenilikçi parçalara dönüştürerek çevreye duyarlı yaklaşımlarını sergilediler. Özellikle, modüler ve çok fonksiyonlu mobilyaların yükselişi, değişen yaşam alanlarına uyum sağlama ihtiyacını gözler önüne serdi.', en: 'We have compiled the prominent trends and new collections from this year\'s Milan Design Week for you. Sustainability and natural materials were at the forefront again. Designers showcased their environmentally conscious approaches by transforming recycled materials into luxurious and innovative pieces. In particular, the rise of modular and multifunctional furniture highlighted the need to adapt to changing living spaces.' }, 
        mainImage: 'https://picsum.photos/seed/milan/1200/800',
        media: [
            { type: 'image', url: 'https://picsum.photos/seed/milan-1/1200/800', caption: { tr: 'Sürdürülebilirlik odaklı tasarımlar', en: 'Sustainability-focused designs' } },
            { type: 'image', url: 'https://picsum.photos/seed/milan-2/1200/800' },
            { type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
        ]
    },
    { 
        id: 'new-collection-urquiola', 
        title: { tr: 'Patricia Urquiola\'dan Yeni Koleksiyon: "Terra"', en: 'New Collection from Patricia Urquiola: "Terra"' }, 
        date: '01 Mayıs 2024', 
        content: { tr: 'Ünlü tasarımcı Patricia Urquiola, doğadan ilham alan yeni koleksiyonu "Terra" ile yine fark yaratıyor. Toprak tonları ve organik formların hakim olduğu koleksiyon, modern yaşam alanlarına sıcaklık ve doğallık katmayı amaçlıyor. Urquiola, bu koleksiyonda zanaatkarlık ve teknolojiyi bir araya getirerek hem estetik hem de fonksiyonel parçalar ortaya koyuyor.', en: 'Famous designer Patricia Urquiola makes a difference again with her new collection "Terra", inspired by nature. The collection, dominated by earth tones and organic forms, aims to add warmth and naturalness to modern living spaces. In this collection, Urquiola combines craftsmanship and technology to create pieces that are both aesthetic and functional.' }, 
        mainImage: 'https://picsum.photos/seed/urquiola-coll/1200/800',
        media: [
             { type: 'image', url: 'https://picsum.photos/seed/terra-1/1200/800' },
        ]
    },
    { 
        id: 'new-material-mycelium', 
        title: { tr: 'Yeni Bir Malzemenin Yükselişi: Miselyum', en: 'The Rise of a New Material: Mycelium' }, 
        date: '20 Nisan 2024', 
        content: { tr: 'Tasarım dünyası, mantarların kök ağı olan miselyumun potansiyelini keşfediyor. Bu %100 doğal ve biyolojik olarak parçalanabilen malzeme, hem hafif hem de dayanıklı olmasıyla dikkat çekiyor. Akustik panellerden aydınlatma elemanlarına kadar geniş bir kullanım alanına sahip olan miselyum, mobilya sektöründe sürdürülebilir bir devrim yaratabilir.', en: 'The design world is discovering the potential of mycelium, the root network of fungi. This 100% natural and biodegradable material is notable for being both lightweight and durable. With a wide range of applications from acoustic panels to lighting elements, mycelium could create a sustainable revolution in the furniture industry.' }, 
        mainImage: 'https://picsum.photos/seed/mycelium/1200/800',
        media: [
             { type: 'image', url: 'https://picsum.photos/seed/mycelium-1/1200/800' },
             { type: 'image', url: 'https://picsum.photos/seed/mycelium-2/1200/800' },
        ]
    },
    { 
        id: 'design-award-2024', 
        title: { tr: 'Tasarım Dünyasının Prestijli Ödülü Sahibini Buldu', en: 'Prestigious Design Award Finds Its Winner' }, 
        date: '05 Mart 2024', 
        content: { tr: 'Her yıl düzenlenen Uluslararası Tasarım Ödülleri\'nde "Yılın Mobilyası" kategorisinin kazananı, Antonio Citterio tarafından tasarlanan "Lifesteel" kanepe oldu. Jüri, kanepenin zamansız estetiği, modüler yapısı ve üstün konforunu övgüyle karşıladı. Bu ödül, Citterio\'nun tasarım dehasını bir kez daha tescillemiş oldu.', en: 'The "Lifesteel" sofa, designed by Antonio Citterio, was the winner in the "Furniture of the Year" category at the annual International Design Awards. The jury praised the sofa\'s timeless aesthetics, modular structure, and superior comfort. This award once again confirmed Citterio\'s design genius.' }, 
        mainImage: 'https://picsum.photos/seed/award/1200/800',
        media: []
    }
];

export const initialData = {
    [KEYS.SITE_SETTINGS]: siteSettingsData,
    [KEYS.CATEGORIES]: categoriesData,
    [KEYS.DESIGNERS]: designersData,
    [KEYS.PRODUCTS]: productsData,
    [KEYS.USERS]: [] as any[],
    [KEYS.HOME_PAGE]: homePageContentData,
    [KEYS.ABOUT_PAGE]: aboutPageContentData,
    [KEYS.CONTACT_PAGE]: contactPageContentData,
    [KEYS.FOOTER]: footerContentData,
    [KEYS.NEWS]: newsData,
    [KEYS.LANGUAGES]: languagesData,
};