import { useCatGridWalker } from '../hooks/useCatGridWalker'
import type { SquareCat } from '../types'
import './CatSprite.css'

const CAT_EMOJI: Record<SquareCat['type'], string> = {
  orange: '🐈',
  black: '🐈‍⬛',
  white: '🐈',
  calico: '🐈',
  hidden: '✨',
}

type CatSpriteProps = {
  cat: SquareCat
  onClick?: (cat: SquareCat) => void
}

export function CatSprite({ cat, onClick }: CatSpriteProps) {
  const face = CAT_EMOJI[cat.type] ?? '🐈'
  const { row, col } = useCatGridWalker(cat.position.row, cat.position.col, cat.id)

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
      <span className="cat-sprite-face" aria-hidden>
        {face}
      </span>
      <span className="cat-sprite-tag">{cat.activityType}</span>
    </button>
  )
}
