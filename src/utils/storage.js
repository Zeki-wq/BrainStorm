export const STORAGE_KEYS = Object.freeze({
  settings: 'brainlab-settings',
  progress: 'brainlab-progress',
  results: 'brainlab-game-results',
  dailyGoal: 'brainlab-daily-goal',
})

export function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function safeWrite(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export function safeRemove(key) {
  try { window.localStorage.removeItem(key); return true } catch { return false }
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function ordinalFor(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) return null
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

export function readResults() {
  const value = safeRead(STORAGE_KEYS.results, [])
  if (!Array.isArray(value)) return []
  return value.filter(item => item && typeof item.gameId === 'string' && Number.isFinite(item.score) && Number.isFinite(item.duration) && typeof item.timestamp === 'string' && Number.isFinite(Date.parse(item.timestamp)))
}

export function readProgress(today = localDateKey()) {
  const value = safeRead(STORAGE_KEYS.progress, {})
  const raw = value && typeof value === 'object' ? value : {}
  let currentStreak = Number.isInteger(raw.currentStreak) && raw.currentStreak >= 0 ? raw.currentStreak : 0
  let lastActivityDate = typeof raw.lastActivityDate === 'string' ? raw.lastActivityDate : null
  const todayOrdinal = ordinalFor(today)
  const lastOrdinal = ordinalFor(lastActivityDate)
  if (lastOrdinal === null || todayOrdinal === null || lastOrdinal > todayOrdinal) {
    currentStreak = 0
    lastActivityDate = null
  } else if (todayOrdinal - lastOrdinal > 1) currentStreak = 0
  return {
    currentStreak,
    longestStreak: Number.isInteger(raw.longestStreak) && raw.longestStreak >= 0 ? raw.longestStreak : 0,
    lastActivityDate,
    totalTrainingDays: Number.isInteger(raw.totalTrainingDays) && raw.totalTrainingDays >= 0 ? raw.totalTrainingDays : 0,
  }
}

export function updateStreakOnActivity(progress, timestamp = new Date()) {
  const today = localDateKey(timestamp)
  const todayOrdinal = ordinalFor(today)
  const lastOrdinal = ordinalFor(progress.lastActivityDate)
  if (progress.lastActivityDate === today) return progress
  const currentStreak = lastOrdinal !== null && lastOrdinal === todayOrdinal - 1 ? progress.currentStreak + 1 : 1
  return {
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastActivityDate: today,
    totalTrainingDays: progress.totalTrainingDays + 1,
  }
}

export function persistResult(result) {
  const results = readResults()
  if (results.some(item => item.sessionId === result.sessionId)) return { saved: false, results }
  const timestamp = typeof result.timestamp === 'string' && Number.isFinite(Date.parse(result.timestamp))
    ? result.timestamp
    : new Date().toISOString()
  const safeResult = {
    gameId: result.gameId,
    gameName: result.gameName,
    category: result.category,
    score: Math.max(0, Math.round(Number(result.score) || 0)),
    accuracy: Number.isFinite(result.accuracy) ? Math.min(100, Math.max(0, result.accuracy)) : null,
    duration: Math.max(0, Math.round(Number(result.duration) || 0)),
    level: Number.isFinite(result.level) ? Math.max(0, Math.round(result.level)) : null,
    reactionTime: Number.isFinite(result.reactionTime) ? Math.max(0, Math.round(result.reactionTime)) : null,
    completed: true,
    timestamp,
    sessionId: result.sessionId,
  }
  const next = [...results, safeResult].slice(-1000)
  safeWrite(STORAGE_KEYS.results, next)
  return { saved: true, results: next, result: safeResult }
}

export function readDailyGoal() {
  const value = safeRead(STORAGE_KEYS.dailyGoal, 3)
  return Number.isInteger(value) ? Math.min(10, Math.max(1, value)) : 3
}

export function writeDailyGoal(goal) { return safeWrite(STORAGE_KEYS.dailyGoal, Math.min(10, Math.max(1, Math.round(goal)))) }

export function resetResults() { safeRemove(STORAGE_KEYS.results) }
export function resetProgress() { safeRemove(STORAGE_KEYS.results); safeRemove(STORAGE_KEYS.progress); safeRemove(STORAGE_KEYS.dailyGoal) }
