/**
 * Represents a string that can be localized into multiple languages.
 * Can also be a plain string for fields that are not translated.
 * e.g., { tr: 'Merhaba', en: 'Hello' } or 'A non-translated value'
 */
export type LocalizedString = { [key: string]: string; } | string;

// --- Core Site Configuration ---

/**
 * Defines global settings for the website.
 */
export interface SiteSettings {
  /** URL for the site logo. Can be a path or a data URI. */
  logoUrl: string;
  /** Text displayed in the header, often next to the logo. */
  headerText: string;
  /** Toggles the visibility of the header text. */
  isHeaderTextVisible: boolean;
  /** Toggles bottom Prev/Next navigation on product detail page. */
  showProductPrevNext?: boolean;
  /** Toggles the visibility of the cart button in the header. */
  showCartButton?: boolean;
}

// --- Core Data Models ---

/**
 * Represents a product category.
 */
export interface Category {
  /** Unique identifier for the category, typically used as a URL slug. */
  id: string;
  /** Localized name of the category. */
  name: LocalizedString;
  /** Localized subtitle or short description for the category page. */
  subtitle: LocalizedString;
  /** URL for the hero image displayed on the category page. */
  heroImage: string;
}

/**
 * Represents a furniture designer.
 */
export interface Designer {
  /** Unique identifier for the designer, typically used as a URL slug. */
  id: string;
  /** Localized name of the designer. */
  name: LocalizedString;
  /** Localized biography of the designer. */
  bio: LocalizedString;
  /** URL for the designer's portrait or representative image. */
  image: string;
}

/**
 * Represents a registered user/member.
 */
export type UserType = 'email_subscriber' | 'full_member';

export interface User {
  /** Unique identifier for the user (Sanity _id). */
  _id: string;
  /** User's email address (unique identifier). */
  email: string;
  /** User's full name. */
  name?: string;
  /** User's company name. */
  company?: string;
  /** User's profession. */
  profession?: string;
  /** Type of user: email subscriber or full member. */
  userType?: UserType;
  /** Whether the user account is active. */
  isActive: boolean;
  /** Registration date. */
  createdAt: string;
}

/**
 * Materials grouped by swatch book (kartela)
 */
export interface ProductMaterialsBook {
  bookTitle: LocalizedString;
  materials: ProductMaterial[];
}

/**
 * Grouped materials by a material group
 */
export interface ProductMaterialsGroup {
  groupTitle: LocalizedString;
  books: ProductMaterialsBook[];
  materials: ProductMaterial[]; // All materials in the group (for backward compatibility)
}

/**
 * Represents a single product.
 */
export interface Product {
  /** Unique identifier for the product, typically used as a URL slug. */
  id: string;
  /** Localized name of the product. */
  name: LocalizedString;
  /** ID of the designer who created the product. */
  designerId: string;
  /** ID of the category this product belongs to. */
  categoryId: string;
  /** The year the product was designed or released. */
  year: number;
  /** Localized detailed description of the product. */
  description: LocalizedString;
  /** URL for the main display image of the product. */
  mainImage: string;
  /** Array of URLs for alternative product images. */
  alternativeImages: string[]; // legacy
  /** Mixed alternative media for the band under hero. */
  alternativeMedia?: { type: 'image' | 'video' | 'youtube'; url: string }[];
  /** Optional rich media for hero: image/video/youtube */
  media?: { type: 'image' | 'video' | 'youtube'; url: string; title?: LocalizedString }[];
  /** Custom title for the bottom media section */
  mediaSectionTitle?: LocalizedString;
  /** Toggle for showing media panels at bottom. */
  showMediaPanels?: boolean;
  /** Dimension drawings/images shown before materials. Each has an image and a title. */
  dimensionImages?: { image: string; title?: LocalizedString }[];
  /** Indicates if the product can be purchased directly. */
  buyable: boolean;
  /** Price of the product. */
  price: number;
  /** Currency code (e.g., 'TRY', 'USD'). */
  currency: string;
  /** Stock keeping unit code. */
  sku?: string;
  /** Stock status for purchase flow. */
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder';
  /** Optional product variants. */
  variants?: ProductVariant[];
  /** Array of available materials for the product. */
  materials: ProductMaterial[];
  /** Materials grouped by material group (for UI). */
  groupedMaterials?: ProductMaterialsGroup[];
  /** Content accessible only to logged-in users. */
  exclusiveContent: ExclusiveContent;
}

// --- Product Sub-types ---


/**
 * Represents a material option for a product.
 */
export interface ProductMaterial {
  /** Localized name of the material (e.g., 'Leather', 'Fabric'). */
  name: LocalizedString;
  /** URL for an image swatch or sample of the material. */
  image: string;
}

export interface ProductVariant {
  /** Localized variant name (e.g., Color/Size set). */
  name: LocalizedString;
  /** Variant SKU if distinct. */
  sku?: string;
  /** Variant-specific price override. */
  price?: number;
  /** Variant images. */
  images: string[];
}

/**
 * Defines the structure for exclusive, members-only product content.
 */
export interface ExclusiveContent {
  /** Array of URLs for exclusive images. */
  images: string[];
  /** Array of downloadable technical drawings. */
  drawings: { name: LocalizedString; url: string }[];
  /** Array of downloadable 3D models. */
  models3d: { name: LocalizedString; url: string }[];
}


// --- Page-Specific Content Models ---

/**
 * Represents a single media item in the homepage hero slider.
 */
export interface HeroMediaItem {
    /** The type of media to display. */
    type: 'image' | 'video' | 'youtube';
    /** URL for the image, video file, or YouTube link. */
    url: string;
    /** Localized title text displayed over the media. */
    title: LocalizedString;
    /** Localized subtitle text displayed over the media. */
    subtitle: LocalizedString;
    /** Toggles visibility of the call-to-action button. */
    isButtonVisible: boolean;
    /** Localized text for the call-to-action button. */
    buttonText: LocalizedString;
    /** Link for the call-to-action button. */
    buttonLink: string;
}

/**
 * Defines a content block that can be displayed on the homepage.
 */
export interface ContentBlock {
    /** Type of media: image, video, or youtube */
    mediaType: 'image' | 'video' | 'youtube';
    /** Image asset (for image type) */
    image?: string;
    /** URL for video or YouTube (for video/youtube types) */
    url?: string;
    /** Description text */
    description?: LocalizedString;
    /** Link text */
    linkText?: LocalizedString;
    /** Link URL */
    linkUrl?: string;
    /** Position: left, right, center, or full */
    position: 'left' | 'right' | 'center' | 'full';
    /** Order for sorting blocks */
    order?: number;
}

/**
 * Defines the content structure for the Home page.
 */
export interface HomePageContent {
    /** An array of media items for the hero slider. */
    heroMedia: HeroMediaItem[];
    /** Toggles the visibility of the hero text overlay. */
    isHeroTextVisible: boolean;
    /** Toggles the visibility of the logo in the hero section. */
    isLogoVisible: boolean;
    /** An array of product IDs to be featured on the homepage. */
    featuredProductIds: string[];
    /** The ID of the designer to be spotlighted on the homepage. */
    featuredDesignerId: string;
    /** Content blocks displayed after hero section */
    contentBlocks?: ContentBlock[];
    /** Content for the 'Inspiration' section. */
    inspirationSection: {
        backgroundImage: string;
        title: LocalizedString;
        subtitle: LocalizedString;
        buttonText: LocalizedString;
        buttonLink: string;
    };
}

/**
 * Defines the content structure for the About Us page.
 */
export interface AboutPageContent {
    heroImage: string;
    heroTitle: LocalizedString;
    heroSubtitle: LocalizedString;
    storyTitle: LocalizedString;
    storyContentP1: LocalizedString;
    storyContentP2: LocalizedString;
    storyImage: string;
    isQuoteVisible: boolean;
    quoteText: LocalizedString;
    quoteAuthor: string;
    valuesTitle: LocalizedString;
    values: { title: LocalizedString; description: LocalizedString }[];
}

/**
 * Represents a physical location for the company (e.g., showroom, factory).
 */
export interface ContactLocation {
    type: LocalizedString;
    title: LocalizedString;
    address: string;
    phone: string;
    email?: string;
    mapEmbedUrl?: string;
}

/**
 * Defines the content structure for the Contact page.
 */
export interface ContactPageContent {
    title: LocalizedString;
    subtitle: LocalizedString;
    locations: ContactLocation[];
}

/**
 * Represents a single news article or blog post.
 */
export interface NewsItem {
    /** Unique identifier for the news item, typically used as a URL slug. */
    id: string;
    /** Localized title of the news item. */
    title: LocalizedString;
    /** Publication date of the news item. */
    date: string;
    /** Localized main content/body of the news item. */
    content: LocalizedString;
    /** URL for the main image used on the news list page card. */
    mainImage: string;
    /** Array of media items (images, videos) within the article. */
    media: NewsMedia[];
}

/**
 * Represents a media item within a news article.
 */
export interface NewsMedia {
    /** The type of media. */
    type: 'image' | 'video' | 'youtube';
    /** URL of the media asset. */
    url: string;
    /** Optional localized caption for the media. */
    caption?: LocalizedString;
}

// --- Footer Content Models ---

/**
 * Represents a single link in the footer.
 */
export interface FooterLink {
    text: LocalizedString;
    url: string;
}

/**
 * Represents a column of links in the footer.
 */
export interface FooterLinkColumn {
    title: LocalizedString;
    links: FooterLink[];
}

/**
 * Represents a social media link.
 */
export interface SocialLink {
    name: string;
    url: string;
    /** Raw SVG string for the icon. */
    svgIcon: string;
    /** Toggles whether the link is displayed. */
    isEnabled: boolean;
}

/**
 * Defines a footer partner.
 */
export interface FooterPartner {
    name: LocalizedString;
    logo?: string;
    url?: string;
}

/**
 * Represents a legal link in the footer.
 */
export interface LegalLink {
    text: LocalizedString;
    url: string;
    isVisible: boolean;
}

/**
 * Defines the content structure for the site footer.
 */
export interface FooterContent {
    copyrightText: LocalizedString;
    partners?: FooterPartner[];
    partnerNames?: string[]; // Legacy support
    linkColumns: FooterLinkColumn[];
    socialLinks: SocialLink[];
    legalLinks?: LegalLink[];
}

// --- Application-Specific Models ---

/**
 * Represents an item in the shopping cart.
 */
export interface CartItem {
  /** The full product object. */
  product: Product;
  /** The quantity of the product in the cart. */
  quantity: number;
}

export interface Project {
  id: string;
  title: LocalizedString;
  cover: string;
  date?: LocalizedString;
  excerpt?: LocalizedString;
  media?: { type: 'image' | 'video' | 'youtube'; url: string; image?: string }[];
  body?: LocalizedString;
}
