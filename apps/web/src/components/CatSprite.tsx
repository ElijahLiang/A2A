import { useEffect, useRef, useState } from 'react'
import { useCatGridWalker } from '../hooks/useCatGridWalker'
import type { SquareCat } from '../types'
import './CatSprite.css'

type Facing = 'front' | 'back' | 'left' | 'right'

type CatFrames = {
  idleByFacing: Record<Facing, string>
  walk: [string, string]
  rest: string[]
  special?: string[]
}

const CAT_SPRITES: Record<SquareCat['type'], CatFrames> = {
  orange: {
    idleByFacing: {
      front: '/sprites/cats/orange/idle_front.png',
      back: '/sprites/cats/orange/idle_back.png',
      left: '/sprites/cats/orange/idle_left.png',
      right: '/sprites/cats/orange/idle_right.png',
    },
    walk: ['/sprites/cats/orange/walk_1.png', '/sprites/cats/orange/walk_2.png'],
    rest: ['/sprites/cats/orange/sitting.png', '/sprites/cats/orange/lying_down.png'],
  },
  black: {
    idleByFacing: {
      front: '/sprites/cats/tuxedo/idle_front.png',
      back: '/sprites/cats/tuxedo/idle_back.png',
      left: '/sprites/cats/tuxedo/idle_left.png',
      right: '/sprites/cats/tuxedo/idle_right.png',
    },
    walk: ['/sprites/cats/tuxedo/walk_1.png', '/sprites/cats/tuxedo/walk_2.png'],
    rest: ['/sprites/cats/tuxedo/sitting.png', '/sprites/cats/tuxedo/lying_down.png'],
  },
  white: {
    idleByFacing: {
      front: '/sprites/cats/gray/idle_front.png',
      back: '/sprites/cats/gray/idle_back.png',
      left: '/sprites/cats/gray/idle_left.png',
      right: '/sprites/cats/gray/idle_right.png',
    },
    walk: ['/sprites/cats/gray/walk_1.png', '/sprites/cats/gray/walk_2.png'],
    rest: ['/sprites/cats/gray/sitting.png', '/sprites/cats/gray/lying_down.png'],
  },
  calico: {
    idleByFacing: {
      front: '/sprites/cats/gray/idle_front.png',
      back: '/sprites/cats/gray/idle_back.png',
      left: '/sprites/cats/gray/idle_left.png',
      right: '/sprites/cats/gray/idle_right.png',
    },
    walk: ['/sprites/cats/gray/walk_1.png', '/sprites/cats/gray/walk_2.png'],
    rest: ['/sprites/cats/gray/sitting.png', '/sprites/cats/gray/lying_down.png'],
  },
  hidden: {
    idleByFacing: {
      front: '/sprites/cats/gray_actions/tail_swish_1.png',
      back: '/sprites/cats/gray_actions/tail_swish_2.png',
      left: '/sprites/cats/gray_actions/meowing.png',
      right: '/sprites/cats/gray_actions/stretching.png',
    },
    walk: ['/sprites/cats/gray_actions/tail_swish_1.png', '/sprites/cats/gray_actions/tail_swish_2.png'],
    rest: ['/sprites/cats/gray_actions/sleeping.png', '/sprites/cats/gray_actions/grooming.png'],
    special: [
      '/sprites/cats/gray_actions/jumping.png',
      '/sprites/cats/gray_actions/meowing.png',
      '/sprites/cats/gray_actions/playing_with_toy.png',
      '/sprites/cats/gray_actions/stretching.png',
    ],
  },
}

type CatSpriteProps = {
  cat: SquareCat
  onClick?: (cat: SquareCat) => void
}

export function CatSprite({ cat, onClick }: CatSpriteProps) {
  const { row, col } = useCatGridWalker(cat.position.row, cat.position.col, cat.id)
  const [isWalking, setIsWalking] = useState(false)
  const [walkFrame, setWalkFrame] = useState(0)
  const [facing, setFacing] = useState<Facing>('front')
  const [idleFrame, setIdleFrame] = useState<string | null>(null)
  const prevPosRef = useRef({ row: cat.position.row, col: cat.position.col })
  const spriteSet = CAT_SPRITES[cat.type] ?? CAT_SPRITES.orange

  useEffect(() => {
    const prev = prevPosRef.current
    const moved = prev.row !== row || prev.col !== col
    if (moved) {
      if (row < prev.row) setFacing('back')
      else if (row > prev.row) setFacing('front')
      else if (col < prev.col) setFacing('left')
      else if (col > prev.col) setFacing('right')
    }

    prevPosRef.current = { row, col }
    if (!moved) return

    setIdleFrame(null)
    setIsWalking(true)
    const timeout = window.setTimeout(() => setIsWalking(false), 560)
    return () => clearTimeout(timeout)
  }, [row, col])

  useEffect(() => {
    if (!isWalking) {
      setWalkFrame(0)
      return
    }
    const timer = window.setInterval(() => {
      setWalkFrame((current) => (current === 0 ? 1 : 0))
    }, 220)
    return () => clearInterval(timer)
  }, [isWalking])

  useEffect(() => {
    if (isWalking) return

    const base = spriteSet.idleByFacing[facing]
    const pool = [...spriteSet.rest, ...(spriteSet.special ?? [])]
    setIdleFrame(base)

    const timer = window.setInterval(
      () => {
        const useBase = Math.random() < 0.45 || pool.length === 0
        if (useBase) {
          setIdleFrame(base)
          return
        }
        const random = pool[Math.floor(Math.random() * pool.length)]
        setIdleFrame(random)
      },
      2200 + Math.floor(Math.random() * 1600),
    )

    return () => clearInterval(timer)
  }, [isWalking, facing, spriteSet])

  const sprite = isWalking ? spriteSet.walk[walkFrame] : (idleFrame ?? spriteSet.idleByFacing[facing])

  return (
    <button
      type="button"
      className="cat-sprite"
      style={{
        gridRow: `${row} / span 1`,
        gridColumn: `${col} / span 1`,
      }}
      title={`${cat.activityType} 猫 · 点击互动`}
      aria-label={`${cat.activityType} 广场猫`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(cat)
      }}
    >
      <img
        className={`cat-sprite-image${cat.type === 'hidden' ? ' cat-sprite-image--hidden' : ''}`}
        src={sprite}
        alt=""
        aria-hidden
      />
      <span className="cat-sprite-tag">{cat.activityType}</span>
    </button>
  )
}
