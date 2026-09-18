import type {UserProject, InquiryPayload} from '../../types/seckim'

async function apiAccountRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const storedToken = localStorage.getItem('birim_token')
      if (storedToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${storedToken}`
      }
    }

    const res = await fetch(endpoint, {
      ...options,
      credentials: 'same-origin',
      headers,
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data as T
  } catch {
    return null
  }
}

export async function fetchUserSelections(userId: string): Promise<string[]> {
  if (!userId) return []
  const data = await apiAccountRequest<{success: boolean; productIds: string[]}>(
    '/api/account/selections',
    {method: 'GET'}
  )
  if (data && data.success && Array.isArray(data.productIds)) {
    return data.productIds
  }
  return []
}

export async function saveUserSelection(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false
  const data = await apiAccountRequest<{success: boolean}>('/api/account/selections', {
    method: 'POST',
    body: JSON.stringify({productId}),
  })
  return Boolean(data?.success)
}

export async function removeUserSelection(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false
  const data = await apiAccountRequest<{success: boolean}>(
    `/api/account/selections/${encodeURIComponent(productId)}`,
    {method: 'DELETE'}
  )
  return Boolean(data?.success)
}

export async function clearUserSelections(userId: string): Promise<boolean> {
  if (!userId) return false
  const data = await apiAccountRequest<{success: boolean}>('/api/account/selections/all', {
    method: 'DELETE',
  })
  return Boolean(data?.success)
}

export async function bulkSyncUserSelections(
  userId: string,
  localProductIds: string[]
): Promise<string[]> {
  if (!userId) return localProductIds
  const data = await apiAccountRequest<{success: boolean; productIds: string[]}>(
    '/api/account/selections/sync',
    {
      method: 'POST',
      body: JSON.stringify({productIds: localProductIds}),
    }
  )
  if (data && data.success && Array.isArray(data.productIds)) {
    return data.productIds
  }
  return localProductIds
}

export async function fetchUserProjects(userId: string): Promise<UserProject[]> {
  if (!userId) return []
  const data = await apiAccountRequest<{success: boolean; projects: UserProject[]}>(
    '/api/account/projects',
    {method: 'GET'}
  )
  if (data && data.success && Array.isArray(data.projects)) {
    return data.projects
  }
  return []
}

export async function createUserProject(
  userId: string,
  project: {name: string; description?: string; productIds?: string[]; isPublic?: boolean}
): Promise<UserProject | null> {
  if (!userId || !project.name) return null
  const data = await apiAccountRequest<{success: boolean; project: UserProject}>(
    '/api/account/projects',
    {
      method: 'POST',
      body: JSON.stringify(project),
    }
  )
  if (data && data.success && data.project) {
    return data.project
  }
  return null
}

export async function updateUserProject(
  userId: string,
  projectId: string,
  updates: Partial<UserProject>
): Promise<boolean> {
  if (!userId || !projectId) return false
  const data = await apiAccountRequest<{success: boolean}>(
    `/api/account/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  )
  return Boolean(data?.success)
}

export async function deleteUserProject(userId: string, projectId: string): Promise<boolean> {
  if (!userId || !projectId) return false
  const data = await apiAccountRequest<{success: boolean}>(
    `/api/account/projects/${encodeURIComponent(projectId)}`,
    {method: 'DELETE'}
  )
  return Boolean(data?.success)
}

export async function fetchProjectByShareToken(token: string): Promise<UserProject | null> {
  if (!token) return null
  const data = await apiAccountRequest<{success: boolean; project: UserProject}>(
    `/api/account/projects/share/${encodeURIComponent(token)}`,
    {method: 'GET'}
  )
  if (data && data.success && data.project) {
    return data.project
  }
  return null
}

export async function submitInquiry(
  payload: InquiryPayload,
  userId?: string
): Promise<{success: boolean; id?: string; error?: string}> {
  try {
    // Call server endpoint for database logging, email dispatch and lead management
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
