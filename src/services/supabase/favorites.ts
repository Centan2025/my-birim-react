import {supabase, isSupabaseConfigured} from '../../lib/supabaseClient'

export interface FavoriteItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) return []
  try {
    const {data, error} = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId)

    if (error) {
      console.error('[Favorites] Hata:', error)
      return []
    }
    return (data || []).map((item: {product_id: string}) => item.product_id)
  } catch (err) {
    console.error('[Favorites] İstek hatası:', err)
    return []
  }
}

export async function addFavorite(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !productId) return false
  try {
    const {error} = await supabase
      .from('favorites')
      .insert({user_id: userId, product_id: productId})

    if (error && error.code !== '23505') {
      // 23505: unique_violation (already exists)
      console.error('[Favorites] Ekleme hatası:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[Favorites] Ekleme hatası:', err)
    return false
  }
}

export async function removeFavorite(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !productId) return false
  try {
    const {error} = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) {
      console.error('[Favorites] Silme hatası:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[Favorites] Silme hatası:', err)
    return false
  }
}
