import groq from 'groq'
import {sanityClient} from '../lib/sanityClient'

export type ProductCard = {
  _id: string
  title?: string
  slug?: { current: string }
  images?: any[]
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
    dimensions,
    description,
    designer->{_id, name, slug, photo},
    categories[]->{ _id, title, slug }
  }`
  return sanityClient.fetch(query, {slug})
}


