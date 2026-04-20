import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface DarkModeContextType {
    theme: Theme
    toggleTheme: () => void
    isDarkMode: boolean
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme
            if (savedTheme) return savedTheme
            return 'light'
        }
        return 'light'
    })

    useEffect(() => {
        const root = window.document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }

    const isDarkMode = theme === 'dark'

    return (
        <DarkModeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDarkMode = () => {
    const context = useContext(DarkModeContext)
    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider')
    }
    return context
}
