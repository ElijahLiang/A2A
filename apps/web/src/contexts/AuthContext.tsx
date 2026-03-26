import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../services/storage'
import type { User } from '../types'

type AuthContextValue = {
  loggedIn: boolean
  agentName: string
  user: User | null
  login: () => void
  logout: () => void
  setAgentName: (name: string) => void
  updateBio: (bio: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readLegacyLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === '1'
}

function writeLegacyLoggedIn(value: boolean): void {
  localStorage.setItem(STORAGE_KEYS.AUTH, value ? '1' : '')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(readLegacyLoggedIn)
  const [agentName, setAgentNameState] = useState(() => localStorage.getItem(STORAGE_KEYS.AGENT) || '')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    writeLegacyLoggedIn(loggedIn)
  }, [loggedIn])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENT, agentName)
  }, [agentName])

  const login = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AVATAR_COLOR)
    const avatarColor = raw === 'green' ? 'green' : 'blue'
    setUser((prev) =>
      prev
        ? { ...prev, avatarColor }
        : {
            id: crypto.randomUUID(),
            phone: '',
            bio: '',
            avatarColor,
            agentName: '',
            createdAt: Date.now(),
          },
    )
    setLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    setLoggedIn(false)
    setAgentNameState('')
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    localStorage.removeItem(STORAGE_KEYS.AGENT)
  }, [])

  const setAgentName = useCallback((name: string) => {
    setAgentNameState(name)
    setUser((prev) =>
      prev
        ? { ...prev, agentName: name }
        : {
            id: crypto.randomUUID(),
            phone: '',
            bio: '',
            avatarColor: 'blue',
            agentName: name,
            createdAt: Date.now(),
          },
    )
  }, [])

  const updateBio = useCallback((bio: string) => {
    setUser((prev) =>
      prev
        ? { ...prev, bio }
        : {
            id: crypto.randomUUID(),
            phone: '',
            bio,
            avatarColor: 'blue',
            agentName,
            createdAt: Date.now(),
          },
    )
  }, [agentName])

  const value = useMemo(
    () => ({
      loggedIn,
      agentName,
      user,
      login,
      logout,
      setAgentName,
      updateBio,
    }),
    [loggedIn, agentName, user, login, logout, setAgentName, updateBio],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
