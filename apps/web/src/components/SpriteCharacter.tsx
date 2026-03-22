import { useEffect, useState } from 'react'
import './SpriteCharacter.css'

export type Direction = 'down' | 'up' | 'left' | 'right'
export type AnimState = 'idle' | 'walk'

interface SpriteCharacterProps {
  x: number
  y: number
  direction: Direction
  animState: AnimState
  layers: string[]
  label?: string
  statusText?: string
  dialogBubble?: string
  dialogEmotion?: string
  onClick?: () => void
}

const SHEET_COLS = 16
const CELL_SIZE = 64

const WALK_FRAMES: Record<Direction, number[]> = {
  down:  [48, 49, 50, 51, 52, 53],
  up:    [64, 65, 66, 67],
  right: [52, 53, 54, 55],
  left:  [52, 53, 54, 55],
}

const IDLE_FRAME: Record<Direction, number> = {
  down: 0,
  up: 64,
  right: 52,
  left: 52,
}

function cellToPos(cell: number): { x: number; y: number } {
  const col = cell % SHEET_COLS
  const row = Math.floor(cell / SHEET_COLS)
  return { x: col * CELL_SIZE, y: row * CELL_SIZE }
}

export function SpriteCharacter({
  x, y, direction, animState, layers, label, statusText,
  dialogBubble, dialogEmotion, onClick,
}: SpriteCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (animState !== 'walk') {
      setFrameIndex(0)
      return
    }
    const frames = WALK_FRAMES[direction]
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length)
    }, 130)
    return () => clearInterval(interval)
  }, [animState, direction])

  const cell = animState === 'walk'
    ? WALK_FRAMES[direction][frameIndex]
    : IDLE_FRAME[direction]

  const pos = cellToPos(cell)
  const flipX = direction === 'left'

  return (
    <div
      className={`sprite-character ${onClick ? 'sprite-clickable' : ''}`}
      style={{
        left: x,
        top: y,
        transform: flipX ? 'scaleX(-1)' : undefined,
      }}
      onClick={onClick}
    >
      <div className="sprite-layers">
        {layers.map((src, i) => (
          <div
            key={i}
            className="sprite-layer"
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: `-${pos.x}px -${pos.y}px`,
            }}
          />
        ))}
      </div>
      {dialogBubble && (
        <div
          className={`sprite-dialog-bubble ${dialogEmotion === 'positive' ? 'bubble-emotion-positive' : dialogEmotion === 'negative' ? 'bubble-emotion-negative' : ''}`}
          style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
        >
          {dialogBubble}
        </div>
      )}
      {(label || statusText) && (
        <div className="sprite-info" style={{ transform: flipX ? 'scaleX(-1)' : undefined }}>
          {label && <div className="sprite-label">{label}</div>}
          {statusText && !dialogBubble && <div className="sprite-status">{statusText}</div>}
        </div>
      )}
    </div>
  )
}
