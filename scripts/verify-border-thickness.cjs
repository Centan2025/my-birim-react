const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function main() {
  const home = await client.fetch(`*[_type == "homePage"][0]`);
  console.log("=== BORDER THICKNESS VERIFICATION ===");
  home.contentBlocks.forEach((b, i) => {
    console.log(`Block ${i} [${b._key}]: hasBorder=${b.hasBorder}, borderThickness=${b.borderThickness}`);
  });
}

main().catch(console.error);
