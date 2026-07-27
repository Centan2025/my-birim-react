const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw'
});

async function runUpdate() {
  console.log("Fetching homePage and products...");
  const homeDoc = await client.fetch(`*[_type == "homePage"][0]`);
  if (!homeDoc) return;

  const existingBlocks = homeDoc.contentBlocks || [];
  
  // 100% preserve the panels block
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
  panelBlock.order = 1;

  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    media[]{ type, imageR2, isCover }
  }`);

  const getProd = (id) => products.find(p => p.id === id);
  const getImageR2 = (prod) => {
    if (!prod || !prod.media) return null;
    const cover = prod.media.find(m => m.isCover) || prod.media[0];
    return cover ? cover.imageR2 : null;
  };

  const tau = getProd('dp0014-tau-konsol');
  const riva = getProd('kn0250-riva');
  const tin = getProd('dr0001-tin-dresuar');
  const surb = getProd('sh0033-surb');
  const soft = getProd('kr0003-soft');

  // Block 0: REDESIGNED FIRST BLOCK - BIRIM ATELIER & ARCHITECTURE
  const block0 = {
    _key: "block_brand_intro_v3",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "MİMARİ DİSİPLİN VE EL İŞÇİLİĞİ", en: "ARCHITECTURAL DISCIPLINE & CRAFTSMANSHIP" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_b0_v3",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_b0_v3",
              _type: "span",
              text: "1975'ten bu yana nesiller boyu aktarılan zanaat tecrübesi, modern mimari çizgiler ve malzeme dürüstlüğüyle şekilleniyor. Yaşam alanlarına heykelsi bir karakter katan özgün koleksiyonlar."
            }
          ],
          markDefs: []
        }
      ],
      en: [
        {
          _key: "desc_b0_v3_en",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_b0_v3_en",
              _type: "span",
              text: "Generations of craftsmanship expertise since 1975, shaped by modern architectural lines and material honesty."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/uploads/1772637182314-BF006_CAB_06.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "TÜM KOLEKSİYONU KEŞFEDİN", en: "EXPLORE ALL COLLECTIONS" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 2: TAU KONSOL (Full Width Cinematic)
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
    description: tau?.description,
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: getImageR2(tau) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/product/dp0014-tau-konsol",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 3: RİVA KANEPE (Side-by-side right)
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
    description: riva?.description,
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(riva) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/product/kn0250-riva",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 4: TİN DRESUAR (Side-by-side left)
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
    description: tin?.description,
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(tin) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/product/dr0001-tin-dresuar",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 5: SUR SEHPA (Side-by-side right)
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
    description: surb?.description,
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(surb) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/product/sh0033-surb",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 6: SOFT YATAK (Side-by-side left)
  const block6 = {
    _key: "block_soft_yatak",
    _type: "contentBlock",
    order: 6,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "SOFT YATAK", en: "SOFT BED" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: soft?.description,
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: getImageR2(soft) || {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/kr0003-soft/1782299445612-soft-katalog.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/product/kr0003-soft",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // Block 7: MİMARİ PROJELER VE İLETİŞİM (Closing Atelier Block)
  const block7 = {
    _key: "block_architectural_solutions",
    _type: "contentBlock",
    order: 7,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "MİMARİ ÇÖZÜMLER & ÖZEL ÜRETİM", en: "ARCHITECTURAL SOLUTIONS & CUSTOM PRODUCTION" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "center",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_b7_tr",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_b7_tr",
              _type: "span",
              text: "Birim Atelier, konut, otel ve ticari alanlar için özel mobilya imalatı ve projeye özel iç mekân detayları geliştirir. Mimari projeniz için ekibimizle iletişime geçin."
            }
          ],
          markDefs: []
        }
      ],
      en: [
        {
          _key: "desc_b7_en",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_b7_en",
              _type: "span",
              text: "Birim Atelier develops custom furniture manufacturing and project-specific interior details for residential, hotel, and commercial projects."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp",
      hasResponsiveSizes: true
    },
    linkText: { _type: "localizedString", tr: "MİMARİ İLETİŞİM", en: "ARCHITECTURAL CONTACT" },
    linkUrl: "/contact",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  const newBlocks = [block0, panelBlock, block2, block3, block4, block5, block6, block7];

  console.log("Updating homePage document in Sanity with working links...");
  await client.patch(homeDoc._id)
    .set({ contentBlocks: newBlocks })
    .commit();

  console.log("Updating SiteSettings imageBorderStyle to 'square'...");
  const siteSettingsDoc = await client.fetch(`*[_type == "siteSettings"][0]`);
  if (siteSettingsDoc) {
    await client.patch(siteSettingsDoc._id)
      .set({ imageBorderStyle: 'square' })
      .commit();
  }

  console.log("Successfully updated homePage content blocks and button links!");
}

runUpdate().catch(console.error);
