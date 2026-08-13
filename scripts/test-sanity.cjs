const sanityClient = require('@sanity/client')
const client = sanityClient.createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
})
client
  .fetch(
    `*[_type=='project' && id.current=='herodaki-full-screenviewer-tiklayinca-alttaki-icerik-bloklarindaki-gorseller-fullscreen-viewer'][0]{
  id, title, contentBlocks
}`
  )
  .then(res => console.log(JSON.stringify(res, null, 2)))
