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
import { useToken } from './TokenContext'
import { MOCK_PLAZA_CATS } from '../data/cats'
import { getDefaultSeason } from '../data/seasons'
import { fetchCatsRemote, fetchHomeRemote, fetchSeasonRemote, fetchStampsRemote } from '../services/gameApi'
import { loadState, saveState, STORAGE_KEYS } from '../services/storage'
import { TOKEN_REASONS, type Friend, type PixelHome, type Season, type SquareCat, type Stamp, type Wish } from '../types'

export type MeetupPayload = {
  letterId: string
  activityId: string
  venueId: string
  activityType: string
  partnerId: string
  location: string
}

type GamePersist = {
  stamps: Stamp[]
  home: PixelHome
  friends: Friend[]
  currentSeason: Season | null
  wishes: Wish[]
}

function defaultHome(ownerId: string): PixelHome {
  return {
    ownerId,
    level: 1,
    furniture: [],
    visitors: 0,
  }
}

function buildFloatingWishPool(): Wish[] {
  const t = Date.now()
  return [
    {
      id: 'pool-1',
      authorId: 'town-anon-a',
      content: '想找人一起夜跑，配速 6 分左右',
      status: 'floating',
      createdAt: t - 3600000,
    },
    {
      id: 'pool-2',
      authorId: 'town-anon-b',
      content: '周末想探店咖啡馆，聊天轻松向',
      status: 'floating',
      createdAt: t - 7200000,
    },
    {
      id: 'pool-3',
      authorId: 'town-anon-c',
      content: '图书馆自习，互不打扰型',
      status: 'floating',
      createdAt: t - 86400000,
    },
  ]
}

function readGame(ownerId: string): GamePersist {
  const fallback: GamePersist = {
    stamps: [],
    home: defaultHome(ownerId),
    friends: [],
    currentSeason: null,
    wishes: [],
  }
  const loaded = loadState<Partial<GamePersist> | null>(STORAGE_KEYS.GAME, null)
  if (!loaded || !Array.isArray(loaded.stamps)) return fallback
  return {
    stamps: loaded.stamps as Stamp[],
    home: loaded.home && typeof loaded.home === 'object' ? (loaded.home as PixelHome) : defaultHome(ownerId),
    friends: Array.isArray(loaded.friends) ? (loaded.friends as Friend[]) : [],
    currentSeason: loaded.currentSeason ?? null,
    wishes: Array.isArray(loaded.wishes) ? (loaded.wishes as Wish[]) : [],
  }
}

function mergeStamps(local: Stamp[], remote: Stamp[]): Stamp[] {
  const map = new Map<string, Stamp>()
  for (const s of remote) map.set(s.id, s)
  for (const s of local) {
    if (!map.has(s.id)) map.set(s.id, s)
  }
  return Array.from(map.values()).sort((a, b) => b.earnedAt - a.earnedAt)
}

function mergePixelHome(local: PixelHome, remote: PixelHome): PixelHome {
  return {
    ownerId: local.ownerId,
    level: Math.max(local.level, remote.level),
    furniture: [...new Set([...local.furniture, ...remote.furniture])],
    visitors: Math.max(local.visitors, remote.visitors),
  }
}

type GameContextValue = {
  stamps: Stamp[]
  home: PixelHome
  friends: Friend[]
  currentSeason: Season | null
  wishes: Wish[]
  floatingWishes: Wish[]
  plazaCats: SquareCat[]
  meetupSession: MeetupPayload | null
  stampUnlock: Stamp | null
  startMeetup: (payload: MeetupPayload) => void
  endMeetup: () => void
  addStamp: (stamp: Omit<Stamp, 'id' | 'earnedAt'> & { id?: string; earnedAt?: number }) => void
  dismissStampUnlock: () => void
  unlockFurniture: (furnitureId: string) => void
  addFriend: (friend: Omit<Friend, 'addedAt'> & { addedAt?: number }) => void
  checkUnlocks: () => void
  submitWish: (content: string) => boolean
  pickWish: () => Wish | null
  completePickedWish: (wishId: string) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { spend, canAfford } = useToken()
  const ownerId = user?.id ?? localStorage.getItem('a2a-publisher-id') ?? 'local'

  const [stamps, setStamps] = useState<Stamp[]>(() => readGame(ownerId).stamps)
  const [home, setHome] = useState<PixelHome>(() => readGame(ownerId).home)
  const [friends, setFriends] = useState<Friend[]>(() => readGame(ownerId).friends)
  const [currentSeason, setCurrentSeason] = useState<Season | null>(
    () => readGame(ownerId).currentSeason ?? getDefaultSeason(),
  )
  const [wishes, setWishes] = useState<Wish[]>(() => readGame(ownerId).wishes)
  const [floatingWishes, setFloatingWishes] = useState<Wish[]>(() => {
    const g = readGame(ownerId)
    const pool = buildFloatingWishPool()
    const ids = new Set(pool.map((p) => p.id))
    const fromPersist = g.wishes.filter((w) => w.status === 'floating' && !ids.has(w.id))
    return [...pool, ...fromPersist]
  })
  const [plazaCats, setPlazaCats] = useState<SquareCat[]>(MOCK_PLAZA_CATS)
  const [meetupSession, setMeetupSession] = useState<MeetupPayload | null>(null)
  const [stampUnlock, setStampUnlock] = useState<Stamp | null>(null)
  const meetupSessionRef = useRef<MeetupPayload | null>(null)
  const pendingStampUnlockRef = useRef<Stamp | null>(null)

  useEffect(() => {
    meetupSessionRef.current = meetupSession
  }, [meetupSession])

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveState(
        STORAGE_KEYS.GAME,
        { stamps, home, friends, currentSeason, wishes } satisfies GamePersist,
      )
    }, 280)
    return () => clearTimeout(t)
  }, [stamps, home, friends, currentSeason, wishes])

  useEffect(() => {
    setHome((h) => (h.ownerId === ownerId ? h : { ...h, ownerId }))
  }, [ownerId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const remoteCats = await fetchCatsRemote()
      if (cancelled) return
      if (remoteCats && remoteCats.length > 0) setPlazaCats(remoteCats)
      else setPlazaCats(MOCK_PLAZA_CATS)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const remote = await fetchSeasonRemote()
      if (cancelled) return
      if (remote) setCurrentSeason(remote)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [remoteStamps, remoteHome] = await Promise.all([
        fetchStampsRemote(ownerId),
        fetchHomeRemote(ownerId),
      ])
      if (cancelled) return
      if (remoteStamps?.length) setStamps((prev) => mergeStamps(prev, remoteStamps))
      if (remoteHome) setHome((prev) => mergePixelHome(prev, remoteHome))
    })()
    return () => {
      cancelled = true
    }
  }, [ownerId])

  const startMeetup = useCallback((payload: MeetupPayload) => {
    setMeetupSession(payload)
  }, [])

  const endMeetup = useCallback(() => {
    setMeetupSession(null)
    const pending = pendingStampUnlockRef.current
    pendingStampUnlockRef.current = null
    if (pending) setStampUnlock(pending)
  }, [])

  const dismissStampUnlock = useCallback(() => {
    setStampUnlock(null)
  }, [])

  const addStamp = useCallback(
    (stamp: Omit<Stamp, 'id' | 'earnedAt'> & { id?: string; earnedAt?: number }) => {
      const id = stamp.id ?? crypto.randomUUID()
      const earnedAt = stamp.earnedAt ?? Date.now()
      const full: Stamp = { ...stamp, id, earnedAt }
      setStamps((prev) => {
        const isFirst = prev.length === 0
        if (isFirst) {
          queueMicrotask(() => {
            setHome((h) =>
              h.furniture.includes('desk-basic')
                ? h
                : { ...h, furniture: [...h.furniture, 'desk-basic'], visitors: h.visitors + 1 },
            )
          })
        } else {
          queueMicrotask(() => {
            setHome((h) => ({ ...h, visitors: h.visitors + 1 }))
          })
        }
        return [full, ...prev]
      })
      if (meetupSessionRef.current) {
        pendingStampUnlockRef.current = full
      } else {
        setStampUnlock(full)
      }
    },
    [],
  )

  const unlockFurniture = useCallback((furnitureId: string) => {
    setHome((prev) =>
      prev.furniture.includes(furnitureId)
        ? prev
        : { ...prev, furniture: [...prev.furniture, furnitureId] },
    )
  }, [])

  const addFriend = useCallback((friend: Omit<Friend, 'addedAt'> & { addedAt?: number }) => {
    const row: Friend = {
      ...friend,
      addedAt: friend.addedAt ?? Date.now(),
    }
    setFriends((prev) => {
      if (prev.some((f) => f.friendId === row.friendId)) return prev
      return [row, ...prev]
    })
  }, [])

  const checkUnlocks = useCallback(() => {
    setHome((prev) => {
      const level = Math.min(10, prev.level + 1)
      const furniture = [...prev.furniture]
      if (level >= 3 && !furniture.includes('lamp-teal')) furniture.push('lamp-teal')
      return { ...prev, level, furniture }
    })
  }, [])

  const submitWish = useCallback(
    (content: string) => {
      const text = content.trim()
      if (text.length < 4) return false
      if (!canAfford(1)) return false
      if (!spend(1, TOKEN_REASONS.WISH_SUBMIT)) return false
      const w: Wish = {
        id: crypto.randomUUID(),
        authorId: ownerId,
        content: text,
        status: 'floating',
        createdAt: Date.now(),
      }
      setWishes((prev) => [...prev, w])
      setFloatingWishes((prev) => [...prev, w])
      return true
    },
    [ownerId, spend, canAfford],
  )

  const pickWish = useCallback(() => {
    const pool = floatingWishes.filter((w) => w.authorId !== ownerId)
    if (pool.length === 0) return null
    const w = pool[Math.floor(Math.random() * pool.length)]
    setFloatingWishes((prev) => prev.filter((x) => x.id !== w.id))
    const picked: Wish = { ...w, status: 'picked', pickerId: ownerId }
    return picked
  }, [floatingWishes, ownerId])

  const completePickedWish = useCallback((wishId: string) => {
    setWishes((prev) => prev.map((x) => (x.id === wishId ? { ...x, status: 'completed' as const } : x)))
  }, [])

  const value = useMemo(
    () => ({
      stamps,
      home,
      friends,
      currentSeason,
      wishes,
      floatingWishes,
      plazaCats,
      meetupSession,
      stampUnlock,
      startMeetup,
      endMeetup,
      addStamp,
      dismissStampUnlock,
      unlockFurniture,
      addFriend,
      checkUnlocks,
      submitWish,
      pickWish,
      completePickedWish,
    }),
    [
      stamps,
      home,
      friends,
      currentSeason,
      wishes,
      floatingWishes,
      plazaCats,
      meetupSession,
      stampUnlock,
      startMeetup,
      endMeetup,
      addStamp,
      dismissStampUnlock,
      unlockFurniture,
      addFriend,
      checkUnlocks,
      submitWish,
      pickWish,
      completePickedWish,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
