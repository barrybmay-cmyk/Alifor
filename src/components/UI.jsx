import { useState } from 'react'

export const ROLE_META = {
  admin:  { label: 'Admin',  color: '#7c3aed', bg: '#f5f3ff', desc: 'Full access + user management' },
  editor: { label: 'Editor', color: '#0e6ba8', bg: '#eff6ff', desc: 'Create & edit content' },
  viewer: { label: 'Viewer', color: '#0a7c6e', bg: '#f0fdf9', desc: 'Read-only access' },
}

export function Avatar({ name = '?', size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},42%,38%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

export function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.viewer
  return <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: m.color, background: m.bg }}>{m.label}</span>
}

export function Btn({ children, onClick, variant = 'primary', small, disabled, fullWidth, type = 'button', style: sx = {} }) {
  const v = {
    primary:   { background: 'linear-gradient(135deg,#4815E1,#B841E3,#DF346D)', color: '#fff', boxShadow: '0 2px 8px rgba(184,65,227,0.25)', border: 'none' },
    secondary: { background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0' },
    ghost:     { background: 'transparent', color: '#94a3b8', border: '1.5px dashed #e2e8f0' },
    danger:    { background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca' },
    warning:   { background: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ padding: small ? '6px 13px' : '10px 20px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: small ? 12 : 13, fontWeight: 600, transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : undefined, ...v[variant], ...sx }}>
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, placeholder, type = 'text', error, autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>}
      <input autoFocus={autoFocus} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 13px', background: '#f8fafc', border: `1.5px solid ${error ? '#fca5a5' : focused ? '#4815E1' : '#e2e8f0'}`, borderRadius: 8, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 13px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

export function Modal({ title, subtitle, onClose, children, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, width, maxWidth: '92vw', boxShadow: '0 32px 80px rgba(15,23,42,0.18)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans',serif" }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 16 }}>×</button>
          </div>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#0a7c6e,#0e6ba8)', borderRadius: 99, marginTop: 14 }} />
        </div>
        {children}
      </div>
    </div>
  )
}

export function AlertBanner({ type = 'error', message }) {
  if (!message) return null
  const styles = {
    error:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '⚠' },
    success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '✓' },
    info:    { bg: '#eff6ff', color: '#0e6ba8', border: '#bfdbfe', icon: 'ℹ' },
  }
  const s = styles[type]
  return (
    <div style={{ padding: '10px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, color: s.color, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{s.icon}</span> {message}
    </div>
  )
}
