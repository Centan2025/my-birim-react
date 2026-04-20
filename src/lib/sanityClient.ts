import {createClient} from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f',
  dataset: import.meta.env['VITE_SANITY_DATASET'] || 'production',
  apiVersion: import.meta.env['VITE_SANITY_API_VERSION'] || '2025-01-01',
  useCdn: true,
})
