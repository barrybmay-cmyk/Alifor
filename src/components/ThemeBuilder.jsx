// src/components/ThemeBuilder.jsx
import { useState } from 'react'
import { useTheme } from '../lib/ThemeContext'

const PRESET_THEMES = [
  {
    name: 'Alifor Teal', emoji: '🏥',
    primaryStart: '#0a7c6e', primaryEnd: '#0e6ba8', accentColor: '#2dd4bf',
    sidebarBg: '#0f172a', pageBg: '#f8fafc', displayFont: 'Playfair Display', bodyFont: 'Outfit',
  },
  {
    name: 'Midnight Navy', emoji: '🌙',
    primaryStart: '#1e3a5f', primaryEnd: '#2d6a9f', accentColor: '#60a5fa',
    sidebarBg: '#0a0f1e', pageBg: '#f0f4f8', displayFont: 'Cormorant Garamond', bodyFont: 'Raleway',
  },
  {
    name: 'Forest Green', emoji: '🌿',
    primaryStart: '#14532d', primaryEnd: '#166534', accentColor: '#4ade80',
    sidebarBg: '#0f1f12', pageBg: '#f0fdf4', displayFont: 'DM Serif Display', bodyFont: 'Plus Jakarta Sans',
  },
  {
    name: 'Royal Purple', emoji: '👑',
    primaryStart: '#4c1d95', primaryEnd: '#6d28d9', accentColor: '#a78bfa',
    sidebarBg: '#1e0a3c', pageBg: '#faf5ff', displayFont: 'Cormorant Garamond', bodyFont: 'Nunito',
  },
  {
    name: 'Crimson', emoji: '🔴',
    primaryStart: '#7f1d1d', primaryEnd: '#b91c1c', accentColor: '#f87171',
    sidebarBg: '#1a0505', pageBg: '#fff5f5', displayFont: 'Playfair Display', bodyFont: 'Lato',
  },
  {
    name: 'Ocean Breeze', emoji: '🌊',
    primaryStart: '#0369a1', primaryEnd: '#0891b2', accentColor: '#38bdf8',
    sidebarBg: '#020617', pageBg: '#f0f9ff', displayFont: 'DM Serif Display', bodyFont: 'Sora',
  },
]

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
]

const SHADOW_CSS = {
  none: 'none',
  soft: '0 2px 8px rgba(0,0,0,0.06)',
  medium: '0 4px 16px rgba(0,0,0,0.10)',
  strong: '0 8px 32px rgba(0,0,0,0.15)',
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', marginBottom: open ? 14 : 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </div>
  )
}

function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: value, border: '2px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', opacity: 0, cursor: 'pointer' }} />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 80, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none' }} />
      </div>
    </div>
  )
}

function FontSelect({ label, value, onChange, fonts }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: value }}>
        {fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
      </select>
      <div style={{ marginTop: 6, padding: '6px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <span style={{ fontFamily: value, fontSize: 15, color: '#0f172a' }}>The quick brown fox</span>
      </div>
    </div>
  )
}

function SliderInput({ label, value, onChange, min, max, unit = '' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>
        <span style={{ fontSize: 12, color: '#0a7c6e', fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', accentColor: '#0a7c6e' }} />
    </div>
  )
}

export default function ThemeBuilder({ onClose }) {
  const { theme, setTheme, resetTheme, GOOGLE_FONTS, DEFAULT_THEME } = useTheme()
  const [tab, setTab] = useState('presets')
  const [saved, setSaved] = useState(false)

  function applyPreset(preset) {
    setTheme(preset)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Theme is already auto-saved to localStorage on every change
    // In production, save to Supabase app_settings table here
  }

  const tabs = [
    { id: 'presets', label: 'Presets', icon: '✨' },
    { id: 'brand', label: 'Brand', icon: '🏷' },
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'typography', label: 'Fonts', icon: 'Aa' },
    { id: 'layout', label: 'Layout', icon: '⊞' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex' }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex: 1 }} />

      {/* Panel */}
      <div onClick={e => e.stopPropagation()}
        style={{ width: 340, background: '#fff', height: '100vh', boxShadow: '-8px 0 40px rgba(15,23,42,0.15)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', overflowY: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#0f172a', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15 }}>🎨 Visual Builder</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>Customise your workspace</div>
          </div>
          <button onClick={onClose} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>

        {/* Live preview bar */}
        <div style={{ background: `linear-gradient(135deg,${theme.primaryStart},${theme.primaryEnd})`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {theme.logoUrl
            ? <img src={theme.logoUrl} alt="logo" style={{ height: 24, borderRadius: 4 }} />
            : <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>⊕</div>
          }
          <div>
            <div style={{ fontFamily: `'${theme.displayFont}',serif`, fontSize: 14, fontWeight: 700, color: '#fff' }}>{theme.appName}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' }}>{theme.appTagline}</div>
          </div>
          <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: theme.accentColor }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#0a7c6e' : '#94a3b8', borderBottom: tab === t.id ? '2px solid #0a7c6e' : '2px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* PRESETS */}
          {tab === 'presets' && (
            <div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>Choose a theme preset to get started instantly.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {PRESET_THEMES.map(preset => (
                  <button key={preset.name} onClick={() => applyPreset(preset)}
                    style={{ padding: 12, borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = preset.primaryStart; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${preset.primaryStart},${preset.primaryEnd})`, flexShrink: 0 }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.accentColor }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{preset.emoji} {preset.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontFamily: preset.bodyFont }}>{preset.bodyFont}</div>
                  </button>
                ))}
              </div>
              <button onClick={resetTheme} style={{ width: '100%', marginTop: 14, padding: '8px', borderRadius: 8, border: '1.5px dashed #e2e8f0', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                ↺ Reset to Default
              </button>
            </div>
          )}

          {/* BRAND */}
          {tab === 'brand' && (
            <div>
              <Section title="Identity">
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>App Name</label>
                  <input value={theme.appName} onChange={e => setTheme({ appName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tagline</label>
                  <input value={theme.appTagline} onChange={e => setTheme({ appTagline: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </Section>
              <Section title="Logo">
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Logo URL</label>
                  <input value={theme.logoUrl} onChange={e => setTheme({ logoUrl: e.target.value })}
                    placeholder="https://your-logo.png"
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Paste a direct image URL (PNG or SVG recommended)</div>
                </div>
                {theme.logoUrl && (
                  <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <img src={theme.logoUrl} alt="preview" style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* COLORS */}
          {tab === 'colors' && (
            <div>
              <Section title="Primary Gradient">
                <ColorInput label="Gradient Start" value={theme.primaryStart} onChange={v => setTheme({ primaryStart: v })} />
                <ColorInput label="Gradient End" value={theme.primaryEnd} onChange={v => setTheme({ primaryEnd: v })} />
                <div style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg,${theme.primaryStart},${theme.primaryEnd})`, marginBottom: 4 }} />
                <ColorInput label="Accent Colour" value={theme.accentColor} onChange={v => setTheme({ accentColor: v })} />
              </Section>
              <Section title="Sidebar">
                <ColorInput label="Background" value={theme.sidebarBg} onChange={v => setTheme({ sidebarBg: v })} />
                <ColorInput label="Active Item" value={theme.sidebarActiveText} onChange={v => setTheme({ sidebarActiveText: v })} />
              </Section>
              <Section title="Page & Cards">
                <ColorInput label="Page Background" value={theme.pageBg} onChange={v => setTheme({ pageBg: v })} />
                <ColorInput label="Card Background" value={theme.cardBg} onChange={v => setTheme({ cardBg: v })} />
                <ColorInput label="Card Border" value={theme.cardBorder} onChange={v => setTheme({ cardBorder: v })} />
              </Section>
              <Section title="Text">
                <ColorInput label="Primary Text" value={theme.textPrimary} onChange={v => setTheme({ textPrimary: v })} />
                <ColorInput label="Muted Text" value={theme.textMuted} onChange={v => setTheme({ textMuted: v })} />
              </Section>
              <Section title="Login Page">
                <ColorInput label="Background Colour 1" value={theme.loginBg1} onChange={v => setTheme({ loginBg1: v })} />
                <ColorInput label="Background Colour 2" value={theme.loginBg2} onChange={v => setTheme({ loginBg2: v })} />
                <ColorInput label="Background Colour 3" value={theme.loginBg3} onChange={v => setTheme({ loginBg3: v })} />
                <div style={{ height: 32, borderRadius: 8, background: `linear-gradient(135deg,${theme.loginBg1},${theme.loginBg2},${theme.loginBg3})` }} />
              </Section>
            </div>
          )}

          {/* TYPOGRAPHY */}
          {tab === 'typography' && (
            <div>
              <FontSelect label="Display / Heading Font" value={theme.displayFont} onChange={v => setTheme({ displayFont: v })} fonts={GOOGLE_FONTS} />
              <FontSelect label="Body / UI Font" value={theme.bodyFont} onChange={v => setTheme({ bodyFont: v })} fonts={GOOGLE_FONTS} />
              <SliderInput label="Base Font Size" value={theme.baseFontSize} onChange={v => setTheme({ baseFontSize: v })} min={12} max={18} unit="px" />
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 8 }}>
                <div style={{ fontFamily: `'${theme.displayFont}',serif`, fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Heading Style</div>
                <div style={{ fontFamily: `'${theme.bodyFont}',sans-serif`, fontSize: +theme.baseFontSize, color: '#475569', lineHeight: 1.6 }}>Body text preview. This is how your content will look across the app.</div>
              </div>
            </div>
          )}

          {/* LAYOUT */}
          {tab === 'layout' && (
            <div>
              <SliderInput label="Sidebar Width" value={theme.sidebarWidth} onChange={v => setTheme({ sidebarWidth: v })} min={200} max={300} unit="px" />
              <SliderInput label="Border Radius" value={theme.borderRadius} onChange={v => setTheme({ borderRadius: v })} min={0} max={24} unit="px" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Card Shadow</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SHADOW_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setTheme({ cardShadow: s.value })}
                      style={{ padding: '10px', borderRadius: 8, border: `2px solid ${theme.cardShadow === s.value ? '#0a7c6e' : '#e2e8f0'}`, background: '#fff', cursor: 'pointer', boxShadow: SHADOW_CSS[s.value], fontSize: 12, fontWeight: theme.cardShadow === s.value ? 700 : 400, color: theme.cardShadow === s.value ? '#0a7c6e' : '#475569' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, flexShrink: 0, background: '#f8fafc' }}>
          <button onClick={resetTheme} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            ↺ Reset
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: saved ? '#0a7c6e' : 'linear-gradient(135deg,#0a7c6e,#0e6ba8)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s' }}>
            {saved ? '✓ Saved!' : '💾 Save Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}
