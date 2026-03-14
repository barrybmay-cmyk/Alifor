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
const RACI_DESC = {
  R: 'Does the work',
  A: 'Owns the outcome',
  C: 'Provides input',
  I: 'Kept informed',
}
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Blocked']
const STATUS_COLORS = { 'Not Started': '#94a3b8', 'In Progress': '#4815E1', 'Complete': '#0a7c6e', 'Blocked': '#dc2626' }
const PRIORITY = ['High', 'Medium', 'Low']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#0a7c6e' }

// ── RACI Assign Modal ─────────────────────────────────────────────────────────
function RACIAssignModal({ task, members, onUpdate, onClose, theme, canEdit }) {
  const [raci, setRaci] = useState(task.raci || {})
  const [saving, setSaving] = useState(false)

  const ff = `'${theme.bodyFont}',sans-serif`
  const grad = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryEnd})`

  async function handleSet(member, role) {
    if (!canEdit) return
    const newRaci = { ...raci, [member]: role === raci[member] ? '' : role }
    setRaci(newRaci)
    setSaving(true)
    await supabase.from('tasks').update({ raci: newRaci }).eq('id', task.id)
    onUpdate(task.id, newRaci)
    setSaving(false)
  }

  const assigned = Object.entries(raci).filter(([, v]) => v)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.cardBg, borderRadius: 20, width: 520, maxWidth: '94vw', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(72,21,225,0.18)', border: `1px solid ${theme.cardBorder}`, fontFamily: ff }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${theme.primaryStart}18,${theme.primaryEnd}08)`, padding: '20px 24px', borderBottom: `1px solid ${theme.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.primaryStart, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>RACI Assignment</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>{task.title}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {assigned.length === 0
                  ? <span style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>No roles assigned yet</span>
                  : assigned.map(([m, r]) => (
                    <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 5, background: RACI_COLORS[r]+'18', border: `1px solid ${RACI_COLORS[r]}44`, borderRadius: 99, padding: '2px 10px', fontSize: 11, color: RACI_COLORS[r], fontWeight: 600 }}>
                      <span style={{ fontWeight: 800 }}>{r}</span> {m.split(' ')[0]}
                    </span>
                  ))
                }
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>

        {/* RACI legend */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 24px', background: theme.pageBg, borderBottom: `1px solid ${theme.cardBorder}`, flexWrap: 'wrap' }}>
          {Object.entries(RACI_LABELS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: RACI_COLORS[k]+'22', color: RACI_COLORS[k], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>{k}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textPrimary }}>{v}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>{RACI_DESC[k]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Members list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted, fontSize: 13 }}>
              No team members yet. Add users in the Admin Console first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {members.map(member => {
                const currentRole = raci[member.name || member.email] || ''
                const key = member.name || member.email
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${currentRole ? RACI_COLORS[currentRole]+'44' : theme.cardBorder}`, background: currentRole ? RACI_COLORS[currentRole]+'08' : theme.pageBg, transition: 'all 0.2s' }}>
                    <Avatar name={key} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.textPrimary }}>{key}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{member.title || member.role}</div>
                    </div>

                    {/* R A C I buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['R', 'A', 'C', 'I'].map(role => (
                        <button
                          key={role}
                          onClick={() => handleSet(key, role)}
                          disabled={!canEdit}
                          title={`${RACI_LABELS[role]} — ${RACI_DESC[role]}`}
                          style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: currentRole === role ? RACI_COLORS[role] : 'transparent',
                            color: currentRole === role ? '#fff' : RACI_COLORS[role],
                            border: `2px solid ${currentRole === role ? RACI_COLORS[role] : RACI_COLORS[role]+'44'}`,
                            fontWeight: 800, fontSize: 13,
                            cursor: canEdit ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          onMouseOver={e => { if (canEdit && currentRole !== role) { e.currentTarget.style.background = RACI_COLORS[role]+'22'; e.currentTarget.style.borderColor = RACI_COLORS[role] }}}
                          onMouseOut={e => { if (currentRole !== role) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = RACI_COLORS[role]+'44' }}}
                        >
                          {role}
                        </button>
                      ))}
                      {/* Clear button */}
                      {currentRole && (
                        <button onClick={() => handleSet(key, currentRole)} disabled={!canEdit}
                          title="Clear assignment"
                          style={{ width: 38, height: 38, borderRadius: 10, background: 'transparent', color: '#94a3b8', border: '1.5px dashed #d1d5db', fontWeight: 600, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${theme.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.pageBg }}>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            {saving ? '💾 Saving…' : assigned.length > 0 ? `✓ ${assigned.length} role${assigned.length !== 1 ? 's' : ''} assigned` : 'Click R, A, C or I to assign a role'}
          </div>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 10, background: grad, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: ff }}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ── Inline RACI summary chips shown on each task row ──────────────────────────
function RACIChips({ raci, members }) {
  const assigned = members
    .map(m => ({ name: m.name || m.email, role: (raci || {})[m.name || m.email] }))
    .filter(x => x.role)
  if (assigned.length === 0) return <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>No roles</span>
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {assigned.map(({ name, role }) => (
        <span key={name} title={`${name} — ${RACI_LABELS[role]}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: RACI_COLORS[role]+'18', border: `1px solid ${RACI_COLORS[role]}44`, borderRadius: 99, padding: '2px 8px', fontSize: 10, color: RACI_COLORS[role], fontWeight: 700 }}>
          {role} <span style={{ fontWeight: 400, opacity: 0.8 }}>{name.split(' ')[0]}</span>
        </span>
      ))}
    </div>
  )
}

// ── Matrix RACI cell ──────────────────────────────────────────────────────────
function RACICell({ value, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      title={value ? `${RACI_LABELS[value]} — click to change` : 'Click to assign'}
      style={{
        width: 38, height: 38, borderRadius: 10,
        background: value ? RACI_COLORS[value] : 'transparent',
        color: value ? '#fff' : '#d1d5db',
        border: value ? `2px solid ${RACI_COLORS[value]}` : '1.5px dashed #d1d5db',
        fontWeight: 800, fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseOver={e => { if (!disabled && !value) { e.currentTarget.style.borderColor = '#9333ea80'; e.currentTarget.style.color = '#9333ea' }}}
      onMouseOut={e => { if (!value) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#d1d5db' }}}
    >
      {value || '+'}
    </button>
  )
}

function StatusPill({ status, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ padding: '4px 12px', borderRadius: 99, border: 'none', background: STATUS_COLORS[status]+'18', color: STATUS_COLORS[status], fontSize: 11, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
      {status}
    </button>
  )
}

function PriDot({ priority }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[priority], marginRight: 8, flexShrink: 0 }} />
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile: currentUser, signOut } = useAuth()
  const { theme } = useTheme()
  const [view, setView] = useState('strategy')
  const [showAdmin, setShowAdmin] = useState(false)
  const [showThemeBuilder, setShowThemeBuilder] = useState(false)
  const [assigningTask, setAssigningTask] = useState(null)
  const [users, setUsers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedGoals, setExpandedGoals] = useState({})
  const [expandedTactics, setExpandedTactics] = useState({})
  const [modal, setModal] = useState(null)
  const [newGoal, setNewGoal] = useState({ title: '', description: '' })
  const [newTactic, setNewTactic] = useState({ title: '', goalId: null })
  const [newTask, setNewTask] = useState({ title: '', priority: 'High', due: '', tacticId: null })

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'editor'
  const isAdmin = currentUser?.role === 'admin'

  const grad3 = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryMid||theme.primaryEnd},${theme.primaryEnd})`
  const grad = `linear-gradient(135deg,${theme.primaryStart},${theme.primaryEnd})`
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
          tasks: (t.tasks || [])
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(tk => ({ ...tk, raci: tk.raci || {} }))
        }))
    }))
    setGoals(sorted)
    setLoading(false)
  }

  const allTasks = goals.flatMap(g => g.tactics.flatMap(t => t.tasks))
  const memberNames = users.map(u => u.name || u.email)
  const statCounts = STATUS_OPTIONS.reduce((a, s) => ({ ...a, [s]: allTasks.filter(t => t.status === s).length }), {})
  const pct = allTasks.length ? Math.round(statCounts['Complete'] / allTasks.length * 100) : 0

  // Update RACI in local state after modal save
  function handleRaciUpdate(taskId, newRaci) {
    setGoals(gs => gs.map(g => ({
      ...g,
      tactics: g.tactics.map(t => ({
        ...t,
        tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, raci: newRaci } : tk)
      }))
    })))
    // Update assigningTask so modal reflects latest
    setAssigningTask(prev => prev?.id === taskId ? { ...prev, raci: newRaci } : prev)
  }

  // Matrix RACI cycle
  async function cycleMatrixRaci(taskId, member) {
    if (!canEdit) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    const raci = task.raci || {}
    const cur = raci[member] || ''
    const next = RACI_OPTIONS[(RACI_OPTIONS.indexOf(cur) + 1) % RACI_OPTIONS.length]
    const newRaci = { ...raci, [member]: next }
    await supabase.from('tasks').update({ raci: newRaci }).eq('id', taskId)
    handleRaciUpdate(taskId, newRaci)
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
  }

  async function addGoal() {
    if (!newGoal.title.trim()) return
    const { data } = await supabase.from('goals').insert({ title: newGoal.title, description: newGoal.description }).select().single()
    if (data) setGoals(gs => [...gs, { ...data, tactics: [] }])
    setNewGoal({ title: '', description: '' }); setModal(null)
  }

  async function addTactic() {
    if (!newTactic.title.trim()) return
    const goalId = newTactic.goalId || goals[0]?.id
    const { data } = await supabase.from('tactics').insert({ title: newTactic.title, goal_id: goalId, raci: {} }).select().single()
    if (data) setGoals(gs => gs.map(g => g.id !== goalId ? g : { ...g, tactics: [...g.tactics, { ...data, raci: {}, tasks: [] }] }))
    setNewTactic({ title: '', goalId: null }); setModal(null)
  }

  async function addTask() {
    if (!newTask.title.trim()) return
    const raci = memberNames.reduce((a, m) => ({ ...a, [m]: '' }), {})
    const { data } = await supabase.from('tasks').insert({ title: newTask.title, priority: newTask.priority, due_date: newTask.due || null, tactic_id: newTask.tacticId, status: 'Not Started', raci }).select().single()
    if (data) setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => t.id !== newTask.tacticId ? t : { ...t, tasks: [...t.tasks, { ...data, raci }] }) })))
    setNewTask({ title: '', priority: 'High', due: '', tacticId: null }); setModal(null)
  }

  async function deleteGoal(id) { await supabase.from('goals').delete().eq('id', id); setGoals(gs => gs.filter(g => g.id !== id)) }
  async function deleteTactic(id) { await supabase.from('tactics').delete().eq('id', id); setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.filter(t => t.id !== id) }))) }
  async function deleteTask(id) { await supabase.from('tasks').delete().eq('id', id); setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => ({ ...t, tasks: t.tasks.filter(tk => tk.id !== id) })) }))) }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'strategy',  label: 'Strategy',  icon: '◎' },
    { id: 'raci',      label: 'RACI Matrix', icon: '⊞' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg, fontFamily: ff }}>
      <div style={{ textAlign: 'center' }}>
        <img src={theme.logoUrl || '/alifor-logo.svg'} alt={theme.appName} style={{ height: 28, marginBottom: 16 }} onError={e => e.target.style.display='none'} />
        <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading workspace…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.pageBg, fontFamily: ff, color: theme.textPrimary }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: parseInt(theme.sidebarWidth), background: theme.sidebarBg, display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #1e1033' }}>
          <img src="/alifor-logo.svg" alt={theme.appName} style={{ height: 22, marginBottom: 6, display: 'block' }} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block' }} />
          <div style={{ display: 'none', fontSize: 20, fontWeight: 800, background: grad3, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{theme.appName}</div>
          <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500 }}>{theme.appTagline}</div>
        </div>

        <nav style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10 }}>Workspace</div>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: radius, border: 'none', background: view === n.id ? theme.primaryStart+'25' : 'transparent', color: view === n.id ? (theme.sidebarActiveText||theme.primaryMid||'#B841E3') : '#64748b', fontSize: 13, fontWeight: view === n.id ? 600 : 500, cursor: 'pointer', marginBottom: 2, textAlign: 'left', fontFamily: ff }}>
              <span>{n.icon}</span> {n.label}
              {view === n.id && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: theme.sidebarActiveText||'#B841E3' }} />}
            </button>
          ))}

          {isAdmin && <>
            <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Admin</div>
            <button onClick={() => setShowAdmin(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: radius, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
              🛡 Admin Console
            </button>
          </>}

          <div style={{ fontSize: 10, color: '#6d5fa0', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Team ({users.length})</div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: radius, background: u.id === currentUser?.id ? '#ffffff08' : 'transparent' }}>
              <Avatar name={u.name||u.email} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: u.id === currentUser?.id ? '#e2e8f0' : '#94a3b8', fontWeight: u.id === currentUser?.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name||u.email}</div>
              </div>
              <RoleBadge role={u.role} />
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1033' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={currentUser?.name||'?'} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
              <div style={{ fontSize: 10, color: '#6d5fa0' }}>{currentUser?.title}</div>
            </div>
          </div>
          <button onClick={() => setShowThemeBuilder(true)} style={{ width: '100%', padding: '7px 12px', borderRadius: radius, background: theme.primaryStart+'20', border: `1px solid ${theme.primaryStart}40`, color: theme.sidebarActiveText||'#B841E3', fontSize: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: ff, fontWeight: 600 }}>
            🎨 Visual Builder
          </button>
          <button onClick={signOut} style={{ width: '100%', padding: '7px 12px', borderRadius: radius, background: '#1e293b', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: ff }}>
            ← Sign out
          </button>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div style={{ marginLeft: parseInt(theme.sidebarWidth), minHeight: '100vh' }}>
        <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{navItems.find(n => n.id === view)?.label}</div>
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
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>Command Overview</h2>
              <p style={{ margin: '0 0 28px', color: theme.textMuted, fontSize: 14 }}>Strategic performance across all clinical initiatives</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 28 }}>
                {[['📋','Total Tasks',allTasks.length,theme.primaryStart],['✓','Complete',statCounts['Complete'],'#0a7c6e'],['⟳','In Progress',statCounts['In Progress'],theme.primaryEnd],['!','Blocked',statCounts['Blocked'],'#dc2626']].map(([icon,l,v,c]) => (
                  <div key={l} style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: radius*0.8, background: c+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
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
                const gp = gTasks.length ? Math.round(done/gTasks.length*100) : 0
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
                      {goal.tactics.map(t => <span key={t.id} style={{ background: theme.pageBg, border: `1px solid ${theme.cardBorder}`, padding: '3px 10px', borderRadius: 99, fontSize: 11, color: theme.textMuted }}>{t.title} · {t.tasks.length}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STRATEGY ── */}
          {view === 'strategy' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>Strategic Goals</h2>
              <p style={{ margin: '0 0 28px', color: theme.textMuted, fontSize: 14 }}>
                {canEdit ? 'Click 👥 Assign on any task to set RACI roles for each team member.' : 'Read-only access'}
              </p>

              {goals.map(goal => (
                <div key={goal.id} style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, marginBottom: 20, overflow: 'hidden' }}>
                  {/* Goal header */}
                  <div onClick={() => setExpandedGoals(e => ({ ...e, [goal.id]: !e[goal.id] }))}
                    style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: theme.pageBg, borderBottom: expandedGoals[goal.id] ? `1.5px solid ${theme.cardBorder}` : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: radius*0.7, background: grad3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
                      {expandedGoals[goal.id] ? '▾' : '▸'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{goal.title}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{goal.description}</div>
                    </div>
                    {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <Btn small variant="secondary" onClick={() => { setNewTactic({ title: '', goalId: goal.id }); setModal('addTactic') }}>+ Tactic</Btn>
                      <Btn small variant="danger" onClick={() => deleteGoal(goal.id)}>✕</Btn>
                    </div>}
                  </div>

                  {/* Tactics */}
                  {expandedGoals[goal.id] && goal.tactics.map(tactic => (
                    <div key={tactic.id}>
                      {/* Tactic header */}
                      <div onClick={() => setExpandedTactics(e => ({ ...e, [tactic.id]: !e[tactic.id] }))}
                        style={{ padding: '11px 22px 11px 52px', display: 'flex', alignItems: 'center', gap: 10, background: theme.cardBg, cursor: 'pointer', borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: grad, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{tactic.title}</div>
                        <span style={{ fontSize: 11, color: theme.textMuted }}>{tactic.tasks.length} task{tactic.tasks.length !== 1 ? 's' : ''}</span>
                        {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                          <Btn small variant="ghost" onClick={() => { setNewTask({ title: '', priority: 'High', due: '', tacticId: tactic.id }); setModal('addTask') }}>+ Task</Btn>
                          <Btn small variant="danger" onClick={() => deleteTactic(tactic.id)}>✕</Btn>
                        </div>}
                      </div>

                      {/* Tasks */}
                      {expandedTactics[tactic.id] && (
                        <div>
                          {tactic.tasks.length === 0 && (
                            <div style={{ padding: '14px 76px', fontSize: 12, color: theme.textMuted, fontStyle: 'italic', borderBottom: `1px solid ${theme.cardBorder}` }}>
                              No tasks yet — click + Task above
                            </div>
                          )}
                          {tactic.tasks.map((task, ti) => (
                            <div key={task.id} style={{ padding: '12px 22px 12px 72px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${theme.cardBorder}`, background: ti % 2 ? theme.cardBg : theme.pageBg, flexWrap: 'wrap' }}>
                              <PriDot priority={task.priority} />

                              {/* Task name + due */}
                              <div style={{ minWidth: 160, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                                {task.due_date && <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Due {task.due_date}</div>}
                              </div>

                              {/* RACI chips */}
                              <div style={{ flex: 1, minWidth: 120 }}>
                                <RACIChips raci={task.raci} members={users} />
                              </div>

                              {/* Status + Priority + Assign */}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                <StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                                {canEdit && (
                                  <button
                                    onClick={() => setAssigningTask(task)}
                                    title="Assign RACI roles"
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: grad3, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff }}>
                                    👥 Assign
                                  </button>
                                )}
                                {canEdit && <Btn small variant="danger" style={{ padding: '4px 8px' }} onClick={() => deleteTask(task.id)}>✕</Btn>}
                              </div>
                            </div>
                          ))}
                        </div>
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
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>RACI Matrix</h2>
              <p style={{ margin: '0 0 16px', color: theme.textMuted, fontSize: 14 }}>
                {canEdit
                  ? 'Click any cell to cycle R → A → C → I → clear. Or click 👥 Assign for a full assignment view.'
                  : 'Read-only view'}
              </p>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {Object.entries(RACI_LABELS).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: 10, padding: '6px 14px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: RACI_COLORS[k], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' }}>{k}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{v}</div>
                      <div style={{ fontSize: 10, color: theme.textMuted }}>{RACI_DESC[k]}</div>
                    </div>
                  </div>
                ))}
              </div>

              {memberNames.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: radius, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
                  ⚠ No active team members found. Add users in the Admin Console to assign RACI roles.
                </div>
              )}

              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>No goals yet</div>
              ) : (
                <div style={{ background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, borderRadius: radius, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: theme.pageBg, borderBottom: `2px solid ${theme.cardBorder}` }}>
                          <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 240 }}>Task</th>
                          <th style={{ padding: '14px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: theme.textMuted, minWidth: 120, textTransform: 'uppercase', letterSpacing: 0.8 }}>Status</th>
                          {canEdit && <th style={{ padding: '14px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: theme.textMuted, minWidth: 80 }}>Assign</th>}
                          {memberNames.map(m => (
                            <th key={m} style={{ padding: '14px 10px', textAlign: 'center', minWidth: 80 }}>
                              <Avatar name={m} size={28} />
                              <div style={{ marginTop: 4, fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>{m.split(' ')[0]}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {goals.map(goal => (
                          <>
                            {/* Goal row */}
                            <tr key={'g-'+goal.id}>
                              <td colSpan={memberNames.length + (canEdit ? 3 : 2)} style={{ padding: '10px 20px', background: `linear-gradient(90deg,${theme.primaryStart}15,transparent)`, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: theme.primaryStart, textTransform: 'uppercase', letterSpacing: 1 }}>◈ {goal.title}</span>
                              </td>
                            </tr>

                            {goal.tactics.map(tactic => (
                              <>
                                {/* Tactic row */}
                                <tr key={'t-'+tactic.id}>
                                  <td colSpan={memberNames.length + (canEdit ? 3 : 2)} style={{ padding: '8px 20px 8px 32px', background: theme.pageBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.primaryEnd }}>◎ {tactic.title}</span>
                                    <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 8 }}>{tactic.tasks.length} task{tactic.tasks.length !== 1 ? 's' : ''}</span>
                                  </td>
                                </tr>

                                {tactic.tasks.length === 0 && (
                                  <tr key={'t-empty-'+tactic.id}>
                                    <td colSpan={memberNames.length + (canEdit ? 3 : 2)} style={{ padding: '10px 20px 10px 52px', fontSize: 12, color: theme.textMuted, fontStyle: 'italic', borderBottom: `1px solid ${theme.cardBorder}` }}>
                                      No tasks — add tasks in the Strategy view
                                    </td>
                                  </tr>
                                )}

                                {/* Task rows */}
                                {tactic.tasks.map((task, ti) => (
                                  <tr key={'tk-'+task.id} style={{ background: ti % 2 ? theme.cardBg : theme.pageBg, borderBottom: `1px solid ${theme.cardBorder}` }}>
                                    <td style={{ padding: '12px 20px 12px 52px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <PriDot priority={task.priority} />
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</div>
                                          {task.due_date && <div style={{ fontSize: 10, color: theme.textMuted }}>Due {task.due_date}</div>}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                      <StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} />
                                    </td>
                                    {canEdit && (
                                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                        <button onClick={() => setAssigningTask(task)}
                                          title="Assign RACI roles"
                                          style={{ padding: '5px 10px', borderRadius: 8, background: grad3, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff }}>
                                          👥
                                        </button>
                                      </td>
                                    )}
                                    {memberNames.map(m => (
                                      <td key={m} style={{ padding: '12px 10px', textAlign: 'center' }}>
                                        <RACICell
                                          value={task.raci?.[m] || ''}
                                          onClick={() => cycleMatrixRaci(task.id, m)}
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

      {/* ── Overlays ── */}
      {assigningTask && (
        <RACIAssignModal
          task={assigningTask}
          members={users}
          onUpdate={handleRaciUpdate}
          onClose={() => setAssigningTask(null)}
          theme={theme}
          canEdit={canEdit}
        />
      )}
      {showAdmin && isAdmin && <AdminConsole onClose={() => { setShowAdmin(false); fetchAll() }} />}
      {showThemeBuilder && <ThemeBuilder onClose={() => setShowThemeBuilder(false)} />}

      {/* ── Modals ── */}
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
