const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`);
  console.log("=== EXISTING HOME CONTENT BLOCKS ===");
  console.log(JSON.stringify(home?.contentBlocks, null, 2));

  const products = await client.fetch(`*[_type == "product"]{
    id,
    name,
    description,
    "categoryName": category->name,
    media[]{
      type,
      "url": imageR2.url,
      "mobileUrl": imageMobileR2.url,
      "desktopUrl": imageDesktopR2.url,
      "videoUrl": videoFileR2.url,
      isCover,
      title,
      description
    }
  }`);
  console.log("\n=== EXISTING PRODUCTS DETAILED ===");
  console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
