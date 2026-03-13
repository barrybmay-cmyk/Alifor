// src/lib/security.js
import { supabase } from './supabase'

// ── Session timeout ───────────────────────────────────────────────────────────
const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity

let timeoutId = null
let lastActivity = Date.now()

export function initSessionTimeout(onExpire) {
  const reset = () => { lastActivity = Date.now() }
  const check = () => {
    if (Date.now() - lastActivity > TIMEOUT_MS) {
      clearInterval(timeoutId)
      removeEventListeners()
      onExpire()
    }
  }

  const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
  events.forEach(e => window.addEventListener(e, reset, { passive: true }))

  timeoutId = setInterval(check, 60 * 1000) // check every minute

  function removeEventListeners() {
    events.forEach(e => window.removeEventListener(e, reset))
  }

  return () => {
    clearInterval(timeoutId)
    removeEventListeners()
  }
}

// ── Login rate limiting (client-side, backed by Supabase) ─────────────────────
const ATTEMPT_KEY = 'alifor_login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

export function checkLoginRateLimit(email) {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const record = data[email.toLowerCase()]
    if (!record) return { allowed: true, remainingMs: 0 }

    const { count, lockedUntil } = record
    if (lockedUntil && Date.now() < lockedUntil) {
      return { allowed: false, remainingMs: lockedUntil - Date.now(), count }
    }
    if (count >= MAX_ATTEMPTS) {
      // Lock them out
      const lockedUntilTs = Date.now() + LOCKOUT_MS
      data[email.toLowerCase()] = { count, lockedUntil: lockedUntilTs }
      localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
      return { allowed: false, remainingMs: LOCKOUT_MS, count }
    }
    return { allowed: true, remainingMs: 0, count }
  } catch { return { allowed: true, remainingMs: 0 } }
}

export function recordFailedAttempt(email) {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const key = email.toLowerCase()
    const prev = data[key] || { count: 0 }
    data[key] = { count: prev.count + 1, lockedUntil: prev.count + 1 >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null }
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
    return data[key].count
  } catch { return 0 }
}

export function clearLoginAttempts(email) {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY)
    const data = raw ? JSON.parse(raw) : {}
    delete data[email.toLowerCase()]
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
  } catch {}
}

export function formatLockoutTime(ms) {
  const mins = Math.ceil(ms / 60000)
  return mins === 1 ? '1 minute' : `${mins} minutes`
}

// ── Activity logging ──────────────────────────────────────────────────────────
export async function logActivity(userId, userName, userEmail, actionType, description) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      action_type: actionType,
      description,
    })
  } catch (e) {
    console.warn('Activity log failed:', e)
  }
}

// ── Password strength checker ─────────────────────────────────────────────────
export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['', '#dc2626', '#f97316', '#f59e0b', '#16a34a', '#0a7c6e']
  return { checks, score, label: labels[score], color: colors[score] }
}
