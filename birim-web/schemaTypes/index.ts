import category from './documents/category'
import designer from './documents/designer'
import product from './documents/product'
import newsItem from './documents/newsItem'
import siteSettings from './documents/siteSettings'
import homePage from './documents/homePage'
import aboutPage from './documents/aboutPage'
import aboutPageV2 from './documents/aboutPageV2'
import contactPage from './documents/contactPage'
import factoryPage from './documents/factoryPage'
import footer from './documents/footer'
import materialGroup from './documents/materialGroup'
import project from './documents/project'
import cookiesPolicy from './documents/cookiesPolicy'
import privacyPolicy from './documents/privacyPolicy'
import termsOfService from './documents/termsOfService'
import kvkkPolicy from './documents/kvkkPolicy'
import distanceSalesAgreement from './documents/distanceSalesAgreement'
import preliminaryInfoForm from './documents/preliminaryInfoForm'
import translations from './documents/translations'
import shopHomePage from './documents/shopHomePage'
import shopSettings from './documents/shopSettings'

import {localizedString} from './objects/localizedString'
import {localizedText} from './objects/localizedText'
import {localizedPortableText} from './objects/localizedPortableText'
import r2Asset from './objects/r2Asset'
import seoFields from './objects/seoFields'
import productHotspot from './objects/productHotspot'
import interactiveShowcaseItem from './objects/interactiveShowcaseItem'
import productVariant from './objects/productVariant'
import {
  productDimensionDetail,
  productDimensionSet,
  productDimensionImage,
  productSimpleMediaItem,
  productPanelMediaItem,
  productMaterial,
  productMaterialSelection,
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
  contactLocationMedia,
  materialSwatchBook,
  productSellableDimension,
  productSellableMaterial,
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
  aboutPageV2,
  contactPage,
  factoryPage,
  footer,
  materialGroup,
  project,
  cookiesPolicy,
  privacyPolicy,
  termsOfService,
  kvkkPolicy,
  distanceSalesAgreement,
  preliminaryInfoForm,
  translations,
  shopHomePage,
  shopSettings,
  // objects
  localizedString,
  localizedText,
  localizedPortableText,
  r2Asset,
  seoFields,
  productHotspot,
  interactiveShowcaseItem,
  productVariant,
  productDimensionDetail,
  productDimensionSet,
  productDimensionImage,
  productSimpleMediaItem,
  productPanelMediaItem,
  productMaterial,
  materialSwatchBook,
  productMaterialSelection,
  productSellableDimension,
  productSellableMaterial,
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
  contactLocationMedia,
]
