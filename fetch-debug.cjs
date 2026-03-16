const sanityClient = require('@sanity/client');
const fs = require('fs');

const client = sanityClient.createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: false
});

client.fetch(`*[_type=='project' && defined(contentBlocks) && length(contentBlocks) > 0][0...5] {
  "id": id.current, title, contentBlocks
}`).then(res => {
  fs.writeFileSync('f:/birim-web-antigravity/project-debug.json', JSON.stringify(res, null, 2));
  console.log('File written to project-debug.json');
});
