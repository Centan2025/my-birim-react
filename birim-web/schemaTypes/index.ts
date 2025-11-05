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

import {localizedString} from './objects/localizedString'
import {localizedText} from './objects/localizedText'
import {
  productDimensionDetail,
  productDimensionSet,
  productMaterial,
  productMaterialSelection,
  productVariant,
  downloadableItem,
  exclusiveContent,
  heroMediaItem,
  footerLink,
  footerLinkColumn,
  socialLink,
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
  // objects
  localizedString,
  localizedText,
  productDimensionDetail,
  productDimensionSet,
  productMaterial,
  materialSwatchBook,
  productMaterialSelection,
  productVariant,
  downloadableItem,
  exclusiveContent,
  heroMediaItem,
  footerLink,
  footerLinkColumn,
  socialLink,
  contactLocation,
]
