const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
});

async function main() {
  console.log("Applying Full-Screen Cinematic Architectural Narrative Flow...");
  
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

  // BLOCK 0: FULL-SCREEN INTRO (Full Width)
  const block0 = {
    _key: "full_b0_intro",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "MEKÂNIN SESSİZ DİLİ VE İNSAN", en: "THE SILENT LANGUAGE OF SPACE & HUMANITY" },
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
    linkText: { _type: "localizedString", tr: "KOLEKSİYON YOLCULUĞUNA BAŞLAYIN", en: "START THE COLLECTION JOURNEY" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 2: FULL-SCREEN TAU KONSOL (Full Width)
  const block2 = {
    _key: "full_b2_tau",
    _type: "contentBlock",
    order: 2,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "EL İŞÇİLİĞİNİN DOKUNSAL HAKİKATI: TAU KONSOL", en: "THE TACTILE TRUTH OF CRAFTSMANSHIP: TAU CONSOLE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Derinin her bir parçası bir ustanın ellerinde şekillenirken kendi hikâyesini anlatır. Tasarımcı Cem Tanrıkulu ve deri zanaatçısı Serdar Onukar’ın imzasını taşıyan TAU; geleneksel kösele işçiliğini modern mimarinin heykelsi oranlarıyla buluşturuyor. Dokunulduğunda zamanı yavaşlatan bir malzeme sadakati.",
      "Each piece of leather tells its story through the hands of a master craftsman. TAU console combines traditional leather work with modern sculptural proportions."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
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
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 3: FULL-SCREEN RİVA KANEPE (Full Width, Gray Background)
  const block3 = {
    _key: "full_b3_riva",
    _type: "contentBlock",
    order: 3,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "ZEMİNE YAKIN BİR YAŞAM DİSİPLİNİ: RİVA KANEPE", en: "GROUNDED LIVING DISCIPLINE: RIVA SOFA" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Riva; yüksekten bakmayan, zemine yakın masif gövdesiyle mekânın merkezinde alçakgönüllü ama güçlü bir duruş sergiler. Farklı mimari açılara adapte olabilen modüler kurgusu, yaşam alanında sınırları kaldırır. İnsan vücudunu kucaklayan ergonomi ile yalın mimarinin mükemmel uyumu.",
      "Riva presents a humble yet powerful presence with its ground-level solid silhouette. Modular architecture embracing human ergonomics."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
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
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 4: FULL-SCREEN SUR SEHPA (Full Width, White Background)
  const block4 = {
    _key: "full_b4_sur",
    _type: "contentBlock",
    order: 4,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "MÜREKKEBİN ÇELİKLE DİYALOĞU: SUR SEHPA", en: "THE DIALOGUE OF INK & STEEL: SUR TABLE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Sanatçı Albena Martinova'nın mürekkeple kağıda düşürdüğü organik lekeler, paslanmaz çeliğin soğuk ve rasyonel yüzeyinde yeniden doğuyor. SUR Sehpa; sanatı galerilerden çıkarıp günlük yaşamın merkezine yerleştiren, ışıkla sürekli değişen heykelsi bir yüzey şiiridir.",
      "Organic ink patterns created by artist Albena Martinova come alive on stainless steel. A sculptural poetry of surfaces changing with light."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
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
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 5: FULL-SCREEN TİN DRESUAR (Full Width, Gray Background)
  const block5 = {
    _key: "full_b5_tin",
    _type: "contentBlock",
    order: 5,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "HASSAS ÇİZGİLERDE SAF GEOMETRİ: TİN DRESUAR", en: "PURE GEOMETRY IN LINEAR LINES: TIN CONSOLE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Gereksiz tüm süslemelerden arındırılmış doğrusal bir metal strüktür. TIN Dresuar, hafifliği ve rasyonel oranlarıyla giriş alanlarında ve koridorlarda mimari bir nefes yaratır. Fonksiyonun en yalın haliyle estetiğe dönüştüğü an.",
      "Linear metal structure stripped of all unnecessary decoration. TIN console creates architectural breathing room in hallways and entryways."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp",
      "migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp"
    ),
    linkText: { _type: "localizedString", tr: "TİN DRESUARI GÖRÜNTÜLEYİN", en: "VIEW TIN CONSOLE" },
    linkUrl: "/product/dr0001-tin-dresuar",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 6: FULL-SCREEN SOFT YATAK (Full Width, White Background)
  const block6 = {
    _key: "full_b6_soft",
    _type: "contentBlock",
    order: 6,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "YUMUŞAK HATLARLA SAKİNLİK: SOFT YATAK", en: "SERENITY WITH SOFT SILHOUETTES: SOFT BED" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Günün tüm karmaşasının dışında, bütünüyle yumuşak dokularla sarmalanmış bir sığınak. SOFT Yatak; keskin mimari çizgilerin ardından gelen bir yumuşama anıdır. Kumaşın sıcaklığı ve döşemenin derinliğiyle yatak odasına huzurlu bir zarafet taşır.",
      "Wrapped in fully soft textures outside the day's noise. SOFT bed brings peaceful elegance to the bedroom."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/kr0003-soft/1782299445612-soft-katalog.webp",
      "migration/products/kr0003-soft/1782299445612-soft-katalog.webp"
    ),
    linkText: { _type: "localizedString", tr: "SOFT YATAK DOKULARINI İNCELEYİN", en: "DISCOVER SOFT BED TEXTURES" },
    linkUrl: "/product/kr0003-soft",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 7: FULL-SCREEN MES KONSOL (Full Width, Gray Background)
  const block7 = {
    _key: "full_b7_mes",
    _type: "contentBlock",
    order: 7,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "İŞLEVİN HEYKELSİ SİLÜETİ: MES KONSOL", en: "THE SCULPTURAL SILHOUETTE OF FUNCTION: MES CONSOLE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: makeText(
      "Depolama üniteleri yalnızca eşyaları saklamak için değil, duvarların önünde mimari bir kütle dengesi kurmak için vardır. Ahşabın doğal damar yapısı ile kapakların pürüzsüz birleşimi, mekanın mimari ritmini güçlendirir.",
      "Storage units exist to create mass balance against walls. Natural wood grain combined with smooth doors reinforces architectural rhythm."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dp0004-mes/1782287498949-mes-site.webp",
      "migration/products/dp0004-mes/1782287498949-mes-site.webp"
    ),
    linkText: { _type: "localizedString", tr: "MES KOLEKSİYONUNU KEŞFEDİN", en: "EXPLORE MES COLLECTION" },
    linkUrl: "/product/dp0004-mes",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  // BLOCK 8: FULL-SCREEN CLOSING ATELIER INVITATION (Full Width, White Background)
  const block8 = {
    _key: "full_b8_atelier",
    _type: "contentBlock",
    order: 8,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "BİRİM ATELIER: SİZİN MİMARİ VİZYONUNUZ", en: "BIRIM ATELIER: YOUR ARCHITECTURAL VISION" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: makeText(
      "Birim Atelier; konutlardan otellere, küresel projelerden özel iç mekanlara kadar mimarların hayallerine teknik ve imalat ortaklığı sunar. Malzeme bilgimiz, yarım asırlık zanaat birikimimiz ve mimari kadromuzla projelerinize değer katmak için buradayız. Hayalinizdeki mekanı birlikte kurgulayalım.",
      "Birim Atelier provides technical and manufacturing partnership for architects from residential to global hospitality projects. Let us shape your vision together."
    ),
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp",
      "migration/products/dp0006-cab/1782286562154-cab-konsol.webp"
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

  const fullScreenBlocks = [block0, panelBlock, block2, block3, block4, block5, block6, block7, block8];

  console.log("Patching published AND draft homePage documents with 100% Full-Screen Cinematic Flow...");
  const homeDocs = await client.fetch(`*[_type == "homePage"]{ _id }`);
  for (const doc of homeDocs) {
    console.log(`Updating ${doc._id}...`);
    await client.patch(doc._id)
      .set({ contentBlocks: fullScreenBlocks })
      .commit();
  }

  console.log("100% Full-Screen Cinematic Flow applied successfully!");
}

main().catch(console.error);
