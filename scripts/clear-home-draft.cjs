const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'wn3a082f',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN || ''
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
