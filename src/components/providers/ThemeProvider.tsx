'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Read persisted preference or fall back to OS setting
    const stored = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved: Theme = stored ?? (prefersDark ? 'dark' : 'light')
    setTheme(resolved)
    applyTheme(resolved)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      applyTheme(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  // Add transition class so color changes animate smoothly
  root.classList.add('theme-transitioning')
  root.classList.toggle('dark', theme === 'dark')
  // Remove transition class after animation completes so normal interactions stay snappy
  setTimeout(() => root.classList.remove('theme-transitioning'), 220)
}

export const useTheme = () => useContext(ThemeContext)
