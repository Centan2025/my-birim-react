const { createClient } = require('@sanity/client');

// Sanity Client initialization with Token
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
});

async function runUpdate() {
  console.log("Fetching existing homepage and product data...");
  const homeDoc = await client.fetch(`*[_type == "homePage"][0]`);
  if (!homeDoc) {
    console.error("HomePage document not found!");
    return;
  }

  // Preserve existing Hero Media
  const heroMedia = homeDoc.heroMedia || [];

  // Find existing panel block to preserve it 100%
  const existingBlocks = homeDoc.contentBlocks || [];
  const panelBlock = existingBlocks.find(b => b.mediaType === 'panels') || {
    _key: "622f9138e689",
    _type: "contentBlock",
    mediaType: "panels",
    order: 1,
    position: "center",
    panelSize: "small",
    panelFit: "contain",
    panelGap: "none"
  };

  // Fetch product data to get exact image assets and description blocks
  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    media[]{
      type,
      imageR2,
      isCover
    }
  }`);

  const getProduct = (id) => products.find(p => p.id === id);

  const tau = getProduct('dp0014-tau-konsol');
  const riva = getProduct('kn0250-riva');
  const tin = getProduct('dr0001-tin-dresuar');
  const mes = getProduct('dp0004-mes');
  const surb = getProduct('sh0033-surb');

  // Helper for r2Asset reference/object
  const getImageR2 = (prod) => {
    if (!prod || !prod.media) return null;
    const cover = prod.media.find(m => m.isCover) || prod.media[0];
    return cover ? cover.imageR2 : null;
  };

  // Block 0: Brand Manifesto / Story (Preserving or refining existing first block)
  const block0 = existingBlocks[0] && existingBlocks[0].mediaType !== 'panels' ? existingBlocks[0] : {
    _key: "block_brand_manifesto",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "BIRIM TASARIM FELSEFESİ", en: "BIRIM DESIGN PHILOSOPHY" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_b0_tr",
          _type: "block",
          children: [{ _key: "span0", _type: "span", text: "1975'ten bugüne mimari disiplin, malzeme dürüstlüğü ve usta el işçiliğinin buluştuğu zamansız tasarım koleksiyonları." }],
          markDefs: [],
          style: "normal"
        }
      ],
      en: [
        {
          _key: "desc_b0_en",
          _type: "block",
          children: [{ _key: "span0_en", _type: "span", text: "Timeless design collections bringing together architectural discipline, material honesty, and master craftsmanship since 1975." }],
          markDefs: [],
          style: "normal"
        }
      ]
    },
    imageR2: existingBlocks[0]?.imageR2 || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281594540-pomelli-image (12).webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONLARI KEŞFEDİN", en: "EXPLORE COLLECTIONS" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 40
  };

  // Ensure panel block has order 1
  panelBlock.order = 1;

  // Block 2: Tau Konsol (Full width cinematic)
  const block2 = {
    _key: "block_tau_konsol",
    _type: "contentBlock",
    order: 2,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "TAU KONSOL", en: "TAU CONSOLE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: tau?.description || {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_tau_tr",
          _type: "block",
          children: [{ _key: "s_tau", _type: "span", text: "Tasarımcı Cem Tanrıkulu ve deri sanatçısı Serdar Onukar’ın imzasını taşıyan TAU; ünite ve büfe gibi farklı hacimler üzerinde kösele derinin sanatsal bir dışavurumudur. Özel boyama ve doku teknikleriyle işlenen derinin patchwork kurgusuyla kaplandığı bu seri, zanaatın modern geometrideki en yüksek ifadesini sunuyor." }],
          markDefs: [],
          style: "normal"
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: getImageR2(tau) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/products/dp0014-tau-konsol",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 40
  };

  // Block 3: Riva Kanepe (Side-by-Side Right)
  const block3 = {
    _key: "block_riva_kanepe",
    _type: "contentBlock",
    order: 3,
    mediaType: "image",
    position: "right",
    title: { _type: "localizedString", tr: "RİVA KANEPE", en: "RIVA SOFA" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: riva?.description || {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_riva_tr",
          _type: "block",
          children: [{ _key: "s_riva", _type: "span", text: "Zemine yakın masif silüetiyle mekanda panoramik bir konfor alanı kurgulayan Riva; farklı açı ve formlarda kurgulanabilen esnek modüler yapısı sayesinde, geniş oturum derinliğini mekanın geometrisine uyum sağlayan heykelsi bir yerleşimle buluşturuyor." }],
          markDefs: [],
          style: "normal"
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(riva) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONU KEŞFEDİN", en: "EXPLORE COLLECTION" },
    linkUrl: "/products/kn0250-riva",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 40
  };

  // Block 4: Tin Dresuar (Side-by-Side Left)
  const block4 = {
    _key: "block_tin_dresuar",
    _type: "contentBlock",
    order: 4,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "TİN DRESUAR", en: "TIN CONSOLE TABLE" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: tin?.description || {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_tin_tr",
          _type: "block",
          children: [{ _key: "s_tin", _type: "span", text: "Doğrusal bir metal strüktür üzerinde yükselen TIN; çekmeceli ve çekmecesiz üst tabla seçenekleriyle, fonksiyonu en yalın geometrik formda sunuyor. Keskin hatları ve rasyonel oranlarıyla mekanda mimari bir netlik sergiliyor." }],
          markDefs: [],
          style: "normal"
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(tin) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "DETAYLARI İNCELEYİN", en: "VIEW DETAILS" },
    linkUrl: "/products/dr0001-tin-dresuar",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 40
  };

  // Block 5: Sur Sehpa (Side-by-Side Right)
  const block5 = {
    _key: "block_sur_sehpa",
    _type: "contentBlock",
    order: 5,
    mediaType: "image",
    position: "right",
    title: { _type: "localizedString", tr: "SUR SEHPA KOLEKSİYONU", en: "SUR COFFEE TABLE COLLECTION" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: surb?.description || {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_sur_tr",
          _type: "block",
          children: [{ _key: "s_sur", _type: "span", text: "Tasarım ve sanatın sınırlarını eriten SUR; sanatçı Albena Martinova’nın mürekkep tekniği ile yarattığı özgün desenleri, Cem Tanrıkulu’nun zamansız formlarıyla bir araya getiriyor. Paslanmaz metal yüzey üzerine edisyonlu olarak aktarılan bu desenler, her bir tablayı tekil ve yaşayan bir sanat eserine dönüştürüyor." }],
          markDefs: [],
          style: "normal"
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(surb) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONU KEŞFEDİN", en: "EXPLORE COLLECTION" },
    linkUrl: "/products/sh0033-surb",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 40
  };

  const newContentBlocks = [block0, panelBlock, block2, block3, block4, block5];

  console.log("Updating Sanity HomePage document with new content blocks...");
  await client.patch(homeDoc._id)
    .set({ contentBlocks: newContentBlocks })
    .commit();

  console.log("Updating SiteSettings to guarantee sharp borders (imageBorderStyle = 'square')...");
  const siteSettingsDoc = await client.fetch(`*[_type == "siteSettings"][0]`);
  if (siteSettingsDoc) {
    await client.patch(siteSettingsDoc._id)
      .set({ imageBorderStyle: 'square' })
      .commit();
  }

  console.log("Successfully updated HomePage content blocks and SiteSettings in Sanity!");
}

runUpdate().catch(console.error);
