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

export function useAgentEvents() {
  const [bubbles, setBubbles] = useState<AgentBubble[]>([])
  const sinceRef = useRef(0)

  useEffect(() => {
    let active = true

    const poll = async () => {
      while (active) {
        try {
          const { events, nextSince } = await fetchEvents(sinceRef.current)
          sinceRef.current = nextSince

          if (events.length > 0) {
            const now = Date.now()
            const newBubbles: AgentBubble[] = events.map(e => ({
              agentName: e.speaker,
              content: e.content,
              emotion: e.emotion,
              partner: e.receiver,
              scene: e.scene,
              expiresAt: now + BUBBLE_DURATION,
            }))

            setBubbles(prev => {
              const filtered = prev.filter(b => b.expiresAt > now)
              return [...filtered, ...newBubbles].slice(-10)
            })
          }
        } catch { /* backend not running yet */ }

        await new Promise(r => setTimeout(r, 2000))
      }
    }

    poll()

    const cleanup = setInterval(() => {
      setBubbles(prev => prev.filter(b => b.expiresAt > Date.now()))
    }, 1000)

    return () => {
      active = false
      clearInterval(cleanup)
    }
  }, [])

  return bubbles
}
