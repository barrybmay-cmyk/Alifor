import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Avatar, RoleBadge, Btn, Input, Select, Modal } from '../components/UI'
import AdminConsole from './AdminConsole'

const RACI_OPTIONS = ['R', 'A', 'C', 'I', '']
const RACI_LABELS = { R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed' }
const RACI_COLORS = { R: '#0a7c6e', A: '#0e6ba8', C: '#7c3aed', I: '#d97706' }
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Blocked']
const STATUS_COLORS = { 'Not Started': '#94a3b8', 'In Progress': '#0e6ba8', 'Complete': '#0a7c6e', 'Blocked': '#dc2626' }
const PRIORITY = ['High', 'Medium', 'Low']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#0a7c6e' }

const uid = () => Math.floor(Math.random() * 1e9)

function RACIBadge({ value, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} title={RACI_LABELS[value] || 'Assign'}
      style={{ width: 34, height: 34, borderRadius: 6, background: value ? RACI_COLORS[value] + '20' : 'transparent', color: value ? RACI_COLORS[value] : '#cbd5e1', border: value ? `1.5px solid ${RACI_COLORS[value]}50` : '1.5px dashed #e2e8f044', fontWeight: 700, fontSize: 12, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s' }}>
      {value || '·'}
    </button>
  )
}

function StatusPill({ status, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ padding: '3px 11px', borderRadius: 99, border: 'none', background: STATUS_COLORS[status] + '18', color: STATUS_COLORS[status], fontSize: 11, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
      {status}
    </button>
  )
}

function PriDot({ priority }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[priority], marginRight: 7, flexShrink: 0 }} />
}

export default function DashboardPage() {
  const { profile: currentUser, signOut } = useAuth()
  const [view, setView] = useState('strategy')
  const [showAdmin, setShowAdmin] = useState(false)
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

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: profilesData }, { data: goalsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true),
      supabase.from('goals').select(`*, tactics(*, tasks(*))`).order('created_at'),
    ])
    setUsers(profilesData || [])
    // Sort nested
    const sorted = (goalsData || []).map(g => ({
      ...g,
      tactics: (g.tactics || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(t => ({
        ...t,
        tasks: (t.tasks || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      }))
    }))
    setGoals(sorted)
    setLoading(false)
  }

  const memberNames = users.map(u => u.name || u.email)
  const allTasks = goals.flatMap(g => g.tactics.flatMap(t => t.tasks))
  const statCounts = STATUS_OPTIONS.reduce((a, s) => ({ ...a, [s]: allTasks.filter(t => t.status === s).length }), {})
  const pct = allTasks.length ? Math.round(statCounts['Complete'] / allTasks.length * 100) : 0

  async function logActivity(action_type, description) {
    await supabase.from('activity_logs').insert({ user_id: currentUser.id, user_name: currentUser.name, user_email: currentUser.email, action_type, description })
  }

  async function cycleRaci(taskId, member) {
    if (!canEdit) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    const raci = task.raci || {}
    const cur = raci[member] || ''
    const next = RACI_OPTIONS[(RACI_OPTIONS.indexOf(cur) + 1) % RACI_OPTIONS.length]
    const newRaci = { ...raci, [member]: next }
    await supabase.from('tasks').update({ raci: newRaci }).eq('id', taskId)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => ({ ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, raci: newRaci } : tk) })) })))
  }

  async function cycleStatus(taskId) {
    if (!canEdit) return
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    const nextStatus = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(task.status) + 1) % STATUS_OPTIONS.length]
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId)
    await logActivity('update', `Updated task "${task.title}" → ${nextStatus}`)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => ({ ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, status: nextStatus } : tk) })) })))
  }

  async function addGoal() {
    if (!newGoal.title.trim()) return
    const { data } = await supabase.from('goals').insert({ title: newGoal.title, description: newGoal.description }).select().single()
    if (data) { setGoals(gs => [...gs, { ...data, tactics: [] }]); await logActivity('create', `Created goal "${data.title}"`) }
    setNewGoal({ title: '', description: '' }); setModal(null)
  }

  async function addTactic() {
    if (!newTactic.title.trim()) return
    const goalId = newTactic.goalId || goals[0]?.id
    const { data } = await supabase.from('tactics').insert({ title: newTactic.title, goal_id: goalId }).select().single()
    if (data) {
      setGoals(gs => gs.map(g => g.id !== goalId ? g : { ...g, tactics: [...g.tactics, { ...data, tasks: [] }] }))
      await logActivity('create', `Added tactic "${data.title}"`)
    }
    setNewTactic({ title: '', goalId: null }); setModal(null)
  }

  async function addTask() {
    if (!newTask.title.trim()) return
    const raci = memberNames.reduce((a, m) => ({ ...a, [m]: '' }), {})
    const { data } = await supabase.from('tasks').insert({ title: newTask.title, priority: newTask.priority, due_date: newTask.due || null, tactic_id: newTask.tacticId, status: 'Not Started', raci }).select().single()
    if (data) {
      setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => t.id !== newTask.tacticId ? t : { ...t, tasks: [...t.tasks, data] }) })))
      await logActivity('create', `Added task "${data.title}"`)
    }
    setNewTask({ title: '', priority: 'High', due: '', tacticId: null }); setModal(null)
  }

  async function deleteGoal(id, title) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(gs => gs.filter(g => g.id !== id))
    await logActivity('delete', `Deleted goal "${title}"`)
  }

  async function deleteTactic(id, title) {
    await supabase.from('tactics').delete().eq('id', id)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.filter(t => t.id !== id) })))
    await logActivity('delete', `Deleted tactic "${title}"`)
  }

  async function deleteTask(id, title) {
    await supabase.from('tasks').delete().eq('id', id)
    setGoals(gs => gs.map(g => ({ ...g, tactics: g.tactics.map(t => ({ ...t, tasks: t.tasks.filter(tk => tk.id !== id) })) })))
    await logActivity('delete', `Deleted task "${title}"`)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'strategy', label: 'Strategy', icon: '◎' },
    { id: 'raci', label: 'RACI Matrix', icon: '⊞' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, background: 'linear-gradient(135deg,#0a7c6e,#0e6ba8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>Alifor</div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading workspace…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '26px 24px 18px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg,#2dd4bf,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Alifor</div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 2, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 500 }}>Clinical Operating System</div>
        </div>

        <nav style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#334155', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10 }}>Workspace</div>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: view === n.id ? '#ffffff12' : 'transparent', color: view === n.id ? '#2dd4bf' : '#64748b', fontSize: 13, fontWeight: view === n.id ? 600 : 500, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
              <span>{n.icon}</span> {n.label}
              {view === n.id && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#2dd4bf' }} />}
            </button>
          ))}

          {isAdmin && <>
            <div style={{ fontSize: 10, color: '#334155', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Admin</div>
            <button onClick={() => setShowAdmin(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
              🛡 Admin Console
            </button>
          </>}

          <div style={{ fontSize: 10, color: '#334155', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, paddingLeft: 10, marginTop: 20 }}>Team ({users.length})</div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: u.id === currentUser?.id ? '#ffffff08' : 'transparent' }}>
              <Avatar name={u.name || u.email} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: u.id === currentUser?.id ? '#e2e8f0' : '#94a3b8', fontWeight: u.id === currentUser?.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.email}</div>
              </div>
              <RoleBadge role={u.role} />
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={currentUser?.name || currentUser?.email || '?'} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{currentUser?.title}</div>
            </div>
          </div>
          <button onClick={signOut} style={{ width: '100%', padding: '7px 12px', borderRadius: 8, background: '#1e293b', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>← Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 240, minHeight: '100vh' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{navItems.find(n => n.id === view)?.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{allTasks.length} tasks · {pct}% complete · <RoleBadge role={currentUser?.role} /></div>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn small variant="secondary" onClick={() => { setNewTactic({ title: '', goalId: goals[0]?.id }); setModal('addTactic') }}>+ Tactic</Btn>
              <Btn small onClick={() => setModal('addGoal')}>+ Strategic Goal</Btn>
            </div>
          )}
        </div>

        <div style={{ padding: 32 }}>
          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontFamily: "'Playfair Display',serif", fontSize: 26 }}>Command Overview</h2>
              <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: 14 }}>Strategic performance across all clinical initiatives</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 28 }}>
                {[['📋','Total Tasks',allTasks.length,'#0e6ba8'],['✓','Complete',statCounts['Complete'],'#0a7c6e'],['⟳','In Progress',statCounts['In Progress'],'#0e6ba8'],['!','Blocked',statCounts['Blocked'],'#dc2626']].map(([icon,l,v,c]) => (
                  <div key={l} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c+'18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: c, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 26px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Completion</span>
                  <span style={{ fontWeight: 800, color: '#0a7c6e', fontSize: 18, fontFamily: "'Playfair Display',serif" }}>{pct}%</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg,#0a7c6e,#0e6ba8,#2dd4bf)', height: '100%', width: pct+'%', borderRadius: 99, transition: 'width 0.6s' }} />
                </div>
              </div>
              {goals.map(goal => {
                const gTasks = goal.tactics.flatMap(t => t.tasks)
                const done = gTasks.filter(t => t.status === 'Complete').length
                const gp = gTasks.length ? Math.round(done / gTasks.length * 100) : 0
                return (
                  <div key={goal.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{goal.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{goal.description}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0a7c6e', fontFamily: "'Playfair Display',serif" }}>{gp}%</div>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 5, marginBottom: 12 }}>
                      <div style={{ background: 'linear-gradient(90deg,#0a7c6e,#0e6ba8)', height: '100%', width: gp+'%', borderRadius: 99 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {goal.tactics.map(t => <span key={t.id} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 99, fontSize: 11, color: '#64748b' }}>{t.title} · {t.tasks.length}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* STRATEGY */}
          {view === 'strategy' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontFamily: "'Playfair Display',serif", fontSize: 26 }}>Strategic Goals</h2>
              <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: 14 }}>Goals → Tactics → Tasks{!canEdit && ' · Read-only access'}</p>
              {goals.map(goal => (
                <div key={goal.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, marginBottom: 20, overflow: 'hidden' }}>
                  <div onClick={() => setExpandedGoals(e => ({ ...e, [goal.id]: !e[goal.id] }))}
                    style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: '#fafcff', borderBottom: expandedGoals[goal.id] ? '1.5px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#0a7c6e,#0e6ba8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                      {expandedGoals[goal.id] ? '▾' : '▸'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700 }}>{goal.title}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{goal.description}</div>
                    </div>
                    {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <Btn small variant="secondary" onClick={() => { setNewTactic({ title: '', goalId: goal.id }); setModal('addTactic') }}>+ Tactic</Btn>
                      <Btn small variant="danger" onClick={() => deleteGoal(goal.id, goal.title)}>✕</Btn>
                    </div>}
                  </div>
                  {expandedGoals[goal.id] && goal.tactics.map(tactic => (
                    <div key={tactic.id}>
                      <div onClick={() => setExpandedTactics(e => ({ ...e, [tactic.id]: !e[tactic.id] }))}
                        style={{ padding: '11px 22px 11px 52px', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0e6ba8', flexShrink: 0 }} />
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#334155' }}>{tactic.title}</div>
                        {canEdit && <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                          <Btn small variant="ghost" onClick={() => { setNewTask({ title: '', priority: 'High', due: '', tacticId: tactic.id }); setModal('addTask') }}>+ Task</Btn>
                          <Btn small variant="danger" onClick={() => deleteTactic(tactic.id, tactic.title)}>✕</Btn>
                        </div>}
                      </div>
                      {expandedTactics[tactic.id] && tactic.tasks.map((task, ti) => (
                        <div key={task.id} style={{ padding: '10px 22px 10px 76px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f8fafc', background: ti % 2 ? '#fff' : '#fafcff' }}>
                          <PriDot priority={task.priority} />
                          <div style={{ flex: 1, fontSize: 13 }}>{task.title}</div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} />
                            {task.due_date && <span style={{ fontSize: 11, color: '#94a3b8' }}>{task.due_date}</span>}
                            <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                          </div>
                          {canEdit && <Btn small variant="danger" style={{ padding: '3px 8px' }} onClick={() => deleteTask(task.id, task.title)}>✕</Btn>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              {goals.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#cbd5e1' }}>No goals yet — click <strong style={{ color: '#0a7c6e' }}>+ Strategic Goal</strong> to begin</div>}
            </div>
          )}

          {/* RACI */}
          {view === 'raci' && (
            <div>
              <h2 style={{ margin: '0 0 4px', fontFamily: "'Playfair Display',serif", fontSize: 26 }}>RACI Matrix</h2>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>{canEdit ? 'Click any cell to cycle: R → A → C → I' : 'Read-only view'}</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {Object.entries(RACI_LABELS).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '5px 12px' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: RACI_COLORS[k]+'20', color: RACI_COLORS[k], border: `1.5px solid ${RACI_COLORS[k]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{k}</div>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 240 }}>Task</th>
                        <th style={{ padding: '13px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#64748b', minWidth: 110 }}>Status</th>
                        {memberNames.map(m => (
                          <th key={m} style={{ padding: '13px 10px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 90 }}>
                            <Avatar name={m} size={24} />
                            <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>{m.split(' ')[0]}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map(goal => (
                        <>
                          <tr key={'g'+goal.id} style={{ background: 'linear-gradient(90deg,#f0fdf9,#f0f7ff)' }}>
                            <td colSpan={memberNames.length + 2} style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, color: '#0a7c6e', letterSpacing: 1, textTransform: 'uppercase' }}>◈ {goal.title}</td>
                          </tr>
                          {goal.tactics.flatMap(tactic => [
                            <tr key={'t'+tactic.id} style={{ background: '#f8fafc' }}>
                              <td colSpan={memberNames.length + 2} style={{ padding: '7px 20px 7px 34px', fontSize: 12, fontWeight: 600, color: '#0e6ba8' }}>◎ {tactic.title}</td>
                            </tr>,
                            ...tactic.tasks.map((task, ti) => (
                              <tr key={task.id} style={{ background: ti % 2 ? '#fff' : '#fafcff', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '11px 20px 11px 52px', fontSize: 13 }}><PriDot priority={task.priority} />{task.title}</td>
                                <td style={{ padding: '11px 10px', textAlign: 'center' }}><StatusPill status={task.status} onClick={() => cycleStatus(task.id)} disabled={!canEdit} /></td>
                                {memberNames.map(m => (
                                  <td key={m} style={{ padding: '11px 10px', textAlign: 'center' }}>
                                    <RACIBadge value={task.raci?.[m] || ''} onClick={() => cycleRaci(task.id, m)} disabled={!canEdit} />
                                  </td>
                                ))}
                              </tr>
                            ))
                          ])}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdmin && isAdmin && <AdminConsole onClose={() => { setShowAdmin(false); fetchAll() }} />}

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
