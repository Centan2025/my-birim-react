const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw'
});

async function main() {
  console.log("Checking for drafts.homePage...");
  const draft = await client.getDocument('drafts.homePage');
  if (draft) {
    console.log("Deleting drafts.homePage to clear stuck browser draft state...");
    await client.delete('drafts.homePage');
    console.log("Successfully deleted drafts.homePage!");
  } else {
    console.log("No drafts.homePage found!");
  }
}

main().catch(console.error);
