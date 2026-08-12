const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
});

async function main() {
  const news = await client.fetch(`*[_type == "news"]{ _id, title, category, date, "id": id.current, mainImageR2 }`);
  console.log("Found News in Sanity:", JSON.stringify(news, null, 2));
}

main().catch(console.error);
