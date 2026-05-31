// In-memory login rate limiter — single-instance, dev-friendly.
// Will be replaced with @upstash/ratelimit backed by Redis in E1-S5.

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

type AttemptEntry = { count: number; resetAt: number }
const store = new Map<string, AttemptEntry>()

function getEntry(key: string, now: number): AttemptEntry | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (now >= entry.resetAt) {
    store.delete(key)
    return undefined
  }
  return entry
}

export function checkRateLimit(identifier: string): {
  allowed: boolean
  retryAfterSeconds?: number
} {
  const now = Date.now()
  const entry = getEntry(identifier, now)

  if (entry && entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  return { allowed: true }
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now()
  const existing = getEntry(identifier, now)

  if (existing) {
    existing.count++
  } else {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
  }
}

export function clearAttempts(identifier: string): void {
  store.delete(identifier)
}
