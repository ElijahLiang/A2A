import { useEffect, useMemo, useRef, useState } from 'react'
import { getHumanFrame, HUMAN_SPRITES, type HumanSpriteType } from '../data/humanSprites'
import './SpriteCharacter.css'

export type Direction = 'down' | 'up' | 'left' | 'right'
export type AnimState = 'idle' | 'walk'

interface SpriteCharacterProps {
  x: number
  y: number
  direction: Direction
  animState: AnimState
  layers: string[]
  spriteType?: HumanSpriteType
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
  x, y, direction, animState, layers, spriteType, label, statusText,
  dialogBubble, dialogEmotion, onClick,
}: SpriteCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [idleOverride, setIdleOverride] = useState<string | null>(null)
  const hasHumanSprite = Boolean(spriteType)

  // 方向稳定锁：行走途中锁定方向，只在 idle→walk 切换瞬间或 idle 状态下才允许更新
  // 防止 direction prop 在行走中抖动导致左右帧切换（鬼畜摆头）
  const lockedDirectionRef = useRef(direction)
  const prevAnimStateRef = useRef(animState)
  if (animState === 'idle') {
    lockedDirectionRef.current = direction
  } else if (animState === 'walk' && prevAnimStateRef.current === 'idle') {
    // 刚从 idle 进入 walk，记录此刻的方向并锁定
    lockedDirectionRef.current = direction
  }
  prevAnimStateRef.current = animState
  const stableDirection = lockedDirectionRef.current

  const activeWalkFrames = useMemo(() => {
    if (spriteType) return HUMAN_SPRITES[spriteType].walk[stableDirection]
    return WALK_FRAMES[stableDirection].map((cell) => cell.toString())
  }, [stableDirection, spriteType])

  useEffect(() => {
    if (animState !== 'walk') {
      setFrameIndex(0)
      return
    }
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % activeWalkFrames.length)
    }, 130)
    return () => clearInterval(interval)
  }, [activeWalkFrames.length, animState])

  useEffect(() => {
    if (!spriteType || animState !== 'idle') {
      setIdleOverride(null)
      return
    }
    const specialPool = HUMAN_SPRITES[spriteType].special
    setIdleOverride(null)
    const interval = setInterval(
      () => {
        const showSpecial = Math.random() > 0.58
        if (!showSpecial) {
          setIdleOverride(null)
          return
        }
        const frame = specialPool[Math.floor(Math.random() * specialPool.length)]
        setIdleOverride(frame)
      },
      2200 + Math.floor(Math.random() * 1800),
    )
    return () => clearInterval(interval)
  }, [animState, spriteType])

  const cell = animState === 'walk'
    ? WALK_FRAMES[stableDirection][frameIndex % WALK_FRAMES[stableDirection].length]
    : IDLE_FRAME[stableDirection]

  const pos = cellToPos(cell)
  const flipX = !hasHumanSprite && stableDirection === 'left'
  const humanFrame = spriteType
    ? getHumanFrame(spriteType, stableDirection, animState, frameIndex, idleOverride)
    : null

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
        {humanFrame ? (
          <img className="sprite-human-frame" src={humanFrame} alt="" aria-hidden />
        ) : (
          layers.map((src, i) => (
            <div
              key={i}
              className="sprite-layer"
              style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: `-${pos.x}px -${pos.y}px`,
              }}
            />
          ))
        )}
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
