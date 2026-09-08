import {supabase, isSupabaseConfigured} from '../../lib/supabaseClient'
import type {UserProject, InquiryPayload} from '../../types/seckim'

export async function fetchUserSelections(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) return []
  try {
    const {data, error} = await supabase
      .from('user_selections')
      .select('product_id')
      .eq('user_id', userId)

    if (error) {
      // If table does not exist or permission denied, fail gracefully
      return []
    }
    return (data || []).map((item: {product_id: string}) => item.product_id)
  } catch {
    return []
  }
}

export async function saveUserSelection(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !productId) return false
  try {
    const {error} = await supabase
      .from('user_selections')
      .insert({user_id: userId, product_id: productId})

    if (error && error.code !== '23505') {
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function removeUserSelection(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId || !productId) return false
  try {
    const {error} = await supabase
      .from('user_selections')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    return !error
  } catch {
    return false
  }
}

export async function bulkSyncUserSelections(
  userId: string,
  localProductIds: string[]
): Promise<string[]> {
  if (!isSupabaseConfigured || !userId) return localProductIds
  try {
    const serverProductIds = await fetchUserSelections(userId)
    const combinedSet = new Set([...serverProductIds, ...localProductIds])
    const newItems = Array.from(combinedSet).filter(id => !serverProductIds.includes(id))

    if (newItems.length > 0) {
      await supabase
        .from('user_selections')
        .insert(newItems.map(productId => ({user_id: userId, product_id: productId})))
    }

    return Array.from(combinedSet)
  } catch {
    return localProductIds
  }
}

export async function fetchUserProjects(userId: string): Promise<UserProject[]> {
  if (!isSupabaseConfigured || !userId) return []
  try {
    const {data: projectsData, error: pErr} = await supabase
      .from('projects')
      .select('id, user_id, name, description, share_token, is_public, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', {ascending: false})

    if (pErr || !projectsData) return []

    const projectIds = projectsData.map((p: {id: string}) => p.id)
    if (projectIds.length === 0) return []

    const {data: prodData, error: prodErr} = await supabase
      .from('project_products')
      .select('project_id, product_id')
      .in('project_id', projectIds)

    const map = new Map<string, string[]>()
    if (!prodErr && prodData) {
      for (const row of prodData as {project_id: string; product_id: string}[]) {
        const list = map.get(row.project_id) || []
        list.push(row.product_id)
        map.set(row.project_id, list)
      }
    }

    return (
      projectsData as Array<{
        id: string
        user_id: string
        name: string
        description?: string | null
        share_token?: string
        is_public?: boolean | number
        created_at: string
        updated_at: string
      }>
    ).map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      description: p.description || '',
      shareToken: p.share_token,
      isPublic: Boolean(p.is_public),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      productIds: map.get(p.id) || [],
    }))
  } catch {
    return []
  }
}

export async function createUserProject(
  userId: string,
  project: {name: string; description?: string; productIds?: string[]; isPublic?: boolean}
): Promise<UserProject | null> {
  if (!isSupabaseConfigured || !userId) return null
  try {
    const shareToken =
      'prj_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    const {data, error} = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: project.name,
        description: project.description || '',
        is_public: project.isPublic ?? false,
        share_token: shareToken,
      })
      .select()
      .single()

    if (error || !data) return null

    if (project.productIds && project.productIds.length > 0) {
      await supabase.from('project_products').insert(
        project.productIds.map(pid => ({
          project_id: data.id,
          product_id: pid,
        }))
      )
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      shareToken: data.share_token,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      productIds: project.productIds || [],
    }
  } catch {
    return null
  }
}

export async function updateUserProject(
  userId: string,
  projectId: string,
  updates: Partial<UserProject>
): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false
  try {
    const fieldsToUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (updates.name !== undefined) fieldsToUpdate['name'] = updates.name
    if (updates.description !== undefined) fieldsToUpdate['description'] = updates.description
    if (updates.isPublic !== undefined) fieldsToUpdate['is_public'] = updates.isPublic
    if (updates.shareToken !== undefined) fieldsToUpdate['share_token'] = updates.shareToken

    const {error} = await supabase
      .from('projects')
      .update(fieldsToUpdate)
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) return false

    if (updates.productIds) {
      await supabase.from('project_products').delete().eq('project_id', projectId)
      if (updates.productIds.length > 0) {
        await supabase.from('project_products').insert(
          updates.productIds.map(pid => ({
            project_id: projectId,
            product_id: pid,
          }))
        )
      }
    }

    return true
  } catch {
    return false
  }
}

export async function deleteUserProject(userId: string, projectId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false
  try {
    const {error} = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    return !error
  } catch {
    return false
  }
}

export async function fetchProjectByShareToken(token: string): Promise<UserProject | null> {
  if (!isSupabaseConfigured || !token) return null
  try {
    const {data: project, error: pErr} = await supabase
      .from('projects')
      .select('id, name, description, share_token, is_public, created_at, updated_at')
      .eq('share_token', token)
      .single()

    if (pErr || !project) return null

    const {data: prodData} = await supabase
      .from('project_products')
      .select('product_id')
      .eq('project_id', project.id)

    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      shareToken: project.share_token,
      isPublic: project.is_public,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      productIds: (prodData || []).map((r: {product_id: string}) => r.product_id),
    }
  } catch {
    return null
  }
}

export async function submitInquiry(
  payload: InquiryPayload,
  userId?: string
): Promise<{success: boolean; id?: string; error?: string}> {
  try {
    if (isSupabaseConfigured) {
      await supabase.from('inquiries').insert({
        user_id: userId || null,
        name: payload.name,
        company: payload.company || '',
        email: payload.email,
        phone: payload.phone || '',
        project_name: payload.projectName || '',
        message: payload.message || '',
        selected_products: payload.selectedProducts,
        status: 'new',
      })
    }

    // Call server endpoint for email dispatch and lead logging
    const response = await fetch('/api/inquiry', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...payload, userId}),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn('API inquiry notification warning:', errorData)
    }

    return {success: true}
  } catch (err: unknown) {
    console.error('submitInquiry error:', err)
    return {success: true} // still successful locally
  }
}
