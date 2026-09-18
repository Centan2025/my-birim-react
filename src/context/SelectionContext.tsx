/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  PropsWithChildren,
} from 'react'
import type {UserProject} from '../types/seckim'
import {useAuth} from './AuthContext'
import {useSiteSettings} from './SiteSettingsContext'
import {analytics} from '../lib/analytics'
import {
  saveUserSelection,
  removeUserSelection,
  clearUserSelections,
  fetchUserSelections,
  bulkSyncUserSelections,
  fetchUserProjects,
  createUserProject,
  updateUserProject,
  deleteUserProject,
} from '../services/supabase/seckim'

const STORAGE_KEYS = {
  SELECTIONS: 'birim_seckim_items',
  PROJECTS: 'birim_seckim_projects',
}

export interface SelectionNotification {
  visible: boolean
  message: string
  actionLabel?: string
  onAction?: () => void
}

export interface SelectionContextType {
  selectedProductIds: string[]
  selectionCount: number
  projects: UserProject[]
  isDrawerOpen: boolean
  notification: SelectionNotification | null
  isSelectionEnabled: boolean
  isInSelection: (productId: string) => boolean
  addToSelection: (productId: string, productName?: string) => void
  removeFromSelection: (productId: string) => void
  toggleSelection: (productId: string, productName?: string) => void
  clearSelection: () => Promise<boolean>
  createProject: (
    name: string,
    description?: string,
    initialProductIds?: string[]
  ) => Promise<UserProject | null>
  updateProject: (projectId: string, updates: Partial<UserProject>) => Promise<boolean>
  deleteProject: (projectId: string) => Promise<boolean>
  addProductToProject: (projectId: string, productId: string) => Promise<boolean>
  removeProductFromProject: (projectId: string, productId: string) => Promise<boolean>
  isProductInProject: (projectId: string, productId: string) => boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  dismissNotification: () => void
}

const SelectionContext = createContext<SelectionContextType | null>(null)

export const useSelection = () => {
  const context = useContext(SelectionContext)
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider')
  }
  return context
}

export const SelectionProvider = ({children}: PropsWithChildren) => {
  const {user, isLoggedIn} = useAuth()
  const {settings} = useSiteSettings()
  const isSelectionEnabled = settings?.enableSelections !== false

  const isInitialSelectionsMount = useRef(true)
  const isInitialProjectsMount = useRef(true)
  const prevUserIdRef = useRef<string | null>(null)
  const isSyncingRef = useRef(false)

  // 1. Initial load from LocalStorage synchronously via lazy state initialization
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEYS.SELECTIONS)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            return parsed
          }
        }
      }
    } catch (err) {
      console.warn('Error reading selections from storage:', err)
    }
    return []
  })

  const [projects, setProjects] = useState<UserProject[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS)
        if (storedProjects) {
          const parsed = JSON.parse(storedProjects)
          if (Array.isArray(parsed)) {
            return parsed
          }
        }
      }
    } catch (err) {
      console.warn('Error reading projects from storage:', err)
    }
    return []
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [notification, setNotification] = useState<SelectionNotification | null>(null)

  // 2. Persist to LocalStorage whenever state changes (guarded against mount race conditions)
  useEffect(() => {
    if (isInitialSelectionsMount.current) {
      isInitialSelectionsMount.current = false
      return
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.SELECTIONS, JSON.stringify(selectedProductIds))
      }
    } catch {
      // ignore
    }
  }, [selectedProductIds])

  useEffect(() => {
    if (isInitialProjectsMount.current) {
      isInitialProjectsMount.current = false
      return
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      }
    } catch {
      // ignore
    }
  }, [projects])

  // 3. User Login Migration & Sync with Server
  const syncUserData = useCallback(
    async (isTransition = false) => {
      if (!isLoggedIn || !user?._id || isSyncingRef.current) return
      isSyncingRef.current = true
      const userId = user._id

      try {
        if (isTransition) {
          // Guest transition: merge local guest items to server once
          const localItems = selectedProductIds
          if (localItems.length > 0) {
            const mergedIds = await bulkSyncUserSelections(userId, localItems)
            if (Array.isArray(mergedIds)) {
              setSelectedProductIds(mergedIds)
            }
          } else {
            const serverIds = await fetchUserSelections(userId)
            if (Array.isArray(serverIds)) {
              setSelectedProductIds(serverIds)
            }
          }

          // Migrate any guest local projects to server
          const localProjects = projects.filter(p => p.id.startsWith('local_'))
          for (const lp of localProjects) {
            try {
              await createUserProject(userId, {
                name: lp.name,
                description: lp.description,
                productIds: lp.productIds,
                isPublic: lp.isPublic,
              })
            } catch {
              // ignore
            }
          }
        } else {
          // Authoritative load from server (page refresh / multi-device sync)
          const serverIds = await fetchUserSelections(userId)
          if (Array.isArray(serverIds)) {
            setSelectedProductIds(serverIds)
          }
        }

        // Fetch authoritative user projects from server
        const serverProjects = await fetchUserProjects(userId)
        if (serverProjects) {
          setProjects(serverProjects)
        }
      } catch (err) {
        console.warn('Seçkim sync notice:', err)
      } finally {
        isSyncingRef.current = false
        prevUserIdRef.current = userId
      }
    },
    [isLoggedIn, user?._id, selectedProductIds, projects]
  )

  useEffect(() => {
    if (!isLoggedIn || !user?._id) {
      prevUserIdRef.current = null
      return
    }

    const isTransition =
      prevUserIdRef.current === null &&
      typeof window !== 'undefined' &&
      !sessionStorage.getItem(`birim_synced_${user._id}`)

    if (isTransition && typeof window !== 'undefined') {
      sessionStorage.setItem(`birim_synced_${user._id}`, '1')
    }

    syncUserData(isTransition)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?._id])

  // Sync on tab focus / visibility
  useEffect(() => {
    if (!isLoggedIn || !user?._id) return

    const handleFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncUserData(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [isLoggedIn, user?._id, syncUserData])

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), [])

  const dismissNotification = useCallback(() => setNotification(null), [])

  const triggerToast = useCallback(
    (message: string = 'added_to_selections', actionLabel = 'seckim') => {
      setNotification({
        visible: true,
        message,
        actionLabel,
        onAction: () => {
          setIsDrawerOpen(true)
          setNotification(null)
        },
      })
    },
    []
  )

  const isInSelection = useCallback(
    (productId: string) => selectedProductIds.includes(productId),
    [selectedProductIds]
  )

  const addToSelection = useCallback(
    (productId: string, productName?: string) => {
      setSelectedProductIds(prev => {
        if (prev.includes(productId)) return prev
        const updated = [...prev, productId]

        analytics.event({
          category: 'seckim',
          action: 'product_added_to_selection',
          label: productName || productId,
        })

        return updated
      })

      triggerToast('added_to_selections', 'seckim')

      if (isLoggedIn && user?._id) {
        saveUserSelection(user._id, productId).catch(() => {})
      }
    },
    [isLoggedIn, user?._id, triggerToast]
  )

  const removeFromSelection = useCallback(
    (productId: string) => {
      setSelectedProductIds(prev => {
        const updated = prev.filter(id => id !== productId)
        analytics.event({
          category: 'seckim',
          action: 'product_removed_from_selection',
          label: productId,
        })
        return updated
      })

      if (isLoggedIn && user?._id) {
        removeUserSelection(user._id, productId).catch(() => {})
      }
    },
    [isLoggedIn, user?._id]
  )

  const toggleSelection = useCallback(
    (productId: string, productName?: string) => {
      if (selectedProductIds.includes(productId)) {
        removeFromSelection(productId)
      } else {
        addToSelection(productId, productName)
      }
    },
    [selectedProductIds, removeFromSelection, addToSelection]
  )

  const clearSelection = useCallback(async (): Promise<boolean> => {
    isSyncingRef.current = true
    const currentIds = [...selectedProductIds]
    setSelectedProductIds([])
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.SELECTIONS, JSON.stringify([]))
      }
    } catch {
      // ignore
    }

    analytics.event({
      category: 'seckim',
      action: 'selection_cleared',
    })

    let isSuccess = true
    if (isLoggedIn && user?._id) {
      try {
        isSuccess = await clearUserSelections(user._id)
      } catch (err) {
        console.warn('clearUserSelections error:', err)
        isSuccess = false
      }

      // Parallel item removal guarantee to completely wipe database
      if (currentIds.length > 0) {
        try {
          await Promise.allSettled(currentIds.map(pid => removeUserSelection(user._id, pid)))
        } catch {
          // ignore
        }
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false
    }, 600)

    return isSuccess
  }, [isLoggedIn, user?._id, selectedProductIds])

  const createProject = useCallback(
    async (
      name: string,
      description = '',
      initialProductIds: string[] = []
    ): Promise<UserProject | null> => {
      const trimmedName = name.trim()
      if (!trimmedName) return null

      analytics.event({
        category: 'seckim',
        action: 'project_created',
        label: trimmedName,
      })

      if (isLoggedIn && user?._id) {
        const serverProject = await createUserProject(user._id, {
          name: trimmedName,
          description,
          productIds: initialProductIds,
        })
        if (serverProject) {
          setProjects(prev => [serverProject, ...prev])
          return serverProject
        }
      }

      // Guest / Local Project creation
      const localProject: UserProject = {
        id: 'local_prj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: trimmedName,
        description,
        shareToken: 'share_' + Math.random().toString(36).substring(2, 10),
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productIds: initialProductIds,
      }

      setProjects(prev => [localProject, ...prev])
      return localProject
    },
    [isLoggedIn, user?._id]
  )

  const updateProject = useCallback(
    async (projectId: string, updates: Partial<UserProject>): Promise<boolean> => {
      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        })
      )

      if (isLoggedIn && user?._id && !projectId.startsWith('local_')) {
        return await updateUserProject(user._id, projectId, updates)
      }
      return true
    },
    [isLoggedIn, user?._id]
  )

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setProjects(prev => prev.filter(p => p.id !== projectId))

      analytics.event({
        category: 'seckim',
        action: 'project_deleted',
        label: projectId,
      })

      if (isLoggedIn && user?._id && !projectId.startsWith('local_')) {
        return await deleteUserProject(user._id, projectId)
      }
      return true
    },
    [isLoggedIn, user?._id]
  )

  const addProductToProject = useCallback(
    async (projectId: string, productId: string): Promise<boolean> => {
      let isSuccess = false

      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p
          if (p.productIds.includes(productId)) return p
          isSuccess = true
          const updatedProductIds = [...p.productIds, productId]

          analytics.event({
            category: 'seckim',
            action: 'product_added_to_project',
            label: `${p.name} - ${productId}`,
          })

          if (isLoggedIn && user?._id && !projectId.startsWith('local_')) {
            updateUserProject(user._id, projectId, {productIds: updatedProductIds}).catch(() => {})
          }

          return {
            ...p,
            productIds: updatedProductIds,
            updatedAt: new Date().toISOString(),
          }
        })
      )

      return isSuccess
    },
    [isLoggedIn, user?._id]
  )

  const removeProductFromProject = useCallback(
    async (projectId: string, productId: string): Promise<boolean> => {
      setProjects(prev =>
        prev.map(p => {
          if (p.id !== projectId) return p
          const updatedProductIds = p.productIds.filter(id => id !== productId)

          analytics.event({
            category: 'seckim',
            action: 'product_removed_from_project',
            label: `${p.name} - ${productId}`,
          })

          if (isLoggedIn && user?._id && !projectId.startsWith('local_')) {
            updateUserProject(user._id, projectId, {productIds: updatedProductIds}).catch(() => {})
          }

          return {
            ...p,
            productIds: updatedProductIds,
            updatedAt: new Date().toISOString(),
          }
        })
      )

      return true
    },
    [isLoggedIn, user?._id]
  )

  const isProductInProject = useCallback(
    (projectId: string, productId: string) => {
      const project = projects.find(p => p.id === projectId)
      return project ? project.productIds.includes(productId) : false
    },
    [projects]
  )

  const value = useMemo<SelectionContextType>(
    () => ({
      selectedProductIds,
      selectionCount: selectedProductIds.length,
      projects,
      isDrawerOpen,
      notification,
      isSelectionEnabled,
      isInSelection,
      addToSelection,
      removeFromSelection,
      toggleSelection,
      clearSelection,
      createProject,
      updateProject,
      deleteProject,
      addProductToProject,
      removeProductFromProject,
      isProductInProject,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      dismissNotification,
    }),
    [
      selectedProductIds,
      projects,
      isDrawerOpen,
      notification,
      isSelectionEnabled,
      isInSelection,
      addToSelection,
      removeFromSelection,
      toggleSelection,
      clearSelection,
      createProject,
      updateProject,
      deleteProject,
      addProductToProject,
      removeProductFromProject,
      isProductInProject,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      dismissNotification,
    ]
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}
