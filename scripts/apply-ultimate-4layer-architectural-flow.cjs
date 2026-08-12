const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
});

async function main() {
  console.log("Applying Ultimate 4-Layer Architectural Brand Flow...");
  
  const existingDoc = await client.fetch(`*[_type == "homePage"][0]`);
  if (!existingDoc) {
    console.error("No homePage document found!");
    return;
  }

  const existingBlocks = existingDoc.contentBlocks || [];
  
  // 100% preserve the panels block
  const panelBlock = existingBlocks.find(b => b.mediaType === 'panels') || {
    _key: "622f9138e689",
    _type: "contentBlock",
    mediaType: "panels",
    order: 1,
    position: "center",
    panelSize: "small",
    panelFit: "contain",
    panelGap: "none",
    hasBorder: false,
    borderThickness: 1
  };
  panelBlock.order = 1;
  panelBlock.hasBorder = false;
  panelBlock.borderThickness = 1;
  delete panelBlock.title;

  const makeR2Asset = (url, path, width = 1920, height = 1080) => ({
    _type: 'r2Asset',
    url,
    path: path || url.replace('https://birim-assets.web-birim.workers.dev/', ''),
    width,
    height,
    hasResponsiveSizes: true,
    hotspotX: 0.5,
    hotspotY: 0.5,
    mimeType: 'image/webp'
  });

  const makeText = (trText, enText) => ({
    _type: "localizedPortableText",
    tr: [
      {
        _key: "tr_" + Math.random().toString(36).substring(2, 8),
        _type: "block",
        style: "normal",
        children: [{ _key: "s_tr", _type: "span", text: trText }],
        markDefs: []
      }
    ],
    en: [
      {
        _key: "en_" + Math.random().toString(36).substring(2, 8),
        _type: "block",
        style: "normal",
        children: [{ _key: "s_en", _type: "span", text: enText }],
        markDefs: []
      }
    ]
  });

  // KATMAN 1: MİMARİ MİRAS VE FELSEFE (Full Width Intro, White Background)
  const block0 = {
    _key: "lay_b0_heritage",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "1975'TEN BUGÜNE MİMARİ DİSİPLİN VE ZANAAT", en: "ARCHITECTURAL DISCIPLINE & CRAFTSMANSHIP SINCE 1975" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: makeText(
      "Bir mekâna adım attığınızda ilk hissettiğiniz şey mobilyalar değil, mekânın bıraktığı sessiz yankıdır. 1975'ten beri ahşabın sıcaklığını, metalin disiplinini ve derinin yaşayan dokusunu mimari bir dürüstlükle bir araya getiriyoruz. Bizim için tasarım, yalnızca formu biçimlendirmek değil; o formun içinde yaşanacak anlara bir ruh katmaktır.",
      "When you enter a space, the first thing you feel is not the furniture, but the silent resonance of architecture. Since 1975, we bring wood, metal, and leather with architectural honesty."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/products/depolamalar/cab/DP0006_CAB_02.webp",
      "products/depolamalar/cab/DP0006_CAB_02.webp"
    ),
    linkText: { _type: "localizedString", tr: "MİMARİ MİRASIMIZI KEŞFEDİN", en: "DISCOVER OUR ARCHITECTURAL HERITAGE" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 32
  };

  // KATMAN 3A: ZANAAT VE DERİ HİKÂYESİ (Left Image, White Background)
  const block2 = {
    _key: "lay_b2_craft",
    _type: "contentBlock",
    order: 2,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "EL İŞÇİLİĞİNİN DOKUNSAL HAKİKATI: TAU KONSOL", en: "THE TACTILE TRUTH OF CRAFTSMANSHIP: TAU CONSOLE" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: makeText(
      "Derinin her bir parçası bir ustanın ellerinde şekillenirken kendi hikâyesini anlatır. Tasarımcı Cem Tanrıkulu ve deri zanaatçısı Serdar Onukar’ın imzasını taşıyan TAU; geleneksel kösele işçiliğini modern mimarinin heykelsi oranlarıyla buluşturuyor.",
      "Each piece of leather tells its story through master craftsmanship. TAU console combines traditional leather work with modern sculptural proportions."
    ),
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
      "products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp"
    ),
    linkText: { _type: "localizedString", tr: "TAU KONSOL DETAYLARINI KEŞFEDİN", en: "DISCOVER TAU CONSOLE DETAILS" },
    linkUrl: "/product/dp0014-tau-konsol",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 32,
    spacingBottom: 0
  };

  // KATMAN 3B: MEKÂNSAL OTURUM KURGUSU (Right Image, Gray Background)
  const block3 = {
    _key: "lay_b3_living",
    _type: "contentBlock",
    order: 3,
    mediaType: "image",
    position: "right",
    title: { _type: "localizedString", tr: "PANORAMİK OTURUM KURGUSU: RİVA KANEPE", en: "PANORAMIC SEATING EXPERIENCE: RIVA SOFA" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: makeText(
      "Riva; yüksekten bakmayan, zemine yakın masif gövdesiyle mekânın merkezinde alçakgönüllü ama güçlü bir duruş sergiler. Farklı mimari açılara adapte olabilen modüler kurgusu, yaşam alanında sınırları kaldırır.",
      "Riva presents a humble yet powerful presence with its ground-level solid silhouette. Modular architecture embracing human ergonomics."
    ),
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp",
      "migration/products/kn0250-riva/1785155403170-0250 RİVA.webp"
    ),
    linkText: { _type: "localizedString", tr: "RİVA OTURUM KURGUSUNU İNCELEYİN", en: "EXPLORE RIVA SEATING SYSTEM" },
    linkUrl: "/product/kn0250-riva",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 32,
    spacingBottom: 0
  };

  // KATMAN 3C: SANAT VE METAL SENTETİĞİ (Left Image, White Background)
  const block4 = {
    _key: "lay_b4_art",
    _type: "contentBlock",
    order: 4,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "SANAT VE METALLERİN SENTETİĞİ: SUR SEHPA", en: "SYNTHESIS OF ART & METAL: SUR TABLE" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: makeText(
      "Sanatçı Albena Martinova'nın mürekkeple kağıda düşürdüğü organik lekeler, paslanmaz çeliğin soğuk yüzeyinde yeniden doğuyor. SUR Sehpa; sanatı günlük yaşamın merkezine yerleştiren heykelsi bir yüzey şiiridir.",
      "Organic ink patterns created by artist Albena Martinova come alive on stainless steel. A sculptural poetry of surfaces."
    ),
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp",
      "migration/products/sh0033-surb/1781609940212-sur.webp"
    ),
    linkText: { _type: "localizedString", tr: "SUR SEHPA HİKÂYESİNİ OKUYUN", en: "READ SUR TABLE STORY" },
    linkUrl: "/product/sh0033-surb",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 32,
    spacingBottom: 0
  };

  // KATMAN 4: ETKİNLİKLER, BASIN VE SERGİLER (Right Image, Gray Background)
  const block5 = {
    _key: "lay_b5_news",
    _type: "contentBlock",
    order: 5,
    mediaType: "image",
    position: "right",
    title: { _type: "localizedString", tr: "MILANO SALONE DEL MOBILE VE KÜRESEL SERGİLER", en: "MILANO SALONE DEL MOBILE & GLOBAL EXHIBITIONS" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: makeText(
      "Birim Mobilya; Milano Tasarım Haftası, Salone del Mobile ve uluslararası mimari sergilerde Türkiye'nin modern tasarım vizyonunu temsil ediyor. Yayınlanan en son basın haberlerini ve sergi takvimimizi inceleyebilirsiniz.",
      "Birim Furniture represents Turkey's modern design vision at Salone del Mobile Milano and international architectural exhibitions. Discover our latest press and exhibition calendar."
    ),
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp",
      "migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp"
    ),
    linkText: { _type: "localizedString", tr: "TASARIM HABERLERİ VE BASINI İNCELEYİN", en: "EXPLORE DESIGN NEWS & PRESS" },
    linkUrl: "/news",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 32,
    spacingBottom: 0
  };

  // KATMAN 5: BİRİM ATELIER VE MİMARİ KONTRAKT PROJELERİ (Full Width Closing, White Background)
  const block6 = {
    _key: "lay_b6_atelier",
    _type: "contentBlock",
    order: 6,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "BİRİM ATELIER: ÖZEL MİMARİ PROJELER VE KONTRAKT UYGULAMALARI", en: "BIRIM ATELIER: CUSTOM CONTRACT & ARCHITECTURAL CONSULTATION" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: makeText(
      "Birim Atelier; konutlardan lüks otellere, restorasyonlardan küresel ticari yapılara kadar mimarların hayallerine teknik ve imalat ortaklığı sunar. Malzeme bilgimiz, yarım asırlık zanaat birikimimiz ve mimari kadromuzla projelerinize değer katmak için buradayız. Projeniz için mimari ekibimizle doğrudan iletişime geçebilirsiniz.",
      "Birim Atelier provides technical and manufacturing partnership for architects from residential to global hospitality projects. Contact our architectural team directly for your project."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dp0004-mes/1782287498949-mes-site.webp",
      "migration/products/dp0004-mes/1782287498949-mes-site.webp"
    ),
    linkText: { _type: "localizedString", tr: "MİMARİ EKİBİMİZLE İLETİŞİME GEÇİN", en: "CONTACT OUR ARCHITECTURAL TEAM" },
    linkUrl: "/contact",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  const layersFlow = [block0, panelBlock, block2, block3, block4, block5, block6];

  console.log("Patching published AND draft homePage documents with 5-Layer Diverse Architectural Flow...");
  const homeDocs = await client.fetch(`*[_type == "homePage"]{ _id }`);
  for (const doc of homeDocs) {
    console.log(`Updating ${doc._id}...`);
    await client.patch(doc._id)
      .set({ contentBlocks: layersFlow })
      .commit();
  }

  console.log("5-Layer Diverse Architectural Flow applied successfully!");
}

main().catch(console.error);
