import { createContext, useContext, useState, useEffect } from 'react'

const GOOGLE_FONTS = [
  'Plus Jakarta Sans', 'DM Sans', 'Sora', 'Outfit', 'Nunito',
  'Raleway', 'Josefin Sans', 'Lato', 'Poppins', 'Manrope',
  'Inter', 'Work Sans'
]

// Alifor brand colours extracted from official SVG logo
const DEFAULT_THEME = {
  appName: 'Alifor',
  appTagline: 'Clinical Operating System',
  logoUrl: '/alifor-logo.svg',

  primaryStart: '#4815E1',
  primaryMid: '#B841E3',
  primaryEnd: '#DF346D',
  accentColor: '#67e8f9',

  sidebarBg: '#0f0a1e',
  sidebarText: '#94a3b8',
  sidebarActiveText: '#B841E3',
  pageBg: '#f5f3ff',
  cardBg: '#ffffff',
  cardBorder: '#ede9fe',
  textPrimary: '#1e1035',
  textMuted: '#7c6f9e',

  displayFont: 'Plus Jakarta Sans',
  bodyFont: 'Plus Jakarta Sans',
  baseFontSize: '14',

  sidebarWidth: '240',
  borderRadius: '12',
  cardShadow: 'soft',

  loginBg1: '#f5f3ff',
  loginBg2: '#fdf2f8',
  loginBg3: '#eef2ff',
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

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary-start', theme.primaryStart)
    root.style.setProperty('--primary-mid', theme.primaryMid || theme.primaryEnd)
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
