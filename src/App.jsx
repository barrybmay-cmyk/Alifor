import { AuthProvider, useAuth } from './lib/AuthContext'
import { ThemeProvider } from './lib/ThemeContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function AppInner() {
  const { session, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'serif', fontSize: 28, color: '#0a7c6e', marginBottom: 10 }}>Alifor</div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Initialising…</div>
      </div>
    </div>
  )

  return session ? <DashboardPage /> : <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}
