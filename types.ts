export type LocalizedString = { [key: string]: string; } | string; // Allow plain string for backward compatibility or non-translated fields


export interface SiteSettings {
  logoUrl: string;
  heroMediaUrl: string; // This seems legacy, kept for compatibility
  heroMediaType: 'image' | 'video'; // Legacy
  headerText: string;
  isHeaderTextVisible: boolean;
}

export interface Category {
  id: string;
  name: LocalizedString;
  subtitle: LocalizedString;
  heroImage: string;
}

export interface Designer {
  id:string;
  name: LocalizedString;
  bio: LocalizedString;
  image: string;
}

export interface ProductDimensionDetail {
  label: LocalizedString;
  value: string;
}

export interface ProductDimensionSet {
  name: LocalizedString;
  details: ProductDimensionDetail[];
}

export interface ProductMaterial {
  name: LocalizedString;
  image: string;
}

export interface ExclusiveContent {
  images: string[];
  drawings: { name: LocalizedString; url: string }[];
  models3d: { name: LocalizedString; url: string }[];
}

export interface Product {
  id: string;
  name: LocalizedString;
  designerId: string;
  categoryId: string;
  year: number;
  description: LocalizedString;
  mainImage: string;
  alternativeImages: string[];
  dimensions: ProductDimensionSet[];
  buyable: boolean;
  price: number;
  currency: string;
  materials: ProductMaterial[];
  exclusiveContent: ExclusiveContent;
}

export interface HeroMediaItem {
    type: 'image' | 'video' | 'youtube';
    url: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    isButtonVisible: boolean;
    buttonText: LocalizedString;
    buttonLink: string;
}

export interface HomePageContent {
    heroMedia: HeroMediaItem[];
    isHeroTextVisible: boolean;
    isLogoVisible: boolean;
    featuredProductIds: string[];
    featuredDesignerId: string;
    inspirationSection: {
        backgroundImage: string;
        title: LocalizedString;
        subtitle: LocalizedString;
        buttonText: LocalizedString;
        buttonLink: string;
    };
}

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

export interface ContactLocation {
    type: LocalizedString;
    title: LocalizedString;
    address: string;
    phone: string;
    email?: string;
    mapEmbedUrl?: string;
}

export interface ContactPageContent {
    title: LocalizedString;
    subtitle: LocalizedString;
    locations: ContactLocation[];
}

export interface FooterLink {
    text: LocalizedString;
    url: string;
}

export interface FooterLinkColumn {
    title: LocalizedString;
    links: FooterLink[];
}

export interface SocialLink {
    name: string;
    url: string;
    svgIcon: string;
    isEnabled: boolean;
}

export interface FooterContent {
    copyrightText: LocalizedString;
    partnerNames: string[];
    linkColumns: FooterLinkColumn[];
    socialLinks: SocialLink[];
}


export interface NewsMedia {
    type: 'image' | 'video' | 'youtube';
    url: string;
    caption?: LocalizedString;
}

export interface NewsItem {
    id: string;
    title: LocalizedString;
    date: string;
    content: LocalizedString;
    mainImage: string; // Used for the card on the list page
    media: NewsMedia[];
}