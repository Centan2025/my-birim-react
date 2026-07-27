const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function main() {
  const products = await client.fetch(`*[_type == "product"]{
    id,
    name,
    "category": category->name,
    "designer": designer->name,
    description,
    year,
    media[]{
      type,
      "url": imageR2.url,
      isCover,
      alt
    }
  }`);
  
  const news = await client.fetch(`*[_type == "news"]{
    id, title, excerpt, "image": imageR2.url
  }`);

  const projects = await client.fetch(`*[_type == "project"]{
    id, title, description, "image": imageR2.url
  }`);

  const about = await client.fetch(`*[_type in ["aboutPageV2", "aboutPage"]][0]{
    heroImageR2,
    historySection,
    identitySection,
    qualitySection
  }`);

  console.log("ALL PRODUCTS SUMMARY:");
  products.forEach(p => {
    console.log(`Product: ${p.name?.tr || p.id} | Cat: ${p.category?.tr || 'N/A'} | Media count: ${p.media?.length || 0}`);
    if (p.media) {
      p.media.forEach(m => {
        if (m.url) console.log(`   - ${m.url}`);
      });
    }
  });

  console.log("\nNEWS:", JSON.stringify(news, null, 2));
  console.log("\nPROJECTS:", JSON.stringify(projects, null, 2));
}

main().catch(console.error);
