import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {useAuth} from '../context/AuthContext'
import {userActivityTracker} from '../lib/userActivityTracker'

export function useUserActivityTracking() {
  const location = useLocation()
  const {user} = useAuth()

  // Keep tracker updated with current user
  useEffect(() => {
    if (user) {
      const userId = user._id || (user as {id?: string}).id || ''
      if (userId) {
        userActivityTracker.setUser({
          id: userId,
          email: user.email,
        })
      }
    } else {
      userActivityTracker.setUser(null)
    }
  }, [user])

  // Track page view and dwell time whenever route changes
  useEffect(() => {
    const fullPath = location.pathname + location.search
    userActivityTracker.trackPageView(fullPath, document.title)
  }, [location.pathname, location.search])
}
