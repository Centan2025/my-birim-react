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
  extractPalette
} from './sanity/client'
export type { SanityImageLike, SanityFileAsset, SanityProductMediaItem } from './sanity/client'

// Settings & Globals
export {
  getItem,
  setItem,
  getLanguages,
  getSiteSettings
} from './sanity/settings'

// We missed a few simple setting functions from the monolithic file, re-adding them directly to avoid breaking here.
import { sanity, sanityMutations, useSanity } from './sanity/client'
import { getItem as _getItem, setItem as _setItem } from './sanity/settings'
import groq from 'groq'
import type { SiteSettings, CookiesPolicy, PrivacyPolicy, TermsOfService, KvkkPolicy, FooterContent } from '../types'
import { mapImage } from './sanity/client'

const SIMULATED_DELAY = 200
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export const updateLanguages = async (languages: string[]): Promise<void> => {
  await delay(SIMULATED_DELAY)
  _setItem('birim_languages', languages)
}

export const updateSiteSettings = async (settings: SiteSettings): Promise<void> => {
  await delay(SIMULATED_DELAY)
  _setItem('birim_site_settings', settings)
}

export const getTranslations = async (): Promise<Record<string, Record<string, string>>> => {
  if (useSanity && sanity) {
    try {
      const q = groq`*[_type == "uiTranslations" && !(_id in path("drafts.**"))] | order(_updatedAt desc){ language, strings }`
      const noCacheClient = sanity.withConfig({ useCdn: false })
      const results = await noCacheClient.fetch(q)
      const translationsMap: Record<string, Record<string, string>> = {}
      if (Array.isArray(results)) {
        results.forEach((item: any) => {
          if (item.language && item.strings) {
            const normalized: Record<string, string> = { ...item.strings }
            if (normalized['models_3d'] && !normalized['3d_models']) normalized['3d_models'] = normalized['models_3d']
            if (!translationsMap[item.language]) translationsMap[item.language] = normalized
          }
        })
      }
      return translationsMap
    } catch { return {} }
  }
  return {}
}

export const getCookiesPolicy = async (): Promise<CookiesPolicy | null> => {
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "cookiesPolicy"][0]{ title, content, updatedAt }`) || null
  return null
}
export const getPrivacyPolicy = async (): Promise<PrivacyPolicy | null> => {
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "privacyPolicy"][0]{ title, content, updatedAt }`) || null
  return null
}
export const getTermsOfService = async (): Promise<TermsOfService | null> => {
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "termsOfService"][0]{ title, content, updatedAt }`) || null
  return null
}
export const getKvkkPolicy = async (): Promise<KvkkPolicy | null> => {
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "kvkkPolicy"][0]{ title, content, updatedAt }`) || null
  return null
}
export const getFooterContent = async (): Promise<FooterContent> => {
  if (useSanity && sanity) {
    const data = await sanity.fetch(groq`*[_type == "footer"][0]{ ..., partners[]{ ..., logoR2 }, legalLinks[] }`)
    if (data?.partners) data.partners = data.partners.map((p: any) => ({ ...p, logo: mapImage(p.logoR2) }))
    if (!Array.isArray(data?.legalLinks)) data.legalLinks = []
    return data
  }
  const data = _getItem<FooterContent>('birim_footer')
  if (data && !Array.isArray(data.legalLinks)) data.legalLinks = []
  return data || ({} as FooterContent)
}
export const updateFooterContent = async (content: FooterContent): Promise<void> => {
  await delay(SIMULATED_DELAY)
  _setItem('birim_footer', content)
}

// Designers & Categories
export {
  getCategories,
  getDesigners,
  getDesignerById
} from './sanity/categories'


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
  getProductsByDesignerId
} from './sanity/products'


export const addProduct = async (): Promise<void> => { }
export const updateProduct = async (): Promise<void> => { }
export const deleteProduct = async (): Promise<void> => { }

// Pages
export {
  getAboutPageContent,
  getContactPageContent,
  getHomePageContent
} from './sanity/pages'


export const updateAboutPageContent = async (): Promise<void> => { }
export const updateContactPageContent = async (): Promise<void> => { }
export const updateHomePageContent = async (): Promise<void> => { }


// News & Projects
export {
  getNews,
  getNewsById,
  getProjects,
  getProjectById
} from './sanity/news'


export const addNews = async (): Promise<void> => { }
export const updateNews = async (): Promise<void> => { }
export const deleteNews = async (): Promise<void> => { }


// Auth & Users
export {
  subscribeEmail,
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from './sanity/auth'

// Re-implementing a few auth items missed
import type { User } from '../types'
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const normEmail = email.trim().toLowerCase()
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "user" && lower(email) == $email && !defined(_deleted)][0]{ ..., isVerified }`, { email: normEmail }) || null
  return _getItem<User[]>('birim_users')?.find(u => u.email === normEmail) || null
}
export const getUserById = async (id: string): Promise<User | null> => {
  if (useSanity && sanity) return await sanity.fetch(groq`*[_type == "user" && _id == $id][0]{ ..., isVerified }`, { id }) || null
  return _getItem<User[]>('birim_users')?.find(u => u._id === id) || null
}
export const verifyUserByToken = async (token: string): Promise<User | null> => {
  if (useSanity && sanityMutations) {
    const user = await (sanityMutations.fetch as any)(groq`*[_type == "user" && verificationToken == $token][0]`, { token })
    if (!user) return null

    if (!user.isVerified) {
      await sanityMutations.patch(user._id).set({ isVerified: true }).unset(['verificationToken']).commit()
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      company: user.company,
      profession: user.profession,
      country: user.country,
      userType: user.userType as any,
      isActive: user.isActive,
      isVerified: true,
      createdAt: user.createdAt || user._createdAt
    }
  }
  return null
}

export const deleteUserAccount = async (id: string): Promise<boolean> => {
  if (useSanity && sanityMutations) {
    try {
      await sanityMutations.delete(id)
      return true
    } catch {
      return false
    }
  }
  return false
}
