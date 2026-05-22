const sanityClient = require('@sanity/client');
const client = sanityClient.createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: false
});
client.fetch(`*[_type=='project' && defined(contentBlocks) && length(contentBlocks) > 0][0...2]{
  id, title, contentBlocks
}`).then(res => console.log(JSON.stringify(res, null, 2)));
