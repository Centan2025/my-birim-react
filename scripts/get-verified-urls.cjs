const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function checkUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function main() {
  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    media[]{
      type,
      "url": imageR2.url,
      isCover
    }
  }`);

  const verified = [];

  for (const p of products) {
    if (p.media) {
      for (const m of p.media) {
        if (m.url && await checkUrl(m.url)) {
          verified.push({
            id: p.id,
            name: p.name?.tr || p.name?.en,
            url: m.url,
            isCover: !!m.isCover
          });
        }
      }
    }
  }

  console.log("=== VERIFIED 200 OK PRODUCT IMAGES ===");
  console.log(JSON.stringify(verified, null, 2));
}

main().catch(console.error);
