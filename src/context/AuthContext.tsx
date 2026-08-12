/* eslint-disable react-refresh/only-export-components */
import {useState, useContext, createContext, PropsWithChildren, useEffect} from 'react'
import type {User} from '../types'
import {errorReporter} from '../lib/errorReporting'
import {analytics} from '../lib/analytics'
import {getCurrentSessionUser} from '../services/cms'

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({children}: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)

  // Verify server-side session on mount with local storage fallback
  useEffect(() => {
    let isMounted = true
    async function verifySession() {
      // 1. Initial cached user from localStorage for instant render
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedUser = localStorage.getItem('birim_user')
          if (storedUser && isMounted) {
            try {
              const parsedUser: User = JSON.parse(storedUser)
              setUser(parsedUser)
            } catch {
              localStorage.removeItem('birim_user')
            }
          }
        }
      } catch {
        // Storage error ignored
      }

      // 2. Verify authentic session with backend /api/auth/me
      try {
        const serverUser = await getCurrentSessionUser()
        if (isMounted) {
          if (serverUser) {
            setUser(serverUser)
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('birim_user', JSON.stringify(serverUser))
            }
            const userId = serverUser._id || serverUser.email
            if (userId) {
              analytics.identifyUser(userId, {
                email: serverUser.email,
                name: serverUser.name,
                userType: serverUser.userType,
              })
            }
          }
        }
      } catch {
        // Fallback to local session state
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = (userData: User & {token?: string}) => {
    setUser(userData)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (userData.token) {
          localStorage.setItem('birim_token', userData.token)
        }
        const {token: _, ...cleanUser} = userData
        localStorage.setItem('birim_user', JSON.stringify(cleanUser))
      }
    } catch {
      // Storage error ignored
    }
    errorReporter.setUser({
      id: userData._id,
      email: userData.email,
      name: userData.name,
    })
    analytics.identifyUser(userData._id, {
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
    })
    analytics.trackUserAction('login', userData._id)
  }

  const logout = () => {
    setUser(null)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('birim_user')
        localStorage.removeItem('birim_token')
      }
      fetch('/api/auth/logout', {method: 'POST', credentials: 'same-origin'}).catch(() => {})
    } catch {
      // Storage error ignored
    }
    errorReporter.clearUser()
    analytics.resetUser()
  }

  const value = {
    isLoggedIn: !!user,
    user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
