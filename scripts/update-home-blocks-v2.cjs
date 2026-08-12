const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
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

  // Block 0: BRAND HERITAGE with 2-Column Side-by-Side Images via PortableText!
  const block0 = {
    _key: "block_brand_heritage_v2",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "left",
    title: { _type: "localizedString", tr: "BİRİM MİMARİ & TASARIM ARŞİVİ", en: "BIRIM ARCHITECTURE & DESIGN ARCHIVE" },
    titlePosition: "above",
    titleFont: "normal",
    titleAlignment: "left",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "img_pair_1",
          _type: "portableTextImage",
          layout: "left",
          imageR2: {
            _type: "r2Asset",
            alt: "Birim Pomelli Studio 1",
            url: "https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281594540-pomelli-image (12).webp"
          }
        },
        {
          _key: "img_pair_2",
          _type: "portableTextImage",
          layout: "right",
          imageR2: {
            _type: "r2Asset",
            alt: "Birim Pomelli Studio 2",
            url: "https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281629008-pomelli-image (10).webp"
          }
        },
        {
          _key: "desc_b0_text",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "s_b0",
              _type: "span",
              text: "1975'ten bugüne mimari disiplin, malzeme dürüstlüğü ve usta el işçiliğinin buluştuğu zamansız tasarım koleksiyonları. Birim, mekânın ruhunu şekillendiren heykelsi mobilya ve mimari çözümler sunar."
            }
          ],
          markDefs: []
        }
      ],
      en: [
        {
          _key: "desc_b0_text_en",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "s_b0_en",
              _type: "span",
              text: "Timeless design collections bringing together architectural discipline, material honesty, and master craftsmanship since 1975."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "left",
    textPosition: "below",
    verticalAlignment: "center",
    imageR2: {
      _type: "r2Asset",
      url: "https://birim-assets.web-birim.workers.dev/migration/home/panels/1777281594540-pomelli-image (12).webp"
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONLARI KEŞFEDİN", en: "EXPLORE COLLECTIONS" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
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
      url: "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp"
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/products/dp0014-tau-konsol",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
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
      url: "https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp"
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONU KEŞFEDİN", en: "EXPLORE COLLECTION" },
    linkUrl: "/products/kn0250-riva",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
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
      url: "https://birim-assets.web-birim.workers.dev/migration/products/dr0001-tin-dresuar/1781604158672-tin-dresuar.webp"
    },
    linkText: { _type: "localizedString", tr: "DETAYLARI İNCELEYİN", en: "VIEW DETAILS" },
    linkUrl: "/products/dr0001-tin-dresuar",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
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
      url: "https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp"
    },
    linkText: { _type: "localizedString", tr: "KOLEKSİYONU KEŞFEDİN", en: "EXPLORE COLLECTION" },
    linkUrl: "/products/sh0033-surb",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
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
      url: "https://birim-assets.web-birim.workers.dev/migration/products/kr0003-soft/1782299445612-soft-katalog.webp"
    },
    linkText: { _type: "localizedString", tr: "ÜRÜNÜ İNCELEYİN", en: "VIEW PRODUCT" },
    linkUrl: "/products/kr0003-soft",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 48
  };

  const newBlocks = [block0, panelBlock, block2, block3, block4, block5, block6];

  console.log("Updating homePage document in Sanity...");
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

  console.log("Successfully updated homePage and siteSettings!");
}

runUpdate().catch(console.error);
