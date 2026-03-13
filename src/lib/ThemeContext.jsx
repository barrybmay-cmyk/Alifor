// src/lib/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const GOOGLE_FONTS = [
  'Playfair Display', 'DM Serif Display', 'Cormorant Garamond',
  'Outfit', 'DM Sans', 'Plus Jakarta Sans', 'Sora', 'Nunito',
  'Lato', 'Raleway', 'Josefin Sans', 'Libre Baskerville'
]

const DEFAULT_THEME = {
  // Brand
  appName: 'Alifor',
  appTagline: 'Clinical Operating System',
  logoUrl: '',
  faviconUrl: '',

  // Colors
  primaryStart: '#0a7c6e',
  primaryEnd: '#0e6ba8',
  accentColor: '#2dd4bf',
  sidebarBg: '#0f172a',
  sidebarText: '#64748b',
  sidebarActiveText: '#2dd4bf',
  pageBg: '#f8fafc',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textMuted: '#94a3b8',

  // Typography
  displayFont: 'Playfair Display',
  bodyFont: 'Outfit',
  baseFontSize: '14',

  // Layout
  sidebarWidth: '240',
  borderRadius: '12',
  cardShadow: 'soft',

  // Login page
  loginBg1: '#f0fdf9',
  loginBg2: '#eff6ff',
  loginBg3: '#f5f3ff',
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('alifor_theme')
      return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME
    } catch { return DEFAULT_THEME }
  })

  function setTheme(updates) {
    setThemeState(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('alifor_theme', JSON.stringify(next))
      return next
    })
  }

  function resetTheme() {
    localStorage.removeItem('alifor_theme')
    setThemeState(DEFAULT_THEME)
  }

  // Inject Google Fonts dynamically
  useEffect(() => {
    const fonts = [theme.displayFont, theme.bodyFont].filter(Boolean)
    const existing = document.getElementById('alifor-fonts')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.id = 'alifor-fonts'
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    document.head.appendChild(link)
  }, [theme.displayFont, theme.bodyFont])

  // Apply CSS variables globally
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary-start', theme.primaryStart)
    root.style.setProperty('--primary-end', theme.primaryEnd)
    root.style.setProperty('--accent', theme.accentColor)
    root.style.setProperty('--sidebar-bg', theme.sidebarBg)
    root.style.setProperty('--page-bg', theme.pageBg)
    root.style.setProperty('--card-bg', theme.cardBg)
    root.style.setProperty('--text-primary', theme.textPrimary)
    root.style.setProperty('--text-muted', theme.textMuted)
    root.style.setProperty('--border', theme.cardBorder)
    root.style.setProperty('--radius', theme.borderRadius + 'px')
    root.style.setProperty('--sidebar-width', theme.sidebarWidth + 'px')
    root.style.setProperty('--display-font', `'${theme.displayFont}', serif`)
    root.style.setProperty('--body-font', `'${theme.bodyFont}', sans-serif`)
    root.style.setProperty('--font-size', theme.baseFontSize + 'px')
    document.body.style.fontFamily = `'${theme.bodyFont}', sans-serif`
    document.body.style.background = theme.pageBg
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, GOOGLE_FONTS, DEFAULT_THEME }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
