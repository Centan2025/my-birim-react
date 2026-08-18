/**
 * Represents a string that can be localized into multiple languages.
 * Can also be a plain string for fields that are not translated.
 * e.g., { tr: 'Merhaba', en: 'Hello' } or 'A non-translated value'
 */
export type LocalizedString =
  | string
  | unknown[]
  | {
      [key: string]: string | unknown[] | undefined
      en?: string | unknown[]
      tr?: string | unknown[]
    }

// Sanity palette metadata (dominant renk bilgisi)
export interface SanityImagePalette {
  dominant?: {
    background?: string
    foreground?: string
  }
}

export interface R2ImageMetadata {
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  hotspot?: {
    x: number
    y: number
  }
  origWidth?: number
  origHeight?: number
  isMirrored?: boolean
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  cropDesktop?: R2ImageMetadata['crop']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidthDesktop?: number
  origHeightDesktop?: number
}

// --- Core Site Configuration ---

/**
 * Defines global settings for the website.
 */
export interface SiteSettings {
  /** URL for the site logo. Can be a path or a data URI. */
  logoUrl: string
  /** Optional short text displayed at the very top of the page. */
  topBannerText?: string
  /** Whether the language switcher is visible in the header. */
  isLanguageSwitcherVisible?: boolean
  /** Supported language codes, e.g., ['tr','en'] */
  languages?: string[]
  /** Toggles bottom Prev/Next navigation on product detail page. */
  showProductPrevNext?: boolean
  /** Toggles "related products" section on product detail page. */
  showRelatedProducts?: boolean
  /** Toggles the visibility of the cart button in the header. */
  showCartButton?: boolean
  /** Border style for images and videos: 'square' or 'rounded' */
  imageBorderStyle?: 'square' | 'rounded'
  /** Enables maintenance mode - shows "Coming Soon" page to visitors */
  maintenanceMode?: boolean
  /** Mobile header / hamburger menu animation style. */
  mobileHeaderAnimation?: 'default' | 'overlay'
  /** Toggles global page transition animations. */
  enablePageTransitions?: boolean
  /** Whether the "Factory" (Fabrika) menu and page are visible. */
  isFactoryVisible?: boolean
  /** Whether the AI Room Planner (Oda Planlayıcı) feature is enabled. */
  enableAiRoomPlanner?: boolean
}

// --- Core Data Models ---

/**
 * Represents a product category.
 */
export interface Category {
  /** Unique identifier for the category, typically used as a URL slug. */
  id: string
  /** Localized name of the category. */
  name: LocalizedString
  /** Localized subtitle or short description for the category page. */
  subtitle: LocalizedString
  /** URL for the hero image displayed on the category page. */
  heroImage:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        isMirrored?: boolean
      }
  /** URL for the menu image displayed in the products dropdown menu. */
  menuImage?:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        isMirrored?: boolean
      }
}

/**
 * Represents a furniture designer.
 */
export interface Designer {
  /** Unique identifier for the designer, typically used as a URL slug. */
  id: string
  /** Localized name of the designer. */
  name: LocalizedString
  /** Localized role or title of the designer (e.g., Architect). */
  role?: LocalizedString
  /** Localized biography of the designer. */
  bio: LocalizedString
  /** URL for the designer's portrait or representative image. */
  image:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        cropMobile?: R2ImageMetadata['crop']
        hotspotMobile?: R2ImageMetadata['hotspot']
        origWidthMobile?: number
        origHeightMobile?: number
        cropDesktop?: R2ImageMetadata['crop']
        hotspotDesktop?: R2ImageMetadata['hotspot']
        origWidthDesktop?: number
        origHeightDesktop?: number
      }
  /** Art Direction: Mobil için görsel URL (opsiyonel) */
  imageMobile?: string
  /** Art Direction: Desktop için görsel URL (opsiyonel) */
  imageDesktop?: string
}

/**
 * Represents a registered user/member.
 */
export type UserRole =
  | 'consumer'
  | 'architect'
  | 'dealer'
  | 'distributor'
  | 'contract'
  | 'employee'
  | 'admin'

export type ArchitectVerificationStatus =
  | 'not_requested'
  | 'pending_verification'
  | 'verified'
  | 'rejected'

export type UserType = 'email_subscriber' | 'full_member' | 'professional_subscriber'

export interface User {
  /** Unique identifier for the user. */
  _id: string
  /** User's email address. */
  email: string
  /** User's first name. */
  firstName?: string
  /** User's last name. */
  lastName?: string
  /** User's full name. */
  name?: string
  /** User's company name (architect profile). */
  company?: string
  /** User's profession. */
  profession?: string
  /** User's phone number. */
  phone?: string
  /** User's city. */
  city?: string
  /** User's country. */
  country?: string
  /** User's website or portfolio URL (architect profile). */
  website?: string
  /** Role of member: consumer, architect, admin, etc. */
  role: UserRole
  /** Architect verification level for Mimar Programı */
  architectVerificationStatus?: ArchitectVerificationStatus
  /** Notes / reasons from admin verification review */
  verificationNotes?: string
  /** Deprecated userType for backward compatibility. */
  userType?: UserType
  /** Whether email is verified. */
  isVerified?: boolean
  /** Verification token. */
  verificationToken?: string | null
  /** Whether account is active. */
  isActive: boolean
  /** Registration timestamp. */
  createdAt: string
}

export interface ProjectItem {
  id: string
  productId: string
  productName: string
  variantId?: string
  quantity: number
  finishNotes?: string
  designerNotes?: string
}

export interface ProjectCollection {
  id: string
  userId: string
  title: string
  projectType?: string
  description?: string
  items: ProjectItem[]
  createdAt: string
  updatedAt: string
}

export type LeadRequestType = 'information' | 'quotation'
export type LeadRequestStatus =
  | 'new'
  | 'in_review'
  | 'contacted'
  | 'quoted'
  | 'closed_won'
  | 'closed_lost'

export interface LeadRequestItem {
  productId: string
  productName: string
  variantName?: string
  quantity: number
  finishNotes?: string
}

export interface LeadRequest {
  id: string
  requestNumber: string
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  requestType: LeadRequestType
  status: LeadRequestStatus
  projectId?: string
  projectTitle?: string
  items: LeadRequestItem[]
  message?: string
  contactPhone: string
  contactCity: string
  contactCountry: string
  adminNotes?: string
  createdAt: string
}

/**
 * Materials grouped by swatch book (kartela)
 */
export interface ProductMaterialsBook {
  bookTitle: LocalizedString
  materials: ProductMaterial[]
}

/**
 * Grouped materials by a material group
 */
export interface ProductMaterialsGroup {
  groupTitle: LocalizedString
  books: ProductMaterialsBook[]
  materials: ProductMaterial[] // All materials in the group (for backward compatibility)
}

/**
 * Represents a single product.
 */
export interface Product {
  /** Unique identifier for the product, typically used as a URL slug. */
  id: string
  /** Localized name of the product. */
  name: LocalizedString
  /** ID of the designer who created the product. */
  designerId: string
  /** IDs of all designers who created the product. */
  designerIds?: string[]
  /** ID of the category this product belongs to. */
  categoryId: string
  /** The year the product was designed or released. */
  year: number
  /** Indicates if the product should be visible on the website. */
  isPublished?: boolean
  /** Localized detailed description of the product. */
  description: LocalizedString
  /** URL for the main display image of the product. */
  mainImage:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        palette?: SanityImagePalette
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        isMirrored?: boolean
        isMirroredMobile?: boolean
        isMirroredDesktop?: boolean
      }
  /** Mixed alternative media for the band under hero. */
  alternativeMedia?: {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string // Art Direction: Mobil için URL
    urlDesktop?: string // Art Direction: Desktop için URL
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
    origWidth?: number
    origHeight?: number
    isMirrored?: boolean
    isMirroredMobile?: boolean
    isMirroredDesktop?: boolean
  }[]
  /** Optional rich media for hero: image/video/youtube */
  media?: {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string // Art Direction: Mobil için URL
    urlDesktop?: string // Art Direction: Desktop için URL
    title?: LocalizedString
    description?: LocalizedString
    link?: string
    linkText?: LocalizedString
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
    origWidth?: number
    origHeight?: number
    isMirrored?: boolean
    isMirroredMobile?: boolean
    isMirroredDesktop?: boolean
  }[]
  /** Bottom media panels (Alt Medya Panelleri) */
  bottomMedia?: {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string
    urlDesktop?: string
    title?: LocalizedString
    description?: LocalizedString
    link?: string
    linkText?: LocalizedString
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
    origWidth?: number
    origHeight?: number
    isMirrored?: boolean
    isMirroredMobile?: boolean
    isMirroredDesktop?: boolean
  }[]
  /** Custom title for the bottom media section */
  mediaSectionTitle?: LocalizedString
  /** Custom text/description for the bottom media section */
  mediaSectionText?: LocalizedString
  /** Toggle for showing media panels at bottom. */
  showMediaPanels?: boolean
  /** Toggle for showing hero navigation thumbnails band under hero. */
  showHeroNavigation?: boolean
  /** Dimension drawings/images shown before materials. Each has an image and a title. */
  dimensionImages?: {
    image: string
    imageMobile?: string
    imageDesktop?: string
    title?: LocalizedString
  }[]
  /** Indicates if the product can be purchased directly. */
  buyable: boolean
  /** Price of the product. */
  price: number
  /** Currency code (e.g., 'TRY', 'USD'). */
  currency: string
  /** Stock keeping unit code. */
  sku?: string
  /** Stock status for purchase flow. */
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder'
  /** Array of available materials for the product. */
  materials: ProductMaterial[]
  /** Materials grouped by material group (for UI). */
  groupedMaterials?: ProductMaterialsGroup[]
  /** Toggles material section visibility. */
  showMaterials?: boolean
  /** Content accessible only to logged-in users. */
  exclusiveContent: ExclusiveContent
  /** Sanity update timestamp. */
  _updatedAt?: string
  /** Optional custom sort order number for ordering within categories. */
  sortOrder?: number
}

// --- Product Sub-types ---

/**
 * Represents a material option for a product.
 */
export interface ProductMaterial {
  /** Localized name of the material (e.g., 'Leather', 'Fabric'). */
  name: LocalizedString
  /** URL for an image swatch or sample of the material. */
  image: string
}

/**
 * Defines the structure for exclusive, members-only product content.
 */
export interface ExclusiveContent {
  /** Array of URLs for exclusive images. */
  images: string[]
  /** Array of downloadable technical drawings. */
  drawings: {name: LocalizedString; url: string}[]
  /** Array of downloadable 3D models. */
  models3d: {name: LocalizedString; url: string}[]
}

// --- Page-Specific Content Models ---

/**
 * Represents a single media item in the homepage hero slider.
 */
export interface HeroMediaItem {
  /** The type of media to display. */
  type: 'image' | 'video' | 'youtube'
  /** URL for the image, video file, or YouTube link. */
  url: string
  /** Art Direction: Mobil için URL (opsiyonel) */
  urlMobile?: string
  /** Art Direction: Desktop için URL (opsiyonel) */
  urlDesktop?: string
  /** Image palette metadata (only for image type) */
  palette?: SanityImagePalette
  /** Localized title text displayed over the media. */
  title: LocalizedString
  /** Metin konumu: center, left, right (default: center) */
  textPosition?: 'center' | 'left' | 'right'
  /** Localized subtitle text displayed over the media. */
  subtitle: LocalizedString
  /** Toggles visibility of the call-to-action button. */
  isButtonVisible: boolean
  /** Localized text for the call-to-action button. */
  buttonText: LocalizedString
  /** Link for the call-to-action button. */
  buttonLink: string
  /** Whether this hero item should be shown on the site (default: true). */
  isPublished?: boolean
  /** Optional publish date/time for time-based scheduling. */
  publishAt?: string
  /** Optional manual sort order; smaller numbers appear first. */
  sortOrder?: number
  /** Optional crop data from R2 asset */
  crop?: R2ImageMetadata['crop']
  /** Optional hotspot data from R2 asset */
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  cropDesktop?: R2ImageMetadata['crop']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidthDesktop?: number
  origHeightDesktop?: number
}

/**
 * Defines a content block that can be displayed on the homepage.
 */
export interface ContentBlock {
  backgroundColor?: 'white' | 'gray'
  hasBorder?: boolean
  borderThickness?: number
  textAlignment?: 'left' | 'center' | 'right'
  verticalAlignment?: 'top' | 'center' | 'bottom'
  /** Type of media: image, video, youtube or panels */
  mediaType: 'image' | 'video' | 'youtube' | 'panels'
  image?: string
  imageMobile?: string
  imageDesktop?: string
  /** Array of media for panels (for panels type) */
  imagePanels?: Array<{
    url: string
    type: 'image' | 'video'
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
    origWidth?: number
    origHeight?: number
    cropMobile?: R2ImageMetadata['crop']
    hotspotMobile?: R2ImageMetadata['hotspot']
    origWidthMobile?: number
    origHeightMobile?: number
    cropDesktop?: R2ImageMetadata['crop']
    hotspotDesktop?: R2ImageMetadata['hotspot']
    origWidthDesktop?: number
    origHeightDesktop?: number
  }>
  /** Size for panels: small, medium, large */
  panelSize?: 'small' | 'medium' | 'large'
  /** Fitting mode for panel images: cover, contain, natural */
  panelFit?: 'cover' | 'contain' | 'natural'
  /** Gap between panels: none, small, medium, large */
  panelGap?: 'none' | 'small' | 'medium' | 'large'
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  cropDesktop?: R2ImageMetadata['crop']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidthDesktop?: number
  origHeightDesktop?: number
  /** URL for video or YouTube (for video/youtube types) */
  url?: string
  urlMobile?: string
  urlDesktop?: string
  /** Title text */
  title?: LocalizedString
  /** Title font style */
  titleFont?: string
  /** Description text */
  description?: LocalizedString
  /** Content font style */
  contentFont?: string
  /** Link text */
  linkText?: LocalizedString
  /** Link URL */
  linkUrl?: string
  /** Position: left, right, center, or full */
  position: 'left' | 'right' | 'center' | 'full'
  /** Media Width: center or full */
  mediaWidth?: 'center' | 'full'
  /** Column Gap: horizontal space between left and right columns in pixels */
  columnGap?: number
  /** Text Position: above or below the media */
  textPosition?: 'above' | 'below'
  /** Title Position: above or below the media */
  titlePosition?: 'above' | 'below'
  /** Title Alignment: left, center, or right (independent of text) */
  titleAlignment?: 'left' | 'center' | 'right'
  /** Button Alignment when not on media: left, center, or right (independent of text) */
  buttonAlignment?: 'left' | 'center' | 'right'
  /** Button Position when not on media: below text, above text (after title), or top (before title) */
  buttonPosition?: 'below' | 'above' | 'top'
  /** Order for sorting blocks */
  order?: number
  /** Toggles button visibility over media */
  showButtonOnMedia?: boolean
  /** Position of the button on media */
  buttonPositionOnMedia?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  /** Offset/distance of button from media edges in pixels */
  buttonOffsetOnMedia?: number
  /** Bottom spacing in pixels */
  spacingBottom?: number
  /** Top padding in pixels */
  paddingTop?: number
  /** Bottom padding in pixels */
  paddingBottom?: number
  /** Button text color */
  buttonColor?: 'black' | 'white' | 'responsive' | 'responsive-reverse'
  /** Toggles button border visibility */
  showButtonBorder?: boolean
  /** Internal padding in pixels */
  padding?: number
  /** Border color (hex) */
  borderColor?: string
  /** Text displayed directly on top of image/media */
  overlayText?: LocalizedString
  /** Position of overlay text on media */
  overlayTextPosition?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  /** Size of overlay text on media */
  overlayTextSize?: 'small' | 'medium' | 'large' | 'xlarge'
  /** Font weight of overlay text on media */
  overlayTextWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold'
  /** Color of overlay text on media */
  overlayTextColor?: 'white' | 'black'
  /** Font family for overlay text on media */
  overlayTextFont?: string
}

/**
 * Represents a hotspot marker on an interactive product visual.
 */
export interface ProductHotspot {
  x: number
  y: number
  label?: LocalizedString
  product?: {
    id: string
    name: LocalizedString
    mainImage?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    price?: number
    currency?: string
    categoryName?: LocalizedString
    designerName?: LocalizedString
  }
}

/**
 * Represents a slide item in the interactive product showcase.
 */
export interface InteractiveShowcaseItem {
  title?: LocalizedString
  image: string
  imageMobile?: string
  crop?: R2ImageMetadata['crop']
  hotspot?: R2ImageMetadata['hotspot']
  origWidth?: number
  origHeight?: number
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  hotspots: ProductHotspot[]
}

/**
 * Defines the content structure for the Home page.
 */
export interface HomePageContent {
  /** An array of media items for the hero slider. */
  heroMedia: HeroMediaItem[]
  /** Toggles automatic slide transition for hero media. */
  heroAutoPlay?: boolean
  /** Duration in seconds for each slide in automatic transition. */
  heroAutoPlayInterval?: number
  /** Toggles the visibility of the hero text overlay. */
  isHeroTextVisible: boolean
  /** Dynamic fields for the quick action banner under Hero */
  quickBannerTitle?: LocalizedString
  quickBannerSubtitle?: LocalizedString
  quickBannerButtonText?: LocalizedString
  quickBannerLink?: string
  /** An array of product IDs to be featured on the homepage. */
  featuredProductIds: string[]
  /** The ID of the designer to be spotlighted on the homepage. */
  featuredDesignerId: string
  /** Content blocks displayed after hero section */
  contentBlocks?: ContentBlock[]
  /** Title for the interactive showcase section */
  interactiveShowcaseTitle?: LocalizedString
  /** Interactive product showcase items with hotspots */
  interactiveShowcase?: InteractiveShowcaseItem[]
  /** Content block index after which interactive showcase is rendered (0-indexed) */
  interactiveShowcaseBlockIndex?: number
}

/**
 * Defines the content structure for the About Us page.
 */
export interface AboutPageContent {
  heroImage:
    | string
    | {
        url: string
        palette?: SanityImagePalette
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
      }
  heroImageMobile?:
    | string
    | {
        url: string
        palette?: SanityImagePalette
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
      }
  heroBadge?: LocalizedString
  heroTitle: LocalizedString
  heroSubtitle: LocalizedString
  manifestoLabel?: LocalizedString
  manifestoQuote?: LocalizedString
  timelineTitle?: LocalizedString
  timelineSubtitle?: LocalizedString
  eras?: {
    year?: string
    title?: LocalizedString
    description?: LocalizedString
    image?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    imageMobile?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
  }[]
  storyTitle: LocalizedString
  storyContentP1: LocalizedString
  storyContentP2: LocalizedString
  storyImage: string
  valuesTitle: LocalizedString
  values: {title: LocalizedString; description: LocalizedString}[]
  historySection?: {
    title?: LocalizedString
    content?: LocalizedString
    image?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    imageMobile?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    media?: NewsMedia[]
  }
  identitySection?: {
    title?: LocalizedString
    content?: LocalizedString
    image?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    imageMobile?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    media?: NewsMedia[]
  }
  qualitySection?: {
    title?: LocalizedString
    content?: LocalizedString
    image?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    imageMobile?:
      | string
      | {url: string; crop?: R2ImageMetadata['crop']; hotspot?: R2ImageMetadata['hotspot']}
    media?: NewsMedia[]
  }
}

/**
 * Defines the content structure for the Factory page.
 */
export interface FactoryPageContent {
  title: LocalizedString
  content?: LocalizedString
  gallery?: NewsMedia[]
}

/**
 * Represents media for a contact location.
 */
export interface ContactLocationMedia {
  type: 'image' | 'video' | 'youtube'
  image?: {
    asset?: {
      _ref?: string
      _type?: string
      url?: string
    }
    _type?: string
  }
  videoFile?: {
    asset?: {
      _ref?: string
      _type?: string
      url?: string
    }
    _type?: string
  }
  url?: string
}

/**
 * Represents a physical location for the company (e.g., showroom, factory).
 */
export interface ContactLocation {
  type: LocalizedString
  title: LocalizedString
  address: string
  phone: string
  email?: string
  mapEmbedUrl?: string
  media?: ContactLocationMedia[]
  isMediaVisible?: boolean
}

/**
 * Defines the content structure for the Contact page.
 */
export interface ContactPageContent {
  title: LocalizedString
  subtitle: LocalizedString
  locations: ContactLocation[]
}

/**
 * Represents a single news article or blog post.
 */
export interface NewsItem {
  /** Unique identifier for the news item, typically used as a URL slug. */
  id: string
  /** Localized title of the news item. */
  title: LocalizedString
  /** Publication date of the news item. */
  date: string
  /** Localized main content/body of the news item. */
  content: LocalizedString
  /** URL for the main image used on the news list page card. */
  mainImage:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        cropMobile?: R2ImageMetadata['crop']
        hotspotMobile?: R2ImageMetadata['hotspot']
        origWidthMobile?: number
        origHeightMobile?: number
        cropDesktop?: R2ImageMetadata['crop']
        hotspotDesktop?: R2ImageMetadata['hotspot']
        origWidthDesktop?: number
        origHeightDesktop?: number
      }
  /** Array of media items (images, videos) within the article. */
  media: NewsMedia[]
  /** Whether this news item is published on the site. */
  isPublished?: boolean
  /** Optional scheduled publish date used for filtering/sorting. */
  publishAt?: string
  /** Optional manual sort order; smaller numbers appear first. */
  sortOrder?: number
  /** Sanity update timestamp. */
  _updatedAt?: string
  /** Optional category string or localized string (e.g. Press, Event, Award) */
  category?: LocalizedString
  /** Estimated reading time (e.g., '3 min read' or '3 dk okuma') */
  readTime?: string
  /** Whether this article is featured at the top of the news page */
  featured?: boolean
  /** Optional custom title/label for the featured spotlight badge (e.g. 'ÖNE ÇIKAN HİKAYE', 'EDİTÖRÜN SEÇİMİ') */
  featuredBadgeTitle?: LocalizedString
  /** Optional direct link to downloadable Press Kit asset (ZIP / PDF) */
  pressKitUrl?: string
  /** Optional related product slug/id */
  relatedProductId?: string
  /** Optional related designer slug/id */
  relatedDesignerId?: string
}

/**
 * Represents a media item within a news article.
 */
export interface NewsMedia {
  /** The type of media. */
  type: 'image' | 'video' | 'youtube'
  /** URL of the media asset. */
  url: string
  /** Art Direction: Mobil için URL (opsiyonel) */
  urlMobile?: string
  /** Art Direction: Desktop için URL (opsiyonel) */
  urlDesktop?: string
  /** Optional localized caption for the media. */
  caption?: LocalizedString
  /** Optional crop data from R2 asset */
  crop?: R2ImageMetadata['crop']
  /** Optional hotspot data from R2 asset */
  hotspot?: R2ImageMetadata['hotspot']
  /** Original Width */
  origWidth?: number
  /** Original Height */
  origHeight?: number
  cropMobile?: R2ImageMetadata['crop']
  hotspotMobile?: R2ImageMetadata['hotspot']
  origWidthMobile?: number
  origHeightMobile?: number
  cropDesktop?: R2ImageMetadata['crop']
  hotspotDesktop?: R2ImageMetadata['hotspot']
  origWidthDesktop?: number
  origHeightDesktop?: number
  isCover?: boolean
}

// --- Footer Content Models ---

/**
 * Represents a single link in the footer.
 */
export interface FooterLink {
  text: LocalizedString
  url: string
}

/**
 * Represents a column of links in the footer.
 */
export interface FooterLinkColumn {
  title: LocalizedString
  links: FooterLink[]
}

/**
 * Represents a social media link.
 */
export interface SocialLink {
  name: string
  url: string
  /** Raw SVG string for the icon. */
  svgIcon: string
  /** Toggles whether the link is displayed. */
  isEnabled: boolean
}

/**
 * Defines a footer partner.
 */
export interface FooterPartner {
  name: LocalizedString
  logo?: string
  url?: string
}

/**
 * Represents a legal link in the footer.
 */
export interface LegalLink {
  text: LocalizedString
  url: string
  isVisible: boolean
}

/**
 * Defines the content structure for the site footer.
 */
export interface FooterContent {
  copyrightText: LocalizedString
  partners?: FooterPartner[]
  partnerNames?: string[] // Legacy support
  linkColumns: FooterLinkColumn[]
  socialLinks: SocialLink[]
  legalLinks?: LegalLink[]
}

// Sanity Portable Text format (block content)
export type PortableTextBlock = unknown

export interface CookiesPolicy {
  title: LocalizedString
  content: {tr?: PortableTextBlock[]; en?: PortableTextBlock[]}
  updatedAt?: string
}

export interface PrivacyPolicy {
  title: LocalizedString
  content: {tr?: PortableTextBlock[]; en?: PortableTextBlock[]}
  updatedAt?: string
}

export interface TermsOfService {
  title: LocalizedString
  content: {tr?: PortableTextBlock[]; en?: PortableTextBlock[]}
  updatedAt?: string
}

export interface KvkkPolicy {
  title: LocalizedString
  content: {tr?: PortableTextBlock[]; en?: PortableTextBlock[]}
  updatedAt?: string
}

// --- Application-Specific Models ---

/**
 * Represents an item in the shopping cart.
 */
export interface CartItem {
  /** The full product object. */
  product: Product
  /** The quantity of the product in the cart. */
  quantity: number
}

export interface Project {
  id: string
  title: LocalizedString
  cover:
    | string
    | {
        url: string
        urlMobile?: string
        urlDesktop?: string
        palette?: SanityImagePalette
        crop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
      }
  date?: LocalizedString
  projectCategory?: LocalizedString
  excerpt?: LocalizedString
  media?: {
    type: 'image' | 'video' | 'youtube'
    url: string
    urlMobile?: string // Art Direction: Mobil için URL
    urlDesktop?: string // Art Direction: Desktop için URL
    image?: string
    isCover?: boolean
    isOriginal?: boolean
    crop?: R2ImageMetadata['crop']
    hotspot?: R2ImageMetadata['hotspot']
  }[]
  body?: LocalizedString
  /** Content blocks displayed on project detail page (same system as homepage) */
  contentBlocks?: ContentBlock[]
  /** Title for the interactive showcase section */
  interactiveShowcaseTitle?: LocalizedString
  /** Interactive product showcase items with hotspots */
  interactiveShowcase?: InteractiveShowcaseItem[]
  /** Whether this project is published on the site. */
  isPublished?: boolean
  /** Optional scheduled publish date used for filtering/sorting. */
  publishAt?: string
  /** Optional manual sort order; smaller numbers appear first. */
  sortOrder?: number
}
