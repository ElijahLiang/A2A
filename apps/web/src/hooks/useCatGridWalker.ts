import { useEffect, useRef, useState } from 'react'

const ROWS = 10

function hashOffset(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h % 1800)
}

export function useCatGridWalker(startRow: number, startCol: number, seed: string) {
  const [pos, setPos] = useState({ row: startRow, col: startCol })
  const timeoutRef = useRef(0)

  useEffect(() => {
    setPos({ row: startRow, col: startCol })
  }, [startRow, startCol])

  useEffect(() => {
    let cancelled = false

    const tick = () => {
      const delay = 1800 + Math.random() * 3200
      timeoutRef.current = window.setTimeout(() => {
        if (cancelled) return
        setPos((p) => {
          const candidates = [
            { row: p.row - 1, col: p.col },
            { row: p.row + 1, col: p.col },
            { row: p.row, col: p.col - 1 },
            { row: p.row, col: p.col + 1 },
          ].filter((m) => m.row >= 1 && m.row <= ROWS && m.col >= 1 && m.col <= 12)
          if (candidates.length === 0) return p
          return candidates[Math.floor(Math.random() * candidates.length)]
        })
        tick()
      }, delay)
    }

    timeoutRef.current = window.setTimeout(tick, 400 + (hashOffset(seed) % 1200))

    return () => {
      cancelled = true
      clearTimeout(timeoutRef.current)
    }
  }, [startRow, startCol, seed])

  return pos
}
