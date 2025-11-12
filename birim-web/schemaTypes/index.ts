import category from './documents/category'
import designer from './documents/designer'
import product from './documents/product'
import newsItem from './documents/newsItem'
import siteSettings from './documents/siteSettings'
import homePage from './documents/homePage'
import aboutPage from './documents/aboutPage'
import contactPage from './documents/contactPage'
import footer from './documents/footer'
import materialGroup from './documents/materialGroup'
import project from './documents/project'
import user from './documents/user'
import cookiesPolicy from './documents/cookiesPolicy'
import privacyPolicy from './documents/privacyPolicy'
import termsOfService from './documents/termsOfService'
import kvkkPolicy from './documents/kvkkPolicy'
import translations from './documents/translations'

import {localizedString} from './objects/localizedString'
import {localizedText} from './objects/localizedText'
import {localizedPortableText} from './objects/localizedPortableText'
import {
  productDimensionDetail,
  productDimensionSet,
  productDimensionImage,
  productSimpleMediaItem,
  productPanelMediaItem,
  productMaterial,
  productMaterialSelection,
  productVariant,
  downloadableItem,
  exclusiveContent,
  heroMediaItem,
  contentBlock,
  footerPartner,
  footerLink,
  footerLinkColumn,
  socialLink,
  legalLink,
  contactLocation,
  materialSwatchBook,
} from './objects/shared'

export const schemaTypes = [
  // documents
  category,
  designer,
  product,
  newsItem,
  siteSettings,
  homePage,
  aboutPage,
  contactPage,
  footer,
  materialGroup,
  project,
  user,
  cookiesPolicy,
  privacyPolicy,
  termsOfService,
  kvkkPolicy,
  translations,
  // objects
  localizedString,
  localizedText,
  localizedPortableText,
  productDimensionDetail,
  productDimensionSet,
  productDimensionImage,
  productSimpleMediaItem,
  productPanelMediaItem,
  productMaterial,
  materialSwatchBook,
  productMaterialSelection,
  productVariant,
  downloadableItem,
  exclusiveContent,
  heroMediaItem,
  contentBlock,
  footerPartner,
  footerLink,
  footerLinkColumn,
  socialLink,
  legalLink,
  contactLocation,
]
