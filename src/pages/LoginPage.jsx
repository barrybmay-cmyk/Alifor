import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/ThemeContext'
import { Btn, AlertBanner } from '../components/UI'

export default function LoginPage() {
  const { signIn } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState('')

  const ff = `'${theme.bodyFont}',sans-serif`
  const grad = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryMid || theme.primaryEnd},${theme.primaryEnd})`

  async function handleLogin(e) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg,${theme.loginBg1} 0%,${theme.loginBg2} 50%,${theme.loginBg3} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>

      {/* Blobs */}
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle,${theme.primaryStart}18,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle,${theme.primaryEnd}18,transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ background: theme.cardBg, borderRadius: parseInt(theme.borderRadius) + 4, padding: '44px 44px 36px', width: 420, boxShadow: `0 24px 80px ${theme.primaryStart}18`, border: `1px solid ${theme.cardBorder}`, position: 'relative' }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: parseInt(theme.borderRadius) + 4, background: grad, marginBottom: 14, boxShadow: `0 8px 24px ${theme.primaryMid || theme.primaryEnd}35` }}>
            {theme.logoUrl
              ? <img src={theme.logoUrl} alt={theme.appName} style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
              : <span style={{ fontSize: 28, color: '#fff', fontWeight: 800 }}>{theme.appName?.[0] || 'A'}</span>
            }
          </div>
          <div style={{ fontFamily: ff, fontSize: 28, fontWeight: 800, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{theme.appName}</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500 }}>{theme.appTagline}</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Sign in to your workspace</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Physician-controlled · Secure · Private</div>
        </div>

        <AlertBanner type="error" message={error} />

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@alifor.ca"
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              style={{ width: '100%', padding: '11px 14px', background: theme.pageBg, border: `1.5px solid ${focused === 'email' ? theme.primaryStart : theme.cardBorder}`, borderRadius: parseInt(theme.borderRadius) * 0.7, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: theme.textPrimary, fontFamily: ff }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                style={{ width: '100%', padding: '11px 44px 11px 14px', background: theme.pageBg, border: `1.5px solid ${focused === 'pw' ? theme.primaryStart : theme.cardBorder}`, borderRadius: parseInt(theme.borderRadius) * 0.7, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: theme.textPrimary, fontFamily: ff }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: 15, padding: 0 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !email || !password}
            style={{ width: '100%', padding: '12px', borderRadius: parseInt(theme.borderRadius) * 0.7, border: 'none', background: grad, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !email || !password ? 'not-allowed' : 'pointer', opacity: loading || !email || !password ? 0.6 : 1, fontFamily: ff, boxShadow: `0 4px 16px ${theme.primaryStart}30` }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: theme.pageBg, borderRadius: parseInt(theme.borderRadius) * 0.7, border: `1px solid ${theme.cardBorder}`, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
            Don't have an account? Contact your<br />{theme.appName} workspace administrator.
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: theme.cardBorder }}>🔒 Secured by Supabase Auth · End-to-end encrypted</div>
        </div>
      </div>
    </div>
  )
}
