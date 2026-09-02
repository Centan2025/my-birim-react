import {createClient} from '@sanity/client'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
  dotenv.config({path: '.env.local'})
} else {
  dotenv.config()
}

const projectId = process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f'
const dataset = process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_TOKEN || process.env.VITE_SANITY_TOKEN

if (!token) {
  console.error('❌ SANITY_TOKEN bulunamadı!')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

async function syncStudioFactoryDoc() {
  console.log('🚀 Sanity Studio singleton dokümanı (factoryPage) güncelleniyor...')

  const factoryDoc = await client.getDocument('factoryPage')
  if (!factoryDoc) {
    console.error('❌ factoryPage dokümanı bulunamadı!')
    return
  }

  const gallery = factoryDoc.gallery || []
  console.log(`📸 factoryPage dokümanında ${gallery.length} görsel mevcut.`)

  const heroImageR2 = gallery[0]?.imageR2 || null
  const woodImageR2 = gallery[1]?.imageR2 || gallery[0]?.imageR2 || null
  const metalImageR2 = gallery[2]?.imageR2 || gallery[0]?.imageR2 || null
  const upholsteryImageR2 = gallery[3]?.imageR2 || gallery[0]?.imageR2 || null
  const finishingImageR2 = gallery[4]?.imageR2 || gallery[0]?.imageR2 || null

  const portableTextContent = {
    _type: 'localizedPortableText',
    tr: [
      {
        _key: 'block-tr-1',
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: 'span-tr-1',
            _type: 'span',
            marks: [],
            text: 'Birim’in yarım asrı aşan üretim geleneği; yalnızca mimari mobilyalar inşa etmeyi değil, her tasarımın ardındaki mühendislik ve zanaat dengesini kusursuzlaştırmayı hedefler. 15.000 m² entegre üretim kampüsümüzde ahşap, metal, döşeme ve yüzey işlem birimleri tek bir çatı altında, birbirini besleyen organik bir ekosistem olarak faaliyet gösterir.',
          },
        ],
      },
      {
        _key: 'block-tr-2',
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: 'span-tr-2',
            _type: 'span',
            marks: [],
            text: 'Her aşamada uygulanan mikron düzeyindeki tolerans denetimleri, uluslararası sürdürülebilirlik standartları (FSC sertifikalı kaynaklar) ve toksik olmayan çevre dostu kaplamalarla, mekanlara değer katan uzun ömürlü koleksiyonlar hayata geçiriyoruz.',
          },
        ],
      },
    ],
    en: [
      {
        _key: 'block-en-1',
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: 'span-en-1',
            _type: 'span',
            marks: [],
            text: 'With over half a century of manufacturing heritage, Birim strives not simply to build architectural furniture, but to perfect the symbiosis between engineering precision and master craft. Across our 15,000 m² integrated plant, woodworking, metal fabrication, upholstery, and finishing workshops operate as a unified, agile ecosystem.',
          },
        ],
      },
      {
        _key: 'block-en-2',
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: 'span-en-2',
            _type: 'span',
            marks: [],
            text: 'Through micron-level quality controls, internationally certified sustainable timber (FSC), and non-toxic finishing processes, we craft enduring design pieces that elevate contemporary architectural spaces worldwide.',
          },
        ],
      },
    ],
  }

  const patchData = {
    title: {
      _type: 'localizedString',
      tr: 'Fabrika',
      en: 'Factory',
    },
    heroTitle: {
      _type: 'localizedString',
      tr: 'Zanaatın Endüstriyel Ölçekle Buluşması',
      en: 'Where Craftsmanship Meets Industrial Scale',
    },
    heroDescription: {
      _type: 'localizedString',
      tr: 'Birim’in 15.000 m² entegre üretim tesisi; ahşap, metal, döşeme ve yüzey işlem atölyelerini mikron düzeyinde hassasiyetle tek çatı altında buluşturuyor.',
      en: 'Birim’s 15,000 m² integrated manufacturing facility unites woodworking, metal fabrication, upholstery, and finishing with micro-precision under one roof.',
    },
    ...(heroImageR2 && {heroImageR2}),
    metrics: [
      {
        _key: 'metric-1',
        value: {
          _type: 'localizedString',
          tr: '15.000 m²',
          en: '15,000 m²',
        },
        label: {
          _type: 'localizedString',
          tr: 'Entegre kapalı üretim tesisi ve modern makine parkuru',
          en: 'Integrated manufacturing facility and advanced machine park',
        },
      },
      {
        _key: 'metric-2',
        value: {
          _type: 'localizedString',
          tr: '50+ Yıl',
          en: '50+ Yrs',
        },
        label: {
          _type: 'localizedString',
          tr: 'Kuşaktan kuşağa aktarılan zanaatkarlık mirası ve uzmanlık',
          en: 'Generations of artisanal mastery and manufacturing know-how',
        },
      },
      {
        _key: 'metric-3',
        value: {
          _type: 'localizedString',
          tr: '4 Disiplin',
          en: '4 Units',
        },
        label: {
          _type: 'localizedString',
          tr: 'Ahşap, Metal, Döşeme ve Yüzey İşlem tek çatı altında',
          en: 'Wood, Metal, Upholstery & Finishing under single management',
        },
      },
      {
        _key: 'metric-4',
        value: {
          _type: 'localizedString',
          tr: '%100 FSC',
          en: '100% FSC',
        },
        label: {
          _type: 'localizedString',
          tr: 'Sürdürülebilir orman kaynakları ve çevre dostu üretim',
          en: 'Sustainably sourced certified timber & eco-conscious processes',
        },
      },
    ],
    disciplinesTag: {
      _type: 'localizedString',
      tr: 'ÜRETİM DEPARTMANLARI',
      en: 'PRODUCTION UNITS',
    },
    disciplinesTitle: {
      _type: 'localizedString',
      tr: 'Entegre Üretim Disiplinleri',
      en: 'Integrated Manufacturing Units',
    },
    disciplinesDescription: {
      _type: 'localizedString',
      tr: 'Fikirden nihai ürüne kadar tüm aşamaları kendi bünyesinde çözen esnek ve güçlü üretim ekosistemi.',
      en: 'A flexible and high-capacity manufacturing ecosystem resolving every detail from sketch to final production in-house.',
    },
    disciplines: [
      {
        _key: 'disc-wood',
        id: 'wood',
        title: {
          _type: 'localizedString',
          tr: 'Ahşap & Masif İşleme',
          en: 'Woodworking & Solid Timber',
        },
        subtitle: {
          _type: 'localizedString',
          tr: '5-Eksen CNC ve Geleneksel Ustalık',
          en: '5-Axis CNC & Traditional Mastery',
        },
        description: {
          _type: 'localizedString',
          tr: 'Özenle seçilmiş masif ağaçlar ve doğal kaplamalar, mikron toleranslı 5-eksen CNC tezgâhlarımız ve ustalarımızın el hassasiyetiyle kusursuz formlara dönüşür.',
          en: 'Carefully selected solid timber and natural veneers are transformed into flawless architectural forms using 5-axis CNC machining and master craftsmanship.',
        },
        features: [
          {
            _key: 'wood-feat-1',
            _type: 'localizedString',
            tr: '5-Eksen 3D CNC Frezeleme Teknolojisi',
            en: '5-Axis 3D CNC Milling Technology',
          },
          {
            _key: 'wood-feat-2',
            _type: 'localizedString',
            tr: 'FSC Sertifikalı Doğal Ağaç & Masif Seçkisi',
            en: 'FSC Certified Sustainable Solid Timber',
          },
          {
            _key: 'wood-feat-3',
            _type: 'localizedString',
            tr: 'Hassas Zıvana & Gizli Kırlangıç Birleşimler',
            en: 'Precision Joinery & Hidden Dowel Structures',
          },
        ],
        ...(woodImageR2 && {imageR2: woodImageR2}),
      },
      {
        _key: 'disc-metal',
        id: 'metal',
        title: {
          _type: 'localizedString',
          tr: 'Metal & İleri Form Verme',
          en: 'Metal Fabrication & Shaping',
        },
        subtitle: {
          _type: 'localizedString',
          tr: 'Lazer Kesim & Robotik Kaynak',
          en: 'Laser Cutting & Robotic Welding',
        },
        description: {
          _type: 'localizedString',
          tr: 'Paslanmaz çelik, pirinç ve alüminyum profiller; yüksek hassasiyetli fiber lazer kesim, abkant büküm ve TIG/MIG kaynak istasyonlarında milimetrik doğrulukla işlenir.',
          en: 'Stainless steel, brass, and aluminum profiles are fabricated with millimeter precision using high-precision fiber lasers, press brakes, and specialized TIG/MIG welding stations.',
        },
        features: [
          {
            _key: 'metal-feat-1',
            _type: 'localizedString',
            tr: 'Fiber Lazer Kesim ve CNC Abkant Büküm',
            en: 'Fiber Laser Cutting & CNC Press Brake Bending',
          },
          {
            _key: 'metal-feat-2',
            _type: 'localizedString',
            tr: 'İz Bırakmayan TIG & Lazer Kaynak Teknolojisi',
            en: 'Seamless TIG & Laser Welding Finish',
          },
          {
            _key: 'metal-feat-3',
            _type: 'localizedString',
            tr: 'Pirinç, Bakır & Paslanmaz Çelik İşleme',
            en: 'Architectural Brass, Copper & Stainless Steel',
          },
        ],
        ...(metalImageR2 && {imageR2: metalImageR2}),
      },
      {
        _key: 'disc-upholstery',
        id: 'upholstery',
        title: {
          _type: 'localizedString',
          tr: 'Zanaatkar Döşeme & Terzilik',
          en: 'Artisanal Upholstery & Tailoring',
        },
        subtitle: {
          _type: 'localizedString',
          tr: 'Ergonomi ve El İşçiliği',
          en: 'Ergonomics & Hand Stitching',
        },
        description: {
          _type: 'localizedString',
          tr: 'Doğal İtalyan derileri, özel dokuma kumaşlar ve çok yoğunluklu ortopedik sünger katmanları; terzilik inceliğinde el dikişleri ve fitil detaylarıyla buluşur.',
          en: 'Full-grain Italian leathers, bespoke architectural textiles, and multi-density orthopedic foams are crafted with bespoke hand-stitching and piping details.',
        },
        features: [
          {
            _key: 'uph-feat-1',
            _type: 'localizedString',
            tr: 'Çok Yoğunluklu (Multi-Density) Sünger Mimarisi',
            en: 'Multi-Density High-Resilience Foam Architecture',
          },
          {
            _key: 'uph-feat-2',
            _type: 'localizedString',
            tr: 'Kusursuz Kapitone & El Dikişi Zanaatkarlığı',
            en: 'Master Hand Stitching & Precise Tufting',
          },
          {
            _key: 'uph-feat-3',
            _type: 'localizedString',
            tr: 'Doğal Deri ve Alev Geciktirici Kumaş Seçenekleri',
            en: 'Full-Grain Leather & Flame-Retardant Contract Textiles',
          },
        ],
        ...(upholsteryImageR2 && {imageR2: upholsteryImageR2}),
      },
      {
        _key: 'disc-finishing',
        id: 'finishing',
        title: {
          _type: 'localizedString',
          tr: 'Yüzey İşlem & Akrilik Cila',
          en: 'Surface Treatment & Lacquer',
        },
        subtitle: {
          _type: 'localizedString',
          tr: 'Ekolojik Koruma ve Dokunsal Lüks',
          en: 'Eco Protection & Tactile Luxury',
        },
        description: {
          _type: 'localizedString',
          tr: 'Pozitif basınçlı tozsuz cila kabinlerimizde uygulanan su bazlı mat lake, doğal yağ ve elektrostatik toz boya katmanları, mobilyalara ömür boyu dayanıklılık ve ipeksi dokunuş kazandırır.',
          en: 'Applied in positive-pressure dust-free finishing booths, our water-based matte lacquers, natural plant oils, and electrostatic powder coatings ensure longevity and a velvety tactile touch.',
        },
        features: [
          {
            _key: 'fin-feat-1',
            _type: 'localizedString',
            tr: 'Tozsuz Pozitif Basınçlı Cila ve Kurutma Kabinleri',
            en: 'Positive-Pressure Dust-Free Lacquer & Drying Booths',
          },
          {
            _key: 'fin-feat-2',
            _type: 'localizedString',
            tr: 'VOC-Free ve Su Bazlı Çevre Dostu Vernikler',
            en: 'Low-VOC & Water-Based Eco-Conscious Varnishes',
          },
          {
            _key: 'fin-feat-3',
            _type: 'localizedString',
            tr: 'Elektrostatik Toz Boya ve Özel PVD Kaplamalar',
            en: 'Architectural Powder Coating & PVD Finishes',
          },
        ],
        ...(finishingImageR2 && {imageR2: finishingImageR2}),
      },
    ],
    philosophyTag: {
      _type: 'localizedString',
      tr: 'ÜRETİM FELSEFESİ',
      en: 'PHILOSOPHY',
    },
    philosophyTitle: {
      _type: 'localizedString',
      tr: 'Endüstrinin Hızı, El İşçiliğinin Ruhu',
      en: 'Industrial Speed, Handcrafted Soul',
    },
    philosophySubtitle: {
      _type: 'localizedString',
      tr: 'Her parçanın ardında onlarca yıllık zanaat birikimi ve ileri mühendislik disiplini yer alır.',
      en: 'Behind every piece lies decades of artisanal heritage combined with rigorous engineering.',
    },
    content: portableTextContent,
    galleryTag: {
      _type: 'localizedString',
      tr: 'GÖRSEL ARŞİV',
      en: 'VISUAL ARCHIVE',
    },
    galleryTitle: {
      _type: 'localizedString',
      tr: 'Atölyelerden Kareler',
      en: 'Inside the Factory',
    },
    gallerySubtitle: {
      _type: 'localizedString',
      tr: 'Görselleri tam ekran incelemek için üzerlerine tıklayabilirsiniz.',
      en: 'Click on any image to view in fullscreen high-resolution mode.',
    },
    sustainabilityTag: {
      _type: 'localizedString',
      tr: 'KALİTE & TAAHHÜT',
      en: 'QUALITY & SUSTAINABILITY',
    },
    sustainabilityTitle: {
      _type: 'localizedString',
      tr: 'Geleceğe Saygılı, Uzun Ömürlü Mobilya Üretimi',
      en: 'Eco-Conscious, Long-Lasting Furniture Creation',
    },
    sustainabilityDescription: {
      _type: 'localizedString',
      tr: 'Birim üretim felsefesi; atık minimizasyonu, %100 geri dönüştürülebilir metal iskeletler ve sertifikalı ahşap kaynakları kullanarak nesiller boyu kullanılacak dayanıklı mobilyalar inşa etmeyi temel alır.',
      en: 'Birim’s manufacturing ethos is grounded in waste minimization, 100% recyclable metal structures, and certified forest timber to build furniture that lasts for generations.',
    },
    ctaPrimaryText: {
      _type: 'localizedString',
      tr: 'İletişime Geçin',
      en: 'Contact Us',
    },
    ctaPrimaryLink: '/contact',
    ctaSecondaryText: {
      _type: 'localizedString',
      tr: 'Projelerimizi İnceleyin',
      en: 'Explore Projects',
    },
    ctaSecondaryLink: '/projects',
  }

  // 1. Studio'nun açtığı factoryPage dokümanını güncelle
  console.log('📝 Studio dokümanı (factoryPage) güncelleniyor...')
  await client.patch('factoryPage').set(patchData).commit()
  console.log('✅ factoryPage başarıyla güncellendi!')

  // 2. Draft varsa veya oluşturulması gerekiyorsa güncelle
  const draftId = 'drafts.factoryPage'
  const draftDoc = await client.getDocument(draftId)
  if (draftDoc) {
    console.log('📝 Draft dokümanı (drafts.factoryPage) güncelleniyor...')
    await client.patch(draftId).set(patchData).commit()
    console.log('✅ drafts.factoryPage başarıyla güncellendi!')
  }

  console.log('🎉 Sanity Studio’nun açtığı ana "factoryPage" dokümanına tüm V2 alanları, metinleri ve atölye görselleri başarıyla yazıldı!')
}

syncStudioFactoryDoc().catch(err => {
  console.error('❌ Hata oluştu:', err)
  process.exit(1)
})
