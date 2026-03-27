export const STORAGE_KEYS = {
  AUTH: 'a2a-town-auth',
  PHONE: 'a2a-login-phone',
  AGENT: 'a2a-my-agent',
  AVATAR_COLOR: 'a2a-avatar-color',
  TOKEN: 'a2a-token-state',
  MAIL: 'a2a-mail-state',
  GAME: 'a2a-game-state',
} as const

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveState(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}
