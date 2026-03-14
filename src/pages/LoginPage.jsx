import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Btn, AlertBanner } from '../components/UI'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState('')

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f5f3ff 0%,#fdf2f8 50%,#eef2ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,#4815E118,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,#DF346D18,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ background: '#fff', borderRadius: 20, padding: '44px 44px 36px', width: 420, boxShadow: '0 24px 80px rgba(72,21,225,0.12)', border: '1px solid #ede9fe', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#4815E1,#B841E3,#DF346D)', marginBottom: 14, boxShadow: '0 8px 24px rgba(184,65,227,0.35)' }}>
            <img src="/alifor-logo.svg" alt="Alifor" style={{ height: 20, filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 700, background: 'linear-gradient(135deg,#4815E1,#B841E3,#DF346D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Alifor</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500 }}>Clinical Operating System</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Sign in to your workspace</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Physician-controlled · Secure · Private</div>
        </div>

        <AlertBanner type="error" message={error} />

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@alifor.ca"
              onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: `1.5px solid ${focused === 'email' ? '#0a7c6e' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                style={{ width: '100%', padding: '11px 44px 11px 14px', background: '#f8fafc', border: `1.5px solid ${focused === 'pw' ? '#0a7c6e' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <Btn type="submit" disabled={loading || !email || !password} fullWidth>
            {loading ? 'Signing in…' : 'Sign In →'}
          </Btn>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Don't have an account? Contact your<br />Alifor workspace administrator.
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#cbd5e1' }}>
            🔒 Secured by Supabase Auth · End-to-end encrypted
          </div>
        </div>
      </div>
    </div>
  )
}
