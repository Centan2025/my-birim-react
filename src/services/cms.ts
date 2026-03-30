/**
 * BARREL FILE: src/services/cms.ts
 *
 * This file has been refactored into smaller, more manageable services within the `sanity/` directory.
 * It now acts as a barrel file to export everything, ensuring that existing imports in the application
 * (e.g., `import { getProducts } from 'services/cms'`) continue to work without modification.
 *
 * New code should ideally import directly from the relevant `sanity/*` module.
 */

// Core Client & Utilities
export {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_API_VERSION,
  useSanity,
  R2_DOMAIN,
  R2_ORIGIN_DOMAIN,
  ENABLE_LOCAL_FALLBACK,
  sanity,
  SANITY_TOKEN,
  sanityMutations,
  urlFor,
  toFileUrl,
  rewriteR2Url,
  mapImage,
  mapR2Metadata,
  mapImages,
  extractPalette,
} from './sanity/client'
export type { SanityImageLike, SanityFileAsset, SanityProductMediaItem } from './sanity/client'

// Settings & Globals
export {
  getItem,
  setItem,
  getLanguages,
  updateLanguages,
  getSiteSettings,
  updateSiteSettings,
  getTranslations,
  getCookiesPolicy,
  getPrivacyPolicy,
  getTermsOfService,
  getKvkkPolicy,
  getFooterContent,
  updateFooterContent,
} from './sanity/settings'

// Designers & Categories
export { getCategories, getDesigners, getDesignerById } from './sanity/categories'

export const addCategory = async (): Promise<void> => { }
export const updateCategory = async (): Promise<void> => { }
export const deleteCategory = async (): Promise<void> => { }
export const addDesigner = async (): Promise<void> => { }
export const updateDesigner = async (): Promise<void> => { }
export const deleteDesigner = async (): Promise<void> => { }

// Products
export {
  getProducts,
  getProductById,
  getProductsByCategoryId,
  getProductsByDesignerId,
} from './sanity/products'

export const addProduct = async (): Promise<void> => { }
export const updateProduct = async (): Promise<void> => { }
export const deleteProduct = async (): Promise<void> => { }

// Pages
export {
  getAboutPageContent,
  getContactPageContent,
  getHomePageContent,
  getFactoryPageContent,
  updateAboutPageContent,
  updateContactPageContent,
  updateHomePageContent,
} from './sanity/pages'

// News & Projects
export { getNews, getNewsById, getProjects, getProjectById } from './sanity/news'

export const addNews = async (): Promise<void> => { }
export const updateNews = async (): Promise<void> => { }
export const deleteNews = async (): Promise<void> => { }

// Auth & Users
export {
  subscribeEmail,
  subscribeProfessional,
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getUserByEmail,
  getUserById,
  verifyUserByToken,
  deleteUserAccount,
} from './sanity/auth'
