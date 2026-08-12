const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
});

async function main() {
  console.log("Applying Magazine Editorial Flow (2-Column Image Pairing & Rich Typography)...");
  
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

  // BLOCK 0: ARCHITECTURAL MANIFESTO (Museum Style Centered Header, Gray Background)
  const block0 = {
    _key: "mag_b0_manifesto",
    _type: "contentBlock",
    order: 0,
    mediaType: "image",
    position: "center",
    title: { _type: "localizedString", tr: "1975'TEN BUGÜNE MİMARİ DİSİPLİN VE ZANAAT", en: "ARCHITECTURAL DISCIPLINE & CRAFTSMANSHIP SINCE 1975" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_mag_tr",
          _type: "block",
          style: "blockquote",
          children: [
            {
              _key: "span_mag_tr",
              _type: "span",
              text: "Birim, malzeme dürüstlüğü ve usta el işçiliğini modern mimarinin yalın diliyle buluşturur. Her detay, mekanın ruhunu tamamlayan heykelsi bir form ve zamansız bir estetik sunmak üzere tasarlanır."
            }
          ],
          markDefs: []
        }
      ],
      en: [
        {
          _key: "desc_mag_en",
          _type: "block",
          style: "blockquote",
          children: [
            {
              _key: "span_mag_en",
              _type: "span",
              text: "Birim combines material honesty and master craftsmanship with the pure language of modern architecture."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    linkText: { _type: "localizedString", tr: "KOLEKSİYONLARI KEŞFEDİN", en: "EXPLORE COLLECTIONS" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 32,
    spacingBottom: 48
  };

  // BLOCK 2: MAGAZINE EDITORIAL SPREAD (2-Column Side-by-Side Image Pairing inside PortableText)
  const block2 = {
    _key: "mag_b2_editorial_grid",
    _type: "contentBlock",
    order: 2,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "MATERYAL VE FORM SENTETİĞİ", en: "SYNTHESIS OF MATERIAL & FORM" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "pt_img_left",
          _type: "portableTextImage",
          layout: "left",
          caption: "TAU KONSOL — Kösele Deri Patchwork İşçiliği",
          imageR2: makeR2Asset(
            "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
            "products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
            1920,
            1280
          )
        },
        {
          _key: "pt_img_right",
          _type: "portableTextImage",
          layout: "right",
          caption: "SUR SEHPA — Albena Martinova Mürekkep Desenleri",
          imageR2: makeR2Asset(
            "https://birim-assets.web-birim.workers.dev/migration/products/sh0033-surb/1781609940212-sur.webp",
            "migration/products/sh0033-surb/1781609940212-sur.webp",
            1920,
            1280
          )
        },
        {
          _key: "pt_text_essay",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_essay",
              _type: "span",
              text: "Geleneksel usta zanaatı ile çağdaş sanatı tek bir mimari dilde buluşturan seçkin parçalar. Derinin dokunsal sıcaklığı ve paslanmaz metalin rasyonel hatları mekanda heykelsi bir denge yaratır."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp",
      "products/depolamalar/tau-konsol/DP0014_TAU_KONSOL_02.webp"
    ),
    linkText: { _type: "localizedString", tr: "MİMARİ SEÇKİYİ İNCELEYİN", en: "DISCOVER ARCHITECTURAL SELECTION" },
    linkUrl: "/products",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 56
  };

  // BLOCK 3: ASYMMETRIC PANORAMIC FEATURE - RİVA & SOFT (Side-by-side Right, Gray Background)
  const block3 = {
    _key: "mag_b3_panoramic",
    _type: "contentBlock",
    order: 3,
    mediaType: "image",
    position: "right",
    title: { _type: "localizedString", tr: "PANORAMİK OTURUM VE MODÜLER DOKU", en: "PANORAMIC SEATING & MODULAR TEXTURE" },
    titlePosition: "below",
    titleFont: "normal",
    titleAlignment: "left",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_riva_mag",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_riva_mag",
              _type: "span",
              text: "Zemine yakın masif silüetiyle mekanda panoramik bir konfor kurgulayan Riva kanepe; mimari projelerde farklı açılarda düzenlenebilen modüler özgürlük sunar."
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
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/kn0250-riva/1785155403170-0250 RİVA.webp",
      "migration/products/kn0250-riva/1785155403170-0250 RİVA.webp"
    ),
    linkText: { _type: "localizedString", tr: "RİVA KANEPENİ İNCELEYİN", en: "DISCOVER RIVA SOFA" },
    linkUrl: "/product/kn0250-riva",
    showButtonOnMedia: false,
    backgroundColor: "gray",
    hasBorder: false,
    borderThickness: 1,
    padding: 24,
    spacingBottom: 56
  };

  // BLOCK 4: CLOSING ATELIER INVITATION (Full Width Closing Manifesto)
  const block4 = {
    _key: "mag_b4_atelier",
    _type: "contentBlock",
    order: 4,
    mediaType: "image",
    position: "full",
    title: { _type: "localizedString", tr: "BİRİM ATELIER: ÖZEL PROJELER VE MİMARİ DANIŞMANLIK", en: "BIRIM ATELIER: CUSTOM CONTRACT & CONSULTATION" },
    titlePosition: "above",
    titleFont: "Oswald",
    titleAlignment: "center",
    description: {
      _type: "localizedPortableText",
      tr: [
        {
          _key: "desc_atelier_mag",
          _type: "block",
          style: "normal",
          children: [
            {
              _key: "span_at_mag",
              _type: "span",
              text: "Konut, otel ve ticari yapılar için mimari projeye özel imalat, detay çözümleri ve kişiselleştirilmiş mobilya üretimi. Projeniz için mimari ekibimizle doğrudan iletişime geçebilirsiniz."
            }
          ],
          markDefs: []
        }
      ]
    },
    contentFont: "normal",
    textAlignment: "center",
    textPosition: "above",
    imageR2: makeR2Asset(
      "https://birim-assets.web-birim.workers.dev/migration/products/dp0006-cab/1782286562154-cab-konsol.webp",
      "migration/products/dp0006-cab/1782286562154-cab-konsol.webp"
    ),
    linkText: { _type: "localizedString", tr: "MİMARİ DANIŞMANLIK & İLETİŞİM", en: "ARCHITECTURAL CONSULTATION" },
    linkUrl: "/contact",
    showButtonOnMedia: false,
    backgroundColor: "white",
    hasBorder: false,
    borderThickness: 1,
    padding: 0,
    spacingBottom: 64
  };

  const magazineBlocks = [block0, panelBlock, block2, block3, block4];

  console.log("Patching published AND draft homePage documents with Magazine Flow...");
  const homeDocs = await client.fetch(`*[_type == "homePage"]{ _id }`);
  for (const doc of homeDocs) {
    console.log(`Updating ${doc._id}...`);
    await client.patch(doc._id)
      .set({ contentBlocks: magazineBlocks })
      .commit();
  }

  console.log("Magazine Editorial Flow applied successfully!");
}

main().catch(console.error);
