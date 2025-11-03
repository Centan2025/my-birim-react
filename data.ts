import type { SiteSettings, Category, Designer, Product, AboutPageContent, ContactPageContent, HomePageContent, FooterContent, NewsItem } from './types';

export const KEYS = {
    LANGUAGES: 'birim_languages',
    SITE_SETTINGS: 'birim_site_settings',
    CATEGORIES: 'birim_categories',
    DESIGNERS: 'birim_designers',
    PRODUCTS: 'birim_products',
    ABOUT_PAGE: 'birim_about_page',
    CONTACT_PAGE: 'birim_contact_page',
    HOME_PAGE: 'birim_home_page',
    FOOTER: 'birim_footer',
    NEWS: 'birim_news',
};

const languagesData: string[] = ['tr', 'en', 'de', 'fr', 'es', 'it'];

const siteSettingsData: SiteSettings = {
    logoUrl: 'https://raw.githubusercontent.com/birim-web/assets/main/logo-light.svg',
    heroMediaUrl: 'https://raw.githubusercontent.com/birim-web/assets/main/hero-video.mp4',
    heroMediaType: 'video',
    headerText: 'Birim',
    isHeaderTextVisible: false,
};

const categoriesData: Category[] = [
    {
        id: 'kanepeler',
        name: { tr: 'Kanepeler', en: 'Sofas' },
        subtitle: { tr: 'Oturma odanız için konfor ve stilin mükemmel birleşimi.', en: 'The perfect combination of comfort and style for your living room.' },
        heroImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    },
    {
        id: 'sandalyeler',
        name: { tr: 'Sandalyeler', en: 'Chairs' },
        subtitle: { tr: 'Her mekana zarafet katacak ikonik sandalye tasarımları.', en: 'Iconic chair designs to add elegance to any space.' },
        heroImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    },
    {
        id: 'masalar',
        name: { tr: 'Masalar', en: 'Tables' },
        subtitle: { tr: 'Yemek masalarından sehpalara, her ihtiyaca yönelik çözümler.', en: 'From dining tables to coffee tables, solutions for every need.' },
        heroImage: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    },
    {
        id: 'aydinlatma',
        name: { tr: 'Aydınlatma', en: 'Lighting' },
        subtitle: { tr: 'Mekanlarınıza karakter katacak modern aydınlatma elemanları.', en: 'Modern lighting elements to add character to your spaces.' },
        heroImage: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    }
];

const designersData: Designer[] = [
    {
        id: 'arman-kaya',
        name: { tr: 'Arman Kaya', en: 'Arman Kaya' },
        bio: { tr: 'Minimalist yaklaşımı ve doğal malzemelere olan tutkusuyla tanınan Arman Kaya, form ve fonksiyonu bir araya getiren zamansız tasarımlar yaratır. Eserleri, sadeliğin zarafetini yansıtır.', en: 'Known for his minimalist approach and passion for natural materials, Arman Kaya creates timeless designs that unite form and function. His works reflect the elegance of simplicity.' },
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'leyla-demir',
        name: { tr: 'Leyla Demir', en: 'Leyla Demir' },
        bio: { tr: 'Organik formlardan ve doğadan ilham alan Leyla Demir, heykelsi mobilyalarıyla tanınır. Tasarımları, cesur hatları ve yenilikçi malzeme kullanımıyla dikkat çeker.', en: 'Inspired by organic forms and nature, Leyla Demir is known for her sculptural furniture. Her designs stand out with their bold lines and innovative use of materials.' },
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'studio-forma',
        name: { tr: 'Studio Forma', en: 'Studio Forma' },
        bio: { tr: 'İki genç tasarımcının kurduğu Studio Forma, geleneksel zanaatkarlığı modern teknolojiyle birleştiriyor. Kolektif, sürdürülebilirliğe ve işlevselliğe odaklanan modüler ve çok yönlü parçalar yaratıyor.', en: 'Founded by two young designers, Studio Forma combines traditional craftsmanship with modern technology. The collective creates modular and versatile pieces focusing on sustainability and functionality.' },
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    }
];

const productsData: Product[] = [
    {
        id: 'bulut-kanepe',
        name: { tr: 'Bulut Kanepe', en: 'Cloud Sofa' },
        designerId: 'leyla-demir',
        categoryId: 'kanepeler',
        year: 2023,
        description: { tr: 'Yumuşak hatları ve modüler yapısıyla Bulut Kanepe, modern yaşam alanlarına konfor ve esneklik getiriyor. Geniş oturma alanı ve davetkar minderleri ile dinlenmek için mükemmel bir köşe yaratır.', en: 'With its soft lines and modular structure, the Cloud Sofa brings comfort and flexibility to modern living spaces. It creates the perfect corner for relaxation with its wide seating area and inviting cushions.' },
        mainImage: 'https://picsum.photos/seed/bulut/800/800',
        alternativeImages: ['https://picsum.photos/seed/bulut-2/800/800', 'https://picsum.photos/seed/bulut-3/800/800', 'https://picsum.photos/seed/bulut-4/800/800', 'https://picsum.photos/seed/bulut-5/800/800'],
        dimensions: [
            { name: { tr: 'İkili', en: 'Two-Seater' }, details: [{ label: { tr: 'Genişlik', en: 'Width' }, value: '220 cm' }, { label: { tr: 'Derinlik', en: 'Depth' }, value: '105 cm' }, { label: { tr: 'Yükseklik', en: 'Height' }, value: '75 cm' }] },
            { name: { tr: 'Üçlü', en: 'Three-Seater' }, details: [{ label: { tr: 'Genişlik', en: 'Width' }, value: '280 cm' }, { label: { tr: 'Derinlik', en: 'Depth' }, value: '105 cm' }, { label: { tr: 'Yükseklik', en: 'Height' }, value: '75 cm' }] }
        ],
        buyable: true,
        price: 45000,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Keten Kumaş (Bej)', en: 'Linen Fabric (Beige)' }, image: 'https://picsum.photos/seed/linen-beige/100/100' },
            { name: { tr: 'Kadife (Gri)', en: 'Velvet (Gray)' }, image: 'https://picsum.photos/seed/velvet-gray/100/100' }
        ],
        exclusiveContent: { images: ['https://picsum.photos/seed/bulut-ex1/800/800'], drawings: [{ name: { tr: 'Teknik Çizim PDF', en: 'Technical Drawing PDF' }, url: '#' }], models3d: [{ name: { tr: '3Ds Max Modeli', en: '3Ds Max Model' }, url: '#' }] }
    },
    {
        id: 'linea-sandalye',
        name: { tr: 'Linea Sandalye', en: 'Linea Chair' },
        designerId: 'arman-kaya',
        categoryId: 'sandalyeler',
        year: 2022,
        description: { tr: 'Linea Sandalye, minimalist estetiği ve ergonomik tasarımı bir araya getiriyor. Masif meşe iskeleti ve deri oturma yüzeyi ile hem dayanıklı hem de şık bir seçenektir.', en: 'The Linea Chair combines minimalist aesthetics with ergonomic design. With its solid oak frame and leather seat, it is both a durable and stylish option.' },
        mainImage: 'https://picsum.photos/seed/linea/800/800',
        alternativeImages: ['https://picsum.photos/seed/linea-2/800/800', 'https://picsum.photos/seed/linea-3/800/800'],
        dimensions: [{ name: 'Tek Boyut', details: [{ label: 'Genişlik', value: '55 cm' }, { label: 'Derinlik', value: '60 cm' }, { label: 'Yükseklik', value: '80 cm' }] }],
        buyable: true,
        price: 7500,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Meşe / Siyah Deri', en: 'Oak / Black Leather' }, image: 'https://picsum.photos/seed/oak-black/100/100' },
            { name: { tr: 'Ceviz / Taba Deri', en: 'Walnut / Tan Leather' }, image: 'https://picsum.photos/seed/walnut-tan/100/100' }
        ],
        exclusiveContent: { images: [], drawings: [{ name: { tr: 'Teknik Çizim PDF', en: 'Technical Drawing PDF' }, url: '#' }], models3d: [] }
    },
    {
        id: 'dot-sehpa',
        name: { tr: 'Dot Sehpa', en: 'Dot Coffee Table' },
        designerId: 'studio-forma',
        categoryId: 'masalar',
        year: 2024,
        description: { tr: 'Dot Sehpa, modüler tasarımıyla dikkat çeker. Farklı boyut ve renklerdeki üniteleri bir araya getirerek kendi kompozisyonunuzu yaratmanıza olanak tanır. Metal ve lake malzemelerin modern birleşimi.', en: 'The Dot Coffee Table stands out with its modular design. It allows you to create your own composition by combining units of different sizes and colors. A modern combination of metal and lacquer.' },
        mainImage: 'https://picsum.photos/seed/dot/800/800',
        alternativeImages: ['https://picsum.photos/seed/dot-2/800/800', 'https://picsum.photos/seed/dot-3/800/800'],
        dimensions: [
            { name: { tr: 'Küçük', en: 'Small' }, details: [{ label: { tr: 'Çap', en: 'Diameter' }, value: '60 cm' }, { label: { tr: 'Yükseklik', en: 'Height' }, value: '40 cm' }] },
            { name: { tr: 'Büyük', en: 'Large' }, details: [{ label: { tr: 'Çap', en: 'Diameter' }, value: '90 cm' }, { label: { tr: 'Yükseklik', en: 'Height' }, value: '35 cm' }] }
        ],
        buyable: true,
        price: 12000,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Siyah Metal / Antrasit Lake', en: 'Black Metal / Anthracite Lacquer' }, image: 'https://picsum.photos/seed/metal-anthracite/100/100' },
            { name: { tr: 'Pirinç / Beyaz Lake', en: 'Brass / White Lacquer' }, image: 'https://picsum.photos/seed/brass-white/100/100' }
        ],
        exclusiveContent: { images: ['https://picsum.photos/seed/dot-ex1/800/800'], drawings: [{ name: { tr: 'Teknik Çizim PDF', en: 'Technical Drawing PDF' }, url: '#' }], models3d: [{ name: { tr: 'SketchUp Modeli', en: 'SketchUp Model' }, url: '#' }] }
    },
    {
        id: 'luna-lamba',
        name: { tr: 'Luna Lamba', en: 'Luna Lamp' },
        designerId: 'leyla-demir',
        categoryId: 'aydinlatma',
        year: 2021,
        description: { tr: 'El yapımı cam küresi ve mermer tabanıyla Luna, mekanlara sıcak ve sanatsal bir ışık yayar. Her bir parça, üfleme cam tekniğiyle üretildiği için benzersizdir.', en: 'With its handmade glass sphere and marble base, Luna spreads a warm and artistic light in spaces. Each piece is unique as it is produced with the glass blowing technique.' },
        mainImage: 'https://picsum.photos/seed/luna/800/800',
        alternativeImages: [],
        dimensions: [{ name: 'Tek Boyut', details: [{ label: { tr: 'Çap', en: 'Diameter' }, value: '30 cm' }, { label: { tr: 'Yükseklik', en: 'Height' }, value: '45 cm' }] }],
        buyable: false,
        price: 9800,
        currency: 'TRY',
        materials: [
            { name: { tr: 'Beyaz Mermer / Füme Cam', en: 'White Marble / Smoked Glass' }, image: 'https://picsum.photos/seed/marble-smoked/100/100' },
            { name: { tr: 'Siyah Mermer / Amber Cam', en: 'Black Marble / Amber Glass' }, image: 'https://picsum.photos/seed/marble-amber/100/100' }
        ],
        exclusiveContent: { images: [], drawings: [], models3d: [] }
    }
];

const homePageContentData: HomePageContent = {
    heroMedia: [
        { type: 'video', url: 'https://raw.githubusercontent.com/birim-web/assets/main/hero-video.mp4', title: { tr: "Zamansız Tasarım, Sonsuz İlham", en: "Timeless Design, Endless Inspiration" }, subtitle: { tr: "Her biri bir hikaye anlatan, özenle seçilmiş mobilya koleksiyonumuzu keşfedin.", en: "Discover our curated furniture collection where every piece tells a story." }, isButtonVisible: true, buttonText: { tr: "Koleksiyonu Keşfet", en: "Explore Collection" }, buttonLink: "/products/kanepeler" },
        { type: 'image', url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80', title: { tr: "Doğadan Gelen Zarafet", en: "Elegance from Nature" }, subtitle: { tr: "Doğal malzemelerle yaşam alanlarınıza sıcaklık katın.", en: "Add warmth to your living spaces with natural materials." }, isButtonVisible: false, buttonText: '', buttonLink: '' },
        { type: 'youtube', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', title: { tr: "Tasarımın Arkasındaki Sanat", en: "The Art Behind the Design" }, subtitle: { tr: "Tasarımcılarımızın ilham verici süreçlerine tanıklık edin.", en: "Witness the inspiring processes of our designers." }, isButtonVisible: true, buttonText: { tr: "Tasarımcılar", en: "Our Designers" }, buttonLink: "/designers" },
    ],
    isHeroTextVisible: true,
    isLogoVisible: false,
    featuredProductIds: ['bulut-kanepe', 'linea-sandalye', 'dot-sehpa'],
    featuredDesignerId: 'arman-kaya',
    inspirationSection: {
        backgroundImage: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
        title: { tr: 'İlham Veren Mekanlar Yaratın', en: 'Create Inspiring Spaces' },
        subtitle: { tr: 'Tasarım felsefemiz ve mekanlara yaklaşımımız hakkında daha fazlasını öğrenin.', en: 'Learn more about our design philosophy and approach to spaces.' },
        buttonText: { tr: 'Hakkımızda', en: 'About Us' },
        buttonLink: '/about'
    }
};

const aboutPageContentData: AboutPageContent = {
    heroImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    heroTitle: { tr: 'Tasarımın Gücüne İnanıyoruz', en: 'We Believe in the Power of Design' },
    heroSubtitle: { tr: 'Estetik, işlevsellik ve kalitenin kesişim noktasında, yaşam alanlarınıza değer katan mobilyalar yaratıyoruz.', en: 'At the intersection of aesthetics, functionality, and quality, we create furniture that adds value to your living spaces.' },
    storyTitle: { tr: 'Hikayemiz', en: 'Our Story' },
    storyContentP1: { tr: 'Birim, 2010 yılında mobilya tutkunu bir grup zanaatkar ve tasarımcı tarafından kuruldu. Amacımız, sadece güzel değil, aynı zamanda anlamlı ve kalıcı parçalar yaratmaktı. Geleneksel teknikleri modern bir vizyonla birleştirerek, her bir ürünün bir hikaye anlatmasını hedefledik.', en: 'Birim was founded in 2010 by a group of furniture-loving artisans and designers. Our goal was to create pieces that were not only beautiful but also meaningful and lasting. By combining traditional techniques with a modern vision, we aimed for each product to tell a story.' },
    storyContentP2: { tr: 'Yıllar içinde, küçük bir atölyeden uluslararası tanınırlığa sahip bir markaya dönüştük. Ancak ilk günkü tutkumuz ve kaliteye olan bağlılığımız hiç değişmedi. Her tasarım, en iyi malzemeler ve usta işçilikle hayata geçirilir.', en: 'Over the years, we have grown from a small workshop to an internationally recognized brand. However, our initial passion and commitment to quality have never changed. Every design is brought to life with the finest materials and master craftsmanship.' },
    storyImage: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    isQuoteVisible: true,
    quoteText: { tr: 'İyi tasarım, hayatı daha iyi hale getirme sanatıdır.', en: 'Good design is the art of making life better.' },
    quoteAuthor: 'Arman Kaya',
    valuesTitle: { tr: 'Değerlerimiz', en: 'Our Values' },
    values: [
        { title: { tr: 'Kalite', en: 'Quality' }, description: { tr: 'En iyi malzemeleri seçer ve ürünlerimizin uzun ömürlü olmasını sağlarız.', en: 'We select the finest materials and ensure our products are long-lasting.' } },
        { title: { tr: 'Tasarım Odaklılık', en: 'Design Focus' }, description: { tr: 'Estetik ve fonksiyonelliği birleştiren, ilham veren tasarımlar yaratırız.', en: 'We create inspiring designs that combine aesthetics and functionality.' } },
        { title: { tr: 'Zanaatkarlık', en: 'Craftsmanship' }, description: { tr: 'Usta zanaatkarlarımızın el işçiliğine ve detaylara olan özenine değer veririz.', en: 'We value the handiwork of our master artisans and their attention to detail.' } }
    ]
};

const contactPageContentData: ContactPageContent = {
    title: { tr: 'Bize Ulaşın', en: 'Contact Us' },
    subtitle: { tr: 'Sorularınız, iş birlikleri veya sadece bir merhaba demek için buradayız. Mağazalarımızı ziyaret edin veya bizimle iletişime geçin.', en: "We're here for your questions, collaborations, or just to say hello. Visit our stores or get in touch with us." },
    locations: [
        {
            type: { tr: 'Showroom', en: 'Showroom' },
            title: { tr: 'İstanbul Showroom', en: 'Istanbul Showroom' },
            address: 'Bağdat Caddesi No: 123, Kadıköy, İstanbul',
            phone: '+90 216 123 45 67',
            email: 'istanbul@birim.com',
            mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.899661339398!2d29.06172231538356!3d40.98348497930335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac65597b876c5%3A0x742e1d71c5be1a5!2sBa%C4%9Fdat%20Cd.!5e0!3m2!1sen!2str!4v1678886400000!5m2!1sen!2str'
        },
        {
            type: { tr: 'Showroom', en: 'Showroom' },
            title: { tr: 'Ankara Showroom', en: 'Ankara Showroom' },
            address: 'Tunalı Hilmi Caddesi No: 89, Çankaya, Ankara',
            phone: '+90 312 987 65 43',
            email: 'ankara@birim.com',
            mapEmbedUrl: ''
        },
        {
            type: { tr: 'Merkez Ofis & Fabrika', en: 'Head Office & Factory' },
            title: { tr: 'Bursa Üretim Tesisi', en: 'Bursa Production Facility' },
            address: 'Organize Sanayi Bölgesi, Nilüfer, Bursa',
            phone: '+90 224 111 22 33',
            email: 'info@birim.com',
            mapEmbedUrl: ''
        }
    ]
};

const footerContentData: FooterContent = {
    copyrightText: { tr: `© ${new Date().getFullYear()} Birim Mobilya San. ve Tic. A.Ş. Tüm hakları saklıdır.`, en: `© ${new Date().getFullYear()} Birim Furniture Inc. All rights reserved.` },
    partnerNames: ["Vitra", "Arçelik", "Paşabahçe"],
    linkColumns: [
        { title: { tr: 'Şirket', en: 'Company' }, links: [{ text: { tr: 'Hakkımızda', en: 'About Us' }, url: '/about' }, { text: { tr: 'Kariyer', en: 'Careers' }, url: '#' }, { text: { tr: 'Basın', en: 'Press' }, url: '/news' }] },
        { title: { tr: 'Destek', en: 'Support' }, links: [{ text: { tr: 'İletişim', en: 'Contact' }, url: '/contact' }, { text: { tr: 'SSS', en: 'FAQ' }, url: '#' }, { text: { tr: 'Garanti', en: 'Warranty' }, url: '#' }] }
    ],
    socialLinks: [
        { name: 'Instagram', url: 'https://instagram.com', svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>', isEnabled: true },
        { name: 'Pinterest', url: 'https://pinterest.com', svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>', isEnabled: true },
        { name: 'Facebook', url: 'https://facebook.com', svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>', isEnabled: false }
    ]
};

const newsData: NewsItem[] = [
    {
        id: 'milan-tasarim-haftasi-2024',
        title: { tr: 'Milano Tasarım Haftası 2024 Notları', en: 'Notes from Milan Design Week 2024' },
        date: '25 Nisan 2024',
        content: { tr: 'Bu yılki Milano Tasarım Haftası, sürdürülebilirlik ve teknoloji temalarıyla öne çıktı. Birim olarak, yeni koleksiyonumuzda kullandığımız geri dönüştürülmüş malzemeler ve akıllı mobilya konseptlerimizle büyük ilgi gördük. Özellikle Leyla Demir\'in tasarladığı "Yosun" koltuk, biyobozunur materyaliyle fuarın en çok konuşulan parçalarından biri oldu.', en: 'This year\'s Milan Design Week highlighted themes of sustainability and technology. As Birim, we garnered great interest with the recycled materials used in our new collection and our smart furniture concepts. Especially the "Moss" armchair, designed by Leyla Demir, became one of the most talked-about pieces of the fair with its biodegradable material.' },
        mainImage: 'https://images.unsplash.com/photo-1621947082343-c25b39e6a0a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
        media: [
            { type: 'image', url: 'https://picsum.photos/seed/milan-1/1200/800', caption: { tr: 'Standımızdan bir görünüm', en: 'A view from our booth' } },
            { type: 'youtube', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', caption: { tr: 'Tasarımcı Leyla Demir ile röportaj', en: 'Interview with designer Leyla Demir' } }
        ]
    },
    {
        id: 'yeni-magaza-ankara',
        title: { tr: 'Yeni Mağazamız Ankara\'da Açıldı', en: 'Our New Store Opened in Ankara' },
        date: '10 Mart 2024',
        content: { tr: 'İstanbul\'dan sonra şimdi de başkentteyiz! Ankara\'daki yeni showroomumuz, markamızın en güncel koleksiyonlarını ve sevilen klasiklerini bir araya getiriyor. Mimarisiyle de dikkat çeken mağazamız, sizlere ilham veren bir deneyim sunmak için tasarlandı. Tüm tasarım severleri bekliyoruz.', en: 'After Istanbul, we are now in the capital! Our new showroom in Ankara brings together our brand\'s latest collections and beloved classics. Our store, which also stands out with its architecture, was designed to offer you an inspiring experience. We welcome all design lovers.' },
        mainImage: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
        media: [
            { type: 'image', url: 'https://picsum.photos/seed/ankara-1/1200/800', caption: { tr: 'Açılış gününden', en: 'From the opening day' } },
            { type: 'image', url: 'https://picsum.photos/seed/ankara-2/1200/800', caption: { tr: 'Mağazanın iç mekanından bir detay', en: 'A detail from the store\'s interior' } }
        ]
    }
];

export const initialData: { [key: string]: any } = {
    [KEYS.LANGUAGES]: languagesData,
    [KEYS.SITE_SETTINGS]: siteSettingsData,
    [KEYS.CATEGORIES]: categoriesData,
    [KEYS.DESIGNERS]: designersData,
    [KEYS.PRODUCTS]: productsData,
    [KEYS.ABOUT_PAGE]: aboutPageContentData,
    [KEYS.CONTACT_PAGE]: contactPageContentData,
    [KEYS.HOME_PAGE]: homePageContentData,
    [KEYS.FOOTER]: footerContentData,
    [KEYS.NEWS]: newsData,
};
