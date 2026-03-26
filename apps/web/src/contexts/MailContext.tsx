import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { useGame } from './GameContext'
import { loadState, saveState, STORAGE_KEYS } from '../services/storage'
import { fetchMailRemote, markMailReadRemote, sendMailRemote } from '../services/mailApi'
import type { Letter } from '../types'

type MailPersist = {
  letters: Letter[]
  mailboxOpen: boolean
}

function readPersist(): MailPersist {
  return loadState<MailPersist>(STORAGE_KEYS.MAIL, { letters: [], mailboxOpen: false })
}

function buildMockLetters(userId: string): Letter[] {
  const t = Date.now()
  return [
    {
      id: 'mock-welcome',
      activityId: 'act-demo',
      fromUserId: 'agent-mira',
      toUserId: userId,
      content: '嗨，我是 Mira。邮局已连通，这是一封测试邀约信，撕开信封查看详情。',
      mood: '#51b7a9',
      round: 1,
      status: 'unread',
      createdAt: t - 7200000,
      expiresAt: t + 86400000 * 2,
    },
    {
      id: 'mock-round3',
      activityId: 'act-meetup',
      fromUserId: 'agent-kai',
      toUserId: userId,
      content: '第 3 轮了，确认线下见面时间与地点？',
      mood: '#d8b04f',
      round: 3,
      status: 'unread',
      createdAt: t - 3600000,
      expiresAt: t + 86400000,
    },
  ]
}

function mergeById(prev: Letter[], incoming: Letter[]): Letter[] {
  const map = new Map<string, Letter>()
  for (const l of prev) map.set(l.id, l)
  for (const l of incoming) map.set(l.id, l)
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt)
}

function useUserId(): string {
  const { user } = useAuth()
  return useMemo(() => {
    if (user?.id) return user.id
    const k = 'a2a-publisher-id'
    let id = localStorage.getItem(k)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(k, id)
    }
    return id
  }, [user?.id])
}

type MailContextValue = {
  letters: Letter[]
  unreadCount: number
  mailboxOpen: boolean
  setMailboxOpen: (open: boolean) => void
  fetchMail: () => Promise<void>
  sendReply: (letterId: string, content: string) => Promise<void>
  archiveLetter: (id: string) => void
  markRead: (id: string) => void
  confirmMeetup: (letterId: string) => void
  declineMeetup: (letterId: string) => void
}

const MailContext = createContext<MailContextValue | null>(null)

export function MailProvider({ children }: { children: ReactNode }) {
  const { loggedIn } = useAuth()
  const { startMeetup } = useGame()
  const userId = useUserId()
  const [letters, setLetters] = useState<Letter[]>(() => readPersist().letters)
  const [mailboxOpen, setMailboxOpen] = useState(() => readPersist().mailboxOpen)
  const sinceRef = useRef(0)

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveState(STORAGE_KEYS.MAIL, { letters, mailboxOpen } satisfies MailPersist)
    }, 280)
    return () => clearTimeout(t)
  }, [letters, mailboxOpen])

  const visibleLetters = useMemo(
    () => letters.filter((l) => l.status !== 'archived' && l.status !== 'expired'),
    [letters],
  )

  const unreadCount = useMemo(
    () => visibleLetters.filter((l) => l.toUserId === userId && l.status === 'unread').length,
    [visibleLetters, userId],
  )

  const fetchMail = useCallback(async () => {
    const remote = await fetchMailRemote(userId, sinceRef.current)
    if (remote) {
      setLetters((prev) => mergeById(prev, remote))
      sinceRef.current = remote.reduce((m, l) => Math.max(m, l.createdAt), sinceRef.current)
    } else {
      setLetters((prev) => (prev.length > 0 ? prev : buildMockLetters(userId)))
    }
  }, [userId])

  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    const run = async () => {
      const remote = await fetchMailRemote(userId, sinceRef.current)
      if (cancelled) return
      if (remote) {
        setLetters((prev) => mergeById(prev, remote))
        sinceRef.current = remote.reduce((m, l) => Math.max(m, l.createdAt), sinceRef.current)
      } else {
        setLetters((prev) => (prev.length > 0 ? prev : buildMockLetters(userId)))
      }
    }
    void run()
    const id = window.setInterval(run, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [loggedIn, userId])

  const markRead = useCallback((id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === id && l.status === 'unread' ? { ...l, status: 'read' as const } : l)),
    )
    void markMailReadRemote(id)
  }, [])

  const archiveLetter = useCallback((id: string) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'archived' as const } : l)))
  }, [])

  const sendReply = useCallback(
    async (letterId: string, content: string) => {
      const letter = letters.find((l) => l.id === letterId)
      if (!letter) return
      const now = Date.now()
      const expiresAt = now + 48 * 60 * 60 * 1000
      const body = {
        activityId: letter.activityId,
        fromUserId: userId,
        toUserId: letter.fromUserId,
        content,
        mood: letter.mood,
        round: letter.round + 1,
        status: 'unread' as const,
        createdAt: now,
        expiresAt,
      }
      const res = await sendMailRemote(body)
      const newId = res?.id ?? crypto.randomUUID()
      const outbound: Letter = { ...body, id: newId }
      setLetters((prev) => {
        const mapped = prev.map((l) => (l.id === letterId ? { ...l, status: 'replied' as const } : l))
        return mergeById(mapped, [outbound])
      })
    },
    [letters, userId],
  )

  const confirmMeetup = useCallback(
    (letterId: string) => {
      const letter = letters.find((l) => l.id === letterId)
      if (!letter) return
      startMeetup({
        letterId,
        activityId: letter.activityId,
        venueId: 'library',
        activityType: 'coffee',
        partnerId: letter.fromUserId,
        location: '小镇 · 约定地点',
      })
      setLetters((prev) =>
        prev.map((l) => (l.id === letterId ? { ...l, status: 'read' as const } : l)),
      )
      setMailboxOpen(false)
    },
    [letters, startMeetup],
  )

  const declineMeetup = useCallback(
    (letterId: string) => {
      archiveLetter(letterId)
    },
    [archiveLetter],
  )

  const value = useMemo(
    () => ({
      letters: visibleLetters,
      unreadCount,
      mailboxOpen,
      setMailboxOpen,
      fetchMail,
      sendReply,
      archiveLetter,
      markRead,
      confirmMeetup,
      declineMeetup,
    }),
    [
      visibleLetters,
      unreadCount,
      mailboxOpen,
      fetchMail,
      sendReply,
      archiveLetter,
      markRead,
      confirmMeetup,
      declineMeetup,
    ],
  )

  return <MailContext.Provider value={value}>{children}</MailContext.Provider>
}

export function useMail(): MailContextValue {
  const ctx = useContext(MailContext)
  if (!ctx) throw new Error('useMail must be used within MailProvider')
  return ctx
}
