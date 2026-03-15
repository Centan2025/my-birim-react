import {defineCliConfig} from 'sanity/cli'
import path from 'path'

export default defineCliConfig({
  api: {
    projectId: 'wn3a082f',
    dataset: 'production',
  },
  studioHost: 'birim',
  deployment: {
    appId: 'uhq1n1x3jfninkphme61bf2x',
  },
  vite: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@sentry/react': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/browser': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/core': path.resolve(__dirname, './scripts/dummy-sentry.js'),
        },
      },
    }
  },
})
