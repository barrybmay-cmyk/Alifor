import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/ThemeContext'
import { Avatar, RoleBadge, Btn, Input, Select, Modal } from '../components/UI'
import AdminConsole from './AdminConsole'
import ThemeBuilder from '../components/ThemeBuilder'

const RACI_OPTIONS = ['R', 'A', 'C', 'I', '']
const RACI_LABELS = { R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed' }
const RACI_COLORS = { R: '#7c3aed', A: '#4815E1', C: '#B841E3', I: '#DF346D' }
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Blocked']
const STATUS_COLORS = { 'Not Started': '#94a3b8', 'In Progress': '#4815E1', 'Complete': '#0a7c6e', 'Blocked': '#dc2626' }
const PRIORITY = ['High', 'Medium', 'Low']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#0a7c6e' }

// ── Sub-components ────────────────────────────────────────────────────────────

function RACIBadge({ value, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={value ? `${RACI_LABELS[value]} — click to change` : 'Click to assign'}
      style={{
        width: 36, height: 36, borderRadius: 8,
        background: value ? RACI_COLORS[value] + '22' : 'transparent',
        color: value ? RACI_COLORS[value] : '#cbd5e1',
        border: value ? `2px solid ${RACI_COLORS[value]}55` : '1.5px dashed #d1d5db',
        fontWeight: 700, fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseOver={e => { if (!disabled && !value) { e.currentTarget.style.borderColor = '#9333ea'; e.currentTarget.style.color = '#9333ea' } }}
      onMouseOut={e => { if (!value) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#cbd5e1' } }}
    >
      {value || '+'}
    </button>
  )
}

function StatusPill({ status, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ padding: '4px 12px', borderRadius: 99, border: 'none', background: STATUS_COLORS[status] + '18', color: STATUS_COLORS[status], fontSize: 11, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
      {status}
    </button>
  )
}

function PriDot({ priority }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[priority], marginRight: 7, flexShrink: 0 }} />
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile: currentUser, signOut } = useAuth()
  const { theme } = useTheme()
  const [view, setView] = useState('strategy')
  const [showAdmin, setShowAdmin] = useState(false)
  const [showThemeBuilder, setShowThemeBuilder] = useState(false)
  const [users, setUsers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedGoals, setExpandedGoals] = useState({})
  const [expandedTactics, setExpandedTactics] = useState({})
  const [modal, setModal] = useState(null)
  const [newGoal, setNewGoal] = useState({ title: '', description: '' })
  const [newTactic, setNewTactic] = useState({ title: '', goalId: null })
  const [newTask, setNewTask] = useState({ title: '', priority: 'High', due: '', tacticId: null })
  const [raciTooltip, setRaciTooltip] = useState(null)

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor'
  const isAdmin = currentUser?.role === 'admin'

  const grad = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryEnd})`
  const grad3 = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryMid || theme.primaryEnd},${theme.primaryEnd})`
  const ff = `'${theme.bodyFont}',sans-serif`
  const radius = parseInt(theme.borderRadius || 12)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: profilesData }, { data: goalsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true),
      supabase.from('goals').select(`*, tactics(*, tasks(*))`).order('created_at'),
    ])
    setUsers(profilesData || [])
    const sorted = (goalsData || []).map(g => ({
      ...g,
      tactics: (g.tactics || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(t => ({
          ...t,
          raci: t.raci || {},
          tasks: (t.tasks || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(tk => ({ ...tk, raci: tk.raci || {} }))
        }))
    }))
    setGoals(sorted)
    setLoading(false)
  }

  const memberNames = users.map(u => u.name || u.email)
  const allTasks = goals.flatMap(g => g.tactics.flatMap(t => t.tasks))
  const allTactics = goals.flatMap(g => g.tactics)
  const statCounts = STATUS_OPTIONS.reduce((a, s) => ({ ...a, [s]: allTasks.filter(t => t.status === s).length }), {})
  const pct = allTasks.length ? Math.round(statCounts['Complete'] / allTasks.length * 100) : 0

  async function logActivity(type, desc) {
    try { await supabase.from('activity_logs').insert({ user_id: currentUser.id, user_name: currentUser.name, user_email: currentUser.email, action_type: type, description: desc }) } catch {}
  }

  // ── RACI cycling for TACTICS ──────────────────────────────────────────────
  async function cycleTacticRaci(tacticId, member) {
    if (!canEdit) return
    const tactic = allTactics.find(t => t.id === tacticId)
    if (!tactic) return
    const raci = tactic.raci || {}
    const cur = raci[member] || ''
    const next = RACI_OPTIONS[(RACI_OPTIONS.indexOf(cur) + 1) % RACI_OPTIONS.length]
    const newRaci = { ...raci, [member]: next }
    await supabase.from('tactics').update({ raci: newRaci }).eq('id', tacticId)
    setGoals(gs => gs.map(g => ({
      ...g,
      tactics: g.tactics.map(t => t.id === tacticId ? { ...t, raci: newRaci } : t)
    })))
    await logActivity('update', `Updated RACI for tactic "${tactic.title}" — ${member}: ${next || 'cleared'}`)
  }

  // ── RACI cycling for TASKS ────────────────────────────────────────────────
  async function cycleTaskRaci(taskId, member) {
    if (!canEdit) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    const raci = task.raci || {}
    const cur = raci[member] || ''
    const next = RACI_OPTIONS[(RACI_OPTIONS.indexOf(cur) + 1) % RACI_OPTIONS.length]
    const newRaci = { ...raci, [member]: next }
    await supabase.from('tasks').update({ raci: newRaci }).eq('id', taskId)
    setGoals(gs => gs.map(g => ({
      ...g,
      tactics: g.tactics.map(t => ({
        ...t,
        tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, raci: newRaci } : tk)
      }))
    })))
    await logActivity('update', `Updated RACI for task "${task.title}" — ${member}: ${next || 'cleared'}`)
  }

  async function cycleStatus(taskId) {
    if (!canEdit) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    const next = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(task.status) + 1) % STATUS_OPTIONS.length]
    await supabase.from('tasks').update({ status: next }).eq('id', taskId)
    setGoals(gs => gs.map(g => ({
      ...g,
      tactics: g.tactics.map(t => ({
        ...t,
        tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, status: next } : tk)
      }))
    })))
    await logActivity('update', `"${task.title}" → ${next}`)
  }

  async function addGoal() {
    if (!newGoal.title.trim()) return
    const { data } = await supabase.from('goals').insert({ title: newGoal.title, description: newGoal.description }).select().single()
    if (data) { setGoals(gs => [...gs, { ...data, tactics: [] }]); await logActivity('create', `Goal: "${data.title}"`) }
    setNewGoal({ title: '', description: '' }); setModal(null)
  }

  async function addTactic() {
    if (!newTactic.title.trim()) return
    const goalId = newTactic.goalId || goals[0]?.id
    const raci = memberNames.reduce((a, m) => ({ ...a, [m]: '' }), {})
    const { data } = await supabase.from('tactics').insert({ title: newTactic.title, goal_id: goalId, raci }).select().single()
    if (data) {
      setGoals(gs => gs.map(g => g.id !== goalId ? g : { ...g, tactics: [...g.tactics, { ...data, raci: raci, tasks: [] }] }))
      await logActivity('create', `Tactic: "${data.title}"`)
    }
    setNewTactic({ title: '', goalId: null }); setModal(null)
  }

  async function addTask() {
    if (!newTask.title.trim()) return
    const raci = memberNames.reduce((a, m) => ({ ...a, [m]: '' }), {})
    const { data } = await supabase.from('tasks').insert({ title: newTask.title, priority: newTask.priority, due_date: newTask.due || null, tactic_id: newTask.tacticId, status: 'Not Started', raci }).select().single()
    if (data) {
      setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => t.id !== newTask.tacticId ? t : { ...t, tasks: [...t.tasks, { ...data, raci }] }) })))
      await logActivity('create', `Task: "${data.title}"`)
    }
    setNewTask({ title: '', priority: 'High', due: '', tacticId: null }); setModal(null)
  }

  async function deleteGoal(id, title) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(gs => gs.filter(g => g.id !== id))
    await logActivity('delete', `Goal: "${title}"`)
  }
  async function deleteTactic(id, title) {
    await supabase.from('tactics').delete().eq('id', id)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.filter(t => t.id !== id) })))
    await logActivity('delete', `Tactic: "${title}"`)
  }
  async function deleteTask(id, title) {
    await supabase.from('tasks').delete().eq('id', id)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => ({ ...t, tasks: t.tasks.filter(tk => tk.id !== id) })) })))
    await logActivity('delete', `Task: "${title}"`)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'strategy', label: 'Strategy', icon: '◎' },
    { id: 'raci', label: 'RACI Matrix', icon: '⊞' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg, fontFamily: ff }}>
      <div style={{ textAlign: 'center' }}>
        <img src={theme.logoUrl || '/alifor-logo.svg'} alt={theme.appName} style={{ height: 28, marginBottom: 16 }} />
        <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading workspace…</div>
      </div>
    </div>
  )

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: theme.pageBg, fontFamily: ff, color: theme.textPrimary }}>

      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: parseInt(theme.sidebarWidth), background: theme.sidebarBg, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #1e1033' }}>
          {theme.logoUrl
            ? <img src={theme.logoUrl} alt={theme.appName} style={{ height: 22, marginBottom: 6, display: 'block' }} />
            : <div style={{ fontSize: 20, fontWeight: 800, background: grad3, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>{theme.appName}</div>
          }
          <div style={{ fontSize: 10, color: '#6d5fa0', marginTop: 2, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500 }}>{theme.appTagline}</div>
        </div>

        <nav style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10 }}>Workspace</div>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: radius, border: 'none', background: view === n.id ? theme.primaryStart + '25' : 'transparent', color: view === n.id ? (theme.sidebarActiveText || theme.primaryMid) : '#64748b', fontSize: 13, fontWeight: view === n.id ? 600 : 500, cursor: 'pointer', marginBottom: 2, textAlign: 'left', fontFamily: ff }}>
              <span>{n.icon}</span> {n.label}
              {view === n.id && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: theme.sidebarActiveText || theme.primaryMid }} />}
            </button>
          ))}

          {isAdmin && <>
            <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Admin</div>
            <button onClick={() => setShowAdmin(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: radius, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
              🛡 Admin Console
            </button>
          </>}

          <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Team ({users.length})</div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: radius, background: u.id === currentUser?.id ? '#ffffff08' : 'transparent' }}>
              <Avatar name={u.name || u.email} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: u.id === currentUser?.id ? '#e2e8f0' : '#94a3b8', fontWeight: u.id === currentUser?.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.email}</div>
              </div>
              <RoleBadge role={u.role} />
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1033' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={currentUser?.name || '?'} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
              <div style={{ fontSize: 10, color: '#6d5fa0' }}>{currentUser?.title}</div>
            </div>
          </div>
          <button onClick={() => setShowThemeBuilder(true)}
            style={{ width: '100%', padding: '7px 12px', borderRadius: radius, background: theme.primaryStart + '20', border: `1px solid ${theme.primaryStart}40`, color: theme.sidebarActiveText || '#B841E3', fontSize: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: ff, fontWeight: 600 }}>
            🎨 Visual Builder
          </button>
          <button onClick={signOut}
            style={{ width: '100%', padding: '7px 12px', borderRadius: radius, background: '#1e293b', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
            ← Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: parseInt(theme.sidebarWidth), minHeight: '100vh' }}>
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>{navItems.find(n => n.id === view)?.label}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{allTasks.length} tasks · {pct}% complete · <RoleBadge role={currentUser?.role} /></div>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn small variant="secondary" onClick={() => { setNewTactic({ title: '', goalId: goals[0]?.id }); setModal('addTactic') }}>+ Tactic</Btn>
              <Btn small onClick={() => setModal('addGoal')}>+ Strategic Goal</Btn>
            </div>
          )}
        </div>

        <div style={{ padding: 32 }}>

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: theme.textPrimary }}>Command Overview</h2>
              <p style={{ margin: '0 0 28px', color: theme.textMuted, fontSize: 14 }}>Strategic performance across all clinical initiatives</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 28 }}>
                {[['📋','Total Tasks',allTasks.length,theme.primaryStart],['✓','Complete',statCounts['Complete'],'#0a7c6e'],['⟳','In Progress',statCounts['In Progress'],theme.primaryEnd],['!','Blocked',statCounts['Blocked'],'#dc2626']].map(([icon,l,v,c]) => (
                  <div key={l} style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: radius * 0.8, background: c+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, padding: '22px 26px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Completion</span>
                  <span style={{ fontWeight: 800, color: theme.primaryStart, fontSize: 18 }}>{pct}%</span>
                </div>
                <div style={{ background: theme.pageBg, borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: grad3, height: '100%', width: pct+'%', borderRadius: 99, transition: 'width 0.6s' }} />
                </div>
              </div>
              {goals.map(goal => {
                const gTasks = goal.tactics.flatMap(t => t.tasks)
                const done = gTasks.filter(t => t.status === 'Complete').length
                const gp = gTasks.length ? Math.round(done / gTasks.length * 100) : 0
                return (
                  <div key={goal.id} style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, padding: '18px 22px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{goal.title}</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{goal.description}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: theme.primaryStart }}>{gp}%</div>
                    </div>
                    <div style={{ background: theme.pageBg, borderRadius: 99, height: 5, marginBottom: 12 }}>
                      <div style={{ background: grad, height: '100%', width: gp+'%', borderRadius: 99 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {goal.tactics.map(t => <span key={t.id} style={{ background: theme.pageBg, border: `1px solid ${theme.cardBorder}`, padding: '3px 10px', borderRadius: 99, fontSize: 11, color: theme.textMuted }}>{t.title} · {t.tasks.length} tasks</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STRATEGY ── */}
          {view === 'strategy' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: theme.textPrimary }}>Strategic Goals</h2>
              <p style={{ margin: '0 0 28px', color: theme.textMuted, fontSize: 14 }}>Goals → Tactics → Tasks{!canEdit && ' · Read-only access'}</p>
              {goals.map(goal => (
                <div key={goal.id} style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, marginBottom: 20, overflow: 'hidden' }}>
                  <div onClick={() => setExpandedGoals(e => ({ ...e, [goal.id]: !e[goal.id] }))}
                    style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: theme.pageBg, borderBottom: expandedGoals[goal.id] ? `1.5px solid ${theme.cardBorder}` : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: radius * 0.7, background: grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
                      {expandedGoals[goal.id] ? '▾' : '▸'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{goal.title}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{goal.description}</div>
                    </div>
                    {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <Btn small variant="secondary" onClick={() => { setNewTactic({ title: '', goalId: goal.id }); setModal('addTactic') }}>+ Tactic</Btn>
                      <Btn small variant="danger" onClick={() => deleteGoal(goal.id, goal.title)}>✕</Btn>
                    </div>}
                  </div>
                  {expandedGoals[goal.id] && goal.tactics.map(tactic => (
                    <div key={tactic.id}>
                      <div onClick={() => setExpandedTactics(e => ({ ...e, [tactic.id]: !e[tactic.id] }))}
                        style={{ padding: '11px 22px 11px 52px', display: 'flex', alignItems: 'center', gap: 10, background: theme.cardBg, cursor: 'pointer', borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.primaryStart, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{tactic.title}</div>
                        {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                          <Btn small variant="ghost" onClick={() => { setNewTask({ title: '', priority: 'High', due: '', tacticId: tactic.id }); setModal('addTask') }}>+ Task</Btn>
                          <Btn small variant="danger" onClick={() => deleteTactic(tactic.id, tactic.title)}>✕</Btn>
                        </div>}
                      </div>
                      {expandedTactics[tactic.id] && tactic.tasks.map((task, ti) => (
                        <div key={task.id} style={{ padding: '10px 22px 10px 76px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${theme.cardBorder}`, background: ti % 2 ? theme.cardBg : theme.pageBg }}>
                          <PriDot priority={task.priority} />
                          <div style={{ flex: 1, fontSize: 13 }}>{task.title}</div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} />
                            {task.due_date && <span style={{ fontSize: 11, color: theme.textMuted }}>{task.due_date}</span>}
                            <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                          </div>
                          {canEdit && <Btn small variant="danger" style={{ padding: '3px 8px' }} onClick={() => deleteTask(task.id, task.title)}>✕</Btn>}
                        </div>
                      ))}
                      {expandedTactics[tactic.id] && tactic.tasks.length === 0 && (
                        <div style={{ padding: '12px 76px', fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>No tasks yet — click + Task above</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {goals.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>No goals yet — click <strong style={{ color: theme.primaryStart }}>+ Strategic Goal</strong> to begin</div>}
            </div>
          )}

          {/* ── RACI MATRIX ── */}
          {view === 'raci' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: theme.textPrimary }}>RACI Matrix</h2>
              <p style={{ margin: '0 0 6px', color: theme.textMuted, fontSize: 14 }}>
                {canEdit ? 'Click any cell to assign: R → A → C → I → clear. Tactics and tasks each have their own RACI row.' : 'Read-only view'}
              </p>

              {/* No team members warning */}
              {memberNames.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: radius, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                  ⚠ No active team members found. Add users in the Admin Console to assign RACI roles.
                </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {Object.entries(RACI_LABELS).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius * 0.6, padding: '5px 12px' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: RACI_COLORS[k]+'22', color: RACI_COLORS[k], border: `1.5px solid ${RACI_COLORS[k]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{k}</div>
                    <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>No goals yet — add goals and tactics in the Strategy view first</div>
              ) : (
                <div style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: theme.pageBg, borderBottom: `2px solid ${theme.cardBorder}` }}>
                          <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 260, position: 'sticky', left: 0, background: theme.pageBg, zIndex: 1 }}>
                            Goal / Tactic / Task
                          </th>
                          <th style={{ padding: '14px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: theme.textMuted, minWidth: 120, textTransform: 'uppercase', letterSpacing: 0.8 }}>Status</th>
                          {memberNames.map(m => (
                            <th key={m} style={{ padding: '14px 10px', textAlign: 'center', minWidth: 90 }}>
                              <Avatar name={m} size={28} />
                              <div style={{ marginTop: 5, fontSize: 10, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.3 }}>{m.split(' ')[0]}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {goals.map(goal => (
                          <>
                            {/* Goal header row */}
                            <tr key={'goal-'+goal.id}>
                              <td colSpan={memberNames.length + 2}
                                style={{ padding: '10px 20px', background: `linear-gradient(90deg,${theme.primaryStart}18,${theme.primaryEnd}08)`, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primaryStart, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                  ◈ {goal.title}
                                </div>
                              </td>
                            </tr>

                            {goal.tactics.length === 0 && (
                              <tr key={'goal-empty-'+goal.id}>
                                <td colSpan={memberNames.length + 2} style={{ padding: '10px 20px 10px 36px', fontSize: 12, color: theme.textMuted, fontStyle: 'italic', borderBottom: `1px solid ${theme.cardBorder}` }}>
                                  No tactics yet
                                </td>
                              </tr>
                            )}

                            {goal.tactics.map((tactic, ti) => (
                              <>
                                {/* Tactic RACI row — fully interactive */}
                                <tr key={'tactic-'+tactic.id} style={{ background: ti % 2 === 0 ? theme.pageBg : theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                  <td style={{ padding: '12px 20px 12px 32px', position: 'sticky', left: 0, background: 'inherit', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: grad, flexShrink: 0 }} />
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{tactic.title}</div>
                                        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>Tactic · {tactic.tasks.length} task{tactic.tasks.length !== 1 ? 's' : ''}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                    {/* Tactics don't have status — show task count summary instead */}
                                    <span style={{ fontSize: 11, color: theme.textMuted, background: theme.pageBg, padding: '3px 10px', borderRadius: 99, border: `1px solid ${theme.cardBorder}` }}>
                                      {tactic.tasks.filter(t => t.status === 'Complete').length}/{tactic.tasks.length} done
                                    </span>
                                  </td>
                                  {memberNames.map(m => (
                                    <td key={m} style={{ padding: '12px 10px', textAlign: 'center' }}>
                                      <RACIBadge
                                        value={tactic.raci?.[m] || ''}
                                        onClick={() => cycleTacticRaci(tactic.id, m)}
                                        disabled={!canEdit}
                                      />
                                    </td>
                                  ))}
                                </tr>

                                {/* Task RACI rows */}
                                {tactic.tasks.map((task, tki) => (
                                  <tr key={'task-'+task.id} style={{ background: tki % 2 === 0 ? theme.cardBg : theme.pageBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                    <td style={{ padding: '10px 20px 10px 52px', position: 'sticky', left: 0, background: 'inherit', zIndex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <PriDot priority={task.priority} />
                                        <span style={{ fontSize: 13, color: theme.textPrimary }}>{task.title}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                                      <StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} />
                                    </td>
                                    {memberNames.map(m => (
                                      <td key={m} style={{ padding: '10px 10px', textAlign: 'center' }}>
                                        <RACIBadge
                                          value={task.raci?.[m] || ''}
                                          onClick={() => cycleTaskRaci(task.id, m)}
                                          disabled={!canEdit}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAdmin && isAdmin && <AdminConsole onClose={() => { setShowAdmin(false); fetchAll() }} />}
      {showThemeBuilder && <ThemeBuilder onClose={() => setShowThemeBuilder(false)} />}

      {modal === 'addGoal' && (
        <Modal title="New Strategic Goal" onClose={() => setModal(null)}>
          <Input label="Goal Title" value={newGoal.title} onChange={v => setNewGoal(f => ({ ...f, title: v }))} placeholder="e.g. Expand Clinical AI Adoption" autoFocus />
          <Input label="Description" value={newGoal.description} onChange={v => setNewGoal(f => ({ ...f, description: v }))} placeholder="Brief description…" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="secondary">Cancel</Btn>
            <Btn onClick={addGoal}>Add Goal</Btn>
          </div>
        </Modal>
      )}
      {modal === 'addTactic' && (
        <Modal title="New Tactic" onClose={() => setModal(null)}>
          {goals.length > 1 && <Select label="Under Goal" value={newTactic.goalId ?? goals[0]?.id} onChange={v => setNewTactic(f => ({ ...f, goalId: v }))} options={goals.map(g => ({ value: g.id, label: g.title }))} />}
          <Input label="Tactic Title" value={newTactic.title} onChange={v => setNewTactic(f => ({ ...f, title: v }))} placeholder="e.g. Physician Onboarding Program" autoFocus />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="secondary">Cancel</Btn>
            <Btn onClick={addTactic}>Add Tactic</Btn>
          </div>
        </Modal>
      )}
      {modal === 'addTask' && (
        <Modal title="New Task" onClose={() => setModal(null)}>
          <Input label="Task Title" value={newTask.title} onChange={v => setNewTask(f => ({ ...f, title: v }))} placeholder="e.g. Define onboarding pathway" autoFocus />
          <Select label="Priority" value={newTask.priority} onChange={v => setNewTask(f => ({ ...f, priority: v }))} options={PRIORITY} />
          <Input label="Due Date" type="date" value={newTask.due} onChange={v => setNewTask(f => ({ ...f, due: v }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="secondary">Cancel</Btn>
            <Btn onClick={addTask}>Add Task</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
