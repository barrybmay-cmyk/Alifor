import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Avatar, RoleBadge, Btn, Input, Select, Modal, AlertBanner, ROLE_META } from '../components/UI'

const ROLES = ['admin', 'editor', 'viewer']

export default function AdminConsole({ onClose }) {
  const { profile: currentUser } = useAuth()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor', title: '' })
  const [editForm, setEditForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers(); fetchLogs() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setUsers(data || [])
    setLoading(false)
  }

  async function fetchLogs() {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(30)
    setLogs(data || [])
  }

  async function createUser() {
    setFormError(''); setFormSuccess(''); setSaving(true)
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are required.'); setSaving(false); return
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.'); setSaving(false); return
    }
    // Create auth user via Supabase admin (uses service role in edge function or direct)
    // For simplicity, we use signUp + immediate profile insert
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: { name: form.name }
    })
    if (authError) {
      // Fallback: insert profile with a placeholder (user must be created via Supabase dashboard or invite)
      setFormError('Note: To create users you need a Supabase service role key configured. Please invite users via Supabase Auth dashboard, then their profile will appear here automatically.')
      setSaving(false); return
    }
    await supabase.from('profiles').upsert({ id: authData.user.id, name: form.name, email: form.email, role: form.role, title: form.title, active: true })
    setFormSuccess('User created successfully.')
    setForm({ name: '', email: '', password: '', role: 'editor', title: '' })
    fetchUsers()
    setSaving(false)
    setTimeout(() => { setModal(null); setFormSuccess('') }, 1500)
  }

  async function saveEdit() {
    setFormError(''); setFormSuccess(''); setSaving(true)
    if (!editForm.name.trim()) { setFormError('Name is required.'); setSaving(false); return }
    const { error } = await supabase.from('profiles').update({ name: editForm.name, role: editForm.role, title: editForm.title, active: editForm.active }).eq('id', editForm.id)
    if (error) { setFormError(error.message); setSaving(false); return }
    setFormSuccess('Saved!')
    fetchUsers()
    setSaving(false)
    setTimeout(() => { setModal(null); setFormSuccess('') }, 1000)
  }

  async function toggleActive(user) {
    if (user.id === currentUser?.id) return
    await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id)
    fetchUsers()
  }

  const stats = { total: users.length, active: users.filter(u => u.active).length, admins: users.filter(u => u.role === 'admin').length }

  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'roles', label: 'Roles & Permissions', icon: '🔐' },
    { id: 'logs', label: 'Access Log', icon: '📋' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '92vw', maxWidth: 960, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(15,23,42,0.22)' }}>

        {/* Header */}
        <div style={{ background: '#0f172a', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0a7c6e,#0e6ba8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡</div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, color: '#f1f5f9', fontWeight: 700 }}>Admin Console</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Alifor · User & Access Management</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Stats */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 28px', display: 'flex', gap: 28, alignItems: 'center' }}>
          {[['Total', stats.total, '#0e6ba8'], ['Active', stats.active, '#0a7c6e'], ['Admins', stats.admins, '#7c3aed']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: c, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{l} Users</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Btn small onClick={() => { setForm({ name: '', email: '', password: '', role: 'editor', title: '' }); setFormError(''); setFormSuccess(''); setModal('add') }}>+ Add User</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '10px 28px 0', borderBottom: '1px solid #e2e8f0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#0f172a' : '#94a3b8', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer', borderBottom: tab === t.id ? '2px solid #0a7c6e' : '2px solid transparent', marginBottom: -1 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading users…</div>}

          {!loading && tab === 'users' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['User', 'Title', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', borderBottom: '1.5px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 ? '#fff' : '#fafcff' }}>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name || u.email} size={34} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                            {u.name || '—'}
                            {u.id === currentUser?.id && <span style={{ fontSize: 10, color: '#0a7c6e', marginLeft: 6 }}>(you)</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 14, fontSize: 13, color: '#475569' }}>{u.title || '—'}</td>
                    <td style={{ padding: 14 }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: 14 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: u.active ? '#f0fdf4' : '#fef2f2', color: u.active ? '#16a34a' : '#dc2626' }}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 14, fontSize: 12, color: '#94a3b8' }}>{u.created_at?.slice(0, 10) || '—'}</td>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn small variant="secondary" onClick={() => { setEditForm({ ...u }); setFormError(''); setFormSuccess(''); setModal('edit') }}>Edit</Btn>
                        <Btn small variant={u.active ? 'warning' : 'secondary'} onClick={() => toggleActive(u)} disabled={u.id === currentUser?.id}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'roles' && (
            <div style={{ display: 'grid', gap: 16 }}>
              {ROLES.map(role => {
                const m = ROLE_META[role]
                const count = users.filter(u => u.role === role).length
                const perms = {
                  admin:  ['View all content', 'Create & edit goals, tactics, tasks', 'Manage RACI assignments', 'Add & remove team members', 'Access Admin Console', 'Deactivate users'],
                  editor: ['View all content', 'Create & edit goals, tactics, tasks', 'Manage RACI assignments', 'Add team members'],
                  viewer: ['View all content', 'View RACI matrix', 'View dashboard & strategy'],
                }
                return (
                  <div key={role} style={{ background: '#fff', border: `1.5px solid ${m.color}30`, borderRadius: 14, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {role === 'admin' ? '👑' : role === 'editor' ? '✏️' : '👁'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{m.label}</span>
                          <RoleBadge role={role} />
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{count} user{count !== 1 ? 's' : ''} · {m.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
                      {perms[role].map(p => (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                          <span style={{ color: m.color }}>✓</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'logs' && (
            <div>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                {logs.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No activity logged yet.</div>}
                {logs.map((log, i) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: i < logs.length - 1 ? '1px solid #e2e8f0' : 'none', background: i % 2 ? '#fff' : '#fafcff' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a7c6e15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {log.action_type === 'login' ? '🔐' : log.action_type === 'create' ? '➕' : log.action_type === 'update' ? '✏️' : '👁'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{log.user_name || log.user_email}</span>
                      <span style={{ fontSize: 13, color: '#64748b' }}> — {log.description}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add user modal */}
      {modal === 'add' && (
        <Modal title="Add New User" subtitle="Create a user account with role-based access" onClose={() => setModal(null)}>
          <AlertBanner type="error" message={formError} />
          <AlertBanner type="success" message={formSuccess} />
          <Input label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Dr. Jane Smith" />
          <Input label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="jane@alifor.ca" />
          <Input label="Job Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Clinical Lead" />
          <Input label="Temporary Password" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Min. 8 characters" />
          <Select label="Role" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={ROLES.map(r => ({ value: r, label: `${ROLE_META[r].label} — ${ROLE_META[r].desc}` }))} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="secondary">Cancel</Btn>
            <Btn onClick={createUser} disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Btn>
          </div>
        </Modal>
      )}

      {/* Edit user modal */}
      {modal === 'edit' && editForm && (
        <Modal title="Edit User" subtitle="Update profile details and permissions" onClose={() => setModal(null)}>
          <AlertBanner type="error" message={formError} />
          <AlertBanner type="success" message={formSuccess} />
          <Input label="Full Name" value={editForm.name || ''} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
          <Input label="Job Title" value={editForm.title || ''} onChange={v => setEditForm(f => ({ ...f, title: v }))} />
          <Select label="Role" value={editForm.role} onChange={v => setEditForm(f => ({ ...f, role: v }))} options={ROLES.map(r => ({ value: r, label: `${ROLE_META[r].label} — ${ROLE_META[r].desc}` }))} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Status</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: editForm.id === currentUser?.id ? 'not-allowed' : 'pointer' }}>
              <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} disabled={editForm.id === currentUser?.id} />
              <span style={{ fontSize: 13, color: '#475569' }}>Account Active</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)} variant="secondary">Cancel</Btn>
            <Btn onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
