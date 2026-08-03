const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01'
});

client.fetch(`*[_type == "product" && !(_id in path("drafts.**"))][0..2]{
  _id,
  name,
  media
}`).then(res => {
  console.log('MEDIA ITEMS:', JSON.stringify(res, null, 2));
}).catch(console.error);
