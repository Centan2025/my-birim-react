const {createClient} = require('@sanity/client')
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
})

client
  .fetch('*[_type == "factoryPage"][0]{ title, gallery }')
  .then((res) => console.log(JSON.stringify(res, null, 2)))
  .catch((err) => console.error(err))
