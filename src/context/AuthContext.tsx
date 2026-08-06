/* eslint-disable react-refresh/only-export-components */
import {useState, useContext, createContext, PropsWithChildren, useEffect} from 'react'
import type {User} from '../types'
import {errorReporter} from '../lib/errorReporting'
import {analytics} from '../lib/analytics'

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

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUser = localStorage.getItem('birim_user')
        if (storedUser) {
          try {
            const parsedUser: User = JSON.parse(storedUser)
            setUser(parsedUser)
            const userId = parsedUser._id || (parsedUser as unknown as {id?: string}).id || parsedUser.email
            if (userId) {
              analytics.identifyUser(userId, {
                email: parsedUser.email,
                name: parsedUser.name,
                userType: parsedUser.userType,
              })
            }
          } catch (e) {
            try {
              localStorage.removeItem('birim_user')
            } catch {
              // Storage erişilemiyorsa sessizce devam et
            }
          }
        }
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('birim_user', JSON.stringify(userData))
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
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
      }
    } catch {
      // Storage erişilemiyorsa sessizce devam et
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
