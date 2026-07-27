const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw'
});

client.fetch('*[_type == "homePage"]').then(res => {
  console.log(res.map(d => ({ _id: d._id, heroMediaCount: d.heroMedia?.length, contentBlocksCount: d.contentBlocks?.length })));
});
