const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw'
});

async function run() {
  const doc = await client.getDocument('homePage');
  const blocks = doc?.contentBlocks || [];
  blocks.forEach((b, i) => {
    console.log(`Block ${i} mediaType:`, b.mediaType);
    if (b.imagePanels) {
      console.log(`Block ${i} imagePanels:`, JSON.stringify(b.imagePanels, null, 2));
    }
  });
}
run();
