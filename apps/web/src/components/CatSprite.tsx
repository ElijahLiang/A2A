import { useEffect, useState } from 'react'
import { useTownActor } from '../hooks/useTownActor'
import { CAT_SPRITES, getCatFrame } from '../data/catSprites'
import type { SquareCat } from '../types'
import './CatSprite.css'

type CatSpriteProps = {
  cat: SquareCat
  onClick?: (cat: SquareCat) => void
}

export function CatSprite({ cat, onClick }: CatSpriteProps) {
  const actor = useTownActor(cat.id)
  const [idleOverride, setIdleOverride] = useState<string | null>(null)
  const spriteSet = CAT_SPRITES[cat.type] ?? CAT_SPRITES.orange

  const x = actor?.x ?? (cat.position.col - 1) * 64
  const y = actor?.y ?? (cat.position.row - 1) * 64
  const direction = actor?.direction ?? 'down'
  const animState = actor?.animState ?? 'idle'
  const frameIndex = actor?.frameIndex ?? 0

  useEffect(() => {
    if (animState === 'walk') {
      setIdleOverride(null)
      return
    }
    const pool = [...spriteSet.rest, ...(spriteSet.special ?? [])]
    const timer = window.setInterval(
      () => {
        if (Math.random() < 0.45 || pool.length === 0) {
          setIdleOverride(null)
          return
        }
        setIdleOverride(pool[Math.floor(Math.random() * pool.length)])
      },
      2200 + Math.floor(Math.random() * 1600),
    )
    return () => clearInterval(timer)
  }, [animState, spriteSet])

  const sprite = getCatFrame(cat.type, direction, animState, frameIndex, idleOverride)

  return (
    <button
      type="button"
      className="cat-sprite"
      style={{
        left: x,
        top: y,
        zIndex: 15 + Math.round(y / 16),
      }}
      title={`${cat.activityType} 猫 · 点击互动`}
      aria-label={`${cat.activityType} 广场猫`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(actor?.kind === 'cat' ? actor.source : cat)
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
