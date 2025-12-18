import groq from 'groq'
import {sanityClient} from '../lib/sanityClient'

// Sanity image reference type
export type SanityImageReference = {
  _type?: string
  asset?: {
    _ref?: string
    _type?: string
  }
  [key: string]: unknown
}

export type ProductCard = {
  _id: string
  title?: string
  slug?: {current: string}
  images?: SanityImageReference[]
  price?: number
}

export async function fetchProducts(): Promise<ProductCard[]> {
  const query = groq`*[_type == "product"] | order(publishedAt desc){
    _id,
    title,
    slug,
    images,
    price
  }`
  return sanityClient.fetch(query)
}

export async function fetchProductBySlug(slug: string) {
  const query = groq`*[_type == "product" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    images,
    price,
    materials,
    description,
    designer->{_id, name, slug, photo},
    categories[]->{ _id, title, slug }
  }`
  return sanityClient.fetch(query, {slug})
}
