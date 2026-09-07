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
  clearSelection: () => void
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

  // 3. User Login Migration & Sync
  useEffect(() => {
    if (!isLoggedIn || !user?._id) return

    let isMounted = true
    const userId = user._id

    async function syncUserData() {
      try {
        // Merge guest selections with server selections
        const mergedIds = await bulkSyncUserSelections(userId, selectedProductIds)
        if (isMounted && mergedIds && mergedIds.length > 0) {
          setSelectedProductIds(prev => {
            const set = new Set([...prev, ...mergedIds])
            return Array.from(set)
          })
        }

        // Fetch user projects from server
        const serverProjects = await fetchUserProjects(userId)
        if (isMounted) {
          if (serverProjects && serverProjects.length > 0) {
            setProjects(prevLocal => {
              const existingIds = new Set(serverProjects.map(p => p.id))
              const unmigrated = prevLocal.filter(p => !existingIds.has(p.id))
              return [...serverProjects, ...unmigrated]
            })
          }
        }
      } catch (err) {
        console.warn('Seçkim sync notice:', err)
      }
    }

    syncUserData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?._id])

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), [])

  const dismissNotification = useCallback(() => setNotification(null), [])

  const triggerToast = useCallback((message: string, actionLabel = 'Seçkimi Gör') => {
    setNotification({
      visible: true,
      message,
      actionLabel,
      onAction: () => {
        setIsDrawerOpen(true)
        setNotification(null)
      },
    })
  }, [])

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

      triggerToast('Ürün seçkinize eklendi.')

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

  const clearSelection = useCallback(() => {
    setSelectedProductIds([])
    analytics.event({
      category: 'seckim',
      action: 'selection_cleared',
    })
  }, [])

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
