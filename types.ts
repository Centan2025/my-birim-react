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
  alternativeImages: string[];
  /** Array of available dimension sets for the product (e.g., '2-seater', '3-seater'). */
  dimensions: ProductDimensionSet[];
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
  /** Content accessible only to logged-in users. */
  exclusiveContent: ExclusiveContent;
}

// --- Product Sub-types ---

/**
 * A specific detail of a product's dimensions (e.g., 'Width', 'Height').
 */
export interface ProductDimensionDetail {
  /** Localized label for the dimension (e.g., { tr: 'Genişlik', en: 'Width' }). */
  label: LocalizedString;
  /** Value of the dimension (e.g., '240cm'). */
  value: string;
}

/**
 * A set of dimensions for a product variant (e.g., 'Standard', 'Large').
 */
export interface ProductDimensionSet {
  /** Localized name of the dimension set. */
  name: LocalizedString;
  /** Array of specific dimension details for this set. */
  details: ProductDimensionDetail[];
}

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
 * Defines the content structure for the site footer.
 */
export interface FooterContent {
    copyrightText: LocalizedString;
    partnerNames: string[];
    linkColumns: FooterLinkColumn[];
    socialLinks: SocialLink[];
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
