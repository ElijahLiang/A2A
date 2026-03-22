import { useEffect, useRef, useState } from 'react'
import type { Direction, AnimState } from '../components/SpriteCharacter'

const TILE = 64
const SPEED = 1.5
const FRAME_MS = 32

const PATH_NODES: { row: number; col: number }[] = []
for (let col = 1; col <= 15; col++) {
  PATH_NODES.push({ row: 4, col })
  PATH_NODES.push({ row: 8, col })
  PATH_NODES.push({ row: 11, col })
}
for (let row = 1; row <= 15; row++) {
  PATH_NODES.push({ row, col: 6 })
  PATH_NODES.push({ row, col: 10 })
}
const uniqueKey = (n: { row: number; col: number }) => `${n.row}-${n.col}`
const UNIQUE_NODES = Array.from(
  new Map(PATH_NODES.map(n => [uniqueKey(n), n])).values()
)

function toPixel(row: number, col: number) {
  return { x: (col - 1) * TILE, y: (row - 1) * TILE }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  }
  return dy > 0 ? 'down' : 'up'
}

export interface WalkerState {
  x: number
  y: number
  direction: Direction
  animState: AnimState
}

export function useAgentWalker(startRow: number, startCol: number): WalkerState {
  const startPos = toPixel(startRow, startCol)
  const [state, setState] = useState<WalkerState>({
    x: startPos.x,
    y: startPos.y,
    direction: 'down',
    animState: 'idle',
  })

  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let targetX = startPos.x
    let targetY = startPos.y
    let curX = startPos.x
    let curY = startPos.y
    let phase: 'idle' | 'walking' = 'idle'
    let idleTimer = 2000 + Math.random() * 4000
    let elapsed = 0

    const tick = () => {
      elapsed += FRAME_MS

      if (phase === 'idle') {
        if (elapsed >= idleTimer) {
          const target = pickRandom(UNIQUE_NODES)
          const tp = toPixel(target.row, target.col)
          targetX = tp.x
          targetY = tp.y
          phase = 'walking'
          elapsed = 0

          const dx = targetX - curX
          const dy = targetY - curY
          setState({
            x: curX, y: curY,
            direction: getDirection(dx, dy),
            animState: 'walk',
          })
        }
        return
      }

      const dx = targetX - curX
      const dy = targetY - curY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < SPEED) {
        curX = targetX
        curY = targetY
        phase = 'idle'
        idleTimer = 3000 + Math.random() * 5000
        elapsed = 0
        setState({ x: curX, y: curY, direction: stateRef.current.direction, animState: 'idle' })
        return
      }

      const nx = dx / dist
      const ny = dy / dist
      curX += nx * SPEED
      curY += ny * SPEED

      setState({
        x: curX,
        y: curY,
        direction: getDirection(nx, ny),
        animState: 'walk',
      })
    }

    const interval = setInterval(tick, FRAME_MS)
    return () => clearInterval(interval)
  }, [startPos.x, startPos.y])

  return state
}
