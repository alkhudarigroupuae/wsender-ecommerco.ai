import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function getStoredTheme() {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark') return v
    return null
  } catch {
    return null
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme() || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}

