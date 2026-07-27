const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function main() {
  const about = await client.fetch(`*[_type in ["aboutPageV2", "aboutPage"]][0]{
    heroImageR2,
    historySection{ imageR2, media[]{ imageR2 } },
    identitySection{ imageR2, media[]{ imageR2 } },
    qualitySection{ imageR2, media[]{ imageR2 } }
  }`);

  console.log("=== ABOUT PAGE ASSETS ===");
  console.log(JSON.stringify(about, null, 2));
}

main().catch(console.error);
