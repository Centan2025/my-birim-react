const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function verify() {
  const home = await client.fetch(`*[_type == "homePage"][0]{
    heroMedia,
    contentBlocks
  }`);

  const settings = await client.fetch(`*[_type == "siteSettings"][0]{
    imageBorderStyle
  }`);

  console.log("=== HERO MEDIA COUNT ===", home?.heroMedia?.length);
  console.log("=== SITE SETTINGS BORDER STYLE ===", settings?.imageBorderStyle);
  console.log("=== CONTENT BLOCKS SUMMARY ===");
  home?.contentBlocks?.forEach((b, idx) => {
    console.log(`[Block ${idx}] Key: ${b._key} | Order: ${b.order} | Type: ${b.mediaType} | Pos: ${b.position} | Title: ${JSON.stringify(b.title?.tr || b.title)}`);
    if (b.linkText) console.log(`   CTA: ${JSON.stringify(b.linkText.tr || b.linkText)} -> ${b.linkUrl}`);
  });
}

verify().catch(console.error);
