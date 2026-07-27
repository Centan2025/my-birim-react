const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false
});

async function main() {
  const products = await client.fetch(`*[_type == "product"]{
    "id": id.current,
    name,
    description,
    "imageUrl": media[isCover == true || type == "image"][0].imageR2.url
  }`);
  
  products.forEach(p => {
    console.log("-----------------------------------------");
    console.log("ID:", p.id);
    console.log("NAME:", p.name?.tr || p.name?.en);
    console.log("IMAGE:", p.imageUrl);
    console.log("DESC TR:", JSON.stringify(p.description?.tr));
  });
}

main().catch(console.error);
