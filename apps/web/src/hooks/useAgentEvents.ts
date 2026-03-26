import { useEffect, useRef, useState } from 'react'
import { fetchEvents } from '../services/agentApi'

export interface AgentBubble {
  agentName: string
  content: string
  emotion: string
  partner: string
  scene: string
  expiresAt: number
}

const BUBBLE_DURATION = 6000
/** 后端可用时轮询间隔；失败时由 fetch 超时快速返回，仍用此间隔避免空转 */
const POLL_MS = 8000
const CLEANUP_MS = 2500

export function useAgentEvents() {
  const [bubbles, setBubbles] = useState<AgentBubble[]>([])
  const sinceRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const schedule = () => {
      if (cancelled) return
      timeoutRef.current = window.setTimeout(() => void tick(), POLL_MS)
    }

    const tick = async () => {
      if (cancelled) return
      try {
        const { events, nextSince } = await fetchEvents(sinceRef.current)
        sinceRef.current = nextSince

        if (events.length > 0) {
          const now = Date.now()
          const newBubbles: AgentBubble[] = events.map((e) => ({
            agentName: e.speaker,
            content: e.content,
            emotion: e.emotion,
            partner: e.receiver,
            scene: e.scene,
            expiresAt: now + BUBBLE_DURATION,
          }))

          setBubbles((prev) => {
            const filtered = prev.filter((b) => b.expiresAt > now)
            return [...filtered, ...newBubbles].slice(-10)
          })
        }
      } catch {
        /* backend off */
      }
      if (cancelled) return
      schedule()
    }

    void tick()

    const cleanupIv = window.setInterval(() => {
      setBubbles((prev) => {
        const now = Date.now()
        const next = prev.filter((b) => b.expiresAt > now)
        return next.length === prev.length ? prev : next
      })
    }, CLEANUP_MS)

    return () => {
      cancelled = true
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      clearInterval(cleanupIv)
    }
  }, [])

  return bubbles
}
